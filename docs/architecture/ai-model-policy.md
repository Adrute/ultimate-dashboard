# Política de modelos de IA

**Verificado:** 9 de octubre de 2026

**Ámbito:** sesiones de Codex usadas hasta F1-03

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

## Aplicación en F0-04

La sesión volvió a comunicar los mismos identificadores el 8 de octubre de 2026. F0-04 afecta esquema, autorización y RLS, por lo que se trató como tarea sensible y se ejecutó secuencialmente con razonamiento alto. El entorno siguió sin exponer el identificador exacto ni el coste del orquestador activo; no se atribuye la ejecución a uno de los modelos delegables sin evidencia.

## Aplicación en F0-05

La disponibilidad declarada no cambió. La ampliación de pruebas de aislamiento y CI se ejecutó secuencialmente, sin delegación. El identificador, nivel de razonamiento y coste del orquestador activo continúan sin estar expuestos por el entorno.

## Aplicación en F0-06

La disponibilidad declarada no cambió. F0-06 combina UI accesible, acciones de servidor, persistencia y RLS, y se ejecutó secuencialmente sin delegación ni dependencias nuevas. El entorno continúa sin exponer el identificador exacto, razonamiento o coste del orquestador activo.

## Aplicación en F0-07

La disponibilidad declarada no cambió. F0-07 es documentación operativa rutinaria y se ejecutó secuencialmente, sin delegación ni cambios de dependencias. El entorno continúa sin exponer el identificador exacto, razonamiento o coste del orquestador activo.

## Aplicación en F1-01

La disponibilidad declarada no cambió. F1-01 afecta esquema multiusuario, privilegios y RLS, por lo que se trató como cambio sensible y se ejecutó secuencialmente con razonamiento alto, sin delegación ni dependencias nuevas. El entorno sigue sin exponer el identificador exacto, nivel de razonamiento o coste del orquestador activo.

## Aplicación en F1-02

La disponibilidad declarada no cambió. F1-02 incorpora una consulta SQL sujeta a RLS y se ejecutó secuencialmente con razonamiento alto, sin delegación ni dependencias nuevas. El entorno sigue sin exponer el identificador exacto, nivel de razonamiento o coste del orquestador activo.

## Aplicación en F1-03

La disponibilidad declarada no cambió. F1-03 es un cambio acotado de plataforma web y se ejecutó secuencialmente, sin delegación ni dependencias nuevas. La política offline se revisó con especial atención a no cachear datos privados. El entorno sigue sin exponer el identificador exacto, nivel de razonamiento o coste del orquestador activo.
