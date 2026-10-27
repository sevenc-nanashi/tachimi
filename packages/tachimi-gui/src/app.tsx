import { render } from "@gpuix/solid";
import { createResource, createSignal } from "solid-js";
import * as cli from "~/cli.ts";
import * as actions from "~/actions.ts";
import Header from "./components/Header.tsx";
import TachieList from "./components/TachieList.tsx";

function App() {
  const [tachies, { refetch }] = createResource(cli.listTachie);
  const [parentWorkKeys, setParentWorkKeys] = createSignal<ReadonlySet<string>>(
    new Set(),
  );
  function setParentWorkIncluded(key: string, included: boolean) {
    setParentWorkKeys((previous) => {
      const next = new Set(previous);
      if (included) next.add(key);
      else next.delete(key);
      return next;
    });
  }
  async function copyParentWorkIds() {
    await actions.copyToClipboard(
      [...parentWorkKeys()]
        .flatMap((key) => {
          const tachie = tachies()?.find((t) => t.key === key);
          return tachie?.parentWork ? [tachie.parentWork.id] : [];
        })
        .join(" "),
    );

    setParentWorkKeys(new Set<string>());
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Header
        onDownloaded={() => void refetch()}
        hasParentWorks={parentWorkKeys().size > 0}
        onCopyParentWorkIds={copyParentWorkIds}
      />
      <TachieList
        tachies={tachies}
        onDownloaded={() => void refetch()}
        parentWorkKeys={parentWorkKeys()}
        onParentWorkIncludedChange={setParentWorkIncluded}
      />
    </div>
  );
}

render(() => <App />, { title: "Tachimi", width: 800, height: 600 });
