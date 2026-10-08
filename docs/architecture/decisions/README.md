# Registro de decisiones de arquitectura

Los ADR documentan decisiones que afectan límites de dominio, datos, autorización, dependencias, integraciones u operación. No sustituyen a `MASTER_SPEC.md`: explican cómo se implementa una decisión aprobada y sus consecuencias.

## Convención

1. Copia `ADR-0000-template.md` como `ADR-NNNN-titulo-breve.md`.
2. Usa el siguiente número disponible y no lo reutilices.
3. Empieza con estado `Propuesto` y fecha ISO `AAAA-MM-DD`.
4. Cambia a `Aceptado`, `Rechazado` o `Sustituido` tras la decisión humana correspondiente.
5. No reescribas una decisión aceptada para alterar su significado. Crea otro ADR y enlázalo desde `Sustituye`/`Sustituido por`.
6. Enlaza el ADR desde el pull request que lo incorpora.

## Índice

Todavía no hay decisiones formalizadas como ADR. Las decisiones aprobadas actuales permanecen en `MASTER_SPEC.md` hasta que un cambio concreto requiera registrar su implementación.
