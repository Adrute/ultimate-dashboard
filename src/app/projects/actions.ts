"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createTaskSchema } from "@/lib/tasks/task-input";
import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
} from "@/lib/projects/project-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const value = (data: FormData, key: string) => data.get(key);
export async function createRelatedTask(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const input = createTaskSchema.safeParse({
    description: "",
    dueDate: "",
    parentTaskId: value(formData, "parentTaskId"),
    priority: "none",
    projectId: value(formData, "projectId"),
    spaceId: value(formData, "spaceId"),
    title: value(formData, "title"),
  });
  if (!input.success) redirect("/projects?error=invalid_input");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tasks").insert({
    created_by: user.id,
    description: null,
    due_date: null,
    parent_task_id: input.data.parentTaskId,
    priority: "none",
    project_id: input.data.projectId,
    space_id: input.data.spaceId,
    title: input.data.title,
  });
  if (error) redirect("/projects?error=create_failed");
  revalidatePath("/projects");
  redirect("/projects?message=updated");
}
export async function createProject(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const input = createProjectSchema.safeParse({
    description: value(formData, "description"),
    dueDate: value(formData, "dueDate"),
    name: value(formData, "name"),
    progress: value(formData, "progress"),
    spaceId: value(formData, "spaceId"),
    startDate: value(formData, "startDate"),
    status: value(formData, "status"),
  });
  if (!input.success) redirect("/projects?error=invalid_input");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("projects").insert({
    created_by: user.id,
    description: input.data.description,
    due_date: input.data.dueDate,
    name: input.data.name,
    progress: input.data.progress,
    space_id: input.data.spaceId,
    start_date: input.data.startDate,
    status: input.data.status,
  });
  if (error) redirect("/projects?error=create_failed");
  revalidatePath("/projects");
  redirect("/projects?message=created");
}
export async function updateProject(formData: FormData) {
  await requireAuthenticatedUser();
  const input = updateProjectSchema.safeParse({
    description: value(formData, "description"),
    dueDate: value(formData, "dueDate"),
    name: value(formData, "name"),
    progress: value(formData, "progress"),
    projectId: value(formData, "projectId"),
    startDate: value(formData, "startDate"),
    status: value(formData, "status"),
  });
  if (!input.success) redirect("/projects?error=invalid_input");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      description: input.data.description,
      due_date: input.data.dueDate,
      name: input.data.name,
      progress: input.data.progress,
      start_date: input.data.startDate,
      status: input.data.status,
    })
    .eq("id", input.data.projectId)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/projects?error=update_failed");
  revalidatePath("/projects");
  redirect("/projects?message=updated");
}
export async function deleteProject(formData: FormData) {
  await requireAuthenticatedUser();
  const input = deleteProjectSchema.safeParse({
    projectId: value(formData, "projectId"),
  });
  if (!input.success) redirect("/projects?error=invalid_input");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", input.data.projectId)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect("/projects?error=delete_failed");
  revalidatePath("/projects");
  redirect("/projects?message=deleted");
}
