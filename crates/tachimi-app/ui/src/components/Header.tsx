import { createResource, Show } from "solid-js";
import * as theme from "~/theme.ts";
import * as cli from "~/cli.ts";
import DownloadDialog from "./DownloadDialog.tsx";

export default function Header(props: { onDownloaded: () => void }) {
  const [version] = createResource(cli.getVersion);

  return (
    <div
      style={{
        gap: 24,
        display: "flex",
        flexDirection: "row",
        alignItems: "end",
        ...theme.paddingXY(theme.spacing.md, theme.spacing.sm),
        borderBottomWidth: 1,
        borderColor: theme.line,
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
      <Show
        when={version()}
        fallback={<text style={{ color: theme.muted }}>Loading...</text>}
      >
        <text
          style={{ color: theme.muted, fontSize: theme.fontSize.sm }}
        >{`v${version()?.version}`}</text>
      </Show>
      <div style={{ flexGrow: 1 }} />
      <DownloadDialog onDownloaded={props.onDownloaded} />
    </div>
  );
}
