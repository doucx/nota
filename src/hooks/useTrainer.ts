import { soundEngine } from '@/audio/synth';
import { CLEF_CONFIGS } from '@/constants/clefs';
import { KEYBOARD_MAP } from '@/constants/keys';
import { STEP_TO_PC } from '@/constants/notation';
import type {
  AccidentalMode,
  ClefType,
  GhostNoteItem,
  KeyFeedback,
  NoteItem,
  TrainerOptions,
} from '@/types';
import { getClosestStepForPc } from '@/utils/pitch';
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
  const [attempts, setAttempts] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(options.duration);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const delayTimerRef = useRef<number | null>(null);
  const onFinishSessionRef = useRef(onFinishSession);

  useEffect(() => {
    onFinishSessionRef.current = onFinishSession;
  }, [onFinishSession]);

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

  // 生成下一题
  const generateQuestion = useCallback(() => {
    setIsLocked(false);
    setIsSuccess(false);
    setGhostNote(null);
    setKeyFeedback(null);
    setDeviationText('');

    const activeClefs: ClefType[] = options.clefs.length > 0 ? options.clefs : ['treble'];
    const chosenClefName = activeClefs[Math.floor(Math.random() * activeClefs.length)];
    const clef = CLEF_CONFIGS[chosenClefName];

    // 优先采用用户自定义的音域范围，若未定义则回退到谱表配置的默认范围
    const configuredRange = options.ranges?.[chosenClefName];
    const [min, max] = configuredRange ?? clef.range;
    let step = 0;
    let pc = 0;
    let accidental: '♯' | '♭' | null = null;
    let nextAccMode: AccidentalMode = 'sharp';

    if (options.accidentalsOnly) {
      // 纯黑键模式：收集音域内所有合法的黑键候选组合
      interface BlackKeyItem {
        step: number;
        pc: number;
        accidental: '♯' | '♭';
        mode: AccidentalMode;
      }
      const candidates: BlackKeyItem[] = [];

      for (let s = min; s <= max; s++) {
        const dIdx = ((s % 7) + 7) % 7;
        const natPc = STEP_TO_PC[dIdx];

        // 升号黑键 (C, D, F, G, A)
        if ([0, 1, 3, 4, 5].includes(dIdx)) {
          candidates.push({
            step: s,
            pc: (natPc + 1) % 12,
            accidental: '♯',
            mode: 'sharp',
          });
        }
        // 降号黑键 (D, E, G, A, B)
        if ([1, 2, 4, 5, 6].includes(dIdx)) {
          candidates.push({
            step: s,
            pc: (natPc + 11) % 12,
            accidental: '♭',
            mode: 'flat',
          });
        }
      }

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      step = chosen.step;
      pc = chosen.pc;
      accidental = chosen.accidental;
      nextAccMode = chosen.mode;
    } else {
      step = Math.floor(Math.random() * (max - min + 1)) + min;
      const diatonicIndex = ((step % 7) + 7) % 7;
      const naturalPc = STEP_TO_PC[diatonicIndex];
      pc = naturalPc;

      if (options.allowAccidentals && Math.random() < 0.4) {
        const useSharp = Math.random() < 0.5;
        if (useSharp) {
          const sharpable = [0, 1, 3, 4, 5]; // C, D, F, G, A
          if (sharpable.includes(diatonicIndex)) {
            accidental = '♯';
            pc = (naturalPc + 1) % 12;
            nextAccMode = 'sharp';
          }
        } else {
          const flatable = [1, 2, 4, 5, 6]; // D, E, G, A, B
          if (flatable.includes(diatonicIndex)) {
            accidental = '♭';
            pc = (naturalPc + 11) % 12;
            nextAccMode = 'flat';
          }
        }
      }
    }

    setAccidentalMode(nextAccMode);
    const octave = 4 + Math.floor(step / 7);
    const midiPitch = 12 * (octave + 1) + pc;

    setCurrentNote({
      clef,
      step,
      pc,
      accidental,
      midiPitch,
    });
  }, [options.clefs, options.ranges, options.allowAccidentals, options.accidentalsOnly]);

  // 重置训练场
  const resetTrainer = useCallback(() => {
    stopTimers();
    setScore(0);
    setAttempts(0);
    setTimeLeft(options.duration);
    setIsSuccess(false);
    setKeyFeedback(null);
    generateQuestion();

    if (options.duration > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimers();
            onFinishSessionRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [options.duration, generateQuestion, stopTimers]);

  // 根据 isActive 启动或中止计时器
  useEffect(() => {
    if (isActive) {
      resetTrainer();
    } else {
      stopTimers();
    }
    return () => {
      stopTimers();
    };
  }, [isActive, resetTrainer, stopTimers]);

  // 答题处理
  const handleInput = useCallback(
    (pressedPc: number) => {
      if (!isActive || isLocked || !currentNote) return;

      setAttempts((a) => a + 1);
      const isCorrect = pressedPc === currentNote.pc;

      if (isCorrect) {
        setScore((s) => s + 1);
        soundEngine.playPitch(currentNote.midiPitch, options.sound);
        setIsLocked(true);
        setIsSuccess(true);
        setKeyFeedback({
          correctPc: currentNote.pc,
          wrongPc: null,
        });

        // 答对时给 180ms 的绿色视觉确认反馈后切入下一题
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

        const isAccidental = [1, 3, 6, 8, 10].includes(pressedPc);
        const errorAccidental = isAccidental ? (accidentalMode === 'sharp' ? '♯' : '♭') : null;

        setGhostNote({
          step: userStep,
          accidental: errorAccidental,
        });

        setKeyFeedback({
          correctPc: currentNote.pc,
          wrongPc: pressedPc,
        });

        const diff = userStep - currentNote.step;
        if (diff > 0) {
          setDeviationText(`偏高 ${Math.abs(diff)} 度 (红色为您所按)`);
        } else if (diff < 0) {
          setDeviationText(`偏低 ${Math.abs(diff)} 度 (红色为您所按)`);
        } else {
          setDeviationText('音位正确，但升降半音有误');
        }

        // 依据配置的 errorDelay 进行等待后切换下一题
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
    attempts,
    timeLeft,
    handleInput,
    resetTrainer,
  };
}
