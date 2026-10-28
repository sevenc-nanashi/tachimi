import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@gpuix/solid/dialog";
import { Download, RefreshCw, X } from "lucide-static";
import { createSignal, Show } from "solid-js";
import * as cli from "~/cli.ts";
import * as theme from "~/theme.ts";
import IconButton from "./IconButton.tsx";
import DownloadProgress from "./DownloadProgress.tsx";
import type { UpdateStatus } from "./TachieList.tsx";

export default function UpdateDialog(props: {
  tachie: cli.TachieInfo;
  updateStatus: UpdateStatus | undefined;
  onDownloaded: () => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [progress, setProgress] = createSignal<number>();
  const [error, setError] = createSignal<string>();
  async function update() {
    if (busy()) return;
    setBusy(true);
    setProgress(undefined);
    setError(undefined);
    try {
      await cli.downloadKey(props.tachie.key, setProgress);
      setOpen(false);
      props.onDownloaded();
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        if (!busy()) setOpen(next);
      }}
    >
      <IconButton
        level={props.updateStatus === "available" ? "primary" : "secondary"}
        size="small"
        icon={RefreshCw}
        disabled={props.updateStatus !== "available"}
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        {props.updateStatus === undefined || props.updateStatus === "checking"
          ? "チェック中..."
          : props.updateStatus === "current"
            ? "最新です"
            : props.updateStatus === "available"
              ? "更新"
              : "確認に失敗"}
      </IconButton>
      <DialogPortal>
        <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
        <DialogPopup
          aria-label="立ち絵を更新"
          style={{
            width: 480,
            maxWidth: "90%",
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            backgroundColor: theme.bg,
            borderRadius: 12,
          }}
        >
          <DialogTitle
            style={{
              color: theme.text,
              fontSize: theme.fontSize.xl,
              fontWeight: "bold",
            }}
          >
            立ち絵を更新
          </DialogTitle>
          <text style={{ color: theme.text }}>
            {`「${props.tachie.name}」を更新しますか？`}
          </text>
          <text style={{ color: theme.danger }}>
            ZIPにあるファイルを改変していた場合はその改変はリセットされます。
            改変を残したい場合は別の場所に退避させてから更新してください。
          </text>
          <Show when={error()}>
            <text role="alert" style={{ color: theme.danger }}>
              {error()}
            </text>
          </Show>
          <Show when={busy()}>
            <DownloadProgress value={progress()} />
          </Show>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "end",
              gap: theme.spacing.sm,
            }}
          >
            <IconButton
              level="secondary"
              size="small"
              icon={X}
              disabled={busy()}
              onClick={() => setOpen(false)}
            >
              キャンセル
            </IconButton>
            <IconButton
              level="primary"
              size="small"
              icon={Download}
              disabled={busy()}
              onClick={() => void update()}
            >
              更新
            </IconButton>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
