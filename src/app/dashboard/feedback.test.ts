import { describe, expect, it } from "vitest";

import { getDashboardFeedback } from "./feedback";

describe("dashboard feedback", () => {
  it("maps known codes without reflecting arbitrary query input", () => {
    expect(getDashboardFeedback(undefined, "created")?.kind).toBe("success");
    expect(getDashboardFeedback("<script>alert(1)</script>")).toBeNull();
  });
});
