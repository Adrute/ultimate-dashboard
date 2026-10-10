import { z } from "zod";

const noteFields = {
  body: z.string().max(50000),
  title: z.string().trim().min(1).max(160),
};

export const createNoteSchema = z.object({
  ...noteFields,
  parentNoteId: z
    .union([z.uuid(), z.literal("")])
    .nullish()
    .transform((value) => value || null),
  spaceId: z.uuid(),
});

export const updateNoteSchema = z.object({
  ...noteFields,
  noteId: z.uuid(),
});

export const deleteNoteSchema = z.object({ noteId: z.uuid() });

export const restoreNoteVersionSchema = z.object({
  noteId: z.uuid(),
  versionId: z.uuid(),
});
