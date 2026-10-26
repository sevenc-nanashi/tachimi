import { createSignal } from "solid-js";
import { render } from "@gpuix/solid";

function App() {
  const [count, setCount] = createSignal(0);
  return (
    <div style={{ padding: 24, backgroundColor: "#1a1a1a", height: "100%" }}>
      <div onClick={() => setCount((value) => value + 1)}>
        <text style={{ color: "#e2e2e2" }}>Count: {count()}</text>
      </div>
    </div>
  );
}

render(() => <App />, { title: "Solid GPUIX", width: 800, height: 600 });
