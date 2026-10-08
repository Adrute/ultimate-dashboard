# Checklist de revisión de seguridad

Úsalo en cambios que afecten autenticación, autorización, datos, acciones de servidor, APIs, integraciones, almacenamiento o despliegue. Marca únicamente comprobaciones realizadas; documenta `No aplica` con una razón cuando corresponda.

## Alcance y límites de confianza

- [ ] Están identificados usuario, datos y sistemas afectados.
- [ ] Las entradas de formularios, URL, cookies, webhooks y proveedores se validan en servidor.
- [ ] Los errores mostrados al cliente usan códigos controlados y no reflejan entradas arbitrarias.
- [ ] Se han definido límites de tamaño, frecuencia y paginación cuando son necesarios.

## Autenticación y sesiones

- [ ] La autorización se comprueba en el servidor y no depende solo de middleware o UI.
- [ ] No se confía en una sesión sin validar identidad o claims.
- [ ] Inicio, cierre, expiración y revocación tienen comportamiento seguro.
- [ ] Acciones mutables consideran CSRF y el mecanismo real de sesión.

## Autorización y RLS

- [ ] Cada tabla con datos de usuario tiene RLS habilitada.
- [ ] Toda tabla multiusuario tiene migración y pruebas positivas y negativas.
- [ ] Se prueba aislamiento con al menos dos usuarios y dos espacios.
- [ ] Las políticas comprueban pertenencia y rol en PostgreSQL, no solo en la aplicación.
- [ ] Funciones `security definer` tienen necesidad justificada, `search_path` seguro y privilegios mínimos.
- [ ] Grants de tabla, columna y función están restringidos a las operaciones necesarias.

## Privacidad y datos sensibles

- [ ] Salud usa `owner_user_id` y nunca queda expuesta mediante espacios compartidos.
- [ ] Logs, fixtures, capturas y mensajes de error no contienen datos personales innecesarios.
- [ ] Se han revisado retención, borrado, exportación y copias de seguridad cuando aplica.
- [ ] El dashboard o la búsqueda no conceden acceso adicional a datos de otros espacios.

## Secretos e integraciones

- [ ] No hay service role, secretos JWT, tokens OAuth ni credenciales en cliente o repositorio.
- [ ] Ningún secreto usa variables `NEXT_PUBLIC_*`.
- [ ] Tokens de proveedores se almacenan y procesan solo en servidor.
- [ ] Se verificaron permisos mínimos, revocación, renovación, cuotas y atribución del proveedor.
- [ ] Google Calendar permanece como fuente de verdad y las tareas no crean eventos automáticamente.

## Navegador, contenido y archivos

- [ ] El contenido enriquecido o externo se sanitiza frente a XSS.
- [ ] Enlaces, redirecciones y URLs firmadas están limitados a destinos esperados.
- [ ] Storage es privado y las URLs firmadas tienen duración mínima cuando aplica.
- [ ] CSP y cabeceras relevantes se revisaron si cambia la superficie web.

## Migraciones y operación

- [ ] No se modificó una migración ya aplicada; se añadió una nueva migración hacia delante.
- [ ] Se evaluaron bloqueos, integridad referencial, índices y compatibilidad con datos existentes.
- [ ] Existe una estrategia de reversión o desactivación que evita pérdida de datos.
- [ ] No se despliega a producción ni se ejecutan acciones destructivas sin autorización explícita.
- [ ] La observabilidad evita secretos y permite detectar fallos de autorización o integración.

## Evidencia y aprobación

- [ ] Formato, lint, tipos, pruebas relevantes y build se ejecutaron o se justificó su omisión.
- [ ] Las pruebas de permisos incluyen caminos permitidos y denegados.
- [ ] Riesgos residuales, excepciones y decisiones pendientes están documentados en el PR.
- [ ] Los cambios sensibles recibieron revisión humana antes de producción.
