import { CLEF_RANGE_DEFINITIONS } from '@/constants/clefs';
import { STEP_TO_PC } from '@/constants/notation';
import type { ClefType, NoteStats, TrainerOptions } from '@/types';

export const TARGET_MS = 1200;

const DAY_MS = 24 * 60 * 60 * 1000;
const SHORT_MS = 10 * 60 * 1000;
const MAX_SAMPLES = 20;
const SHARPABLE = [0, 1, 3, 4, 5];
const FLATABLE = [1, 2, 4, 5, 6];

export interface Candidate {
  clef: ClefType;
  step: number;
  accidental: '♯' | '♭' | null;
  pc: number;
}

export function noteKey(clef: ClefType, step: number, accidental: '♯' | '♭' | null): string {
  return `${clef}:${step}:${accidental ?? 'nat'}`;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function buildCandidates(options: TrainerOptions): Candidate[] {
  const list: Candidate[] = [];
  for (const clefName of options.clefs) {
    const def = CLEF_RANGE_DEFINITIONS[clefName];
    const range = options.ranges?.[clefName] ?? def.defaultRange;
    const [min, max] = range;
    for (let step = min; step <= max; step++) {
      const dIdx = ((step % 7) + 7) % 7;
      const natPc = STEP_TO_PC[dIdx];
      const canSharp = SHARPABLE.includes(dIdx);
      const canFlat = FLATABLE.includes(dIdx);

      if (options.accidentalsOnly) {
        if (canSharp) {
          list.push({ clef: clefName, step, accidental: '♯', pc: (natPc + 1) % 12 });
        }
        if (canFlat) {
          list.push({ clef: clefName, step, accidental: '♭', pc: (natPc + 11) % 12 });
        }
      } else {
        list.push({ clef: clefName, step, accidental: null, pc: natPc });
        if (options.allowAccidentals) {
          if (canSharp) {
            list.push({ clef: clefName, step, accidental: '♯', pc: (natPc + 1) % 12 });
          }
          if (canFlat) {
            list.push({ clef: clefName, step, accidental: '♭', pc: (natPc + 11) % 12 });
          }
        }
      }
    }
  }
  return list;
}

export function weightOf(stats: NoteStats | undefined, now: number): number {
  if (!stats) return 12;
  switch (stats.state) {
    case 'lapsed':
      return 24;
    case 'learning':
      return 18;
    case 'new':
      return 12;
    case 'review': {
      const overdue = now - stats.nextDueAt;
      if (overdue >= 0) {
        return 8 + Math.min(overdue / DAY_MS, 16);
      }
      return 0.4;
    }
    default:
      return 8;
  }
}

export function pickWeighted(
  candidates: Candidate[],
  statsMap: Record<string, NoteStats>,
  now: number,
): Candidate {
  const weights = candidates.map((c) =>
    weightOf(statsMap[noteKey(c.clef, c.step, c.accidental)], now),
  );
  const total = weights.reduce((acc, w) => acc + w, 0);
  let target = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    target -= weights[i];
    if (target <= 0) {
      return candidates[i];
    }
  }
  return candidates[candidates.length - 1];
}

function createEmptyStats(note: {
  clef: ClefType;
  step: number;
  accidental: '♯' | '♭' | null;
}): NoteStats {
  return {
    clef: note.clef,
    step: note.step,
    accidental: note.accidental,
    attempts: 0,
    correct: 0,
    reactionTimes: [],
    lastSeenAt: 0,
    state: 'new',
    intervalDays: 0,
    nextDueAt: 0,
    learningStreak: 0,
  };
}

export function updateStats(
  prev: NoteStats | undefined,
  note: { clef: ClefType; step: number; accidental: '♯' | '♭' | null },
  correct: boolean,
  reactionTime: number,
  now: number,
): NoteStats {
  const base = prev ?? createEmptyStats(note);
  const next: NoteStats = { ...base };

  next.attempts += 1;
  if (correct) {
    next.correct += 1;
  }
  next.reactionTimes = [...base.reactionTimes, reactionTime].slice(-MAX_SAMPLES);
  next.lastSeenAt = now;

  const fast = correct && reactionTime <= TARGET_MS;

  if (base.state === 'new' || base.state === 'learning' || base.state === 'lapsed') {
    next.learningStreak = fast ? base.learningStreak + 1 : 0;
    if (next.learningStreak >= 2) {
      next.state = 'review';
      next.intervalDays = 1;
      next.nextDueAt = now + DAY_MS;
    } else {
      next.state = 'learning';
      next.intervalDays = 0;
      next.nextDueAt = now + SHORT_MS;
    }
  } else if (fast) {
    next.state = 'review';
    next.learningStreak = base.learningStreak + 1;
    next.intervalDays = Math.min(Math.max(base.intervalDays, 1) * 2.5, 90);
    next.nextDueAt = now + next.intervalDays * DAY_MS;
  } else {
    next.state = 'lapsed';
    next.learningStreak = 0;
    next.intervalDays = 0;
    next.nextDueAt = now + SHORT_MS;
  }

  return next;
}
