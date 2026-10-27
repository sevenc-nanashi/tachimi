import * as theme from "~/theme.ts";
import AboutDialog from "./AboutDialog.tsx";
import DownloadDialog from "./DownloadDialog.tsx";

export default function Header(props: { onDownloaded: () => void }) {
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
      <DownloadDialog onDownloaded={props.onDownloaded} />
    </div>
  );
}
