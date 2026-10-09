const errors = {
  create_failed: "No se pudo crear la nota.",
  delete_failed: "No se pudo eliminar la nota.",
  invalid_input: "Revisa el título y el contenido de la nota.",
  update_failed: "No se pudo guardar la nota.",
} as const;

const successes = {
  created: "Nota creada.",
  deleted: "Nota eliminada.",
  updated: "Nota guardada.",
} as const;

export function getNoteFeedback(error?: string, message?: string) {
  const errorMessage = errors[error as keyof typeof errors];
  const successMessage = successes[message as keyof typeof successes];
  if (errorMessage) return { kind: "error" as const, message: errorMessage };
  if (successMessage)
    return { kind: "success" as const, message: successMessage };
  return null;
}
