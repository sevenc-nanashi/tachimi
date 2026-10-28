import { ClipboardCheck, ClipboardX, FolderOpen } from "lucide-static";
import type { TachieInfo } from "~/cli.ts";
import * as theme from "~/theme.ts";
import * as actions from "~/actions.ts";
import IconButton from "./IconButton.tsx";
import UpdateDialog from "./UpdateDialog.tsx";
import DeleteDialog from "./DeleteDialog.tsx";
import type { UpdateStatus } from "./TachieList.tsx";
import Link from "./Link.tsx";
import { Show } from "solid-js";

export default function TachieEntry(props: {
  tachie: TachieInfo;
  updateStatus: UpdateStatus | undefined;
  isParentWorkIncluded: boolean;
  onIncludeParentWork: () => void;
  onExcludeParentWork: () => void;
  onDownloaded: () => void;
}) {
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

        <Show when={props.tachie.parentWork}>
          {(parentWork) => (
            <div
              style={{
                fontSize: theme.fontSize.sm,
                display: "flex",
              }}
            >
              親作品先：
              <Link url={parentWork().url}>{parentWork().url}</Link>
            </div>
          )}
        </Show>
        <div
          style={{
            fontSize: theme.fontSize.sm,
            display: "flex",
          }}
        >
          TACHIE：
          <Link url={props.tachie.url}>{props.tachie.url}</Link>
        </div>
        <div
          style={{ alignSelf: "start", display: "flex", gap: theme.spacing.sm }}
        >
          <IconButton
            level="secondary"
            size="small"
            icon={FolderOpen}
            onClick={() => actions.openFolder(props.tachie.dir)}
          >
            フォルダを開く
          </IconButton>
          <Show
            when={props.isParentWorkIncluded}
            fallback={
              <IconButton
                level="secondary"
                size="small"
                icon={ClipboardCheck}
                disabled={!props.tachie.parentWork}
                onClick={() => props.onIncludeParentWork()}
              >
                親作品対象に含める
              </IconButton>
            }
          >
            <IconButton
              level="primary"
              size="small"
              icon={ClipboardX}
              onClick={() => props.onExcludeParentWork()}
            >
              親作品対象から除外する
            </IconButton>
          </Show>
          <UpdateDialog
            tachie={props.tachie}
            updateStatus={props.updateStatus}
            onDownloaded={props.onDownloaded}
          />
          <DeleteDialog
            tachie={props.tachie}
            onDeleted={() => {
              props.onExcludeParentWork();
              props.onDownloaded();
            }}
          />
        </div>
      </div>
    </div>
  );
}
