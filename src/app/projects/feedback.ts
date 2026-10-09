const errors = {
  create_failed: "No se pudo crear el proyecto.",
  delete_failed: "No se pudo eliminar el proyecto.",
  invalid_input: "Revisa los datos y las fechas.",
  update_failed: "No se pudo guardar el proyecto.",
} as const;
const successes = {
  created: "Proyecto creado.",
  deleted: "Proyecto eliminado.",
  updated: "Proyecto guardado.",
} as const;
export function getProjectFeedback(error?: string, message?: string) {
  const errorMessage = errors[error as keyof typeof errors];
  const successMessage = successes[message as keyof typeof successes];
  if (errorMessage) return { kind: "error" as const, message: errorMessage };
  if (successMessage)
    return { kind: "success" as const, message: successMessage };
  return null;
}
