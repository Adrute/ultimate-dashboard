import { describe, expect, it } from "vitest";

import {
  createDashboardWidgetSchema,
  moveDashboardWidgetSchema,
} from "./widget-input";

const validIds = {
  layoutId: "11111111-1111-4111-8111-111111111111",
  spaceId: "22222222-2222-4222-8222-222222222222",
};

describe("dashboard widget input", () => {
  it("trims and accepts a bounded widget configuration", () => {
    const result = createDashboardWidgetSchema.parse({
      ...validIds,
      size: "medium",
      title: "  Mis prioridades  ",
    });

    expect(result.title).toBe("Mis prioridades");
  });

  it("rejects invalid identifiers, sizes and empty titles", () => {
    expect(
      createDashboardWidgetSchema.safeParse({
        layoutId: "not-a-uuid",
        size: "huge",
        spaceId: validIds.spaceId,
        title: "   ",
      }).success,
    ).toBe(false);
  });

  it("allows only explicit keyboard-friendly move directions", () => {
    expect(
      moveDashboardWidgetSchema.safeParse({
        direction: "up",
        widgetId: validIds.layoutId,
      }).success,
    ).toBe(true);
    expect(
      moveDashboardWidgetSchema.safeParse({
        direction: "sideways",
        widgetId: validIds.layoutId,
      }).success,
    ).toBe(false);
  });
});
