import { JSX, StyleDesc } from "@gpuix/solid";
import * as actions from "~/actions.ts";
import * as theme from "~/theme.ts";

export default function Link(props: {
  url: string;
  children?: JSX.Element;
  style?: StyleDesc;
}) {
  return (
    <text
      role="link"
      tabIndex={0}
      onClick={() => actions.openUrl(props.url)}
      onKeyDown={(event) => {
        if (event.key === "enter" && !event.isHeld) {
          actions.openUrl(props.url);
        }
      }}
      style={{
        display: "inline",
        color: theme.accent,
        textDecoration: "underline",
        cursor: "pointer",
        ...props.style,
      }}
    >
      {props.children}
    </text>
  );
}
