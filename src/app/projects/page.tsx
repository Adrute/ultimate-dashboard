import Link from "next/link";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProject, deleteProject, updateProject } from "./actions";
import { getProjectFeedback } from "./feedback";
export const metadata = { title: "Proyectos" };
const statusLabels = {
  planned: "Planificado",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
} as const;
export default async function ProjectsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string; message?: string }> }>) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;
  const feedback = getProjectFeedback(params.error, params.message);
  const supabase = await createSupabaseServerClient();
  const [spacesResult, membersResult, projectsResult] = await Promise.all([
    supabase.from("spaces").select("id,kind,name,owner_user_id").order("name"),
    supabase
      .from("space_members")
      .select("role,space_id")
      .eq("user_id", user.id),
    supabase
      .from("projects")
      .select(
        "description,due_date,id,name,progress,space_id,start_date,status,updated_at",
      )
      .order("updated_at", { ascending: false }),
  ]);
  if (spacesResult.error || membersResult.error || projectsResult.error)
    throw new Error("No se pudieron cargar los proyectos.");
  const editableShared = new Set(
    membersResult.data
      .filter(({ role }) => role === "admin" || role === "editor")
      .map(({ space_id }) => space_id),
  );
  const editableSpaces = spacesResult.data.filter(
    (space) =>
      (space.kind === "personal" && space.owner_user_id === user.id) ||
      editableShared.has(space.id),
  );
  const editableIds = new Set(editableSpaces.map(({ id }) => id));
  const spaceNames = new Map(
    spacesResult.data.map(({ id, name }) => [id, name]),
  );
  const fields = (project?: (typeof projectsResult.data)[number]) => (
    <>
      <label>
        Nombre
        <input
          defaultValue={project?.name}
          maxLength={160}
          name="name"
          required
        />
      </label>
      <label>
        Descripción
        <textarea
          defaultValue={project?.description ?? ""}
          maxLength={5000}
          name="description"
          rows={3}
        />
      </label>
      <div className="project-form-row">
        <label>
          Estado
          <select defaultValue={project?.status ?? "planned"} name="status">
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Progreso
          <input
            defaultValue={project?.progress ?? 0}
            max={100}
            min={0}
            name="progress"
            type="number"
          />
        </label>
        <label>
          Inicio
          <input
            defaultValue={project?.start_date ?? ""}
            name="startDate"
            type="date"
          />
        </label>
        <label>
          Fin previsto
          <input
            defaultValue={project?.due_date ?? ""}
            name="dueDate"
            type="date"
          />
        </label>
      </div>
    </>
  );
  return (
    <main className="page-shell projects-page" id="main-content" tabIndex={-1}>
      <header className="page-heading projects-heading">
        <p className="eyebrow">Productividad</p>
        <h1>Proyectos con rumbo.</h1>
        <p className="page-introduction">
          Define el objetivo, las fechas y el avance sin añadir complejidad
          innecesaria.
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
      <section className="project-composer" aria-labelledby="new-project-title">
        <div>
          <p className="eyebrow">Nuevo proyecto</p>
          <h2 id="new-project-title">Traza el camino</h2>
          <p>Etapas e hitos llegarán en una vertical posterior.</p>
        </div>
        {editableSpaces.length ? (
          <form action={createProject} className="project-form">
            {fields()}
            <label>
              Espacio
              <select defaultValue={editableSpaces[0]?.id} name="spaceId">
                {editableSpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button-primary" type="submit">
              Crear proyecto
            </button>
          </form>
        ) : (
          <p>No tienes espacios editables.</p>
        )}
      </section>
      <section
        className="projects-list-section"
        aria-labelledby="projects-list-title"
      >
        <div className="task-list-heading">
          <div>
            <p className="eyebrow">Vista general</p>
            <h2 id="projects-list-title">Tus proyectos</h2>
          </div>
          <span className="widget-count">{projectsResult.data.length}</span>
        </div>
        {projectsResult.data.length === 0 ? (
          <div className="task-empty-state">
            <span aria-hidden="true">◇</span>
            <h3>Aún no hay proyectos</h3>
            <p>Crea el primero con el formulario anterior.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projectsResult.data.map((project) => (
              <article className="project-card" key={project.id}>
                <span>
                  {spaceNames.get(project.space_id)} ·{" "}
                  {statusLabels[project.status]}
                </span>
                <h3>{project.name}</h3>
                {project.description && <p>{project.description}</p>}
                <div className="project-progress">
                  <span style={{ width: `${project.progress}%` }} />
                  <strong>{project.progress}%</strong>
                </div>
                {project.due_date && (
                  <time dateTime={project.due_date}>
                    Fin previsto: {project.due_date}
                  </time>
                )}
                <Link
                  className="project-open-link"
                  href={`/projects/${project.id}`}
                >
                  Abrir tareas →
                </Link>
                {editableIds.has(project.space_id) && (
                  <details>
                    <summary>Editar proyecto</summary>
                    <form
                      action={updateProject}
                      className="project-form is-compact"
                    >
                      <input
                        name="projectId"
                        type="hidden"
                        value={project.id}
                      />
                      {fields(project)}
                      <button className="button-primary" type="submit">
                        Guardar
                      </button>
                    </form>
                    <form
                      action={deleteProject}
                      className="project-delete-form"
                    >
                      <input
                        name="projectId"
                        type="hidden"
                        value={project.id}
                      />
                      <ConfirmSubmitButton
                        className="button-danger"
                        confirmation={`¿Eliminar “${project.name}”?`}
                      >
                        Eliminar proyecto
                      </ConfirmSubmitButton>
                    </form>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
