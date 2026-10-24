import { soundEngine } from '@/audio/synth';
import { CLEF_CONFIGS } from '@/constants/clefs';
import { KEYBOARD_MAP } from '@/constants/keys';
import { addSession, getAllNoteStats, putNoteStatsBatch } from '@/db/storage';
import type {
  AccidentalMode,
  GhostNoteItem,
  KeyFeedback,
  NoteItem,
  NoteStats,
  SessionRecord,
  TrainerOptions,
} from '@/types';
import { getClosestStepForPc } from '@/utils/pitch';
import { buildCandidates, noteKey, pickWeighted, updateStats } from '@/utils/scheduler';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useTrainer(
  options: TrainerOptions,
  isActive: boolean,
  onFinishSession: () => void,
) {
  const [currentNote, setCurrentNote] = useState<NoteItem | null>(null);
  const [ghostNote, setGhostNote] = useState<GhostNoteItem | null>(null);
  const [keyFeedback, setKeyFeedback] = useState<KeyFeedback | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [deviationText, setDeviationText] = useState<string>('');
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>('sharp');
  const [score, setScore] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(options.duration);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const onFinishSessionRef = useRef(onFinishSession);
  const optionsRef = useRef(options);
  const shownAtRef = useRef<number>(0);
  const statsCacheRef = useRef<Record<string, NoteStats>>({});
  const pendingFlushRef = useRef<Record<string, NoteStats>>({});
  const dirtyCountRef = useRef<number>(0);
  const sessionRef = useRef<{
    id: string;
    startedAt: number;
    attempts: number;
    correct: number;
  } | null>(null);

  useEffect(() => {
    onFinishSessionRef.current = onFinishSession;
  }, [onFinishSession]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const flushStats = useCallback(() => {
    const pending = pendingFlushRef.current;
    const keys = Object.keys(pending);
    if (keys.length === 0) {
      dirtyCountRef.current = 0;
      return;
    }
    pendingFlushRef.current = {};
    dirtyCountRef.current = 0;
    putNoteStatsBatch(pending).catch(() => {});
  }, []);

  const finalizeSession = useCallback(() => {
    flushStats();
    const s = sessionRef.current;
    if (s && s.attempts > 0) {
      const record: SessionRecord = {
        id: s.id,
        startedAt: s.startedAt,
        endedAt: Date.now(),
        settingsSnapshot: optionsRef.current,
        attempts: s.attempts,
        correct: s.correct,
      };
      addSession(record).catch(() => {});
    }
    sessionRef.current = null;
  }, [flushStats]);

  // 依据加权策略生成下一题
  const generateQuestion = useCallback(() => {
    setIsLocked(false);
    setIsSuccess(false);
    setGhostNote(null);
    setKeyFeedback(null);
    setDeviationText('');

    const candidates = buildCandidates(options);
    if (candidates.length === 0) {
      setCurrentNote(null);
      return;
    }

    const now = Date.now();
    const chosen = pickWeighted(candidates, statsCacheRef.current, now);
    const clefConfig = CLEF_CONFIGS[chosen.clef];
    const octave = 4 + Math.floor(chosen.step / 7);
    const midiPitch = 12 * (octave + 1) + chosen.pc;

    setAccidentalMode(chosen.accidental === '♭' ? 'flat' : 'sharp');
    setCurrentNote({
      clef: clefConfig,
      step: chosen.step,
      pc: chosen.pc,
      accidental: chosen.accidental,
      midiPitch,
    });
    // 计时起点置于音符真正展示的瞬间（避免确认动画污染）
    shownAtRef.current = performance.now();
  }, [options]);

  // 重置训练场：结算上一会话并开启新会话
  const resetTrainer = useCallback(() => {
    finalizeSession();
    stopTimers();
    setScore(0);
    setWrongCount(0);
    setAttempts(0);
    setTimeLeft(options.duration);
    setIsSuccess(false);
    setKeyFeedback(null);
    setGhostNote(null);
    setDeviationText('');

    sessionRef.current = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: Date.now(),
      attempts: 0,
      correct: 0,
    };
    generateQuestion();

    if (options.duration > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimers();
            finalizeSession();
            onFinishSessionRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [options.duration, generateQuestion, stopTimers, finalizeSession]);

  // 依据 isActive 启停，并在启动前加载统计缓存
  useEffect(() => {
    if (!isActive) {
      stopTimers();
      finalizeSession();
      return;
    }

    let alive = true;
    (async () => {
      try {
        const all = await getAllNoteStats();
        if (!alive) return;
        statsCacheRef.current = all;
      } catch {
        if (!alive) return;
        statsCacheRef.current = {};
      }
      resetTrainer();
    })();

    return () => {
      alive = false;
      stopTimers();
    };
  }, [isActive, resetTrainer, stopTimers, finalizeSession]);

  const handleInput = useCallback(
    (pressedPc: number) => {
      if (!isActive || isLocked || !currentNote) return;

      const reactionTime = performance.now() - shownAtRef.current;
      // 防抖：排除前意识滑按
      if (reactionTime < 150) return;

      const isCorrect = pressedPc === currentNote.pc;
      setAttempts((a) => a + 1);
      if (isCorrect) {
        setScore((s) => s + 1);
      } else {
        setWrongCount((w) => w + 1);
      }

      // 更新音符级统计
      const key = noteKey(currentNote.clef.name, currentNote.step, currentNote.accidental);
      const prevStats = statsCacheRef.current[key];
      const nextStats = updateStats(
        prevStats,
        {
          clef: currentNote.clef.name,
          step: currentNote.step,
          accidental: currentNote.accidental,
        },
        isCorrect,
        reactionTime,
        Date.now(),
      );
      statsCacheRef.current[key] = nextStats;
      pendingFlushRef.current[key] = nextStats;
      dirtyCountRef.current += 1;
      if (dirtyCountRef.current >= 10) {
        flushStats();
      }

      if (sessionRef.current) {
        sessionRef.current.attempts += 1;
        if (isCorrect) {
          sessionRef.current.correct += 1;
        }
      }

      if (isCorrect) {
        soundEngine.playPitch(currentNote.midiPitch, options.sound);
        setIsLocked(true);
        setIsSuccess(true);
        setKeyFeedback({ correctPc: currentNote.pc, wrongPc: null });

        delayTimerRef.current = window.setTimeout(() => {
          generateQuestion();
        }, 180);
      } else {
        setIsLocked(true);
        soundEngine.playError(options.sound);

        const userStep = getClosestStepForPc(currentNote.step, pressedPc);
        const userOctave = 4 + Math.floor(userStep / 7);
        const userMidi = 12 * (userOctave + 1) + pressedPc;
        soundEngine.playPitch(userMidi, options.sound);

        const isAccidentalNote = [1, 3, 6, 8, 10].includes(pressedPc);
        const errorAccidental = isAccidentalNote ? (accidentalMode === 'sharp' ? '♯' : '♭') : null;

        setGhostNote({ step: userStep, accidental: errorAccidental });
        setKeyFeedback({ correctPc: currentNote.pc, wrongPc: pressedPc });

        const diff = userStep - currentNote.step;
        if (diff > 0) {
          setDeviationText(`偏高 ${Math.abs(diff)} 度 (红色为您所按)`);
        } else if (diff < 0) {
          setDeviationText(`偏低 ${Math.abs(diff)} 度 (红色为您所按)`);
        } else {
          setDeviationText('音位正确，但升降半音有误');
        }

        const waitTime = options.errorDelay !== undefined ? options.errorDelay : 500;
        delayTimerRef.current = window.setTimeout(() => {
          generateQuestion();
        }, waitTime);
      }
    },
    [
      isActive,
      isLocked,
      currentNote,
      options.sound,
      options.errorDelay,
      accidentalMode,
      generateQuestion,
      flushStats,
    ],
  );

  // 物理键盘监听（仅在活跃状态下绑定）
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (KEYBOARD_MAP[e.key] !== undefined) {
        handleInput(KEYBOARD_MAP[e.key]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, handleInput]);

  return {
    currentNote,
    ghostNote,
    keyFeedback,
    isSuccess,
    deviationText,
    accidentalMode,
    score,
    wrongCount,
    attempts,
    timeLeft,
    handleInput,
    resetTrainer,
  };
}
