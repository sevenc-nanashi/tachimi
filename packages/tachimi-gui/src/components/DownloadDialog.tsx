import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@gpuix/solid/dialog";
import { ArrowLeft, Download, Search, X } from "lucide-static";
import { createSignal, Show } from "solid-js";
import * as cli from "~/cli.ts";
import * as theme from "~/theme.ts";
import IconButton from "./IconButton.tsx";
import DownloadProgress from "./DownloadProgress.tsx";

export default function DownloadDialog(props: { onDownloaded: () => void }) {
  const [open, setOpen] = createSignal(false);
  const [url, setUrl] = createSignal("");
  const [info, setInfo] = createSignal<cli.TachiePreview>();
  const [fetching, setFetching] = createSignal(false);
  const [downloading, setDownloading] = createSignal(false);
  const [progress, setProgress] = createSignal<number>();
  const [error, setError] = createSignal<string>();
  const busy = () => fetching() || downloading();

  async function preview() {
    if (busy()) return;
    setFetching(true);
    setError(undefined);
    try {
      setInfo(await cli.getTachieInfo(url()));
    } catch (error) {
      setError(String(error));
    } finally {
      setFetching(false);
    }
  }

  async function download() {
    if (busy() || !info()) return;
    setDownloading(true);
    setProgress(undefined);
    setError(undefined);
    try {
      await cli.downloadTachie(url(), setProgress);
      setOpen(false);
      setUrl("");
      props.onDownloaded();
    } catch (error) {
      setError(String(error));
    } finally {
      setDownloading(false);
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
        level="primary"
        icon={Download}
        size="small"
        onClick={() => {
          setError(undefined);
          setInfo(undefined);
          setOpen(true);
        }}
      >
        立ち絵をダウンロード
      </IconButton>
      <DialogPortal>
        <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
        <DialogPopup
          aria-label="立ち絵をダウンロード"
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
            立ち絵をダウンロード
          </DialogTitle>
          <Show
            when={info()}
            fallback={
              <>
                <text style={{ color: theme.textSub }}>
                  立ち絵の作品URLを入力してください
                </text>
                <input
                  aria-label="作品URL"
                  value={url()}
                  placeholder="https://tachie.net/w/..."
                  readOnly={busy()}
                  onChange={(event) => setUrl(event.value!)}
                  onSubmit={() => void preview()}
                  style={{
                    width: "100%",
                    padding: theme.spacing.sm,
                    borderWidth: 1,
                    borderColor: theme.lineStrong,
                    borderRadius: 8,
                    color: theme.text,
                  }}
                />
              </>
            }
          >
            {(info) => (
              <>
                <text style={{ color: theme.textSub }}>
                  この立ち絵をダウンロードしますか？
                </text>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: theme.spacing.md,
                  }}
                >
                  <img
                    src={info().thumbnail}
                    alt={info().title}
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
                      {info().title}
                    </text>
                    <text style={{ color: theme.textSub }}>{info().user}</text>
                    <text
                      style={{
                        color: theme.muted,
                        fontSize: theme.fontSize.sm,
                      }}
                    >
                      {url().trim()}
                    </text>
                    <text style={{ color: theme.text }}>
                      {`概算サイズ：${(
                        info().approxSize /
                        1024 /
                        1024
                      ).toLocaleString("ja-JP", {
                        maximumFractionDigits: 2,
                      })} MB`}
                    </text>
                  </div>
                </div>
              </>
            )}
          </Show>
          <Show when={error()}>
            <text role="alert" style={{ color: theme.danger }}>
              {error()}
            </text>
          </Show>
          <Show when={downloading()}>
            <DownloadProgress value={progress()} />
          </Show>
          <Show when={fetching()}>
            <text style={{ color: theme.muted }}>作品情報を取得中...</text>
          </Show>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "end",
              gap: theme.spacing.sm,
            }}
          >
            <Show when={!info()}>
              <IconButton
                level="secondary"
                size="small"
                icon={X}
                disabled={busy()}
                onClick={() => setOpen(false)}
              >
                閉じる
              </IconButton>
            </Show>
            <Show when={info()}>
              <IconButton
                level="secondary"
                size="small"
                icon={ArrowLeft}
                disabled={busy()}
                onClick={() => {
                  setInfo(undefined);
                  setError(undefined);
                }}
              >
                戻る
              </IconButton>
            </Show>
            <IconButton
              level="primary"
              size="small"
              icon={info() ? Download : Search}
              disabled={busy() || !url().trim()}
              onClick={() => void (info() ? download() : preview())}
            >
              {info() ? "ダウンロード" : "情報を確認"}
            </IconButton>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
