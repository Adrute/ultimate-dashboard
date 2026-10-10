# Jerarquía e historial de notas

**Estado:** implementado en F2-05  
**Fecha:** 10 de octubre de 2026

## Alcance

Las notas pueden organizarse como páginas raíz y subpáginas sin límite artificial de profundidad. La relación se mantiene con `notes.parent_note_id`; una validación en base de datos impide autorreferencias, ciclos y relaciones entre espacios distintos.

Cada alta y cada cambio de título, contenido o página superior genera un snapshot inmutable en `note_versions`. El historial se consulta desde la página de detalle y una versión anterior puede restaurarse como un cambio nuevo, por lo que el estado sustituido no se pierde.

## Autorización

- Las políticas existentes de `notes` siguen determinando quién puede crear o modificar una página.
- `note_versions` solo concede lectura a usuarios autenticados con acceso al espacio mediante `private.can_access_space`.
- Los clientes no pueden insertar, actualizar ni eliminar snapshots; los crea exclusivamente un trigger con privilegios controlados.
- Los lectores de un espacio compartido pueden consultar páginas e historial, pero no editar ni restaurar.

La migración `20261010090000_add_note_hierarchy_and_versions.sql` incluye el backfill de una versión inicial para notas existentes. Las pruebas pgTAP cubren creación, versiones, aislamiento entre propietarios, rechazo de ciclos, rechazo entre espacios y denegación de escritura directa.

## Límites deliberados

El editor continúa siendo texto plano. Los bloques enriquecidos, adjuntos, edición colaborativa en tiempo real y comparación visual entre versiones quedan fuera de esta entrega. Si una versión histórica apuntaba a una página superior ya eliminada, su restauración completa se rechaza para no recrear una relación inválida.
