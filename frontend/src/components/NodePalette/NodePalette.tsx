import React, { useEffect, useState } from "react";
import { NodeType } from "../../types/types";
import { fetchNodes } from "../../services/nodeService";
import "./NodePalette.css";

export default function NodePalette({
  onError,
}: {
  onError?: (m: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<NodeType[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchNodeTypes = async () => {
      try {
        const nodeTypes = await fetchNodes();
        if (!cancelled) {
          setTypes(nodeTypes);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e.message;
          setError(msg);
          onError?.(msg);
          console.error("Failed to fetch node types:", e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchNodeTypes();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  if (loading) return <div className="small">Loading node types…</div>;
  if (error) return <div style={{ color: "#fca5a5" }}>Error: {error}</div>;

  const onDragStart = (
    ev: React.DragEvent<HTMLDivElement>,
    nodeType: NodeType
  ) => {
    try {
      ev.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify(nodeType)
      );
      ev.dataTransfer.effectAllowed = "move";
    } catch (error) {
      console.error("Failed to start drag operation:", error);
    }
  };

  return (
    <div>
      <div className="desc" style={{ marginBottom: 8 }}>
        Drag any node to the canvas.
      </div>
      {types.map((t) => (
        <div
          key={t.id}
          className="node-pill"
          draggable
          onDragStart={(e) => onDragStart(e, t)}
        >
          <span>{t.name}</span>
          <span className="small">{t.id}</span>
        </div>
      ))}
    </div>
  );
}