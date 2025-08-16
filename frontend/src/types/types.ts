import { XYPosition } from "reactflow";

export type NodeStatus = "idle" | "running" | "done";

export type PipelineLog = { t: number; msg: string };

export type AddNodeInput = {
  typeId: string;
  label: string;
  position: XYPosition;
};

export type PipelineNodeData = {
  label: string;
  typeId: string;
  status: NodeStatus;
};



export type NodeType = { id: string; name: string };