import { z } from "zod";
export const projectStatusSchema = z.enum([
  "planned",
  "active",
  "on_hold",
  "completed",
]);
const optionalDate = z
  .union([z.iso.date(), z.literal("")])
  .transform((value) => value || null);
const projectFields = z
  .object({
    description: z
      .string()
      .trim()
      .max(5000)
      .transform((value) => value || null),
    dueDate: optionalDate,
    name: z.string().trim().min(1).max(160),
    progress: z.coerce.number().int().min(0).max(100),
    startDate: optionalDate,
    status: projectStatusSchema,
  })
  .refine(
    ({ dueDate, startDate }) => !dueDate || !startDate || startDate <= dueDate,
    { path: ["dueDate"] },
  );
export const createProjectSchema = projectFields.extend({ spaceId: z.uuid() });
export const updateProjectSchema = projectFields.extend({
  projectId: z.uuid(),
});
export const deleteProjectSchema = z.object({ projectId: z.uuid() });
