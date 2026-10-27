import { ClipboardCopy } from "lucide-static";
import { Show } from "solid-js";
import * as theme from "~/theme.ts";
import AboutDialog from "./AboutDialog.tsx";
import DownloadDialog from "./DownloadDialog.tsx";
import IconButton from "./IconButton.tsx";

export default function Header(props: {
  onDownloaded: () => void;
  hasParentWorks: boolean;
  onCopyParentWorkIds: () => void;
}) {
  return (
    <div
      style={{
        gap: 24,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        ...theme.paddingXY(theme.spacing.md, theme.spacing.sm),
        borderBottomWidth: 1,
        borderColor: theme.line,
      }}
    >
      <AboutDialog />
      <div style={{ flexGrow: 1 }} />
      <Show
        when={props.hasParentWorks}
        fallback={<DownloadDialog onDownloaded={props.onDownloaded} />}
      >
        <IconButton
          level="primary"
          size="small"
          icon={ClipboardCopy}
          onClick={props.onCopyParentWorkIds}
        >
          親作品IDをコピー
        </IconButton>
      </Show>
    </div>
  );
}
