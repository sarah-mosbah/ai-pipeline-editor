import type { Connection, Edge, Node } from "reactflow";
export function nodeIncomingCount(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.target === nodeId).length;
}

export function nodeOutgoingCount(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.source === nodeId).length;
}
export function neighbors(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.source === nodeId).map((edge) => edge.target);
}
export function hasPath(sourceNodeId: string, destinationNodeId: string, edges: Edge[]): boolean {
  const nodeQueue: string[] = [sourceNodeId];
  const visitedNodes = new Set<string>([sourceNodeId]);
  while (nodeQueue.length) {
    const currentNodeId = nodeQueue.shift()!;
    if (currentNodeId === destinationNodeId) return true;
    for (const neighborNodeId of neighbors(currentNodeId, edges))
      if (!visitedNodes.has(neighborNodeId)) {
        visitedNodes.add(neighborNodeId);
        nodeQueue.push(neighborNodeId);
      }
  }
  return false;
}
export function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const incomingDegreeMap = new Map<string, number>();
  nodes.forEach((node) => incomingDegreeMap.set(node.id, 0));
  edges.forEach((edge) => incomingDegreeMap.set(edge.target, (incomingDegreeMap.get(edge.target) ?? 0) + 1));
  const nodesWithNoIncomingEdges = nodes.filter((node) => (incomingDegreeMap.get(node.id) ?? 0) === 0).map((node) => node.id);
  let processedNodesCount = 0;
  while (nodesWithNoIncomingEdges.length) {
    const currentNodeId = nodesWithNoIncomingEdges.shift()!;
    processedNodesCount++;
    edges
      .filter((edge) => edge.source === currentNodeId)
      .forEach((edge) => {
        const targetNodeId = edge.target;
        const newIncomingDegree = (incomingDegreeMap.get(targetNodeId) ?? 0) - 1;
        incomingDegreeMap.set(targetNodeId, newIncomingDegree);
        if (newIncomingDegree === 0) nodesWithNoIncomingEdges.push(targetNodeId);
      });
  }
  return processedNodesCount !== nodes.length;
}
export function topologicalOrder(nodes: Node[], edges: Edge[]): Node[] {
  const incomingDegreeMap = new Map<string, number>();
  const nodeIdToNodeMap = new Map(nodes.map((node) => [node.id, node]));
  nodes.forEach((node) => incomingDegreeMap.set(node.id, 0));
  edges.forEach((edge) => incomingDegreeMap.set(edge.target, (incomingDegreeMap.get(edge.target) ?? 0) + 1));
  const nodesWithNoIncomingEdges = nodes.filter((node) => (incomingDegreeMap.get(node.id) ?? 0) === 0).map((node) => node.id);
  const topologicallySortedNodes: Node[] = [];
  while (nodesWithNoIncomingEdges.length) {
    const currentNodeId = nodesWithNoIncomingEdges.shift()!;
    topologicallySortedNodes.push(nodeIdToNodeMap.get(currentNodeId)!);
    edges
      .filter((edge) => edge.source === currentNodeId)
      .forEach((edge) => {
        const targetNodeId = edge.target;
        const newIncomingDegree = (incomingDegreeMap.get(targetNodeId) ?? 0) - 1;
        incomingDegreeMap.set(targetNodeId, newIncomingDegree);
        if (newIncomingDegree === 0) nodesWithNoIncomingEdges.push(targetNodeId);
      });
  }
  if (topologicallySortedNodes.length !== nodes.length)
    throw new Error("Cannot compute order for cyclic graph");
  return topologicallySortedNodes;
}
export function validateConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
) {
  const { source: sourceNodeId, target: targetNodeId } = connection;
  if (!sourceNodeId || !targetNodeId) return false;
  if (sourceNodeId === targetNodeId) return false;

  // Check if this would create a cycle
  if (hasPath(targetNodeId, sourceNodeId, edges)) return false;

  // Check connection limits: max 1 outgoing and 1 incoming per node
  const sourceOutgoingConnectionCount = nodeOutgoingCount(sourceNodeId, edges);
  const targetIncomingConnectionCount = nodeIncomingCount(targetNodeId, edges);

  if (sourceOutgoingConnectionCount >= 1 || targetIncomingConnectionCount >= 1) return false;

  // Validate logical pipeline flow
  const sourceNode = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === targetNodeId);
  if (!sourceNode || !targetNode) return false;

  return validatePipelineFlow(sourceNode.data?.typeId, targetNode.data?.typeId);
}

function validatePipelineFlow(sourceNodeType: string, targetNodeType: string): boolean {
  const pipelineFlowOrder = ["data-source", "transformer", "model", "sink"];
  const sourceNodeTypeIndex = pipelineFlowOrder.indexOf(sourceNodeType);
  const targetNodeTypeIndex = pipelineFlowOrder.indexOf(targetNodeType);

  if (sourceNodeTypeIndex === -1 || targetNodeTypeIndex === -1) return true; // Unknown types allowed
  return targetNodeTypeIndex > sourceNodeTypeIndex;
}
