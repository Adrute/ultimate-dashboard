# UltimateDashboard

Proyecto de suite personal y colaborativa. Nombre provisional.

## Documentación

- `MASTER_SPEC.md`: alcance, diseño, arquitectura, seguridad, agentes y roadmap.
- `AGENTS.md`: instrucciones operativas para Codex en VS Code.
- `docs/architecture/decisions`: plantilla e índice de decisiones de arquitectura.
- `docs/security/review-checklist.md`: revisión de seguridad por cambio.

## Estado

- F0-01 completado: scaffold mínimo de Next.js con App Router, TypeScript estricto, ESLint, Prettier y Vitest.
- F0-02 completado: tokens visuales semánticos, shell base y navegación responsive accesible.
- F0-03 completado: autenticación SSR con Supabase, perfiles privados con RLS y ruta protegida.
- F0-04 completado: espacios personales y compartidos, roles, módulos y RLS.
- F0-05 completado: aislamiento entre espacios y pipeline CI.
- F0-06 completado: dashboard configurable con widgets persistentes.
- F0-07 completado: plantillas de PR y ADR y checklist de seguridad.
- F1-01 completado: captura y gestión básica de tareas personales/compartidas con RLS.
- F1-02 completado: búsqueda inicial de tareas autorizadas por título y descripción.
- F1-03 implementado: PWA instalable con fallback offline sin cachear datos privados.

No hay servicios externos configurados.

## Requisitos

- Node.js 22.12 o posterior (la versión usada al crear el scaffold fue 22.23.3).
- npm 10 o posterior.

## Desarrollo

```bash
npm install
npm run supabase:start
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

El service worker se registra únicamente en compilaciones de producción. Para probar la instalación y el fallback offline usa `npm run build && npm run start`.

Para habilitar autenticación, copia `.env.example` a `.env.local` y completa la URL y la clave publicable mostradas por `npm run supabase:start` o por el panel del proyecto. No uses una clave `service_role` en variables `NEXT_PUBLIC_*`.

## Controles

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:db
npm run build
```

`npm run check` agrupa formato, lint, tipos y pruebas unitarias.

## Primer prompt para Codex

> Lee MASTER_SPEC.md y AGENTS.md. Implementa exclusivamente F0-01 (scaffold Next.js con TypeScript estricto, ESLint, formatter y scripts de test). Antes de modificar archivos, describe el plan y verifica versiones compatibles y modelos disponibles. No configures servicios externos ni inventes credenciales. Al terminar, ejecuta los controles disponibles y resume resultados y riesgos.
