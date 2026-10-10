import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(160);

const noteFields = {
  body: z.string().max(50000),
  title: titleSchema,
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

export const updateRichNoteSchema = z.object({
  content: z.string().max(200000),
  noteId: z.uuid(),
  title: titleSchema,
});

export const deleteNoteSchema = z.object({ noteId: z.uuid() });

export const restoreNoteVersionSchema = z.object({
  noteId: z.uuid(),
  versionId: z.uuid(),
});
