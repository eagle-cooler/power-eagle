import { useState } from "react";
import reactLogo from "./assets/react.svg";
import eagleLogo from "./assets/eagle.png";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<"light" | "dark">("light");

  return (
    <div
      data-theme={mode}
      className="w-full h-screen text-center flex flex-col gap-y-10 justify-center"
    >
      <div className="flex justify-center gap-4">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="w-24" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-24" alt="React logo" />
        </a>
        <a href="https://eagle.cool" target="_blank">
          <img src={eagleLogo} className="w-24" alt="Eagle logo" />
        </a>
      </div>
      <h1 className="text-lg font-bold">Vite + React + Eagle Plugin</h1>
      <div>
        <div className="gap-x-2 flex justify-center">
          <button
            className="btn btn-primary"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <button
            className="btn"
            onClick={() =>
              setMode((mode) => (mode === "light" ? "dark" : "light"))
            }
          >
            change mode
          </button>
        </div>

        <p className="mt-2">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  );
}

export default App;
