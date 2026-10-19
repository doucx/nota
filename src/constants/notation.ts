import type { NamingScheme } from '@/types';

export const STEP_TO_PC = [0, 2, 4, 5, 7, 9, 11] as const;

export const NAMING_TABLES: Record<
  NamingScheme,
  { natural: string[]; sharp: string[]; flat: string[] }
> = {
  letters: {
    natural: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    sharp: ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'],
    flat: ['D♭', 'E♭', 'G♭', 'A♭', 'B♭'],
  },
  german: {
    natural: ['C', 'D', 'E', 'F', 'G', 'A', 'H'],
    sharp: ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'],
    flat: ['D♭', 'E♭', 'G♭', 'A♭', 'B'],
  },
  'solfege-si': {
    natural: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'],
    sharp: ['Do♯', 'Re♯', 'Fa♯', 'Sol♯', 'La♯'],
    flat: ['Re♭', 'Mi♭', 'Sol♭', 'La♭', 'Si♭'],
  },
  'solfege-ti': {
    natural: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'],
    sharp: ['Do♯', 'Re♯', 'Fa♯', 'Sol♯', 'La♯'],
    flat: ['Re♭', 'Mi♭', 'Sol♭', 'La♭', 'Ti♭'],
  },
};
