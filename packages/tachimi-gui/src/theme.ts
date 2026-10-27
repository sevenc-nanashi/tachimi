export const bg = "#ffffff";
export const fill = "#f2f5f2";
export const fillSoft = "#f7f9f7";
export const fillHover = "#e5ebe5";
export const text = "#182019";
export const textSub = "#3e4a40";
export const muted = "#606f63";
export const line = "#e5ebe5";
export const lineStrong = "#cdd7ce";
export const accent = "#287a3d";
export const accentStrong = "#1c5e2d";
export const accentSoft = "#e6f2e8";
export const accentFill = "#287a3d";
export const accentFillStrong = "#1c5e2d";
export const onAccent = "#ffffff";
export const danger = "#b4382e";
export const warnBg = "#fff4dc";
export const warnLine = "#f0d595";
export const r18 = "#d6254d";
export const overlay = "rgba(0, 0, 0, 0.6)";
export const checkerA = "#e8ede8";
export const checkerB = "#f7f9f7";
export const logoBack = "#a5d2ae";
export const radius = "12px";
export const radiusSmall = "8px";

export const fontSize = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
} as const;

const spacingUnit = 4;
export const spacing = {
  sm: spacingUnit * 2,
  md: spacingUnit * 4,
  lg: spacingUnit * 6,
} as const;
export const space = (size: number) => spacingUnit * size;
export const paddingXY = (x: number, y: number) => ({
  paddingLeft: x,
  paddingRight: x,
  paddingTop: y,
  paddingBottom: y,
});
