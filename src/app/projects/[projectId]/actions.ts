"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createTaskSchema, taskStatusSchema } from "@/lib/tasks/task-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const value = (data: FormData, key: string) => data.get(key);
const projectTaskSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
});
const projectTaskStatusSchema = projectTaskSchema.extend({
  status: taskStatusSchema,
});

function projectPath(
  projectId: string,
  kind: "error" | "message",
  code: string,
) {
  return `/projects/${projectId}?${kind}=${code}`;
}

export async function createProjectTask(formData: FormData) {
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

  if (!input.success || !input.data.projectId) {
    redirect("/projects?error=invalid_input");
  }

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

  if (error) {
    redirect(projectPath(input.data.projectId, "error", "task_create_failed"));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${input.data.projectId}`);
  redirect(projectPath(input.data.projectId, "message", "task_created"));
}

export async function updateProjectTaskStatus(formData: FormData) {
  await requireAuthenticatedUser();
  const input = projectTaskStatusSchema.safeParse({
    projectId: value(formData, "projectId"),
    status: value(formData, "status"),
    taskId: value(formData, "taskId"),
  });

  if (!input.success) redirect("/projects?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: input.data.status })
    .eq("id", input.data.taskId)
    .eq("project_id", input.data.projectId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(projectPath(input.data.projectId, "error", "task_update_failed"));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${input.data.projectId}`);
  redirect(projectPath(input.data.projectId, "message", "task_updated"));
}

export async function deleteProjectTask(formData: FormData) {
  await requireAuthenticatedUser();
  const input = projectTaskSchema.safeParse({
    projectId: value(formData, "projectId"),
    taskId: value(formData, "taskId"),
  });

  if (!input.success) redirect("/projects?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", input.data.taskId)
    .eq("project_id", input.data.projectId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(projectPath(input.data.projectId, "error", "task_delete_failed"));
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${input.data.projectId}`);
  redirect(projectPath(input.data.projectId, "message", "task_deleted"));
}
