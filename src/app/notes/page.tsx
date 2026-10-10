import Link from "next/link";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { buildNoteTree, type NoteTreeNode } from "@/lib/notes/note-tree";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createNote } from "./actions";
import { getNoteFeedback } from "./feedback";

export const metadata = { title: "Notas" };

type NotesPageProps = Readonly<{
  searchParams: Promise<{ error?: string; message?: string; space?: string }>;
}>;

type NoteSummary = Readonly<{
  body: string;
  id: string;
  parent_note_id: string | null;
  space_id: string;
  title: string;
  updated_at: string;
}>;

function NoteBranch({
  editableIds,
  node,
  spaceNames,
}: Readonly<{
  editableIds: ReadonlySet<string>;
  node: NoteTreeNode<NoteSummary>;
  spaceNames: ReadonlyMap<string, string>;
}>) {
  return (
    <li>
      <article className="note-card">
        <div className="note-card-copy">
          <span>{spaceNames.get(node.space_id) ?? "Espacio"}</span>
          <h3>
            <Link href={`/notes/${node.id}`}>{node.title}</Link>
          </h3>
          <p className="note-preview">{node.body || "Nota vacía"}</p>
        </div>
        <div className="note-card-meta">
          <time dateTime={node.updated_at}>
            {new Intl.DateTimeFormat("es-ES", {
              dateStyle: "medium",
            }).format(new Date(node.updated_at))}
          </time>
          <Link className="note-open-link" href={`/notes/${node.id}`}>
            {editableIds.has(node.space_id) ? "Abrir y editar" : "Abrir"}
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </article>
      {node.children.length > 0 && (
        <ul className="note-tree is-nested">
          {node.children.map((child) => (
            <NoteBranch
              editableIds={editableIds}
              key={child.id}
              node={child}
              spaceNames={spaceNames}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

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
    .select("body, id, parent_note_id, space_id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (activeSpace) notesQuery = notesQuery.eq("space_id", activeSpace);
  const notesResult = await notesQuery;
  if (notesResult.error) throw new Error("No se pudieron cargar las notas.");

  const noteTree = buildNoteTree(notesResult.data);

  return (
    <main className="page-shell notes-page" id="main-content" tabIndex={-1}>
      <div className="notes-topbar">
        <header className="page-heading notes-heading">
          <p className="eyebrow">Biblioteca</p>
          <h1>Tus notas</h1>
          <p className="page-introduction">
            Organiza ideas en páginas y subpáginas. Cada cambio queda guardado
            en el historial.
          </p>
        </header>

        {editableSpaces.length > 0 && (
          <details className="note-create-panel">
            <summary>＋ Nueva nota</summary>
            <form action={createNote} className="note-form note-create-content">
              <input name="parentNoteId" type="hidden" value="" />
              <label htmlFor="note-title">Título</label>
              <input
                autoComplete="off"
                id="note-title"
                maxLength={160}
                name="title"
                required
              />
              <label htmlFor="note-body">Contenido</label>
              <textarea id="note-body" maxLength={50000} name="body" rows={6} />
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
          </details>
        )}
      </div>

      {feedback && (
        <p
          aria-live="polite"
          className={`dashboard-feedback is-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <section
        aria-labelledby="notes-list-title"
        className="notes-list-section"
      >
        <div className="task-list-heading">
          <div>
            <p className="eyebrow">Vista general</p>
            <h2 id="notes-list-title">Páginas</h2>
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
            <p>Crea la primera página con el botón Nueva nota.</p>
          </div>
        ) : (
          <ul className="note-tree">
            {noteTree.map((node) => (
              <NoteBranch
                editableIds={editableIds}
                key={node.id}
                node={node}
                spaceNames={spaceNames}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
