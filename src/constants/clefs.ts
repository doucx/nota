import type { ClefConfig, ClefType } from '@/types';

/**
 * 接入用户校准参数：
 * STAFF_LINES = [34, 50, 66, 82, 98]，Line 1 是 98px，间距 16px，每 diatonic step 是 8px
 */
export const STAFF_LINES = [34, 50, 66, 82, 98] as const;

export const CLEF_CONFIGS: Record<ClefType, ClefConfig> = {
  treble: {
    name: 'treble',
    baseStep: 2, // E4
    range: [-1, 11], // D4 ~ G5
    symbol: '𝄞',
    x: 50,
    y: 98,
    size: 84,
  },
  alto: {
    name: 'alto',
    baseStep: -4, // F3
    range: [-7, 5], // C3 ~ A4
    symbol: '𝄡',
    x: 50,
    y: 95.5,
    size: 80,
  },
  bass: {
    name: 'bass',
    baseStep: -10, // G2
    range: [-14, -1], // E2 ~ B3
    symbol: '𝄢',
    x: 41,
    y: 106,
    size: 95,
  },
};
