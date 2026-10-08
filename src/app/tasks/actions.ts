"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskStatusSchema,
} from "@/lib/tasks/task-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return formData.get(key);
}

export async function createTask(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const input = createTaskSchema.safeParse({
    description: value(formData, "description"),
    dueDate: value(formData, "dueDate"),
    priority: value(formData, "priority"),
    spaceId: value(formData, "spaceId"),
    title: value(formData, "title"),
  });

  if (!input.success) redirect("/tasks?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").insert({
    created_by: user.id,
    description: input.data.description,
    due_date: input.data.dueDate,
    priority: input.data.priority,
    space_id: input.data.spaceId,
    title: input.data.title,
  });

  if (error) redirect("/tasks?error=create_failed");
  revalidatePath("/tasks");
  redirect("/tasks?message=created");
}

export async function updateTaskStatus(formData: FormData) {
  await requireAuthenticatedUser();
  const input = updateTaskStatusSchema.safeParse({
    status: value(formData, "status"),
    taskId: value(formData, "taskId"),
  });

  if (!input.success) redirect("/tasks?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: input.data.status })
    .eq("id", input.data.taskId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/tasks?error=update_failed");
  revalidatePath("/tasks");
  redirect("/tasks?message=updated");
}

export async function deleteTask(formData: FormData) {
  await requireAuthenticatedUser();
  const input = deleteTaskSchema.safeParse({
    taskId: value(formData, "taskId"),
  });
  if (!input.success) redirect("/tasks?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", input.data.taskId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/tasks?error=delete_failed");
  revalidatePath("/tasks");
  redirect("/tasks?message=deleted");
}
