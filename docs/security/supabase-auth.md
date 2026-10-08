# Autenticación con Supabase

## Alcance de F0-03

La aplicación usa autenticación SSR con cookies mediante `@supabase/ssr`. El Proxy de Next.js renueva la sesión con `getClaims()`, pero la autorización se repite en el layout protegido de `/dashboard`; no se confía únicamente en el Proxy ni en `getSession()`.

`public.profiles` contiene únicamente el perfil privado del usuario. RLS permite leer y modificar el `display_name` propio. El rol autenticado no puede insertar, borrar, modificar columnas técnicas ni acceder a otro perfil. El alta del perfil se realiza mediante un trigger sobre `auth.users`.

## Configuración local

1. Ejecuta `npm run supabase:start`.
2. Copia `.env.example` a `.env.local`.
3. Usa únicamente `API_URL` y `PUBLISHABLE_KEY` del entorno local:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Ejecuta `npm run test:db` para validar las políticas y `npm run dev` para probar el flujo.

Nunca añadas `SECRET_KEY`, `SERVICE_ROLE_KEY`, secretos JWT ni credenciales de base de datos a una variable `NEXT_PUBLIC_*`.

## Proyecto alojado

No hay ningún proyecto remoto vinculado. Antes de hacerlo deben definirse el entorno, las URLs permitidas y si el correo exige confirmación. Si se habilita confirmación, la plantilla debe dirigir a `/auth/confirm` usando `token_hash` y `type`, como la plantilla local versionada.
