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

export interface TrainerOptions {
  clefs: ClefType[];
  duration: number; // 0 表示无限制，单位秒
  naming: NamingScheme;
  allowAccidentals: boolean;
  accidentalsOnly: boolean;
  sound: boolean;
}
