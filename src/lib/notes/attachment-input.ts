import { z } from "zod";

export const NOTE_ATTACHMENT_BUCKET = "note-attachments";
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const attachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
] as const;

const attachmentMimeTypeSchema = z.enum(attachmentMimeTypes);
const fileNameSchema = z.string().trim().min(1).max(255);

export const attachmentActionSchema = z.object({
  attachmentId: z.uuid(),
  noteId: z.uuid(),
});

export const attachmentNoteSchema = z.object({ noteId: z.uuid() });

type ValidatedAttachment = Readonly<{
  file: File;
  fileName: string;
  mimeType: (typeof attachmentMimeTypes)[number];
}>;

export function validateAttachmentFile(
  candidate: FormDataEntryValue | null,
): ValidatedAttachment | null {
  if (!(candidate instanceof File)) return null;
  const fileName = fileNameSchema.safeParse(candidate.name);
  const mimeType = attachmentMimeTypeSchema.safeParse(candidate.type);
  if (
    !fileName.success ||
    !mimeType.success ||
    candidate.size < 1 ||
    candidate.size > MAX_ATTACHMENT_BYTES
  ) {
    return null;
  }
  return { file: candidate, fileName: fileName.data, mimeType: mimeType.data };
}

export function attachmentStoragePath(
  spaceId: string,
  noteId: string,
  attachmentId: string,
  mimeType: ValidatedAttachment["mimeType"],
) {
  const extensionByMimeType: Record<ValidatedAttachment["mimeType"], string> = {
    "application/pdf": "pdf",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "text/plain": "txt",
  };
  return `${spaceId}/${noteId}/${attachmentId}.${extensionByMimeType[mimeType]}`;
}
