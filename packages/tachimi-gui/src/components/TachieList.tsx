import * as theme from "~/theme.ts";
import {
  type Resource,
  createEffect,
  createSignal,
  For,
  Match,
  onCleanup,
  Switch,
} from "solid-js";
import * as cli from "~/cli.ts";
import TachieEntry from "./TachieEntry.tsx";

export type UpdateStatus = "checking" | "available" | "current" | "error";

export default function TachieList(props: {
  tachies: Resource<cli.TachieInfo[]>;
  onDownloaded: () => void;
}) {
  const tachies = props.tachies;
  const [updates, setUpdates] = createSignal<Record<string, UpdateStatus>>({});
  createEffect(() => {
    const items = tachies();
    if (!items) return;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    setUpdates(Object.fromEntries(items.map((item) => [item.key, "checking"])));
    const setStatus = (key: string, status: UpdateStatus) => {
      if (!cancelled) setUpdates((previous) => ({ ...previous, [key]: status }));
    };
    void (async () => {
      try {
        const shallow = await cli.shallowFetch();
        for (const item of items) {
          const revision = shallow.revisions[item.key];
          if (revision != null && revision > item.idx) {
            setStatus(item.key, "available");
          }
        }
      } catch {
        // Individual checks still discover updates if the shallow request fails.
      }
      for (const [index, item] of items.entries()) {
        if (cancelled) return;
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
        if (cancelled) return;
        try {
          const result = await cli.fetchTachie(item.key);
          const revision = result.revisions[item.key];
          if (revision == null) throw new Error("更新情報がありません");
          setStatus(item.key, revision > item.idx ? "available" : "current");
        } catch {
          setStatus(item.key, "error");
        }
      }
    })();
  });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        overflowY: "scroll",
        scrollbarColor: theme.lineStrong,
        gap: theme.spacing.md,
        padding: theme.spacing.md,
      }}
    >
      <Switch>
        <Match when={tachies.loading}>
          <text style={{ color: theme.muted }}>立ち絵を読み込み中...</text>
        </Match>
        <Match when={tachies.error}>
          <text style={{ color: theme.danger }}>
            立ち絵一覧を取得できませんでした: {String(tachies.error)}
          </text>
        </Match>
        <Match when={tachies()}>
          <For
            each={tachies()}
            fallback={
              <text style={{ color: theme.muted }}>立ち絵はまだありません</text>
            }
          >
            {(tachie) => (
              <TachieEntry
                tachie={tachie}
                updateStatus={updates()[tachie.key]}
                onDownloaded={props.onDownloaded}
              />
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}
