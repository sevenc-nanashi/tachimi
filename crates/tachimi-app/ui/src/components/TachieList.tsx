import * as theme from "~/theme.ts";

export default function TachieList() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
      }}
    >
      Tachie list
    </div>
  );
}
