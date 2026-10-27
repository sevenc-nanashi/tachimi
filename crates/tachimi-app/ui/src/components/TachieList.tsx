import * as theme from "~/theme.ts";
import {
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import * as cli from "~/cli.ts";
import * as actions from "~/actions.ts";
import TachieEntry from "./TachieEntry.tsx";

export default function TachieList() {
  const [tachies] = createResource(cli.listTachie);
  const [openError, setOpenError] = createSignal<string>();

  async function openFolder(dir: string) {
    setOpenError(undefined);
    try {
      await actions.openFolder(dir);
    } catch (error) {
      setOpenError(String(error));
    }
  }

  async function openUrl(url: string) {
    setOpenError(undefined);
    try {
      await actions.openUrl(url);
    } catch (error) {
      setOpenError(String(error));
    }
  }

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
      <Show when={openError()}>
        <text style={{ color: theme.danger }}>{openError()}</text>
      </Show>
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
                onOpenFolder={() => void openFolder(tachie.dir)}
                onOpenUrl={() => void openUrl(tachie.url)}
              />
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}
