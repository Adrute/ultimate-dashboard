export type NoteTreeNode<T> = T & {
  children: NoteTreeNode<T>[];
};

type HierarchicalNote = Readonly<{
  id: string;
  parent_note_id: string | null;
}>;

export function buildNoteTree<T extends HierarchicalNote>(
  notes: readonly T[],
): NoteTreeNode<T>[] {
  const nodes = new Map<string, NoteTreeNode<T>>(
    notes.map((note) => [note.id, { ...note, children: [] }]),
  );
  const roots: NoteTreeNode<T>[] = [];

  for (const note of notes) {
    const node = nodes.get(note.id);
    if (!node) continue;

    const parent = note.parent_note_id
      ? nodes.get(note.parent_note_id)
      : undefined;

    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}
