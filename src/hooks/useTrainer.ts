import { soundEngine } from '@/audio/synth';
import { CLEF_CONFIGS } from '@/constants/clefs';
import { KEYBOARD_MAP } from '@/constants/keys';
import { STEP_TO_PC } from '@/constants/notation';
import { addSession, getAllNoteStats, putNoteStatsBatch } from '@/db/storage';
import type {
  AccidentalMode,
  GhostNoteItem,
  KeyFeedback,
  NoteItem,
  NoteStats,
  SandboxNoteSpec,
  SessionRecord,
  TrainerOptions,
} from '@/types';
import { resolvePressedPlacement } from '@/utils/pitch';
import { buildCandidates, noteKey, pickWeighted, updateStats } from '@/utils/scheduler';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useTrainer(
  options: TrainerOptions,
  isActive: boolean,
  onFinishSession: () => void,
  sandboxEnabled = false,
  sandboxPinnedNote: SandboxNoteSpec | null = null,
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
    // 沙盒模式不产生任何持久化副作用
    if (sandboxEnabled) {
      sessionRef.current = null;
      pendingFlushRef.current = {};
      dirtyCountRef.current = 0;
      return;
    }
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
  }, [flushStats, sandboxEnabled]);

  // 依据加权策略生成下一题（沙盒模式下可强制指定固定音符）
  const generateQuestion = useCallback(() => {
    setIsLocked(false);
    setIsSuccess(false);
    setGhostNote(null);
    setKeyFeedback(null);
    setDeviationText('');

    if (sandboxEnabled && sandboxPinnedNote) {
      const clefConfig = CLEF_CONFIGS[sandboxPinnedNote.clef];
      const dIdx = ((sandboxPinnedNote.step % 7) + 7) % 7;
      const natPc = STEP_TO_PC[dIdx];
      let pc = natPc;
      if (sandboxPinnedNote.accidental === '♯') {
        pc = (natPc + 1) % 12;
      } else if (sandboxPinnedNote.accidental === '♭') {
        pc = (natPc + 11) % 12;
      }
      const octave = 4 + Math.floor(sandboxPinnedNote.step / 7);
      const midiPitch = 12 * (octave + 1) + pc;

      setAccidentalMode(sandboxPinnedNote.accidental === '♭' ? 'flat' : 'sharp');
      setCurrentNote({
        clef: clefConfig,
        step: sandboxPinnedNote.step,
        pc,
        accidental: sandboxPinnedNote.accidental,
        midiPitch,
      });
      shownAtRef.current = performance.now();
      return;
    }

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
  }, [options, sandboxEnabled, sandboxPinnedNote]);

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

    if (sandboxEnabled) {
      // 沙盒模式：不读取历史统计，也不写回任何数据
      statsCacheRef.current = {};
      resetTrainer();
      return () => {
        stopTimers();
        // 退出沙盒时清空会话残留，避免切换到正常训练时被意外提交
        sessionRef.current = null;
      };
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
  }, [isActive, sandboxEnabled, resetTrainer, stopTimers, finalizeSession]);

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

      // 更新音符级统计（沙盒模式跳过所有持久化）
      if (!sandboxEnabled) {
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

        const placement = resolvePressedPlacement(currentNote.step, pressedPc);
        const userOctave = 4 + Math.floor(placement.step / 7);
        const userMidi = 12 * (userOctave + 1) + pressedPc;
        soundEngine.playPitch(userMidi, options.sound);

        setGhostNote({ step: placement.step, accidental: placement.accidental });
        setKeyFeedback({ correctPc: currentNote.pc, wrongPc: pressedPc });

        const isBlackKey = [1, 3, 6, 8, 10].includes(pressedPc);
        const semitoneDiff = (pressedPc - currentNote.pc + 12) % 12;

        if (semitoneDiff === 1) {
          setDeviationText('高了半音 (红色为您所按)');
        } else if (semitoneDiff === 11) {
          setDeviationText('低了半音 (红色为您所按)');
        } else if (
          placement.step === currentNote.step &&
          pressedPc !== currentNote.pc &&
          isBlackKey
        ) {
          setDeviationText('音位正确，但升降半音有误');
        } else {
          const diff = placement.step - currentNote.step;
          if (diff > 0) {
            setDeviationText(`偏高 ${Math.abs(diff)} 个音级 (红色为您所按)`);
          } else if (diff < 0) {
            setDeviationText(`偏低 ${Math.abs(diff)} 个音级 (红色为您所按)`);
          } else {
            setDeviationText('音位正确，但音高有误');
          }
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
      generateQuestion,
      flushStats,
      sandboxEnabled,
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
