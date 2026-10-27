import { createResource, Show } from "solid-js";
import * as theme from "~/theme.ts";
import * as cli from "~/cli.ts";

export function Header() {
  const [version] = createResource(cli.getVersion);

  return (
    <div
      style={{
        gap: 24,
        display: "flex",
        flexDirection: "row",
        ...theme.paddingXY(theme.spacing.md, theme.spacing.sm),
        borderBottomWidth: 1,
        borderColor: theme.line,
      }}
    >
      <text
        style={{
          color: theme.accent,
          fontWeight: "bold",
        }}
      >
        Tachimi
      </text>
      <Show
        when={version()}
        fallback={<text style={{ color: theme.muted }}>Loading...</text>}
      >
        <text style={{ color: theme.muted }}>{`v${version()?.version}`}</text>
      </Show>
    </div>
  );
}
