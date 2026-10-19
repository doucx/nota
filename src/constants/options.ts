import { DEFAULT_CLEF_RANGES } from '@/constants/clefs';
import type { TrainerOptions } from '@/types';

export const STORAGE_KEY_OPTIONS = 'nota_trainer_options_v1';

export const DEFAULT_OPTIONS: TrainerOptions = {
  clefs: ['treble', 'bass'],
  duration: 60,
  naming: 'solfege-ti',
  allowAccidentals: true,
  accidentalsOnly: false,
  sound: true,
  errorDelay: 500,
  ranges: DEFAULT_CLEF_RANGES,
};

/**
 * 从 localStorage 读取已保存的选项配置；
 * 若不存在或解析失败，则安全回退到默认设置，并对缺失字段进行补齐。
 */
export function loadSavedOptions(): TrainerOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (!raw) return DEFAULT_OPTIONS;

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_OPTIONS;
    }

    return {
      ...DEFAULT_OPTIONS,
      ...parsed,
      ranges: {
        ...DEFAULT_OPTIONS.ranges,
        ...(parsed.ranges ?? {}),
      },
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

/**
 * 将选项配置持久化到 localStorage
 */
export function saveOptions(options: TrainerOptions): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(options));
  } catch {
    // 忽略无痕模式或配额超限异常
  }
}
