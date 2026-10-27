import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@gpuix/solid/dialog";
import { RefreshCw, X } from "lucide-static";
import { createResource, createSignal, Show } from "solid-js";
import { checkForUpdate, installUrl, version } from "~/update.ts";
import * as theme from "~/theme.ts";
import * as actions from "~/actions.ts";
import IconButton from "./IconButton.tsx";
import Link from "./Link.tsx";

const homepage = "https://tachimi.sevenc7c.com";

export default function AboutDialog() {
  const [open, setOpen] = createSignal(false);
  const [update, { refetch }] = createResource(checkForUpdate);
  const availableUpdate = () => !update.error && !update.loading && update();
  const updateLabel = () => {
    if (update.loading) return "更新を確認中...";
    if (update.error) return "更新の確認に失敗しました";
    if (update()) return `v${update()} が利用できます`;
    return "最新バージョンです";
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Tachimiについて"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: theme.spacing.sm,
          cursor: "pointer",
          borderBottomWidth: 1,
          borderColor: "transparent",
          hover: { borderColor: theme.accent },
          focusVisible: {
            borderColor: theme.accent,
          },
        }}
      >
        <text
          style={{
            color: theme.accent,
            fontSize: theme.fontSize.xl,
            fontWeight: "bold",
          }}
        >
          Tachimi
        </text>
        <text style={{ color: theme.muted, fontSize: theme.fontSize.sm }}>
          {`v${version}`}
        </text>
        <Show when={availableUpdate()}>
          <text style={{ color: theme.accent, fontSize: theme.fontSize.sm }}>
            更新あり
          </text>
        </Show>
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
        <DialogPopup
          aria-label="Tachimiについて"
          style={{
            width: 400,
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
              color: theme.accent,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <text
              style={{
                fontSize: theme.fontSize.xxl,
                fontWeight: "bold",
              }}
            >
              Tachimi
            </text>
            <text style={{ color: theme.muted }}>{`v${version}`}</text>
          </DialogTitle>
          <text style={{ color: theme.text }}>
            Tachimiは、TACHIEの立ち絵を管理するためのツールです。
            このツールは非公式のツールであり、TACHIEの公式とは関係ありません。
          </text>
          <text
            role="status"
            style={{ color: update.error ? theme.danger : theme.muted }}
          >
            {updateLabel()}
          </text>
          <Show when={availableUpdate()}>
            <Link url={installUrl}>最新版のインストールページを開く</Link>
          </Show>
          <IconButton
            level="secondary"
            size="small"
            icon={RefreshCw}
            disabled={update.loading}
            onClick={() => void refetch()}
          >
            更新を確認
          </IconButton>
          <div
            role="link"
            tabIndex={0}
            onClick={() => actions.openUrl(homepage)}
            onKeyDown={(event) => {
              if (event.key === "enter" && !event.isHeld) {
                actions.openUrl(homepage);
              }
            }}
            style={{
              color: theme.accent,
              cursor: "pointer",
              textDecoration: "underline",
              focusVisible: { outlineWidth: 2, outlineColor: theme.accent },
            }}
          >
            <text>{homepage}</text>
          </div>
          <div style={{ alignSelf: "end" }}>
            <IconButton
              level="secondary"
              size="small"
              icon={X}
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
