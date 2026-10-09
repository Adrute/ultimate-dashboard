import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export const taskPrioritySchema = z.enum(["none", "low", "medium", "high"]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });

export const createTaskSchema = z.object({
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => value || null),
  dueDate: z
    .union([dateSchema, z.literal("")])
    .transform((value) => value || null),
  priority: taskPrioritySchema,
  projectId: z
    .union([z.uuid(), z.literal("")])
    .nullish()
    .transform((value) => value || null),
  parentTaskId: z
    .union([z.uuid(), z.literal("")])
    .nullish()
    .transform((value) => value || null),
  spaceId: z.uuid(),
  title: z.string().trim().min(1).max(160),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
  taskId: z.uuid(),
});

export const deleteTaskSchema = z.object({
  taskId: z.uuid(),
});

export const taskFilterSchema = z.enum(["open", "done", "all"]);
