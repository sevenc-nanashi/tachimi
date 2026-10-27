export const bg = "#ffffff";
export const fill = "#f2f4f6";
export const fillSoft = "#f7f8f9";
export const fillHover = "#e6e9ec";
export const text = "#16191c";
export const textSub = "#3c444c";
export const muted = "#5f6b76";
export const line = "#e6e9ec";
export const lineStrong = "#cfd5da";
export const accent = "#0e7c86";
export const accentStrong = "#0a5f67";
export const accentSoft = "#e3f1f2";
export const accentFill = "#0e7c86";
export const accentFillStrong = "#0a5f67";
export const onAccent = "#ffffff";
export const danger = "#b4382e";
export const warnBg = "#fff4dc";
export const warnLine = "#f0d595";
export const r18 = "#d6254d";
export const overlay = "rgba(0, 0, 0, 0.6)";
export const checkerA = "#e9ecef";
export const checkerB = "#f7f8f9";
export const logoBack = "#9fd0d4";
export const radius = "12px";
export const radiusSmall = "8px";

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
