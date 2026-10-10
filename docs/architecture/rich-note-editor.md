# Editor enriquecido de notas

**Estado:** implementado en F2-06  
**Fecha:** 10 de octubre de 2026

## Decisión

Las notas almacenan el documento estructurado de Tiptap como JSONB en `notes.content`. El campo `body` se conserva como representación de texto plano para vistas previas, búsqueda y recuperación compatible. `note_versions.content` guarda el documento completo de cada snapshot.

Se fijan `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` y `@tiptap/extension-link` en la versión 3.31.4. Esta versión declara compatibilidad con React 19. El editor es un componente cliente con `immediatelyRender: false`, según la integración SSR oficial para Next.js.

## Límites de confianza

El servidor no acepta HTML. Recibe JSON serializado y lo reconstruye mediante una lista cerrada de nodos y marcas:

- párrafos y encabezados de niveles 1 a 3;
- listas ordenadas y no ordenadas;
- tablas con filas, cabeceras y celdas acotadas;
- citas, reglas horizontales, saltos y bloques de código;
- negrita, cursiva, tachado, código en línea y enlaces;
- enlaces limitados a HTTP, HTTPS, correo o rutas internas.

Se aplican límites de 200 KB serializados, 50.000 caracteres de texto, 2.000 nodos y 20 niveles. Atributos desconocidos se descartan; nodos, marcas o protocolos desconocidos provocan el rechazo completo. La base de datos exige un documento JSON con raíz `doc` y replica el límite de 200 KB.

La interfaz de solo lectura utiliza el esquema de Tiptap, no `dangerouslySetInnerHTML`. El texto plano se deriva en servidor del documento validado, evitando confiar en un segundo valor enviado por el cliente.

Los enlaces internos se generan exclusivamente desde las páginas que el servidor ya ha leído mediante RLS en el mismo espacio. Se guardan como rutas `/notes/{id}` y se abren en la pestaña actual. Esto no concede acceso adicional: la página de destino vuelve a comprobar la sesión y sus políticas al navegar.

## Compatibilidad y migración

La migración `20261010143000_add_rich_note_content.sql` convierte las notas y versiones existentes en documentos con un párrafo, sin modificar migraciones anteriores. Las restauraciones recuperan título, jerarquía, texto plano y contenido enriquecido de forma conjunta.

## Fuera de alcance

Imágenes, adjuntos, menciones, plantillas y edición colaborativa CRDT quedan para verticales posteriores. No se aceptan imágenes embebidas ni HTML arbitrario.
