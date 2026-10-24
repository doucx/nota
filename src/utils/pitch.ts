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

export interface PressedPlacement {
  step: number;
  accidental: '♯' | '♭' | null;
}

/**
 * 将用户实际按下的 Pitch Class 映射回最邻近的五线谱位置。
 * - 白键（自然音）：取最近的同名自然音位置，不会吸收到相邻半音。
 * - 黑键（升降音）：取最近的升/降拼写位置，并给出对应升降记号。
 * 这样 Mi→Fa、Ti→Do 等半音邻居不会因拼法相同而被误判为「音位正确」。
 */
export function resolvePressedPlacement(targetStep: number, pressedPc: number): PressedPlacement {
  const isBlackKey = [1, 3, 6, 8, 10].includes(pressedPc);
  let bestStep = targetStep;
  let bestDiff = Number.POSITIVE_INFINITY;
  let bestAccidental: '♯' | '♭' | null = null;

  for (let s = targetStep - 7; s <= targetStep + 7; s++) {
    const dIdx = ((s % 7) + 7) % 7;
    const natPc = STEP_TO_PC[dIdx];
    let accidental: '♯' | '♭' | null = null;

    if (isBlackKey) {
      if ((natPc + 1) % 12 === pressedPc) {
        accidental = '♯';
      } else if ((natPc + 11) % 12 === pressedPc) {
        accidental = '♭';
      } else {
        continue;
      }
    } else if (natPc !== pressedPc) {
      continue;
    }

    const diff = Math.abs(s - targetStep);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestStep = s;
      bestAccidental = accidental;
    }
  }

  return { step: bestStep, accidental: bestAccidental };
}
