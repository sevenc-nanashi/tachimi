import { render } from "@gpuix/solid";
import { Header } from "./components/Header.tsx";
import * as theme from "~/theme.ts";

function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
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
    </div>
  );
}

render(() => <App />, { title: "Tachimi", width: 800, height: 600 });
