import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@gpuix/solid/dialog";
import { X } from "lucide-static";
import { createResource, createSignal } from "solid-js";
import * as cli from "~/cli.ts";
import * as theme from "~/theme.ts";
import * as actions from "~/actions.ts";
import IconButton from "./IconButton.tsx";

const homepage = "https://tachimi.sevenc7c.com";

export default function AboutDialog() {
  const [open, setOpen] = createSignal(false);
  const [version] = createResource(cli.getVersion);
  const versionLabel = () => {
    if (version.error) return "バージョン取得失敗";
    if (version.loading) return "読み込み中...";
    return `v${version()!.version}`;
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
          {versionLabel()}
        </text>
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
            <text style={{ color: theme.muted }}>{versionLabel()}</text>
          </DialogTitle>
          <text style={{ color: theme.text }}>
            Tachimiは、TACHIEの立ち絵を管理するためのツールです。
            このツールは非公式のツールであり、TACHIEの公式とは関係ありません。
          </text>
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
