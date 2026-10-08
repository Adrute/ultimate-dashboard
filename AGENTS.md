# UltimateDashboard — instrucciones para Codex

Lee `MASTER_SPEC.md` antes de implementar funcionalidades. Mantén el nombre como provisional. Responde en español al usuario y usa nombres de código claros en inglés.

## Reglas innegociables
- No implementar funcionalidades no aprobadas ni introducir módulos financieros.
- No crear microservicios, paquetes, dependencias o abstracciones por anticipación.
- TypeScript estricto; validación de entradas en límites de confianza.
- Nunca exponer service role, tokens OAuth ni secretos en el cliente.
- Toda tabla multiusuario requiere RLS, pruebas positivas y negativas y migración versionada.
- Salud es privada; no puede exponerse mediante espacios compartidos.
- Google Calendar es fuente de verdad de eventos; tareas no se sincronizan como eventos automáticamente.
- No cambiar migraciones ya aplicadas; añadir nuevas migraciones.
- No desplegar producción ni ejecutar acciones destructivas sin autorización explícita.
- No afirmar que pruebas pasaron si no se ejecutaron; informar bloqueos.

## Ciclo de trabajo
1. Identifica requisito y criterios de aceptación.
2. Inspecciona archivos existentes antes de editar.
3. Propón plan si afecta más de un módulo, seguridad o esquema.
4. Implementa el cambio mínimo vertical; evita refactors ajenos.
5. Ejecuta lint, typecheck, tests relevantes y build cuando corresponda.
6. Informa resumen, archivos modificados, resultados de pruebas, riesgos y próximos pasos.

## Delegación especializada
- Arquitectura: ADR, dependencias entre módulos, límites de dominio.
- Frontend: UI, accesibilidad, responsive, tokens.
- Backend: casos de uso, Google/TMDB/IGDB, validación y resiliencia.
- DB/Seguridad: SQL, RLS, políticas, índices, OAuth.
- QA: pruebas, fixtures, flujos E2E y regresiones.
- Documentación: actualizar especificaciones, ADR y manuales.

No asumir que Codex dispone de agentes paralelos o un modelo concreto. Verificar capacidades instaladas. Para tareas sensibles utilizar el modelo de codificación más capaz disponible y razonamiento alto; para cambios rutinarios usar uno rápido con razonamiento medio/bajo. Registrar configuración real en `docs/architecture/ai-model-policy.md`.

## Definition of Done
Requisitos satisfechos, código tipado, tests pertinentes ejecutados, permisos validados, accesibilidad revisada, documentación actualizada y sin secretos. Cualquier excepción debe declararse explícitamente.
