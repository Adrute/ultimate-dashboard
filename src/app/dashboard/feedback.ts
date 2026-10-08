const errorMessages = {
  create_failed: "No se pudo añadir el widget. Inténtalo de nuevo.",
  invalid_input: "Revisa el título y el tamaño del widget.",
  move_failed: "No se pudo cambiar el orden del widget.",
  remove_failed: "No se pudo eliminar el widget.",
  resize_failed: "No se pudo cambiar el tamaño del widget.",
} as const;

const successMessages = {
  created: "Widget añadido al panel.",
  moved: "Orden del panel actualizado.",
  removed: "Widget eliminado del panel.",
  resized: "Tamaño del widget actualizado.",
} as const;

export function getDashboardFeedback(error?: string, message?: string) {
  const errorMessage = errorMessages[error as keyof typeof errorMessages];
  const successMessage =
    successMessages[message as keyof typeof successMessages];

  if (errorMessage) {
    return { kind: "error" as const, message: errorMessage };
  }

  if (successMessage) {
    return { kind: "success" as const, message: successMessage };
  }

  return null;
}
