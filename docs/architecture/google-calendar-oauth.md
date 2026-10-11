# Conexión OAuth de Google Calendar

**Estado:** implementada la conexión base; lectura y sincronización de eventos pendientes.

## Alcance de F2-10

La aplicación permite a cada usuario autenticado iniciar OAuth, conservar una única conexión privada, revocar el permiso y eliminar la conexión. Esta entrega no consulta calendarios ni eventos todavía y no convierte tareas en eventos.

Se solicitan únicamente estos permisos:

- `calendar.calendarlist.readonly`, para descubrir calendarios accesibles.
- `calendar.events`, para gestionar eventos cuando se implemente la siguiente vertical.
- `openid` y `email`, para identificar claramente la cuenta conectada.

## Controles de seguridad

- El flujo usa `state` aleatorio, cookie `HttpOnly` de diez minutos y PKCE `S256`.
- Client secret, clave de cifrado y tokens solo se usan en el servidor.
- Los tokens se cifran antes de persistirse mediante AES-256-GCM con IV aleatorio y etiqueta de autenticación.
- `google_connections` tiene RLS por propietario y pruebas positivas y negativas de aislamiento.
- Al desconectar se revoca primero el refresh token en Google. Si la revocación falla, se conserva la conexión local para poder reintentar.
- Los eventos siguen siendo propiedad y fuente de verdad de Google. Las tareas de Supabase no se escriben automáticamente en Calendar.

## Configuración manual de desarrollo

1. En Google Cloud, habilitar Google Calendar API y configurar la pantalla de consentimiento OAuth.
2. Crear un cliente OAuth de tipo aplicación web.
3. Registrar exactamente `http://localhost:3000/calendar/oauth/callback` como URI de redirección local.
4. Completar en `.env.local` las cuatro variables `GOOGLE_CALENDAR_*` de `.env.example`.
5. Generar localmente una clave aleatoria de 32 bytes en base64, por ejemplo con `openssl rand -base64 32`; no reutilizar el client secret.
6. Reiniciar el servidor y conectar desde `/calendar`.

Para un entorno HTTPS, la URI de redirección debe usar HTTPS y coincidir exactamente con la registrada en Google.

## Operación y riesgos pendientes

- La clave de cifrado debe almacenarse en el gestor de secretos del entorno. Cambiarla sin una migración de claves obliga a reconectar las cuentas existentes.
- No hay sincronización incremental, renovación ejercitada contra Google, gestión de recurrencia, zonas horarias ni reintentos de API en esta entrega.
- Antes de producción deben configurarse la pantalla de consentimiento, usuarios de prueba o verificación de Google según corresponda, y una estrategia documentada de rotación de claves.

Referencias: [OAuth 2.0 para aplicaciones web](https://developers.google.com/identity/protocols/oauth2/web-server), [ámbitos de Google Calendar](https://developers.google.com/workspace/calendar/api/auth) y [google-auth-library para Node.js](https://github.com/googleapis/google-auth-library-nodejs).
