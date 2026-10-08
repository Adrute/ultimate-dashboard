# Base del dashboard configurable

## Alcance de F0-06

Cada usuario dispone de una vista `Principal` privada creada durante el alta. La vista guarda tarjetas de marcador que pueden añadirse, eliminarse, reordenarse y cambiar de tamaño. El estado se persiste en Supabase y se recupera desde cualquier navegador autenticado.

F0-06 no implementa datos de módulos, múltiples vistas, drag-and-drop ni personalización de tema. Esas capacidades se añadirán mediante verticales posteriores sin convertir el dashboard en una fuente de autorización.

## Modelo y autorización

- `dashboard_layouts` pertenece siempre a `owner_user_id`. El rol autenticado solo puede leer su propia vista; no puede crear vistas directamente en F0-06.
- `dashboard_widgets` pertenece a una vista y referencia un `space_id` accesible para su propietario.
- RLS impide leer o modificar la configuración de otro usuario y rechaza widgets que apunten a espacios no autorizados.
- `move_dashboard_widget` intercambia posiciones en una transacción y se ejecuta con permisos del llamador, por lo que RLS sigue siendo efectiva.
- Un widget nunca concede acceso al espacio ni a sus datos. Cada módulo futuro deberá ejecutar sus propias consultas sujetas a RLS.

Las pruebas pgTAP cubren dos usuarios, espacios personales, un espacio compartido, referencias permitidas y denegadas, operaciones cruzadas, rol anónimo y el RPC de ordenación.
