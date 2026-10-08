const errors = {
  create_failed: "No se pudo crear la tarea.",
  delete_failed: "No se pudo eliminar la tarea.",
  invalid_input: "Revisa los datos de la tarea.",
  update_failed: "No se pudo cambiar el estado.",
} as const;

const successes = {
  created: "Tarea creada.",
  deleted: "Tarea eliminada.",
  updated: "Estado actualizado.",
} as const;

export function getTaskFeedback(error?: string, message?: string) {
  const errorMessage = errors[error as keyof typeof errors];
  const successMessage = successes[message as keyof typeof successes];

  if (errorMessage) return { kind: "error" as const, message: errorMessage };
  if (successMessage)
    return { kind: "success" as const, message: successMessage };
  return null;
}
