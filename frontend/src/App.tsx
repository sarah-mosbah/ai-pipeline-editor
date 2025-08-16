import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import NodePalette from "./components/NodePalette/NodePalette";
import PipelineCanvas from "./components/PipelineCanvas/PipelineCanvas";
import ExecutionLog from "./components/ExecutionLog/ExecutionLog";
import { pipelineStore } from "./state/pipelineStore";
import "./App.css";

const App = observer(() => {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setError(null);
  }, []);

  return (
    <div className="app">
      <div className="palette panel">
        <div className="header">
          <h1 className="h1">Node Palette</h1>
        </div>
        <NodePalette onError={setError} />
        {error && <div style={{ color: "#fca5a5", marginTop: 8 }}>{error}</div>}
      </div>
      <div className="canvas panel">
        <div className="toolbar">
          <button className="btn" onClick={pipelineStore.resetExecution} disabled={pipelineStore.running}>
            Reset
          </button>
          <button className="btn primary" onClick={pipelineStore.execute} disabled={pipelineStore.running}>
            {pipelineStore.running ? "Running…" : "Execute"}
          </button>
        </div>
        <PipelineCanvas />
      </div>
      <div className="logs panel">
        <div className="header">
          <h2 className="h1">Execution Logs</h2>
          <span className="desc">Faux results per node</span>
        </div>
        <ExecutionLog />
      </div>
    </div>
  );
});

export default App;
