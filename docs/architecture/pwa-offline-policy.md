# PWA mínima y política offline (F1-03)

UltimateDashboard incluye un manifest, icono adaptable y service worker para poder instalar la aplicación desde navegadores compatibles. El nombre continúa siendo provisional.

## Límite offline

El service worker precarga únicamente `/offline` y el icono de aplicación. Para navegaciones usa primero la red y muestra la página informativa si la petición falla. No almacena respuestas de `/dashboard`, `/tasks`, `/search`, Supabase ni ningún contenido autenticado.

No existe creación, edición ni sincronización offline. Este límite evita mostrar datos privados obsoletos y conflictos silenciosos. Cualquier ampliación deberá definir cifrado local, caducidad, usuario activo, resolución de conflictos y limpieza al cerrar sesión antes de implementarse.

El registro se activa solo en compilaciones de producción para no interferir con el servidor de desarrollo.
