import { render } from "@gpuix/solid";
import { createResource } from "solid-js";
import * as cli from "~/cli.ts";
import Header from "./components/Header.tsx";
import TachieList from "./components/TachieList.tsx";

function App() {
  const [tachies, { refetch }] = createResource(cli.listTachie);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Header onDownloaded={() => void refetch()} />
      <TachieList tachies={tachies} />
    </div>
  );
}

render(() => <App />, { title: "Tachimi", width: 800, height: 600 });
