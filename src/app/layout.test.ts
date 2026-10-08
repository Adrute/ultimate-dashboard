import { describe, expect, it } from "vitest";

import { metadata } from "./layout";

describe("application metadata", () => {
  it("keeps the provisional product name", () => {
    expect(metadata.title).toBe("UltimateDashboard");
  });
});
