"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  createNoteSchema,
  restoreNoteVersionSchema,
  updateNoteSchema,
} from "@/lib/notes/note-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => data.get(key);

function notePath(noteId: string, kind: "error" | "message", code: string) {
  return `/notes/${noteId}?${kind}=${code}`;
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
    .select("body,note_id,parent_note_id,space_id,title")
    .eq("id", input.data.versionId)
    .eq("note_id", input.data.noteId)
    .maybeSingle();

  if (versionError || !version) {
    redirect(notePath(input.data.noteId, "error", "restore_failed"));
  }

  const { data: note, error: updateError } = await supabase
    .from("notes")
    .update({
      body: version.body,
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
