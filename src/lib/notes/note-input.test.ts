import { describe, expect, it } from "vitest";

import {
  createNoteSchema,
  updateNoteSchema,
  updateRichNoteSchema,
} from "./note-input";

const noteId = "11111111-1111-4111-8111-111111111111";
const spaceId = "22222222-2222-4222-8222-222222222222";

describe("note input", () => {
  it("trims the title and preserves plain-text whitespace", () => {
    const result = createNoteSchema.parse({
      body: "Primera línea\n  segunda línea",
      spaceId,
      title: "  Ideas  ",
    });

    expect(result.title).toBe("Ideas");
    expect(result.body).toBe("Primera línea\n  segunda línea");
    expect(result.parentNoteId).toBeNull();
  });

  it("accepts a valid update", () => {
    expect(
      updateNoteSchema.safeParse({ body: "Texto", noteId, title: "Nota" })
        .success,
    ).toBe(true);
  });

  it("limits serialized rich content at the input boundary", () => {
    expect(
      updateRichNoteSchema.safeParse({
        content: '{"type":"doc"}',
        noteId,
        title: "Nota",
      }).success,
    ).toBe(true);
    expect(
      updateRichNoteSchema.safeParse({
        content: "a".repeat(200001),
        noteId,
        title: "Nota",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid identifiers and oversized content", () => {
    expect(
      createNoteSchema.safeParse({
        body: "a".repeat(50001),
        spaceId: "invalid",
        title: " ",
      }).success,
    ).toBe(false);
  });

  it("accepts a parent page and rejects an invalid one", () => {
    expect(
      createNoteSchema.safeParse({
        body: "",
        parentNoteId: noteId,
        spaceId,
        title: "Subpágina",
      }).success,
    ).toBe(true);
    expect(
      createNoteSchema.safeParse({
        body: "",
        parentNoteId: "invalid",
        spaceId,
        title: "Subpágina",
      }).success,
    ).toBe(false);
  });
});
