import { FolderOpen } from "lucide-static";
import type { TachieInfo } from "~/cli.ts";
import * as theme from "~/theme.ts";
import * as actions from "~/actions.ts";
import IconButton from "./IconButton.tsx";

export default function TachieEntry(props: { tachie: TachieInfo }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        flexShrink: 0,
        borderWidth: 1,
        borderColor: theme.line,
        borderRadius: 8,
      }}
    >
      <img
        src={props.tachie.thumbnail}
        alt={props.tachie.name}
        objectFit="contain"
        style={{
          width: 128,
          height: 128,
          flexShrink: 0,
          backgroundColor: theme.fillSoft,
          borderRadius: 8,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
          gap: theme.spacing.sm,
        }}
      >
        <text
          style={{
            color: theme.text,
            fontSize: theme.fontSize.lg,
            fontWeight: "bold",
          }}
        >
          {props.tachie.name}
        </text>
        <text
          style={{
            color: theme.textSub,
            fontSize: theme.fontSize.md,
          }}
        >
          {props.tachie.user}
        </text>
        <div
          role="link"
          tabIndex={0}
          onClick={() => actions.openUrl(props.tachie.url)}
          onKeyDown={(event) => {
            if (event.key === "enter" && !event.isHeld) {
              actions.openUrl(props.tachie.url);
            }
          }}
          style={{
            color: theme.accent,
            fontSize: theme.fontSize.sm,
            cursor: "pointer",
            textDecoration: "underline",
            focusVisible: { outlineWidth: 2, outlineColor: theme.accent },
          }}
        >
          <text>{props.tachie.url}</text>
        </div>
        <div style={{ alignSelf: "start" }}>
          <IconButton
            level="secondary"
            size="small"
            icon={FolderOpen}
            onClick={() => actions.openFolder(props.tachie.dir)}
          >
            フォルダを開く
          </IconButton>
        </div>
      </div>
    </div>
  );
}
