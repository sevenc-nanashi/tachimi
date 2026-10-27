import * as theme from "~/theme.ts";

const sizes = {
  small: 24,
  medium: 32,
  large: 40,
};
const padding = {
  small: 8,
  medium: 8,
  large: 12,
};

export default function IconButton(props: {
  level: "primary" | "secondary";
  size: "small" | "medium" | "large";
  icon: string;
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
        display: "grid",
        alignItems: "center",
        justifyContent: "center",
        width: sizes[props.size],
        height: sizes[props.size],
      }}

      onClick={props.onClick}
    >
      <svg
        source={props.icon}
        style={{
          width: sizes[props.size] - padding[props.size],
          height: sizes[props.size] - padding[props.size],
        }}
      />
    </div>
  );
}
