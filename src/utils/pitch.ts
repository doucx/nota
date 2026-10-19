import { NAMING_TABLES, STEP_TO_PC } from '@/constants/notation';
import type { ClefConfig, NamingScheme } from '@/types';

/**
 * 将 diatonic step 转换为自然音名索引 (0=C, 6=B) 与八度编号
 * step = 0 对应 C4 (Do4)
 */
export function stepToDiatonic(step: number): { index: number; octave: number } {
  const octave = 4 + Math.floor(step / 7);
  const index = ((step % 7) + 7) % 7;
  return { index, octave };
}

/**
 * 根据用户的记谱偏好 (naming) 将 step 格式化为对应的音名/唱名 (如 Fa3、F3)
 */
export function formatStep(step: number, naming: NamingScheme): string {
  const { index, octave } = stepToDiatonic(step);
  const noteName = NAMING_TABLES[naming].natural[index];
  return `${noteName}${octave}`;
}

/**
 * 计算五线谱对应 Y 轴像素位置
 * Line 1 为 98px，每 diatonic step 变动 8px
 */
export function getStaffY(clef: ClefConfig, step: number): number {
  return 98 - (step - clef.baseStep) * 8;
}

/**
 * 寻找最邻近目标 diatonic step 且 Pitch Class 匹配的五线谱线/间位置
 */
export function getClosestStepForPc(targetStep: number, pc: number): number {
  let bestStep = targetStep;
  let minDiff = 999;

  for (let s = targetStep - 7; s <= targetStep + 7; s++) {
    const dIdx = ((s % 7) + 7) % 7;
    const natPc = STEP_TO_PC[dIdx];
    if (natPc === pc || (natPc + 1) % 12 === pc || (natPc + 11) % 12 === pc) {
      const diff = Math.abs(s - targetStep);
      if (diff < minDiff) {
        minDiff = diff;
        bestStep = s;
      }
    }
  }

  return bestStep;
}
