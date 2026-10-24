import { DEFAULT_CLEF_RANGES } from '@/constants/clefs';
import { getMeta, setMeta } from '@/db/storage';
import type { TrainerOptions } from '@/types';

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
 * 从 IDB 读取已保存的选项配置；若不存在则回退默认设置，并对缺失字段补齐。
 */
export async function loadSavedOptions(): Promise<TrainerOptions> {
  try {
    const meta = await getMeta();
    const saved = meta?.options;
    if (!saved) {
      return DEFAULT_OPTIONS;
    }
    return {
      ...DEFAULT_OPTIONS,
      ...saved,
      ranges: {
        ...DEFAULT_OPTIONS.ranges,
        ...(saved.ranges ?? {}),
      },
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

/**
 * 将选项配置持久化到 IDB。
 */
export async function saveOptions(options: TrainerOptions): Promise<void> {
  try {
    await setMeta({ options });
  } catch {
    // 忽略持久化异常
  }
}
