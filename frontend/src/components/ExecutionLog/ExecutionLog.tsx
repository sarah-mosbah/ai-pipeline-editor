import React from "react";
import { observer } from "mobx-react-lite";
import { pipelineStore } from "../../state/pipelineStore";
import "./ExecutionLog.css";

const ExecutionLog = observer(() => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {pipelineStore.logs.length === 0 && (
        <div className="desc">
          No logs yet. Build a pipeline and press Execute.
        </div>
      )}
      {pipelineStore.logs.map((l, i) => (
        <div key={i} className="logline">
          [{new Date(l.t).toLocaleTimeString()}] {l.msg}
        </div>
      ))}
    </div>
  );
});

export default ExecutionLog;
