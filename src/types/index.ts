export type ClefType = 'treble' | 'alto' | 'bass';

export type NamingScheme = 'letters' | 'german' | 'solfege-si' | 'solfege-ti';

export type AccidentalMode = 'sharp' | 'flat';

export interface ClefConfig {
  name: ClefType;
  baseStep: number;
  range: [number, number];
  symbol: string;
  x: number;
  y: number;
  size: number;
}

export interface NoteItem {
  clef: ClefConfig;
  step: number;
  pc: number;
  accidental: '♯' | '♭' | null;
  midiPitch: number;
}

export interface GhostNoteItem {
  step: number;
  accidental: '♯' | '♭' | null;
}

export interface KeyFeedback {
  correctPc: number | null;
  wrongPc: number | null;
}

export interface TrainerOptions {
  clefs: ClefType[];
  duration: number; // 0 表示无限制，单位秒
  naming: NamingScheme;
  allowAccidentals: boolean;
  accidentalsOnly: boolean;
  sound: boolean;
  errorDelay: number; // 出错等待时间（毫秒，0 ~ 2000）
  ranges: Record<ClefType, [number, number]>; // 各谱表自定义音域 [minStep, maxStep]
}

export type LearningState = 'new' | 'learning' | 'review' | 'lapsed';

export interface NoteStats {
  clef: ClefType;
  step: number;
  accidental: '♯' | '♭' | null;
  attempts: number;
  correct: number;
  reactionTimes: number[];
  lastSeenAt: number;
  state: LearningState;
  intervalDays: number;
  nextDueAt: number;
  learningStreak: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  settingsSnapshot: TrainerOptions;
  attempts: number;
  correct: number;
}

export interface AppMeta {
  schemaVersion: number;
  options?: TrainerOptions;
}
