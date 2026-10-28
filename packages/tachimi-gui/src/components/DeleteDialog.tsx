import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@gpuix/solid/dialog";
import { Trash2, X } from "lucide-static";
import { createSignal, Show } from "solid-js";
import * as cli from "~/cli.ts";
import * as theme from "~/theme.ts";
import IconButton from "./IconButton.tsx";

export default function DeleteDialog(props: {
  tachie: cli.TachieInfo;
  onDeleted: () => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string>();
  async function remove() {
    if (busy()) return;
    setBusy(true);
    setError(undefined);
    try {
      await cli.deleteTachie(props.tachie.key);
      setOpen(false);
      props.onDeleted();
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
        level="secondary"
        type="danger"
        size="small"
        icon={Trash2}
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        削除
      </IconButton>
      <DialogPortal>
        <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
        <DialogPopup
          aria-label="立ち絵を削除"
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
            立ち絵を削除
          </DialogTitle>
          <text
            style={{ color: theme.text }}
          >{`「${props.tachie.name}」を削除しますか？`}</text>
          <text style={{ color: theme.danger }}>
            追加・変更したファイルを含め、立ち絵フォルダ全体を削除します。この操作は取り消せません。
          </text>
          <Show when={error()}>
            <text role="alert" style={{ color: theme.danger }}>
              {error()}
            </text>
          </Show>
          <Show when={busy()}>
            <text style={{ color: theme.muted }}>削除中...</text>
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
              type="danger"
              size="small"
              icon={Trash2}
              disabled={busy()}
              onClick={() => void remove()}
            >
              削除
            </IconButton>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
