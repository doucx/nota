/**
 * 物理键盘映射表
 * 自然音：sdf ghjk -> Do ~ Ti (C, D, E, F, G, A, B)
 * 半音：er -> Do#/Re#, yui -> Fa# ~ La#
 */
export const KEYBOARD_MAP: Record<string, number> = {
  s: 0,
  d: 2,
  f: 4,
  g: 5,
  h: 7,
  j: 9,
  k: 11,
  S: 0,
  D: 2,
  F: 4,
  G: 5,
  H: 7,
  J: 9,
  K: 11,
  e: 1,
  r: 3,
  y: 6,
  u: 8,
  i: 10,
  E: 1,
  R: 3,
  Y: 6,
  U: 8,
  I: 10,
};
