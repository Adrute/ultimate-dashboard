import { describe, expect, it } from "vitest";

import { getLoginFeedback } from "./feedback";

describe("login feedback", () => {
  it("maps known status codes without reflecting arbitrary input", () => {
    expect(getLoginFeedback("session_required")?.kind).toBe("error");
    expect(getLoginFeedback("<script>alert(1)</script>")).toBeNull();
  });
});
