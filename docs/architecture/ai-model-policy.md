# Política de modelos de IA

**Verificado:** 8 de octubre de 2026  
**Ámbito:** sesión de Codex usada para F0-01

## Capacidades observadas

La sesión comunica disponibilidad de los siguientes identificadores para trabajo delegado:

- `gpt-6.1-sol`: codificación y trabajo general; razonamiento de bajo a ultra.
- `gpt-6-astra`: tareas de máxima complejidad; razonamiento de bajo a ultra.
- `gpt-6-sol`: codificación general de generación anterior; razonamiento de bajo a ultra.
- `gpt-6-luna`: tareas rápidas y rutinarias; razonamiento de bajo a máximo.
- `gpt-5.6-sol`: modelo anterior para codificación; razonamiento de bajo a ultra.

El identificador exacto del orquestador activo, su nivel de razonamiento y el coste de esta sesión no están expuestos por el entorno. No se registran estimaciones como si fueran datos observados.

## Aplicación en F0-01

F0-01 es un cambio rutinario y acotado. Se ejecutó de forma secuencial con el orquestador activo, sin delegación. Para futuras tareas se seleccionará el modelo más rápido compatible con cambios rutinarios y el modelo de codificación más capaz disponible, con razonamiento alto, para arquitectura, seguridad, OAuth, migraciones o RLS.

Esta lista debe volver a verificarse al iniciar una sesión relevante; no constituye una garantía permanente de disponibilidad, precio o límites.
