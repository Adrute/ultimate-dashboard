# Integración continua

## Alcance de F0-05

El workflow `.github/workflows/ci.yml` se ejecuta en cada `push` y `pull_request` dirigido a `main`. Solo solicita permiso de lectura del repositorio y no despliega, enlaza ni modifica ningún proyecto Supabase alojado.

El pipeline contiene dos trabajos independientes:

- `Application checks`: instala con `npm ci`, ejecuta formato, ESLint, TypeScript estricto, pruebas unitarias y el build de Next.js.
- `Database isolation tests`: levanta un Supabase efímero en Docker, reproduce todas las migraciones, ejecuta pgTAP y revisa el esquema con `supabase db lint`.

Las versiones de Ubuntu, Node, npm y Supabase CLI quedan fijadas por el workflow, `package.json` y `package-lock.json`. Las acciones de GitHub también están ancladas a los commits publicados como `checkout` 7.0.1 y `setup-node` 7.1.0. No se requieren secretos de GitHub ni credenciales de Supabase.

## Aislamiento cubierto

`space_isolation_rls.test.sql` crea dos espacios compartidos administrados por usuarios diferentes y un editor asignado únicamente al primero. Comprueba en ambas direcciones que administrar un espacio no permite leer o modificar el otro, y que pertenecer a uno no expone espacios, miembros ni módulos no asignados.

## Reproducción local

Con Supabase local en ejecución:

```bash
npm ci
npm run check
npm run build
npm run test:db
npx supabase db lint --local --level warning
```

La primera ejecución de `npm run supabase:start` puede tardar mientras descarga las imágenes de Docker.
