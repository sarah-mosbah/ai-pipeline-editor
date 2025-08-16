import { describe, it, expect } from "vitest";
import { hasCycle, topologicalOrder, validateConnection } from "../utils/graph";
const n = (id: string) => ({ id, data: {}, position: { x: 0, y: 0 } });
const e = (s: string, t: string) => ({
  id: s + "->" + t,
  source: s,
  target: t,
});
describe("graph utils", () => {
  it("detects cycles", () => {
    const nodes = [n("a"), n("b"), n("c")];
    const edges = [e("a", "b"), e("b", "c"), e("c", "a")];
    expect(hasCycle(nodes as any, edges as any)).toBe(true);
  });
  it("topological order works on DAG", () => {
    const nodes = [n("a"), n("b"), n("c")];
    const edges = [e("a", "b"), e("b", "c")];
    const order = topologicalOrder(nodes as any, edges as any);
    expect(order.map((o) => o.id)).toEqual(["a", "b", "c"]);
  });
  it("validateConnection rules", () => {
    const nodes = [n("a"), n("b"), n("c")];
    const edges = [e("a", "b")];
    expect(
      validateConnection(
        { source: "a", target: "c" } as any,
        nodes as any,
        edges as any
      )
    ).toBe(false);
    expect(
      validateConnection(
        { source: "c", target: "b" } as any,
        nodes as any,
        edges as any
      )
    ).toBe(false);
    expect(
      validateConnection(
        { source: "c", target: "c" } as any,
        nodes as any,
        edges as any
      )
    ).toBe(false);
    expect(
      validateConnection(
        { source: "c", target: "a" } as any,
        nodes as any,
        edges as any
      )
    ).toBe(true);
  });
});
