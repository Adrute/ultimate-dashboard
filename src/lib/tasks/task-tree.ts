export type TaskTreeNode<T> = T & {
  children: TaskTreeNode<T>[];
};

type HierarchicalTask = Readonly<{
  id: string;
  parent_task_id: string | null;
}>;

export function buildTaskTree<T extends HierarchicalTask>(
  tasks: readonly T[],
): TaskTreeNode<T>[] {
  const nodes = new Map<string, TaskTreeNode<T>>(
    tasks.map((task) => [task.id, { ...task, children: [] }]),
  );
  const roots: TaskTreeNode<T>[] = [];

  for (const task of tasks) {
    const node = nodes.get(task.id);
    if (!node) continue;

    const parent = task.parent_task_id
      ? nodes.get(task.parent_task_id)
      : undefined;

    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}
