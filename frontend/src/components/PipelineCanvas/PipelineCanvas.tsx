import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  OnConnect,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { pipelineStore } from "../../state/pipelineStore";
import { validateConnection } from "../../utils/graph";
import "./PipelineCanvas.css";

const PipelineCanvas = observer(() => {

  const arrayNodes = Array.isArray(pipelineStore.nodes) ? pipelineStore.nodes : [];
  const arrayEdges = Array.isArray(pipelineStore.edges) ? pipelineStore.edges : [];

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(arrayNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(arrayEdges);

  useEffect(() => {
    if (Array.isArray(pipelineStore.nodes)) {
      setRfNodes(pipelineStore.nodes);
    }
  }, [pipelineStore.nodes, setRfNodes]);

  useEffect(() => {
    if (Array.isArray(pipelineStore.edges)) {
      setRfEdges(pipelineStore.edges);
    }
  }, [pipelineStore.edges, setRfEdges]);

  const onDrop = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      try {
        const bounds = (ev.target as HTMLDivElement).getBoundingClientRect();
        const txt = ev.dataTransfer.getData("application/reactflow");
        if (!txt) {
          console.warn("No drag data found");
          return;
        }

        const data = JSON.parse(txt) as { id: string; name: string };
        if (!data.id || !data.name) {
          console.error("Invalid node data:", data);
          return;
        }

        // Calculate position with validation
        const x = ev.clientX - bounds.left;
        const y = ev.clientY - bounds.top;
        
        // Ensure coordinates are valid numbers
        const position = {
          x: isNaN(x) ? 0 : Math.max(0, x),
          y: isNaN(y) ? 0 : Math.max(0, y),
        };
        
        console.log('Dropping node at position:', position);
        pipelineStore.addNode({ typeId: data.id, label: data.name, position });
      } catch (error) {
        console.error("Failed to process dropped node:", error);
      }
    },
    []
  );

  const onDragOver = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }, []);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      try {
        const safeRfNodes = Array.isArray(rfNodes) ? rfNodes : [];
        const safeRfEdges = Array.isArray(rfEdges) ? rfEdges : [];

        const ok = validateConnection(params, safeRfNodes, safeRfEdges);
        if (!ok) {
          console.warn("Invalid connection attempt:", params);
          return;
        }
        const newEdges = addEdge({ ...params, animated: true }, safeRfEdges);
        pipelineStore.setEdges(newEdges);
      } catch (error) {
        console.error("Failed to create connection:", error);
      }
    },
    [rfNodes, rfEdges]
  );

  const onEdgesChangeSync: typeof onEdgesChange = (changes) => {
    try {
      onEdgesChange(changes);
    } catch (error) {
      console.error("Failed to handle edge changes:", error);
    }
  };

  const onNodesChangeSync: typeof onNodesChange = (changes) => {
    try {
      onNodesChange(changes);
      pipelineStore.setNodes((nodes: any[]) => {
        if (!Array.isArray(nodes)) {
          console.warn("Invalid nodes state, resetting to empty array");
          return [];
        }
        const map = new Map(nodes.map((n) => [n.id, n]));
        changes.forEach((ch: any) => {
          if (ch.type === "position" && map.has(ch.id) && ch.position) {
            const node = map.get(ch.id)!;
            // Validate position object has x and y properties
            if (ch.position && typeof ch.position.x === 'number' && typeof ch.position.y === 'number') {
              node.position = ch.position;
            } else {
              console.warn('Invalid position data:', ch.position);
            }
          }
        });
        return Array.from(map.values());
      });
    } catch (error) {
      console.error("Failed to sync node changes:", error);
    }
  };

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChangeSync}
        onEdgesChange={onEdgesChangeSync}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
});

export default PipelineCanvas;
