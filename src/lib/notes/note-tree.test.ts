import { describe, expect, it } from "vitest";

import { buildNoteTree } from "./note-tree";

describe("buildNoteTree", () => {
  it("nests pages recursively while preserving order", () => {
    const tree = buildNoteTree([
      { id: "root", parent_note_id: null, title: "Root" },
      { id: "child", parent_note_id: "root", title: "Child" },
      { id: "grandchild", parent_note_id: "child", title: "Grandchild" },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.children[0]?.id).toBe("grandchild");
  });

  it("keeps a page visible if its parent is outside the current filter", () => {
    const tree = buildNoteTree([
      { id: "visible", parent_note_id: "filtered", title: "Visible" },
    ]);

    expect(tree[0]?.id).toBe("visible");
  });
});
