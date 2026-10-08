const errorMessages = {
  configuration:
    "Supabase todavía no está configurado. Añade las variables indicadas para habilitar el acceso.",
  invalid_credentials: "No se pudo iniciar sesión con esas credenciales.",
  invalid_input:
    "Revisa el correo y usa una contraseña de al menos 8 caracteres.",
  session_required: "Inicia sesión para acceder a tu espacio personal.",
  signup_failed:
    "No se pudo crear la cuenta. Revisa los datos o inténtalo más tarde.",
  verification_failed: "El enlace de confirmación no es válido o ha caducado.",
} as const;

const successMessages = {
  check_email: "Revisa tu correo para confirmar la cuenta antes de entrar.",
  signed_out: "La sesión se ha cerrado correctamente.",
} as const;

export function getLoginFeedback(error?: string, message?: string) {
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
