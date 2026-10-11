"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  attachmentActionSchema,
  attachmentNoteSchema,
  attachmentStoragePath,
  NOTE_ATTACHMENT_BUCKET,
  validateAttachmentFile,
} from "@/lib/notes/attachment-input";
import {
  noteDocumentAttachmentIds,
  noteDocumentToPlainText,
  noteDocumentUsesAttachment,
  plainTextToNoteDocument,
  safeParseNoteDocument,
} from "@/lib/notes/note-content";
import {
  createNoteSchema,
  restoreNoteVersionSchema,
  updateRichNoteSchema,
} from "@/lib/notes/note-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => data.get(key);

function notePath(noteId: string, kind: "error" | "message", code: string) {
  return `/notes/${noteId}?${kind}=${code}`;
}

async function noteOwnsDocumentAttachments(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  noteId: string,
  content: NonNullable<ReturnType<typeof safeParseNoteDocument>>,
) {
  const attachmentIds = noteDocumentAttachmentIds(content);
  if (attachmentIds.length === 0) return true;
  const { count, error } = await supabase
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("note_id", noteId)
    .in("id", attachmentIds);
  return !error && count === attachmentIds.length;
}

export async function createChildNote(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const input = createNoteSchema.safeParse({
    body: value(formData, "body"),
    parentNoteId: value(formData, "parentNoteId"),
    spaceId: value(formData, "spaceId"),
    title: value(formData, "title"),
  });

  if (!input.success || !input.data.parentNoteId) {
    redirect("/notes?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    body: input.data.body,
    content: plainTextToNoteDocument(input.data.body),
    created_by: user.id,
    parent_note_id: input.data.parentNoteId,
    space_id: input.data.spaceId,
    title: input.data.title,
  });

  if (error) {
    redirect(notePath(input.data.parentNoteId, "error", "child_create_failed"));
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.data.parentNoteId}`);
  redirect(notePath(input.data.parentNoteId, "message", "child_created"));
}

export async function updateDetailedNote(formData: FormData) {
  await requireAuthenticatedUser();
  const input = updateRichNoteSchema.safeParse({
    content: value(formData, "content"),
    noteId: value(formData, "noteId"),
    title: value(formData, "title"),
  });

  if (!input.success) redirect("/notes?error=invalid_input");

  const content = safeParseNoteDocument(input.data.content);
  if (!content) {
    redirect(notePath(input.data.noteId, "error", "update_failed"));
  }

  const supabase = await createSupabaseServerClient();
  if (
    !(await noteOwnsDocumentAttachments(supabase, input.data.noteId, content))
  ) {
    redirect(notePath(input.data.noteId, "error", "update_failed"));
  }
  const { data, error } = await supabase
    .from("notes")
    .update({
      body: noteDocumentToPlainText(content),
      content,
      title: input.data.title,
    })
    .eq("id", input.data.noteId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(notePath(input.data.noteId, "error", "update_failed"));
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.data.noteId}`);
  redirect(notePath(input.data.noteId, "message", "updated"));
}

export async function restoreNoteVersion(formData: FormData) {
  await requireAuthenticatedUser();
  const input = restoreNoteVersionSchema.safeParse({
    noteId: value(formData, "noteId"),
    versionId: value(formData, "versionId"),
  });

  if (!input.success) redirect("/notes?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data: version, error: versionError } = await supabase
    .from("note_versions")
    .select("content,note_id,parent_note_id,space_id,title")
    .eq("id", input.data.versionId)
    .eq("note_id", input.data.noteId)
    .maybeSingle();

  if (versionError || !version) {
    redirect(notePath(input.data.noteId, "error", "restore_failed"));
  }

  const content = safeParseNoteDocument(version.content);
  if (!content) {
    redirect(notePath(input.data.noteId, "error", "restore_failed"));
  }

  if (
    !(await noteOwnsDocumentAttachments(supabase, input.data.noteId, content))
  ) {
    redirect(
      notePath(input.data.noteId, "error", "restore_missing_attachment"),
    );
  }

  const { data: note, error: updateError } = await supabase
    .from("notes")
    .update({
      body: noteDocumentToPlainText(content),
      content,
      parent_note_id: version.parent_note_id,
      title: version.title,
    })
    .eq("id", input.data.noteId)
    .eq("space_id", version.space_id)
    .select("id")
    .maybeSingle();

  if (updateError || !note) {
    redirect(notePath(input.data.noteId, "error", "restore_failed"));
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${input.data.noteId}`);
  redirect(notePath(input.data.noteId, "message", "restored"));
}

export async function uploadNoteAttachment(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const noteInput = attachmentNoteSchema.safeParse({
    noteId: value(formData, "noteId"),
  });
  const attachment = validateAttachmentFile(value(formData, "attachment"));
  if (!noteInput.success || !attachment) {
    redirect(
      noteInput.success
        ? notePath(noteInput.data.noteId, "error", "attachment_invalid")
        : "/notes?error=invalid_input",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id,space_id")
    .eq("id", noteInput.data.noteId)
    .maybeSingle();
  if (noteError || !note) {
    redirect(notePath(noteInput.data.noteId, "error", "attachment_failed"));
  }

  const attachmentId = crypto.randomUUID();
  const storagePath = attachmentStoragePath(
    note.space_id,
    note.id,
    attachmentId,
    attachment.mimeType,
  );
  const { error: uploadError } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .upload(storagePath, attachment.file, {
      cacheControl: "3600",
      contentType: attachment.mimeType,
      upsert: false,
    });
  if (uploadError) {
    redirect(notePath(note.id, "error", "attachment_failed"));
  }

  const { error: metadataError } = await supabase.from("attachments").insert({
    created_by: user.id,
    file_name: attachment.fileName,
    id: attachmentId,
    mime_type: attachment.mimeType,
    note_id: note.id,
    size_bytes: attachment.file.size,
    space_id: note.space_id,
    storage_path: storagePath,
  });
  if (metadataError) {
    await supabase.storage.from(NOTE_ATTACHMENT_BUCKET).remove([storagePath]);
    redirect(notePath(note.id, "error", "attachment_failed"));
  }

  revalidatePath(`/notes/${note.id}`);
  redirect(notePath(note.id, "message", "attachment_uploaded"));
}

export async function deleteNoteAttachment(formData: FormData) {
  await requireAuthenticatedUser();
  const input = attachmentActionSchema.safeParse({
    attachmentId: value(formData, "attachmentId"),
    noteId: value(formData, "noteId"),
  });
  if (!input.success) redirect("/notes?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data: attachment, error: attachmentError } = await supabase
    .from("attachments")
    .select("id,storage_path")
    .eq("id", input.data.attachmentId)
    .eq("note_id", input.data.noteId)
    .maybeSingle();
  if (attachmentError || !attachment) {
    redirect(notePath(input.data.noteId, "error", "attachment_delete_failed"));
  }

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("content")
    .eq("id", input.data.noteId)
    .maybeSingle();
  const noteContent = note && safeParseNoteDocument(note.content);
  if (
    noteError ||
    !noteContent ||
    noteDocumentUsesAttachment(noteContent, attachment.id)
  ) {
    redirect(
      notePath(
        input.data.noteId,
        "error",
        noteContent ? "attachment_in_use" : "attachment_delete_failed",
      ),
    );
  }

  const { error: storageError } = await supabase.storage
    .from(NOTE_ATTACHMENT_BUCKET)
    .remove([attachment.storage_path]);
  if (storageError) {
    redirect(notePath(input.data.noteId, "error", "attachment_delete_failed"));
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id)
    .select("id")
    .maybeSingle();
  if (deleteError || !deleted) {
    redirect(notePath(input.data.noteId, "error", "attachment_delete_failed"));
  }

  revalidatePath(`/notes/${input.data.noteId}`);
  redirect(notePath(input.data.noteId, "message", "attachment_deleted"));
}
