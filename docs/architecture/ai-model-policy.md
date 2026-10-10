# Política de modelos de IA

**Verificado:** 10 de octubre de 2026

**Ámbito:** sesiones de Codex usadas hasta F2-06

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

## Aplicación en F2-01

La disponibilidad declarada no cambió. F2-01 afecta datos compartidos, privilegios y RLS, por lo que se ejecutó secuencialmente con razonamiento alto, sin delegación ni dependencias nuevas. El entorno sigue sin exponer el identificador exacto, nivel de razonamiento o coste del orquestador activo.

## Aplicación en F2-02

La disponibilidad declarada no cambió. F2-02 afecta datos compartidos, restricciones y RLS, por lo que se ejecutó secuencialmente con razonamiento alto, sin delegación ni dependencias nuevas. El entorno sigue sin exponer el identificador exacto, nivel de razonamiento o coste del orquestador activo.

## Aplicación en F2-03

La disponibilidad declarada no cambió. F2-03 combina integridad jerárquica, RLS y un cambio visual transversal, por lo que se ejecutó secuencialmente con razonamiento alto. Se usó la herramienta integrada de generación de imágenes únicamente para crear una cabecera original; no se añadieron dependencias ni credenciales.

## Aplicación en F2-04

La sesión volvió a declarar los mismos modelos delegables. F2-04 afecta integridad relacional, acciones de servidor y UI recursiva, por lo que se ejecutó secuencialmente con razonamiento alto y sin dependencias nuevas. El identificador exacto, nivel de razonamiento y coste del orquestador activo siguen sin estar expuestos por el entorno.

## Aplicación en F2-05

La sesión volvió a declarar los mismos modelos delegables. F2-05 incorpora jerarquía recursiva, snapshots inmutables, restauración y RLS, por lo que se ejecutó secuencialmente con razonamiento alto y sin dependencias nuevas. El identificador exacto, nivel de razonamiento y coste del orquestador activo siguen sin estar expuestos por el entorno.

## Aplicación en F2-06

La sesión volvió a declarar los mismos modelos delegables y no expuso el identificador exacto del orquestador. F2-06 afecta contenido persistido, renderizado de texto enriquecido y superficie XSS, por lo que se ejecutó secuencialmente con razonamiento alto. Se verificó la compatibilidad declarada de Tiptap 3.31.4 con React 19 y la configuración SSR recomendada para Next.js antes de fijar las dependencias.
