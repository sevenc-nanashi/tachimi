import { JSX } from "solid-js";
import { Button } from "@gpuix/solid";
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
  disabled?: boolean;
}) {
  return (
    <Button
      disabled={props.disabled}
      style={{
        ...(props.level === "primary"
          ? {
              backgroundColor: theme.accent,
              color: theme.onAccent,
              borderRadius: 128,
              hover: {
                backgroundColor: theme.accentStrong,
              },
            }
          : {
              backgroundColor: theme.bg,
              borderColor: theme.lineStrong,
              color: theme.text,
              borderWidth: 1,
              borderRadius: 128,
              hover: {
                backgroundColor: theme.fill,
              },
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
        gap: props.children ? padding[props.size] : 0,
        opacity: props.disabled ? 0.5 : 1,

        ...(props.disabled
          ? {
              cursor: "not-allowed",
              hover: {},
            }
          : {
              cursor: "pointer",
            }),
      }}

      onClick={props.onClick}
    >
      <svg
        source={props.icon}
        style={{
          color: props.level === "primary" ? theme.onAccent : theme.text,
          width: sizes[props.size] - padding[props.size] * 2,
          height: sizes[props.size] - padding[props.size] * 2,
        }}
      />
      {props.children}
    </Button>
  );
}
