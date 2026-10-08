import { describe, expect, it } from "vitest";

import {
  createTaskSchema,
  taskFilterSchema,
  updateTaskStatusSchema,
} from "./task-input";

const taskId = "11111111-1111-4111-8111-111111111111";
const spaceId = "22222222-2222-4222-8222-222222222222";

describe("task input", () => {
  it("normalizes a valid task", () => {
    const result = createTaskSchema.parse({
      description: "  Una nota  ",
      dueDate: "2026-10-31",
      priority: "high",
      spaceId,
      title: "  Preparar demo  ",
    });

    expect(result).toMatchObject({
      description: "Una nota",
      dueDate: "2026-10-31",
      title: "Preparar demo",
    });
  });

  it("turns optional empty values into null", () => {
    const result = createTaskSchema.parse({
      description: "",
      dueDate: "",
      priority: "none",
      spaceId,
      title: "Tarea",
    });

    expect(result.description).toBeNull();
    expect(result.dueDate).toBeNull();
  });

  it("rejects invalid calendar dates and oversized input", () => {
    expect(
      createTaskSchema.safeParse({
        description: "a".repeat(5001),
        dueDate: "2026-02-30",
        priority: "urgent",
        spaceId: "invalid",
        title: " ",
      }).success,
    ).toBe(false);
  });

  it("allows only explicit statuses and filters", () => {
    expect(
      updateTaskStatusSchema.safeParse({ status: "done", taskId }).success,
    ).toBe(true);
    expect(
      updateTaskStatusSchema.safeParse({ status: "archived", taskId }).success,
    ).toBe(false);
    expect(taskFilterSchema.safeParse("open").success).toBe(true);
    expect(taskFilterSchema.safeParse("unknown").success).toBe(false);
  });
});
