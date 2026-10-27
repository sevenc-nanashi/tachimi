import { render } from "@gpuix/solid";
import Header from "./components/Header.tsx";
import TachieList from "./components/TachieList.tsx";

function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <TachieList />
    </div>
  );
}

render(() => <App />, { title: "Tachimi", width: 800, height: 600 });
