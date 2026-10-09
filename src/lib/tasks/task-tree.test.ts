import { describe, expect, it } from "vitest";

import { buildTaskTree } from "./task-tree";

describe("buildTaskTree", () => {
  it("preserves input order while nesting tasks at any depth", () => {
    const tree = buildTaskTree([
      { id: "root", parent_task_id: null, title: "Raíz" },
      { id: "child", parent_task_id: "root", title: "Hija" },
      { id: "grandchild", parent_task_id: "child", title: "Nieta" },
      { id: "second-root", parent_task_id: null, title: "Otra raíz" },
    ]);

    expect(tree.map(({ id }) => id)).toEqual(["root", "second-root"]);
    expect(tree[0]?.children[0]?.id).toBe("child");
    expect(tree[0]?.children[0]?.children[0]?.id).toBe("grandchild");
  });

  it("keeps an orphan visible as a root", () => {
    const tree = buildTaskTree([
      { id: "orphan", parent_task_id: "missing", title: "Huérfana" },
    ]);

    expect(tree[0]?.id).toBe("orphan");
  });
});
