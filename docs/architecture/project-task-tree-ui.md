# F2-04 — Árbol de tareas por proyecto

**Fecha:** 9 de octubre de 2026  
**Estado:** implementado, pendiente de validación manual

## Alcance

- Vista dedicada de proyecto en `/projects/[projectId]`.
- Tareas y subtareas recursivas sin límite artificial de profundidad en la UI.
- Creación de una tarea raíz o de una subtarea desde cualquier nodo.
- Completar, reabrir y eliminar tareas respetando permisos del espacio.
- Navegación inferior móvil y capa visual compacta alineada con la referencia aprobada.
- Navegación autenticada sin duplicar `Inicio` y `Panel`; el menú inferior solo se muestra en móvil y el menú superior conserva navegación y cuenta en todas las rutas.
- Creación de proyectos en un panel desplegable para mantener visible la vista general.

No se añadieron dependencias, integraciones externas ni credenciales. La edición avanzada de los campos de una tarea, el orden manual y el arrastre entre niveles permanecen fuera de este vertical.

## Integridad y autorización

La interfaz usa el cliente de servidor sujeto a la sesión y a RLS. Los lectores pueden consultar el árbol, pero no reciben controles de escritura. Las acciones validan UUID, estado y título antes de consultar Supabase, y acotan las mutaciones por `project_id`.

La migración `20261009013000_enforce_task_project_hierarchy.sql` endurece el trigger existente para impedir que una tarea y su padre pertenezcan a proyectos distintos, incluso si ambos proyectos están en el mismo espacio. También impide mover un padre a otro proyecto mientras conserve hijos del proyecto original.

## Comportamiento de borrado

La relación existente usa `ON DELETE SET NULL`. Al eliminar una tarea, sus subtareas no se borran: pasan al nivel raíz del mismo proyecto. La confirmación de la UI hace explícito este efecto.

## Verificación visual

La vista de proyectos se comprobó con Chrome a 1440 × 1000 y 390 × 844 píxeles. En escritorio, la navegación móvil y la tarjeta de espacio permanecen ocultas; en móvil, la barra inferior presenta cinco columnas sin desbordamiento. El panel de creación tampoco produce desbordamiento horizontal.
