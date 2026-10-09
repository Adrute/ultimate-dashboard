import { z } from "zod";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createNote, deleteNote, updateNote } from "./actions";
import { getNoteFeedback } from "./feedback";

export const metadata = { title: "Notas" };

type NotesPageProps = Readonly<{
  searchParams: Promise<{ error?: string; message?: string; space?: string }>;
}>;

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;
  const feedback = getNoteFeedback(params.error, params.message);
  const supabase = await createSupabaseServerClient();
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
  const allowedIds = new Set(spaces.map(({ id }) => id));
  const requestedSpace = z.uuid().safeParse(params.space);
  const activeSpace =
    requestedSpace.success && allowedIds.has(requestedSpace.data)
      ? requestedSpace.data
      : undefined;
  const editableSharedIds = new Set(
    membershipsResult.data
      .filter(({ role }) => role === "admin" || role === "editor")
      .map(({ space_id }) => space_id),
  );
  const editableSpaces = spaces.filter(
    (space) =>
      (space.kind === "personal" && space.owner_user_id === user.id) ||
      editableSharedIds.has(space.id),
  );
  const editableIds = new Set(editableSpaces.map(({ id }) => id));
  const spaceNames = new Map(spaces.map(({ id, name }) => [id, name]));

  let notesQuery = supabase
    .from("notes")
    .select("body, id, space_id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (activeSpace) notesQuery = notesQuery.eq("space_id", activeSpace);
  const notesResult = await notesQuery;
  if (notesResult.error) throw new Error("No se pudieron cargar las notas.");

  return (
    <main className="page-shell notes-page" id="main-content" tabIndex={-1}>
      <header className="page-heading notes-heading">
        <p className="eyebrow">Productividad</p>
        <h1>Ideas que no se pierden.</h1>
        <p className="page-introduction">
          Guarda notas sencillas en tus espacios. El contenido es texto plano y
          seguro.
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

      <section aria-labelledby="new-note-title" className="note-composer">
        <div>
          <p className="eyebrow">Nueva nota</p>
          <h2 id="new-note-title">Empieza a escribir</h2>
          <p>Podrás enriquecerla con bloques en una entrega posterior.</p>
        </div>
        {editableSpaces.length > 0 ? (
          <form action={createNote} className="note-form">
            <label htmlFor="note-title">Título</label>
            <input id="note-title" maxLength={160} name="title" required />
            <label htmlFor="note-body">Contenido</label>
            <textarea id="note-body" maxLength={50000} name="body" rows={7} />
            <label htmlFor="note-space">Espacio</label>
            <select
              defaultValue={
                activeSpace && editableIds.has(activeSpace)
                  ? activeSpace
                  : editableSpaces[0]?.id
              }
              id="note-space"
              name="spaceId"
            >
              {editableSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <button className="button-primary" type="submit">
              Crear nota
            </button>
          </form>
        ) : (
          <p>No tienes espacios con permiso de edición.</p>
        )}
      </section>

      <section
        aria-labelledby="notes-list-title"
        className="notes-list-section"
      >
        <div className="task-list-heading">
          <div>
            <p className="eyebrow">Biblioteca</p>
            <h2 id="notes-list-title">Tus notas</h2>
          </div>
          <span
            aria-label={`${notesResult.data.length} notas`}
            className="widget-count"
          >
            {notesResult.data.length}
          </span>
        </div>
        <form action="/notes" className="notes-filter" method="get">
          <label htmlFor="notes-space-filter">Espacio</label>
          <select
            defaultValue={activeSpace ?? ""}
            id="notes-space-filter"
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

        {notesResult.data.length === 0 ? (
          <div className="task-empty-state">
            <span aria-hidden="true">✎</span>
            <h3>Aún no hay notas</h3>
            <p>Crea la primera nota en el formulario anterior.</p>
          </div>
        ) : (
          <div className="notes-grid">
            {notesResult.data.map((note) => {
              const canEdit = editableIds.has(note.space_id);
              return (
                <article className="note-card" key={note.id}>
                  <span>{spaceNames.get(note.space_id) ?? "Espacio"}</span>
                  <h3>{note.title}</h3>
                  <p className="note-preview">{note.body || "Nota vacía"}</p>
                  <time dateTime={note.updated_at}>
                    Actualizada{" "}
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(note.updated_at))}
                  </time>
                  {canEdit && (
                    <details>
                      <summary>Editar nota</summary>
                      <form
                        action={updateNote}
                        className="note-form is-compact"
                      >
                        <input name="noteId" type="hidden" value={note.id} />
                        <label>
                          Título
                          <input
                            defaultValue={note.title}
                            maxLength={160}
                            name="title"
                            required
                          />
                        </label>
                        <label>
                          Contenido
                          <textarea
                            defaultValue={note.body}
                            maxLength={50000}
                            name="body"
                            rows={8}
                          />
                        </label>
                        <div className="note-actions">
                          <button className="button-primary" type="submit">
                            Guardar
                          </button>
                        </div>
                      </form>
                      <form action={deleteNote} className="note-delete-form">
                        <input name="noteId" type="hidden" value={note.id} />
                        <ConfirmSubmitButton
                          className="button-danger"
                          confirmation={`¿Eliminar “${note.title}”?`}
                        >
                          Eliminar nota
                        </ConfirmSubmitButton>
                      </form>
                    </details>
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
