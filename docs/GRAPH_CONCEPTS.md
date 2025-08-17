# Graph Theory & Connection Validation

This document explains the graph-based validation system implemented in the AI Pipeline Editor to ensure pipeline integrity and prevent invalid connections.

## 📊 Overview

The pipeline editor treats AI workflows as **Directed Acyclic Graphs (DAGs)** where:
- **Nodes** represent processing steps (data sources, transformers, models, sinks)
- **Edges** represent data flow between nodes
- **Validation rules** ensure logical and structurally sound pipelines

## 🎯 Core Validation Rules

### 1. Self-Connection Prevention
```typescript
if (sourceNodeId === targetNodeId) return false;
```
**Rule**: A node cannot connect to itself.
**Reason**: Self-loops don't make logical sense in data processing pipelines.

### 2. Single Input/Output Constraint
```typescript
const sourceOutgoingConnectionCount = nodeOutgoingCount(sourceNodeId, edges);
const targetIncomingConnectionCount = nodeIncomingCount(targetNodeId, edges);

if (sourceOutgoingConnectionCount >= 1 || targetIncomingConnectionCount >= 1) return false;
```
**Rule**: Each node can have at most one input and one output connection.
**Reason**: Ensures one way data flow.

### 3. Cycle Prevention
```typescript
if (hasPath(targetNodeId, sourceNodeId, edges)) return false;
```
**Rule**: No cycles are allowed in the graph.
**Reason**: Cycles would create infinite loops during execution.

### 4. Logical Flow Order
```typescript
const pipelineFlowOrder = ["data-source", "transformer", "model", "sink"];
return targetNodeTypeIndex > sourceNodeTypeIndex;
```
**Rule**: Connections must follow the logical AI pipeline sequence.
**Reason**: Ensures data flows in the correct processing order.

## 🔍 Graph Algorithms Implementation

### 1. Path Detection (BFS)
```typescript
export function hasPath(sourceNodeId: string, destinationNodeId: string, edges: Edge[]): boolean {
  const nodeQueue: string[] = [sourceNodeId];
  const visitedNodes = new Set<string>([sourceNodeId]);
  
  while (nodeQueue.length) {
    const currentNodeId = nodeQueue.shift()!;
    if (currentNodeId === destinationNodeId) return true;
    
    for (const neighborNodeId of neighbors(currentNodeId, edges)) {
      if (!visitedNodes.has(neighborNodeId)) {
        visitedNodes.add(neighborNodeId);
        nodeQueue.push(neighborNodeId);
      }
    }
  }
  return false;
}
```
**Algorithm**: Breadth-First Search (BFS)
**Purpose**: Detect if a path exists between two nodes
**Use Case**: Cycle prevention - before adding an edge, check if a reverse path exists

### 2. Cycle Detection (Kahn's Algorithm)
```typescript
export function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const incomingDegreeMap = new Map<string, number>();
  
  // Initialize incoming degree for all nodes
  nodes.forEach((node) => incomingDegreeMap.set(node.id, 0));
  edges.forEach((edge) => incomingDegreeMap.set(edge.target, (incomingDegreeMap.get(edge.target) ?? 0) + 1));
  
  // Find nodes with no incoming edges
  const nodesWithNoIncomingEdges = nodes
    .filter((node) => (incomingDegreeMap.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  
  let processedNodesCount = 0;
  
  while (nodesWithNoIncomingEdges.length) {
    const currentNodeId = nodesWithNoIncomingEdges.shift()!;
    processedNodesCount++;
    
    // Reduce incoming degree for all neighbors
    edges
      .filter((edge) => edge.source === currentNodeId)
      .forEach((edge) => {
        const targetNodeId = edge.target;
        const newIncomingDegree = (incomingDegreeMap.get(targetNodeId) ?? 0) - 1;
        incomingDegreeMap.set(targetNodeId, newIncomingDegree);
        if (newIncomingDegree === 0) nodesWithNoIncomingEdges.push(targetNodeId);
      });
  }
  
  // If not all nodes were processed, there's a cycle
  return processedNodesCount !== nodes.length;
}
```
**Algorithm**: Kahn's Algorithm for Topological Sorting
**Purpose**: Detect cycles in directed graphs
**Logic**: If we can't process all nodes (some remain with incoming edges), a cycle exists

### 3. Topological Ordering
```typescript
export function topologicalOrder(nodes: Node[], edges: Edge[]): Node[] {
  // Similar to cycle detection but returns the actual order
  const topologicallySortedNodes: Node[] = [];
  
  while (nodesWithNoIncomingEdges.length) {
    const currentNodeId = nodesWithNoIncomingEdges.shift()!;
    topologicallySortedNodes.push(nodeIdToNodeMap.get(currentNodeId)!);
    // ... process neighbors
  }
  
  if (topologicallySortedNodes.length !== nodes.length) {
    throw new Error("Cannot compute order for cyclic graph");
  }
  
  return topologicallySortedNodes;
}
```
**Algorithm**: Kahn's Algorithm
**Purpose**: Determine execution order for pipeline nodes
**Use Case**: Pipeline execution follows this order to respect dependencies


### Flow Validation
```typescript
function validatePipelineFlow(sourceNodeType: string, targetNodeType: string): boolean {
  const pipelineFlowOrder = ["data-source", "transformer", "model", "sink"];
  const sourceNodeTypeIndex = pipelineFlowOrder.indexOf(sourceNodeType);
  const targetNodeTypeIndex = pipelineFlowOrder.indexOf(targetNodeType);

  if (sourceNodeTypeIndex === -1 || targetNodeTypeIndex === -1) return true; // Unknown types allowed
  return targetNodeTypeIndex > sourceNodeTypeIndex;
}
```

**Valid Connections:**
- Data Source → Transformer
- Data Source → Model  
- Transformer → Model
- Transformer → Sink
- Model → Sink

**Invalid Connections:**
- Model → Data Source (backwards flow)
- Sink → any node (sinks are terminals)
- Transformer → Data Source (backwards flow)

## 🔧 Connection Validation Process

When a user attempts to create a connection, the `validateConnection` function performs these checks in order:

```typescript
export function validateConnection(connection: Connection, nodes: Node[], edges: Edge[]) {
  const { source: sourceNodeId, target: targetNodeId } = connection;
  
  // 1. Basic validation
  if (!sourceNodeId || !targetNodeId) return false;
  if (sourceNodeId === targetNodeId) return false;

  // 2. Cycle prevention
  if (hasPath(targetNodeId, sourceNodeId, edges)) return false;

  // 3. Connection limits
  const sourceOutgoingConnectionCount = nodeOutgoingCount(sourceNodeId, edges);
  const targetIncomingConnectionCount = nodeIncomingCount(targetNodeId, edges);
  if (sourceOutgoingConnectionCount >= 1 || targetIncomingConnectionCount >= 1) return false;

  // 4. Logical flow validation
  const sourceNode = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === targetNodeId);
  if (!sourceNode || !targetNode) return false;

  return validatePipelineFlow(sourceNode.data?.typeId, targetNode.data?.typeId);
}
```