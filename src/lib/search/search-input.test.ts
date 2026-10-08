import { describe, expect, it } from "vitest";

import { globalSearchSchema } from "./search-input";

describe("global search input", () => {
  it("trims a bounded query", () => {
    expect(globalSearchSchema.parse("  compra semanal  ")).toBe(
      "compra semanal",
    );
  });

  it("rejects empty and oversized queries", () => {
    expect(globalSearchSchema.safeParse("   ").success).toBe(false);
    expect(globalSearchSchema.safeParse("a".repeat(81)).success).toBe(false);
  });
});
