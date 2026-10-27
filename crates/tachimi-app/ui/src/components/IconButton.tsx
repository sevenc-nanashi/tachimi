import { JSX } from "solid-js";
import * as theme from "~/theme.ts";

const sizes = {
  small: 24,
  medium: 32,
  large: 40,
};
const padding = {
  small: 4,
  medium: 8,
  large: 12,
};
const textPaddings = {
  small: 8,
  medium: 16,
  large: 24,
};
const fontSizes = {
  small: 12,
  medium: 14,
  large: 16,
};

export default function IconButton(props: {
  level: "primary" | "secondary";
  size: "small" | "medium" | "large";
  icon: string;
  children?: JSX.Element;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        ...(props.level === "primary"
          ? {
              backgroundColor: theme.accent,
              color: theme.bg,
              borderRadius: 128,
              cursor: "pointer",
              hover: {
                backgroundColor: theme.accentStrong,
              },
            }
          : {
              backgroundColor: theme.bg,
              borderColor: theme.line,
              borderWidth: 1,
              borderRadius: 128,
            }),
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: padding[props.size],
        paddingLeft: props.children
          ? textPaddings[props.size]
          : padding[props.size],
        paddingRight: props.children
          ? textPaddings[props.size] * 1.5
          : padding[props.size],
        fontSize: fontSizes[props.size],
      }}

      onClick={props.onClick}
    >
      <svg
        source={props.icon}
        style={{
          width: sizes[props.size] - padding[props.size] * 2,
          height: sizes[props.size] - padding[props.size] * 2,
        }}
      />
      {props.children}
    </div>
  );
}
