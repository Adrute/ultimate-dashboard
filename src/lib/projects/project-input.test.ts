import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./project-input";
const spaceId = "22222222-2222-4222-8222-222222222222";
describe("project input", () => {
  it("normalizes a bounded project", () => {
    const result = createProjectSchema.parse({
      description: "  Lanzamiento  ",
      dueDate: "2026-12-20",
      name: "  Web  ",
      progress: "25",
      spaceId,
      startDate: "2026-10-10",
      status: "active",
    });
    expect(result).toMatchObject({
      description: "Lanzamiento",
      name: "Web",
      progress: 25,
    });
  });
  it("accepts empty optional fields", () => {
    const result = createProjectSchema.parse({
      description: "",
      dueDate: "",
      name: "Idea",
      progress: 0,
      spaceId,
      startDate: "",
      status: "planned",
    });
    expect(result.dueDate).toBeNull();
    expect(result.description).toBeNull();
  });
  it("rejects inverted dates and invalid progress", () => {
    expect(
      createProjectSchema.safeParse({
        description: "",
        dueDate: "2026-10-01",
        name: "Bad",
        progress: 101,
        spaceId,
        startDate: "2026-10-02",
        status: "active",
      }).success,
    ).toBe(false);
  });
});
