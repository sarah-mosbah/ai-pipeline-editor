import { makeAutoObservable, runInAction } from "mobx";
import { nanoid } from "nanoid";
import type { Node, Edge } from "reactflow";
import {
  topologicalOrder,
  hasCycle,
  nodeOutgoingCount,
  nodeIncomingCount,
} from "../utils/graph";
import {
  PipelineLog,
  PipelineNodeData,
  AddNodeInput,
  NodeStatus,
} from "../types/types";

const EXECUTION_DELAY_MS = 600;

const statusClass = (s: NodeStatus) =>
  s === "running" ? "node-running" : s === "done" ? "node-done" : "node-idle";

class PipelineStore {
  nodes: Node<PipelineNodeData>[] = [];
  edges: Edge[] = [];
  logs: PipelineLog[] = [];
  running: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setNodes = (updater: any) => {
    try {
      const currentNodes = Array.isArray(this.nodes) ? this.nodes : [];
      const newNodes =
        typeof updater === "function" ? updater(currentNodes) : updater;
      this.nodes = Array.isArray(newNodes) ? newNodes : [];
    } catch (error) {
      console.error("Error updating nodes:", error);
      this.nodes = [];
    }
  };

  setEdges = (edges: Edge[]) => {
    this.edges = Array.isArray(edges) ? edges : [];
  };

  addNode = (input: AddNodeInput) => {
    try {
      const currentNodes = Array.isArray(this.nodes) ? this.nodes : [];

      // Validate position object
      const position =
        input.position &&
        typeof input.position.x === "number" &&
        typeof input.position.y === "number"
          ? input.position
          : { x: 0, y: 0 };

      this.nodes = [
        ...currentNodes,
        {
          id: nanoid(),
          position: position,
          data: {
            label: input.label,
            typeId: input.typeId,
            status: "idle",
          },
          type: "default",
          className: statusClass("idle"),
        },
      ];
    } catch (error) {
      console.error("Error adding node:", error);
    }
  };

  resetExecution = () => {
    try {
      const currentNodes = Array.isArray(this.nodes) ? this.nodes : [];
      this.nodes = currentNodes.map((n) => ({
        ...n,
        data: { ...n.data, status: "idle" as NodeStatus },
        className: statusClass("idle"),
      }));
      this.logs = [];
    } catch (error) {
      console.error("Error resetting execution:", error);
      this.logs = [];
    }
  };

  execute = async () => {
    const arrayNodes = Array.isArray(this.nodes) ? this.nodes : [];
    const arrayEdges = Array.isArray(this.edges) ? this.edges : [];

    if (arrayNodes.length === 0) {
      runInAction(() => {
        this.logs = [{ t: Date.now(), msg: "Nothing to execute: canvas is empty." }];
      });
      return;
    }
    
    const invalidIO = arrayNodes.some(
      (n) =>
        nodeIncomingCount(n.id, arrayEdges) > 1 ||
        nodeOutgoingCount(n.id, arrayEdges) > 1
    );
    
    if (invalidIO) {
      runInAction(() => {
        this.logs = [
          ...(Array.isArray(this.logs) ? this.logs : []),
          {
            t: Date.now(),
            msg: "Invalid pipeline: Each node must have at most one input and one output.",
          },
        ];
      });
      return;
    }
    
    if (hasCycle(arrayNodes, arrayEdges)) {
      runInAction(() => {
        this.logs = [
          ...(Array.isArray(this.logs) ? this.logs : []),
          { t: Date.now(), msg: "Invalid pipeline: Graph contains a cycle." },
        ];
      });
      return;
    }

    runInAction(() => {
      this.running = true;
    });
    
    try {
      const order = topologicalOrder(arrayNodes, arrayEdges);
      for (const n of order) {
        runInAction(() => {
          this.nodes = (Array.isArray(this.nodes) ? this.nodes : []).map((nd) =>
            nd.id === n.id
              ? {
                  ...nd,
                  data: { ...nd.data, status: "running" as NodeStatus },
                  className: statusClass("running"),
                }
              : nd
          );
        });
        
        await new Promise((res) => setTimeout(res, EXECUTION_DELAY_MS));
        
        runInAction(() => {
          this.nodes = (Array.isArray(this.nodes) ? this.nodes : []).map((nd) =>
            nd.id === n.id
              ? {
                  ...nd,
                  data: { ...nd.data, status: "done" as NodeStatus },
                  className: statusClass("done"),
                }
              : nd
          );
          this.logs = [
            ...(Array.isArray(this.logs) ? this.logs : []),
            { t: Date.now(), msg: formatLog(n.data.typeId, n.data.label) },
          ];
        });
      }
      
      runInAction(() => {
        this.logs = [
          ...(Array.isArray(this.logs) ? this.logs : []),
          { t: Date.now(), msg: "Execution completed." },
        ];
      });
    } catch (e: any) {
      runInAction(() => {
        this.logs = [
          ...(Array.isArray(this.logs) ? this.logs : []),
          {
            t: Date.now(),
            msg: "Execution error: " + (e?.message ?? String(e)),
          },
        ];
      });
    } finally {
      runInAction(() => {
        this.running = false;
      });
    }
  };
}

export const pipelineStore = new PipelineStore();


