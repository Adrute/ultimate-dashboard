## Objetivo

<!-- Qué problema resuelve este cambio y para quién. -->

## Alcance

<!-- Cambios incluidos. -->

## Fuera de alcance

<!-- Trabajo relacionado que se ha pospuesto deliberadamente. -->

## Criterios de aceptación

- [ ] El comportamiento solicitado está implementado.
- [ ] Los estados de error y vacío pertinentes están cubiertos.
- [ ] No se han añadido funcionalidades ni dependencias ajenas al alcance.

## Evidencia

<!-- Marca únicamente los controles ejecutados e incluye el resultado. -->

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run test:db`
- [ ] `npm run build`
- [ ] Prueba manual

Controles no ejecutados y motivo:

## Interfaz y accesibilidad

<!-- Si no aplica, indícalo expresamente. -->

- [ ] Revisado en escritorio y móvil.
- [ ] Revisado con teclado y foco visible.
- [ ] Los controles tienen nombre accesible y los mensajes importantes se anuncian.
- [ ] Se adjuntan capturas o grabación cuando cambia la interfaz.

## Datos y seguridad

<!-- Completa el checklist de seguridad enlazado cuando el cambio toque datos, permisos o integraciones. -->

- [ ] No se incluyen secretos, tokens ni datos personales en código, logs o capturas.
- [ ] Las entradas se validan en los límites de confianza.
- [ ] Las tablas nuevas tienen migración versionada y RLS, si aplica.
- [ ] Se probaron accesos permitidos y denegados entre usuarios y espacios, si aplica.
- [ ] Salud permanece privada y fuera de espacios compartidos, si aplica.

Checklist ampliado: `docs/security/review-checklist.md`

## Migración y reversión

<!-- Describe migraciones, compatibilidad hacia delante y cómo desactivar o revertir el cambio de forma segura. -->

## Riesgos y asuntos abiertos

<!-- Limitaciones conocidas, deuda introducida, decisiones humanas o seguimiento necesario. -->

## Documentación

- [ ] README, ADR, manuales o especificaciones actualizados cuando corresponde.
- [ ] No se ha cambiado una migración ya aplicada.
