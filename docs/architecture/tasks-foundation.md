# Base del módulo de tareas (F1-01)

## Alcance

La primera vertical de tareas permite capturar, listar, filtrar por estado y espacio, cambiar entre pendiente/en curso/completada y eliminar. Incluye título, descripción, prioridad y fecha límite. Las tareas pueden vivir en espacios personales o compartidos.

Quedan fuera de esta entrega la bandeja de entrada diferenciada, listas, proyectos, subtareas, recurrencia, etiquetas, asignaciones, Kanban, búsqueda y la superposición en Google Calendar. Se incorporarán en verticales posteriores cuando sus reglas estén aprobadas.

## Autorización

- El propietario edita tareas de su espacio personal.
- Los miembros `admin` y `editor` crean, modifican y eliminan tareas de un espacio compartido.
- Los miembros `viewer` solo leen.
- Un usuario ajeno no ve ni modifica tareas.
- `space_id`, `created_by` y las marcas técnicas no son columnas actualizables por clientes autenticados.

La interfaz oculta acciones no permitidas, pero PostgreSQL RLS es la barrera de seguridad. `supabase/tests/tasks_rls.test.sql` cubre accesos positivos y negativos entre cuatro usuarios y dos espacios compartidos.

## Integridad

Las entradas se validan con Zod en acciones de servidor y nuevamente mediante restricciones SQL. Al completar una tarea, un trigger registra `completed_at`; al reabrirla lo elimina. La tarea se borra con su espacio y conserva el contenido si desaparece el usuario creador.

No se usan claves privilegiadas ni servicios externos en el cliente.
