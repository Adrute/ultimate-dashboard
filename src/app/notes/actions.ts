"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { NOTE_ATTACHMENT_BUCKET } from "@/lib/notes/attachment-input";
import { plainTextToNoteDocument } from "@/lib/notes/note-content";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/notes/note-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return formData.get(key);
}

export async function createNote(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const input = createNoteSchema.safeParse({
    body: value(formData, "body"),
    parentNoteId: value(formData, "parentNoteId"),
    spaceId: value(formData, "spaceId"),
    title: value(formData, "title"),
  });
  if (!input.success) redirect("/notes?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notes").insert({
    body: input.data.body,
    content: plainTextToNoteDocument(input.data.body),
    created_by: user.id,
    parent_note_id: input.data.parentNoteId,
    space_id: input.data.spaceId,
    title: input.data.title,
  });
  if (error) redirect("/notes?error=create_failed");

  revalidatePath("/notes");
  redirect("/notes?message=created");
}

export async function updateNote(formData: FormData) {
  await requireAuthenticatedUser();
  const input = updateNoteSchema.safeParse({
    body: value(formData, "body"),
    noteId: value(formData, "noteId"),
    title: value(formData, "title"),
  });
  if (!input.success) redirect("/notes?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ body: input.data.body, title: input.data.title })
    .eq("id", input.data.noteId)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/notes?error=update_failed");

  revalidatePath("/notes");
  redirect("/notes?message=updated");
}

export async function deleteNote(formData: FormData) {
  await requireAuthenticatedUser();
  const input = deleteNoteSchema.safeParse({
    noteId: value(formData, "noteId"),
  });
  if (!input.success) redirect("/notes?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data: attachments, error: attachmentError } = await supabase
    .from("attachments")
    .select("id,storage_path")
    .eq("note_id", input.data.noteId);
  if (attachmentError) redirect("/notes?error=delete_failed");

  if (attachments.length) {
    const { error: storageError } = await supabase.storage
      .from(NOTE_ATTACHMENT_BUCKET)
      .remove(attachments.map(({ storage_path }) => storage_path));
    if (storageError) redirect("/notes?error=delete_failed");

    const { error: metadataError } = await supabase
      .from("attachments")
      .delete()
      .eq("note_id", input.data.noteId);
    if (metadataError) redirect("/notes?error=delete_failed");
  }

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", input.data.noteId)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/notes?error=delete_failed");

  revalidatePath("/notes");
  redirect("/notes?message=deleted");
}
