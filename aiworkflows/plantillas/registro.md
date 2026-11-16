# Registro de construcción — <nombre del plan>

<!-- PLANTILLA de aiWorkflows. Va al lado del plan, como <plan>.registro.md. -->

> **Plan:** `<ruta del plan>` · **Spec:** `<ruta>` · **Rama:** `<tipo>/<TICKET>-<slug>` (worktree `<carpeta>`, ficha `docs/ramas/<tipo>--<TICKET>-<slug>.md`).
>
> Este archivo es el **traspaso** entre herramientas y entre sesiones: quien retoma lee esto y
> `git log` primero, no su memoria. Una línea por tarea cerrada; las decisiones con su costo; lo
> diferido con su motivo. Se actualiza **al cerrar cada tarea**.

## Estado

| Tarea | Estado | Construye · revisa (modelo y por qué) | Commits | Revisión |
| --- | --- | --- | --- | --- |
| 1 | pendiente | | | |
| 2 | pendiente | | | |

Formato al cerrar: `completa · sonnet · sonnet (pantalla) · a1b2c3d..e4f5g6h · aprobada con menores: 0 errores del constructor; 2 arreglados (ronda 1, <commit>: …)`.

**El modelo de cada encargo sale de la tabla de la skill aiworkflows (`SKILL.md`).** Opus construyendo o aplicando una ronda sólo con `[opus-justificado: <motivo>]`, y el motivo va en esta columna.

## Antes de construir

- <fecha>: spec y maqueta aprobados; plan escrito, probado en seco y auditado (`<commit>`).

## Gasto (medido)

Se llena **al cerrar el lote**; si queda vacío, el lote no está cerrado.

- Claude, con subagentes: la salida de `python -I <skill>/scripts/medir-agentes.py --proyecto <carpeta> --desde <fecha>`. Si marca desvíos (Opus en construir, rondas o explorar; encargos sin modelo), una línea por cada uno con su porqué.
- Retrabajo: la salida de `node <skill>/scripts/medir-retrabajo.mjs --desde <fecha> --primera-subida <sha>` (arreglos por función nueva y arreglos después de la primera subida), más a mano: rondas hasta 0 ❌ y recorridos completos repetidos.
- Recorrido («listo», regla 0): ruta de la spec del recorrido, ruta del informe y resultado (✅ / ⚠️ / ❌ por fila de la tabla de estados).

## Decisiones durante la construcción

Formato: `Decisión: <qué> — <por qué> — <qué cuesta si está mal>`.

## Diferidos

Lo que se vio y a propósito no se hizo, con el motivo. La revisión final decide cuáles entran antes del merge.
