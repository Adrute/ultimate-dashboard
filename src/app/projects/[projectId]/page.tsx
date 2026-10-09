import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildTaskTree, type TaskTreeNode } from "@/lib/tasks/task-tree";
import type { Database } from "@/types/database";

import {
  createProjectTask,
  deleteProjectTask,
  updateProjectTaskStatus,
} from "./actions";

type ProjectDetailPageProps = Readonly<{
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}>;

type Task = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  | "description"
  | "due_date"
  | "id"
  | "parent_task_id"
  | "priority"
  | "status"
  | "title"
>;

const statusLabels = {
  active: "Activo",
  completed: "Completado",
  on_hold: "En pausa",
  planned: "Planificado",
} as const;

const feedbackMessages = {
  task_create_failed: "No se pudo crear la tarea.",
  task_created: "Tarea añadida.",
  task_delete_failed: "No se pudo eliminar la tarea.",
  task_deleted: "Tarea eliminada. Sus subtareas se conservan en el proyecto.",
  task_update_failed: "No se pudo actualizar la tarea.",
  task_updated: "Tarea actualizada.",
} as const;

function TaskBranch({
  canEdit,
  node,
  projectId,
  spaceId,
}: Readonly<{
  canEdit: boolean;
  node: TaskTreeNode<Task>;
  projectId: string;
  spaceId: string;
}>) {
  const isDone = node.status === "done";

  return (
    <li className={isDone ? "project-task-node is-done" : "project-task-node"}>
      <div className="project-task-row">
        {canEdit ? (
          <form action={updateProjectTaskStatus}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="taskId" type="hidden" value={node.id} />
            <input
              name="status"
              type="hidden"
              value={isDone ? "todo" : "done"}
            />
            <button
              aria-label={
                isDone ? `Reabrir ${node.title}` : `Completar ${node.title}`
              }
              className="task-check"
              type="submit"
            >
              {isDone ? "✓" : ""}
            </button>
          </form>
        ) : (
          <span aria-hidden="true" className="task-check">
            {isDone ? "✓" : ""}
          </span>
        )}
        <div className="project-task-copy">
          <strong>{node.title}</strong>
          {node.description && <p>{node.description}</p>}
          {node.due_date && (
            <time dateTime={node.due_date}>Límite: {node.due_date}</time>
          )}
        </div>
        {canEdit && (
          <form action={deleteProjectTask}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="taskId" type="hidden" value={node.id} />
            <ConfirmSubmitButton
              className="task-delete-button"
              confirmation={`¿Eliminar “${node.title}”? Sus subtareas pasarán al nivel principal.`}
            >
              Eliminar
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      {canEdit && (
        <details className="subtask-composer">
          <summary>Añadir subtarea</summary>
          <form action={createProjectTask}>
            <input name="projectId" type="hidden" value={projectId} />
            <input name="spaceId" type="hidden" value={spaceId} />
            <input name="parentTaskId" type="hidden" value={node.id} />
            <label className="sr-only" htmlFor={`subtask-${node.id}`}>
              Nueva subtarea de {node.title}
            </label>
            <input
              id={`subtask-${node.id}`}
              maxLength={160}
              name="title"
              placeholder="Nombre de la subtarea"
              required
            />
            <button type="submit">Añadir</button>
          </form>
        </details>
      )}

      {node.children.length > 0 && (
        <ol className="project-task-tree is-nested">
          {node.children.map((child) => (
            <TaskBranch
              canEdit={canEdit}
              key={child.id}
              node={child}
              projectId={projectId}
              spaceId={spaceId}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const parsedProjectId = z.uuid().safeParse((await params).projectId);
  if (!parsedProjectId.success) notFound();

  const projectId = parsedProjectId.data;
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "description,due_date,id,name,progress,space_id,start_date,status,updated_at",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) throw new Error("No se pudo cargar el proyecto.");
  if (!project) notFound();

  const [spaceResult, membershipResult, tasksResult] = await Promise.all([
    supabase
      .from("spaces")
      .select("id,kind,name,owner_user_id")
      .eq("id", project.space_id)
      .single(),
    supabase
      .from("space_members")
      .select("role")
      .eq("space_id", project.space_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select(
        "description,due_date,id,parent_task_id,priority,status,title,created_at",
      )
      .eq("project_id", project.id)
      .order("created_at"),
  ]);

  if (spaceResult.error || membershipResult.error || tasksResult.error) {
    throw new Error("No se pudo cargar el contenido del proyecto.");
  }

  const space = spaceResult.data;
  const canEdit =
    (space.kind === "personal" && space.owner_user_id === user.id) ||
    membershipResult.data?.role === "admin" ||
    membershipResult.data?.role === "editor";
  const tasks = tasksResult.data;
  const taskTree = buildTaskTree(tasks);
  const completedTasks = tasks.filter(({ status }) => status === "done").length;
  const feedbackParams = await searchParams;
  const feedbackCode = feedbackParams.error ?? feedbackParams.message;
  const feedback =
    feedbackMessages[feedbackCode as keyof typeof feedbackMessages];

  return (
    <main
      className="page-shell project-detail-page"
      id="main-content"
      tabIndex={-1}
    >
      <Link className="back-link" href="/projects">
        ← Todos los proyectos
      </Link>

      <header className="project-detail-header">
        <div>
          <p className="eyebrow">
            {space.name} · {statusLabels[project.status]}
          </p>
          <h1>{project.name}</h1>
          {project.description && <p>{project.description}</p>}
        </div>
        <div
          className="project-detail-progress"
          aria-label={`Progreso ${project.progress}%`}
        >
          <strong>{project.progress}%</strong>
          <span>progreso del proyecto</span>
        </div>
      </header>

      {feedback && (
        <p
          aria-live="polite"
          className={`dashboard-feedback is-${feedbackParams.error ? "error" : "success"}`}
          role={feedbackParams.error ? "alert" : "status"}
        >
          {feedback}
        </p>
      )}

      <section
        className="project-task-workspace"
        aria-labelledby="project-tasks-title"
      >
        <div className="project-task-heading">
          <div>
            <p className="eyebrow">Plan de trabajo</p>
            <h2 id="project-tasks-title">Tareas</h2>
          </div>
          <span>
            {completedTasks}/{tasks.length} completadas
          </span>
        </div>

        {canEdit && (
          <form action={createProjectTask} className="root-task-composer">
            <input name="projectId" type="hidden" value={project.id} />
            <input name="spaceId" type="hidden" value={project.space_id} />
            <input name="parentTaskId" type="hidden" value="" />
            <label className="sr-only" htmlFor="root-task-title">
              Nueva tarea del proyecto
            </label>
            <input
              id="root-task-title"
              maxLength={160}
              name="title"
              placeholder="Añadir una tarea al proyecto"
              required
            />
            <button className="button-primary" type="submit">
              Añadir tarea
            </button>
          </form>
        )}

        {taskTree.length === 0 ? (
          <div className="task-empty-state is-compact">
            <span aria-hidden="true">✓</span>
            <h3>Este proyecto aún no tiene tareas</h3>
            <p>Empieza por el siguiente paso concreto.</p>
          </div>
        ) : (
          <ol className="project-task-tree">
            {taskTree.map((node) => (
              <TaskBranch
                canEdit={canEdit}
                key={node.id}
                node={node}
                projectId={project.id}
                spaceId={project.space_id}
              />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
