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
    range: [-4, 16], // 默认 Fa3 ~ Mi6
    symbol: '𝄞',
    x: 50,
    y: 98,
    size: 84,
  },
  alto: {
    name: 'alto',
    baseStep: -4, // F3
    range: [-10, 10], // 默认 Sol2 ~ Fa5
    symbol: '𝄡',
    x: 50,
    y: 95.5,
    size: 80,
  },
  bass: {
    name: 'bass',
    baseStep: -10, // G2
    range: [-16, 4], // 默认 La1 ~ Sol4
    symbol: '𝄢',
    x: 41,
    y: 106,
    size: 95,
  },
};

export interface ClefRangeDefinition {
  label: string;
  limit: [number, number]; // [极限最低 step, 极限最高 step]
  defaultRange: [number, number]; // [默认最低 step, 默认最高 step]
}

export const CLEF_RANGE_DEFINITIONS: Record<ClefType, ClefRangeDefinition> = {
  treble: {
    label: '高音谱表 (Treble)',
    limit: [-7, 19], // 极限：Do3 - La6
    defaultRange: [-4, 16], // 默认：Fa3 - Mi6
  },
  bass: {
    label: '低音谱表 (Bass)',
    limit: [-19, 7], // 极限：Mi1 - Do5
    defaultRange: [-16, 4], // 默认：La1 - Sol4
  },
  alto: {
    label: '中音谱表 (Alto)',
    limit: [-13, 13], // 极限：Re2 - Ti5
    defaultRange: [-10, 10], // 默认：Sol2 - Fa5
  },
};

export const DEFAULT_CLEF_RANGES: Record<ClefType, [number, number]> = {
  treble: [-4, 16],
  bass: [-16, 4],
  alto: [-10, 10],
};
