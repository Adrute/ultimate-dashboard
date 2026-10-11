# Imágenes y adjuntos privados de notas (F2-08)

**Estado:** implementado
**Fecha:** 12 de octubre de 2026

## Decisión

Los binarios se guardan en el bucket privado `note-attachments` de Supabase
Storage. `public.attachments` conserva exclusivamente metadatos y relaciona
cada archivo con una nota y un espacio. Las rutas físicas usan UUID y no
incluyen el nombre original:

`{space_id}/{note_id}/{attachment_id}.{extension}`

La descarga pasa por `/notes/attachments/{attachment_id}`. Esa ruta exige
sesión, lee los metadatos bajo RLS y emite una URL firmada válida durante 60
segundos. El documento enriquecido solo puede guardar esa ruta interna para
una imagen; no persiste URL firmadas, URL remotas, HTML ni datos base64.

## Autorización e integridad

- Los miembros del espacio pueden leer metadatos y objetos.
- Solo administradores, editores y propietarios del espacio personal pueden
  crear o eliminar archivos.
- Las políticas de `storage.objects` comprueban bucket, forma de la ruta,
  nota y espacio antes de permitir una operación.
- La relación `(note_id, space_id)` impide asociar un archivo con una nota de
  otro espacio.
- No se permite eliminar el archivo de una imagen mientras su ruta siga en el
  documento actual. Si el archivo ya no existe, una versión histórica que lo
  referenciaba no se puede restaurar. La eliminación de una nota retira primero
  sus objetos y después sus metadatos.
- Al guardar o restaurar, cada imagen se valida contra los adjuntos de esa
  misma nota; conocer otro UUID no permite enlazar archivos ajenos.

El bucket es privado y limita tanto el tamaño como los MIME admitidos. No se
usan claves `service_role`: todas las operaciones se ejecutan con la sesión
del usuario y sus políticas RLS.

## Límites

Se aceptan JPEG, PNG, WebP, GIF, PDF y texto plano, entre 1 byte y 5 MB. Next.js
admite 6 MB en el cuerpo de la Server Action para dejar margen al multipart,
pero la aplicación y Storage mantienen el límite efectivo de 5 MB.

No hay análisis antivirus ni conversión de imágenes en esta fase. Por eso no
se aceptan formatos activos como SVG, HTML u Office. Los tipos se validan en
cliente, acción de servidor, tabla y bucket, aunque el MIME declarado no
demuestra por sí solo el contenido real del archivo.
