# UltimateDashboard

Proyecto de suite personal y colaborativa. Nombre provisional.

## Documentación

- `MASTER_SPEC.md`: alcance, diseño, arquitectura, seguridad, agentes y roadmap.
- `AGENTS.md`: instrucciones operativas para Codex en VS Code.

## Estado

- F0-01 completado: scaffold mínimo de Next.js con App Router, TypeScript estricto, ESLint, Prettier y Vitest.
- F0-02 completado: tokens visuales semánticos, shell base y navegación responsive accesible.

No hay servicios externos configurados.

## Requisitos

- Node.js 22.12 o posterior (la versión usada al crear el scaffold fue 22.23.3).
- npm 10 o posterior.

## Desarrollo

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Controles

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

`npm run check` agrupa formato, lint, tipos y pruebas unitarias.

## Primer prompt para Codex

> Lee MASTER_SPEC.md y AGENTS.md. Implementa exclusivamente F0-01 (scaffold Next.js con TypeScript estricto, ESLint, formatter y scripts de test). Antes de modificar archivos, describe el plan y verifica versiones compatibles y modelos disponibles. No configures servicios externos ni inventes credenciales. Al terminar, ejecuta los controles disponibles y resume resultados y riesgos.
