import { useGpuixRequired } from "@gpuix/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@gpuix/solid/dialog";
import { ClipboardCopy, FolderInput, Settings, X } from "lucide-static";
import { createSignal, Show } from "solid-js";
import * as cli from "~/cli.ts";
import { copyToClipboard } from "~/actions.ts";
import * as theme from "~/theme.ts";
import IconButton from "./IconButton.tsx";

export default function SettingsDialog(props: { onMoved: () => void }) {
  const renderer = useGpuixRequired();
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [directory, setDirectory] = createSignal<string>();
  const [destination, setDestination] = createSignal<string>();
  const [error, setError] = createSignal<string>();
  const [message, setMessage] = createSignal<string>();

  async function show() {
    setOpen(true);
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    setDestination(undefined);
    setDirectory(undefined);
    try {
      setDirectory((await cli.getConfig()).tachie_dir);
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function choose() {
    if (busy()) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      if (!renderer.promptForPaths)
        throw new Error("フォルダ選択を利用できません");
      const paths = await renderer.promptForPaths({
        directories: true,
        files: false,
        multiple: false,
        prompt: "移動先を選択",
      });
      if (paths === null) return;
      if (paths.length !== 1 || !paths[0])
        throw new Error("移動先を1つ選択してください");
      setDestination(paths[0]);
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyPath() {
    const path = directory();
    if (busy() || !path) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await copyToClipboard(path);
      setMessage("パスをコピーしました");
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  }

  async function move() {
    const target = destination();
    if (busy() || !target) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await cli.moveTachieDir(target);
      setDestination(undefined);
      setMessage("立ち絵フォルダを移動しました");
    } catch (error) {
      setError(String(error));
    } finally {
      try {
        setDirectory((await cli.getConfig()).tachie_dir);
      } catch (error) {
        setError((previous) =>
          previous ? `${previous}\n${String(error)}` : String(error),
        );
      }
      props.onMoved();
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
        size="small"
        icon={Settings}
        onClick={() => void show()}
      >
        設定
      </IconButton>
      <DialogPortal>
        <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
        <DialogPopup
          aria-label="設定"
          style={{
            width: 560,
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
            設定
          </DialogTitle>
          <text
            style={{
              color: theme.text,
              fontSize: theme.fontSize.lg,
              fontWeight: "bold",
            }}
          >
            立ち絵フォルダ
          </text>
          <Show when={directory()}>
            <text style={{ color: theme.textSub }}>{directory()}</text>
            <IconButton
              level="secondary"
              size="small"
              icon={ClipboardCopy}
              disabled={busy()}
              onClick={() => void copyPath()}
            >
              パスをコピー
            </IconButton>
          </Show>
          <text style={{ color: theme.textSub }}>
            移動先には空のフォルダを選択してください。追加・編集したファイルもまとめて移動します。
          </text>
          <text style={{ color: theme.danger }}>
            移動すると、既存の編集プロジェクトのファイル参照が切れる場合があります。立ち絵を使用中のアプリを閉じてから移動してください。
          </text>
          <IconButton
            level="secondary"
            size="small"
            icon={FolderInput}
            disabled={busy() || !directory()}
            onClick={() => void choose()}
          >
            立ち絵フォルダを移動
          </IconButton>
          <Show when={destination()}>
            <text
              style={{ color: theme.text }}
            >{`移動先：${destination()}`}</text>
            <IconButton
              level="primary"
              size="small"
              icon={FolderInput}
              disabled={busy()}
              onClick={() => void move()}
            >
              このフォルダへ移動する
            </IconButton>
          </Show>
          <Show when={busy()}>
            <text style={{ color: theme.muted }}>処理中...</text>
          </Show>
          <Show when={message()}>
            <text style={{ color: theme.text }}>{message()}</text>
          </Show>
          <Show when={error()}>
            <text role="alert" style={{ color: theme.danger }}>
              {error()}
            </text>
          </Show>
          <div style={{ display: "flex", justifyContent: "end" }}>
            <IconButton
              level="secondary"
              size="small"
              icon={X}
              disabled={busy()}
              onClick={() => setOpen(false)}
            >
              閉じる
            </IconButton>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
