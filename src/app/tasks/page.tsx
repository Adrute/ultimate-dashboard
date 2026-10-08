import Link from "next/link";
import { z } from "zod";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { taskFilterSchema } from "@/lib/tasks/task-input";

import { createTask, deleteTask, updateTaskStatus } from "./actions";
import { getTaskFeedback } from "./feedback";

export const metadata = { title: "Tareas" };

type TasksPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
    filter?: string;
    message?: string;
    space?: string;
  }>;
}>;

const statusLabels = {
  done: "Completada",
  in_progress: "En curso",
  todo: "Pendiente",
} as const;

const priorityLabels = {
  high: "Alta",
  low: "Baja",
  medium: "Media",
  none: "Sin prioridad",
} as const;

function taskFilterHref(filter: "open" | "done" | "all", space?: string) {
  const params = new URLSearchParams({ filter });
  if (space) params.set("space", space);
  return `/tasks?${params.toString()}`;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const filterResult = taskFilterSchema.safeParse(params.filter);
  const filter = filterResult.success ? filterResult.data : "open";
  const spaceResult = z.uuid().safeParse(params.space);
  const requestedSpace = spaceResult.success ? spaceResult.data : undefined;
  const feedback = getTaskFeedback(params.error, params.message);

  const [spacesResult, membershipsResult] = await Promise.all([
    supabase
      .from("spaces")
      .select("id, kind, name, owner_user_id")
      .order("name"),
    supabase
      .from("space_members")
      .select("role, space_id")
      .eq("user_id", user.id),
  ]);

  if (spacesResult.error || membershipsResult.error) {
    throw new Error("No se pudieron cargar tus espacios.");
  }

  const spaces = spacesResult.data;
  const accessibleSpaceIds = new Set(spaces.map((space) => space.id));
  const activeSpace =
    requestedSpace && accessibleSpaceIds.has(requestedSpace)
      ? requestedSpace
      : undefined;
  const editableSharedIds = new Set(
    membershipsResult.data
      .filter(({ role }) => role === "admin" || role === "editor")
      .map(({ space_id: spaceId }) => spaceId),
  );
  const editableSpaces = spaces.filter(
    (space) =>
      (space.kind === "personal" && space.owner_user_id === user.id) ||
      editableSharedIds.has(space.id),
  );
  const editableIds = new Set(editableSpaces.map((space) => space.id));
  const spaceNames = new Map(spaces.map((space) => [space.id, space.name]));

  let tasksQuery = supabase
    .from("tasks")
    .select("description, due_date, id, priority, space_id, status, title")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filter === "open") tasksQuery = tasksQuery.neq("status", "done");
  if (filter === "done") tasksQuery = tasksQuery.eq("status", "done");
  if (activeSpace) tasksQuery = tasksQuery.eq("space_id", activeSpace);

  const { data: tasks, error: tasksError } = await tasksQuery;
  if (tasksError) throw new Error("No se pudieron cargar las tareas.");

  return (
    <main className="page-shell tasks-page" id="main-content" tabIndex={-1}>
      <header className="page-heading tasks-heading">
        <p className="eyebrow">Organización</p>
        <h1>Tareas claras, día tranquilo.</h1>
        <p className="page-introduction">
          Captura pendientes personales o compartidos y mantenlos en movimiento.
        </p>
      </header>

      {feedback && (
        <p
          aria-live="polite"
          className={`dashboard-feedback is-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <section aria-labelledby="quick-task-title" className="task-composer">
        <div>
          <p className="eyebrow">Captura rápida</p>
          <h2 id="quick-task-title">Añade una tarea</h2>
          <p>Los permisos dependen del espacio elegido.</p>
        </div>

        {editableSpaces.length > 0 ? (
          <form action={createTask} className="task-form">
            <label htmlFor="task-title">Título</label>
            <input id="task-title" maxLength={160} name="title" required />

            <label htmlFor="task-description">Descripción</label>
            <textarea
              id="task-description"
              maxLength={5000}
              name="description"
              rows={3}
            />

            <div className="task-form-row">
              <label>
                Espacio
                <select
                  defaultValue={
                    activeSpace && editableIds.has(activeSpace)
                      ? activeSpace
                      : editableSpaces[0]?.id
                  }
                  name="spaceId"
                >
                  {editableSpaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prioridad
                <select defaultValue="none" name="priority">
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha límite
                <input name="dueDate" type="date" />
              </label>
            </div>

            <button className="button-primary" type="submit">
              Crear tarea
            </button>
          </form>
        ) : (
          <p>No tienes ningún espacio con permiso de edición.</p>
        )}
      </section>

      <section aria-labelledby="task-list-title" className="task-list-section">
        <div className="task-list-heading">
          <div>
            <p className="eyebrow">Vista actual</p>
            <h2 id="task-list-title">Tus tareas</h2>
          </div>
          <span className="widget-count" aria-label={`${tasks.length} tareas`}>
            {tasks.length}
          </span>
        </div>

        <div className="task-filters" aria-label="Filtros de tareas">
          <div className="filter-links">
            {(["open", "done", "all"] as const).map((value) => (
              <Link
                aria-current={filter === value ? "page" : undefined}
                href={taskFilterHref(value, activeSpace)}
                key={value}
              >
                {{ all: "Todas", done: "Completadas", open: "Abiertas" }[value]}
              </Link>
            ))}
          </div>
          <form action="/tasks" method="get">
            <input name="filter" type="hidden" value={filter} />
            <label htmlFor="space-filter">Espacio</label>
            <select
              defaultValue={activeSpace ?? ""}
              id="space-filter"
              name="space"
            >
              <option value="">Todos</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <button type="submit">Aplicar</button>
          </form>
        </div>

        {tasks.length === 0 ? (
          <div className="task-empty-state">
            <span aria-hidden="true">✓</span>
            <h3>No hay tareas en esta vista</h3>
            <p>Crea una nueva o cambia los filtros para ver otras tareas.</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const canEdit = editableIds.has(task.space_id);
              return (
                <article
                  className={`task-card is-${task.status}`}
                  key={task.id}
                >
                  <div className="task-card-main">
                    <div className="task-meta">
                      <span>{spaceNames.get(task.space_id) ?? "Espacio"}</span>
                      <span>{priorityLabels[task.priority]}</span>
                      <span>{statusLabels[task.status]}</span>
                    </div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    {task.due_date && (
                      <time dateTime={task.due_date}>
                        Fecha límite:{" "}
                        {new Intl.DateTimeFormat("es-ES", {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }).format(new Date(`${task.due_date}T00:00:00Z`))}
                      </time>
                    )}
                  </div>

                  {canEdit && (
                    <div className="task-actions">
                      {task.status !== "in_progress" &&
                        task.status !== "done" && (
                          <form action={updateTaskStatus}>
                            <input
                              name="taskId"
                              type="hidden"
                              value={task.id}
                            />
                            <input
                              name="status"
                              type="hidden"
                              value="in_progress"
                            />
                            <button type="submit">Empezar</button>
                          </form>
                        )}
                      {task.status !== "done" ? (
                        <form action={updateTaskStatus}>
                          <input name="taskId" type="hidden" value={task.id} />
                          <input name="status" type="hidden" value="done" />
                          <button type="submit">Completar</button>
                        </form>
                      ) : (
                        <form action={updateTaskStatus}>
                          <input name="taskId" type="hidden" value={task.id} />
                          <input name="status" type="hidden" value="todo" />
                          <button type="submit">Reabrir</button>
                        </form>
                      )}
                      <form action={deleteTask}>
                        <input name="taskId" type="hidden" value={task.id} />
                        <ConfirmSubmitButton
                          className="button-danger"
                          confirmation={`¿Eliminar “${task.title}”?`}
                        >
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
