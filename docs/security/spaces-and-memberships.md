# Espacios y membresías

## Alcance de F0-04

Cada alta crea un único espacio `personal`, asociado mediante `owner_user_id`. El cliente no puede crear otro espacio personal ni cambiar su propietario o tipo. Los usuarios autenticados sí pueden crear espacios `shared`; un trigger añade al creador como `admin`.

Las membresías compartidas usan los roles `admin`, `editor` y `viewer`:

| Operación                         | Admin | Editor | Viewer |
| --------------------------------- | ----- | ------ | ------ |
| Leer espacio, miembros y módulos  | Sí    | Sí     | Sí     |
| Renombrar espacio                 | Sí    | No     | No     |
| Añadir miembros `editor`/`viewer` | Sí    | No     | No     |
| Cambiar entre `editor` y `viewer` | Sí    | No     | No     |
| Gestionar módulos                 | Sí    | No     | No     |

El propietario gestiona el nombre y los módulos de su espacio personal. Las funciones auxiliares de autorización están en el esquema privado y se ejecutan con un `search_path` vacío para evitar recursión en RLS y resolución insegura de objetos.

Además de RLS, un trigger de integridad rechaza membresías cuyo destino no sea un espacio compartido, incluso en operaciones privilegiadas.

## Límites deliberados

La promoción o destitución de administradores, la expulsión, la salida voluntaria, la transferencia y el borrado de espacios permanecen bloqueados hasta definir sus flujos explícitos. F0-04 tampoco implementa invitaciones ni UI de gestión.

`health` solo puede activarse en espacios personales. Un trigger de base de datos impide añadirlo a un espacio compartido, incluso si el llamador es administrador. Las futuras tablas de peso y medidas deberán usar `owner_user_id`, nunca un `space_id` compartido.

## Verificación local

Ejecuta `npm run test:db`. La suite crea cuatro usuarios y comprueba accesos positivos y negativos para espacios personales, dos usuarios miembros, un usuario externo, los tres roles y el rol anónimo.
