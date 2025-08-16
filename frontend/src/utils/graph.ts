import type { Connection, Edge, Node } from "reactflow";
export function nodeIncomingCount(nodeId: string, edges: Edge[]) {
  return edges.filter((e) => e.target === nodeId).length;
}
export function nodeOutgoingCount(nodeId: string, edges: Edge[]) {
  return edges.filter((e) => e.source === nodeId).length;
}
export function neighbors(nodeId: string, edges: Edge[]) {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}
export function hasPath(src: string, dst: string, edges: Edge[]): boolean {
  const q: string[] = [src];
  const v = new Set<string>([src]);
  while (q.length) {
    const u = q.shift()!;
    if (u === dst) return true;
    for (const n of neighbors(u, edges))
      if (!v.has(n)) {
        v.add(n);
        q.push(n);
      }
  }
  return false;
}
export function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const indeg = new Map<string, number>();
  nodes.forEach((n) => indeg.set(n.id, 0));
  edges.forEach((e) => indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1));
  const q = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  let removed = 0;
  while (q.length) {
    const u = q.shift()!;
    removed++;
    edges
      .filter((e) => e.source === u)
      .forEach((e) => {
        const t = e.target;
        const d = (indeg.get(t) ?? 0) - 1;
        indeg.set(t, d);
        if (d === 0) q.push(t);
      });
  }
  return removed !== nodes.length;
}
export function topologicalOrder(nodes: Node[], edges: Edge[]): Node[] {
  const indeg = new Map<string, number>();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  nodes.forEach((n) => indeg.set(n.id, 0));
  edges.forEach((e) => indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1));
  const q = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order: Node[] = [];
  while (q.length) {
    const u = q.shift()!;
    order.push(byId.get(u)!);
    edges
      .filter((e) => e.source === u)
      .forEach((e) => {
        const t = e.target;
        const d = (indeg.get(t) ?? 0) - 1;
        indeg.set(t, d);
        if (d === 0) q.push(t);
      });
  }
  if (order.length !== nodes.length)
    throw new Error("Cannot compute order for cyclic graph");
  return order;
}
export function validateConnection(
  conn: Connection,
  nodes: Node[],
  edges: Edge[]
) {
  const { source, target } = conn;
  if (!source || !target) return false;
  if (source === target) return false;

  // Check if this would create a cycle
  if (hasPath(target, source, edges)) return false;

  // Check connection limits: max 1 outgoing and 1 incoming per node
  const sourceOutgoing = nodeOutgoingCount(source, edges);
  const targetIncoming = nodeIncomingCount(target, edges);

  if (sourceOutgoing >= 1 || targetIncoming >= 1) return false;

  // Validate logical pipeline flow
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  if (!sourceNode || !targetNode) return false;

  return validatePipelineFlow(sourceNode.data?.typeId, targetNode.data?.typeId);
}

function validatePipelineFlow(sourceType: string, targetType: string): boolean {
  const flowOrder = ["data-source", "transformer", "model", "sink"];
  const sourceIndex = flowOrder.indexOf(sourceType);
  const targetIndex = flowOrder.indexOf(targetType);

  if (sourceIndex === -1 || targetIndex === -1) return true; // Unknown types allowed
  return targetIndex > sourceIndex;
}
