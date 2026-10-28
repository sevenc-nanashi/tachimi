import * as theme from "~/theme.ts";

export default function DownloadProgress(props: { value: number | undefined }) {
  return (
    <div
      role="progressbar"
      aria-label="ダウンロード進捗"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={props.value}
      style={{
        width: "100%",
        height: 8,
        backgroundColor: theme.fill,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: props.value === undefined ? "100%" : `${props.value * 100}%`,
          height: "100%",
          borderRadius: 4,
          backgroundColor:
            props.value === undefined ? theme.accentSoft : theme.accent,
        }}
      />
    </div>
  );
}
