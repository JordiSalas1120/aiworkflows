---
name: aiworkflows
description: Nuestro método de desarrollo con agentes de IA (aiWorkflows), para cualquier proyecto. Úsala cuando el dueño diga «trabajá con aiWorkflows», «usá nuestro método», «releé el método», o cuando se vaya a diseñar un spec, escribir o auditar un plan de implementación, construir un plan tarea por tarea con subagentes, revisar una tarea o una rama, verificar en el navegador, cerrar un lote o medir el gasto de los agentes. También cuando haya que asegurar la calidad de un ticket antes de pasarlo a QA/cert, atacar un spec buscando huecos, armar la matriz de pruebas, cazar bugs en una revisión, depurar un bug o un rebote de QA, o escribir la guía para QA. También para crear ramas, commitear, subir (push) un spec terminado con su suite al 100 %, llevar la bitácora de ramas, abrir el PR y desplegar con buenas prácticas de DevOps. Define qué modelo (opus/sonnet/haiku) usar en cada encargo, la regla 0 de «listo», los checklists por fase, las plantillas y los scripts (anclas, medidor, ramas y puerta de push, guardia).
metadata:
  version: "2.3.0"
---

# aiWorkflows — cómo construimos software con agentes

Esta skill es la **versión operativa**: lo que se aplica en cada encargo. El porqué y los casos reales están en `references/` (una parte del método por archivo; se abre **sólo la parte que toca**, nunca todas).

`<skill>` = la carpeta de esta skill: la que contiene este `SKILL.md` (por ejemplo `~/.claude/skills/aiworkflows`, o `~/.claude-skills/aiworkflows` si se comparte entre varias cuentas con `instalar.mjs`).

## Antes del primer encargo, confirmá en una línea al dueño

«Trabajo con aiWorkflows: modelo explícito por encargo según la tabla, Opus no construye, planes uno detrás del otro, mido al cerrar.»

Si el proyecto no tiene registro de construcción ni `scripts/tarea-del-plan.sh`, seguí **Preparar un proyecto** (abajo) y **proponé** los cambios antes de commitear.

## La tabla: qué modelo para cada trabajo

Cada `Agent` lleva **`model` explícito**. Sin excepción (salvo un `fork`, que es tu misma sesión partida).

| Trabajo | `model` | Por qué |
|---|---|---|
| Escribir el spec y el plan; auditar un plan; revisión de toda la rama; revisión de diseño contra la maqueta al cerrar | `opus` | Ahí se encuentran los errores caros |
| Revisar una tarea que toca **dinero/precios, motor, permisos, multi-tenant, concurrencia, migraciones o borrado** | `opus` | Ahí aparecieron los importantes |
| Escribir la **corrección exacta** de un hallazgo que exige criterio (sin tocar código) | `opus` | El criterio lo pone Opus; la mano de obra, otro |
| Revisar una tarea de pantalla y textos; re-revisar un arreglo (del mismo nivel que la revisión original) | `sonnet` | Encontró los errores reales; Opus no agregaba |
| **Construir una tarea** cuyo plan trae el código; **aplicar una ronda** con la corrección escrita; armar una maqueta desde su brief | `sonnet` | Medido: 1 $ y 9 min por tarea contra 5 $ y 26 min con Opus |
| Re-auditar las tareas de un plan cuyas anclas se rompieron (regla 3) | `sonnet` | Es verificar contra el código, no diseñar |
| Revisar la maqueta en el navegador contra el brief; juzgar las diferencias de un recorrido; escribir la spec del recorrido desde la tabla de estados | `sonnet` | Mirar o traducir contra una lista no es diseño |
| **Explorar**: «¿dónde está X?», quién usa Y, mapear un área, `graphify affected` | `haiku` | Sólo encuentra; no decide |
| **Correr suites** y devolver la lista de rojos comparada con la base, a un archivo | `haiku` | Mecánico, y el resultado se verifica solo |
| **Recorrer pantallas con una lista fija** (tabla de estados × roles) y juntar capturas (1440 px, claro y oscuro, consola) para que Sonnet juzgue | `haiku` | Juntar evidencia no es juzgarla |
| **Resumir** un informe, un log o una salida larga en ≤ 15 líneas + la ruta | `haiku` | Así el orquestador no relee lo pesado |
| ¿La tarea es idéntica al plan? ¿Las anclas del plan siguen aplicando? | **script**, sin modelo | `fidelidad-tarea.mjs`, `anclas-del-plan.mjs` |

**Nunca:** Haiku revisa, audita, decide o escribe código del producto. Opus construye, transcribe, aplica correcciones escritas, explora, corre suites o junta capturas.

### Los agentes del método (`subagent_type`)

Cada fila tiene su agente en `<skill>/agentes/`, enlazado en cada cuenta como `agents/`. Se usa **el agente y además el `model` explícito**:

| Encargo | `subagent_type` | `model` |
|---|---|---|
| Construir · aplicar ronda | `aiw-implementador` | sonnet |
| Revisar pantalla y textos · re-revisar | `aiw-revisor` | sonnet |
| Revisar lo crítico · revisión de rama · diseño al cerrar | `aiw-revisor-critico` | opus |
| Atacar spec · auditar plan · escribir corrección | `aiw-auditor` | opus |
| Bug o rebote de QA | `aiw-depurador` | sonnet (opus si toca plata, estado o concurrencia) |
| Recorrido de la matriz y exploratoria | `aiw-probador-qa` | sonnet |
| Maqueta | `aiw-maquetador` | sonnet |
| Explorar · suites · capturas · resumir | `aiw-explorador` · `aiw-suites` · `aiw-capturas` · `aiw-resumidor` | haiku |

El agente trae lo fijo del rol; el encargo (`plantillas/encargos.md`), lo concreto. Para mejorar un rol, se edita su archivo. Con herdr, el **taller** abre el orquestador, el constructor y las pruebas en paneles visibles: ver `references/26-herdr-el-taller.md`.

**Si de verdad hace falta Opus fuera de su fila** (la tarea viene en prosa y hay que diseñar, el plan no alcanza y hay que reconciliarlo con código que cambió, o un arreglo no convergió en 2 rondas): el prompt lleva `[opus-justificado: <motivo concreto>]` y el registro, la misma línea. Si la guardia está instalada, eso la deja pasar.

## Regla 0 · «Listo» tiene una definición

**No se dice «listo», «terminado» ni «para producción» sin el informe de un recorrido en el navegador: la tabla de estados × roles, con los usuarios de prueba sembrados, en el entorno de verificación, con 0 ❌.** Sin él, lo máximo que se dice es «construido, falta verificar».

- La lista sale de la tabla de estados del spec (`plantillas/tabla-de-estados.md`); los usuarios, de un script idempotente (`plantillas/sembrar-usuarios-de-prueba.md`).
- El recorrido es una **spec del repo, parte del PR** (`plantillas/recorrido-de-pantallas.md`). Después se repite la spec y se recorre a mano **sólo lo que cambió**.
- Los tests verdes no reemplazan esto: con miles de tests en verde, el navegador igual encontró de 6 a 25 defectos por funcionalidad.

## Regla 0-bis · Ningún ticket pasa a cert sin su puerta

**La meta es que QA lo pase en el primer intento.** Antes de pasar un ticket a QA/cert, la **puerta de cert** (`references/24-qa-senior-que-cert-no-lo-devuelva.md`, 24.10) tiene que estar completa y su informe en el registro:

- ataque al spec hecho, sin bloqueantes abiertos;
- **matriz de pruebas con 0 ❌ en dev**, no sólo en local;
- diferencias de entorno chequeadas en cert;
- cada test de regresión **rojo sin el arreglo** (`scripts/rojo-sin-arreglo.mjs`);
- revisión con caza de bugs, sin Confirmados abiertos;
- sesión exploratoria hecha;
- **ningún «riesgo aceptado» sin la firma del dueño**;
- guía para QA que afirma **sólo lo verificado**.

Las cuatro herramientas de un QA senior, cada una en su momento:

1. **Atacar el spec** antes del plan: los 9 pasos más el pre-mortem «QA lo devolvió porque…» (24.2).
2. **Matriz de pruebas** con particiones, bordes, tabla de decisión, transiciones y entornos. El esperado es **lo que ve la persona**, no el estado interno (24.3, `plantillas/matriz-de-pruebas.md`).
3. **Caza de bugs** en cada revisión: leer más allá del diff, escribir el escenario de falla, separar Confirmado, Plausible y Descartado, y auditar antes de concluir (24.4, 24.5).
4. **Depurar sin adivinar:** causa raíz primero, una hipótesis por vez, test rojo, un solo arreglo; con 3 arreglos fallidos se discute el diseño (24.6).

Todo esto entra **en los encargos que ya existen** (24.13), sin sumar agentes. En un **rebote de QA**, sólo se depura lo reportado, con alcance mínimo.

## Antes de construir y al entregar, siete cosas

1. **Alcance escrito, con SÍ y NO** (método 1.11). Las auditorías se hacen contra él.
2. **Todas las preguntas de producto en un lote, al inicio, una por una y con recomendación** (3.2). Lo que define quién puede qué, qué se bloquea o cuántas firmas hacen falta **no se construye «provisional»** (6.9).
3. **Tabla de estados + una función única** que calcula el estado visible + un test que recorre la tabla (3.5).
4. **Maqueta mapeada a tokens del tema** (3.3) y **trinquete** contra colores, alturas y roles fijos (`scripts/trinquete.mjs`, método 13). Los tests no afirman clases de color.
5. **Usuarios de prueba sembrados** antes de cada recorrido (8.3).
6. **CI y deploy chequeados antes del lote**; si no andan, el deploy manual documentado es el oficial y se dice al empezar (9.1).
7. **Cada guía o resumen para el dueño trae el enlace directo y el entorno** (10.3, 16).

## Las 10 reglas

1. **Modelo explícito en cada encargo**, por la tabla, con una línea en el registro: `Tarea N · construye: sonnet · revisa: opus (permisos)`.
2. **Opus no construye ni aplica.** Tampoco el orquestador: no arregla él mismo (6.10). Construye Sonnet; Opus revisa, audita y escribe correcciones.
3. **Planes uno detrás del otro, y sin re-planificar** (5.5). El plan N+1 con código se escribe recién cuando el N está construido. Si el código se movió debajo de un plan: `node <skill>/scripts/anclas-del-plan.mjs <plan> <punta>` y se re-auditan con `sonnet` **sólo las tareas ✘**. Re-planificar entero sólo si cambió el diseño, con `[opus-justificado]`.
4. **El plan en formato de anclas** (18.2): `**Crear**`/`**Modificar**`/`**Borrar**` con bloques `Buscar:` / `Reemplazar por:`. Un plan en prosa no lo verifica ningún script y obliga a construir con Opus.
5. **El orquestador no lee lo pesado.** Diffs, salidas de suites, logs, informes y planes enteros van a un archivo; un `haiku` devuelve el resumen. Cada agente lee **su** tarea (`tarea-del-plan.sh`), nunca el plan entero. **Un informe de agente ocupa una página como máximo**; la memoria de un frente, 3 KB.
6. **Una sesión de orquestador por lote.** Al cerrar un lote (o pasando ~150 turnos), sesión nueva; el traspaso es el registro y `git log`, no la conversación.
7. **En paralelo lo independiente.** Revisar N mientras se construye N+1 (6.5); `haiku` explorando mientras `opus` audita. Un solo agente escribe a la vez en el mismo árbol. **Máximo 3 agentes vivos (contando los paneles de Claude en herdr) y nunca dos suites completas a la vez.** En un ticket, **4 subagentes en total como tope**: construir, revisar todo junto, una ronda con su verificación y el recorrido. Las suites las corre el orquestador. Para un quinto, se pregunta antes.
8. **El esfuerzo, por rol.** Orquestador: `/effort high` mientras planifica o audita, `medium` mientras despacha y espera. Una sesión de Claude que construye aparte: `/model sonnet` + `/effort medium`; para rondas, `high`.
9. **Medir cada lote al cerrar**: `python -I <skill>/scripts/medir-agentes.py --proyecto <carpeta> --desde <fecha>` (lee `CLAUDE_CONFIG_DIR`; con varias cuentas, pasá `--config <carpeta-de-config>` por cada una) → a «Gasto (medido)» del registro, con los desvíos explicados. Y el retrabajo: `node <skill>/scripts/medir-retrabajo.mjs --desde <fecha>`.
10. **Lo que no se toca nunca, con ningún modelo:** la revisión independiente de cada tarea, la re-revisión de cada arreglo, la suite completa (al cerrar una fase o al integrar; en las rondas, los tests de lo tocado), el recorrido en el navegador (regla 0), la auditoría del plan, la revisión de la rama y la puerta de cert (regla 0-bis). Se ahorra en **quién** hace cada cosa, no en **qué** se hace.

Y siempre: **nada sale de la máquina sin el «sí» del dueño** (merge, deploy, borrar ramas, push forzado). **La única excepción es el push de la rama de trabajo de un spec terminado**, cuando el `CLAUDE.md` del proyecto lo autoriza por escrito (27.9) y pasa la puerta de push. La IA no decide lo del negocio: presenta opciones, recomienda y el dueño decide.

## Regla 0-ter · Cada spec terminado se sube a su rama, con su ficha

**Spec terminado = rama subida.** Un spec cuya suite completa está al 100 % verde, con la revisión de rama aprobada y el recorrido en local en 0 ❌, no se queda en la máquina: se sube a su rama para revisarlo en dev (`references/27-git-ramas-y-bitacora.md`).

- **Una rama por spec**, con nombre `<tipo>/<TICKET>-<slug>`, desde la base del remoto y en su worktree: `node <skill>/scripts/ramas.mjs nueva feat/ABC-123-alta --que "…" --spec <ruta> --worktree <dir>`. Crea también su **ficha** en `docs/ramas/` (la bitácora).
- **Commits por alcance** (27.3): cada tarea, un commit local (implementador); cada ronda, un commit encima; **el spec completo, push + PR borrador**, sólo con la puerta: `node <skill>/scripts/ramas.mjs subir --test "<suite completa>" --pr`. La puerta frena con el árbol sucio, la rama detrás de su base, secretos o `.env` en el diff, o la suite en rojo.
- **Commits convencionales:** `feat(ABC-123): <qué>` + el porqué en el cuerpo; nunca `--no-verify`.
- **Bitácora:** al empezar la sesión, `node <skill>/scripts/ramas.mjs bitacora` (qué ramas hay, de qué spec, en qué estado y en qué entorno); al pasar de entorno, `ramas.mjs estado "en dev" --entorno dev`.
- **Sin el bloque «Git y despliegue» en el `CLAUDE.md` del proyecto** (`plantillas/claude-md-git-devops.md`), se pregunta **una vez** al cerrar el spec y se ofrece dejarlo escrito.
- **Desplegar siempre igual** (`references/28-devops-desplegar-bien.md`): un artefacto promovido de dev a prod, CI con las mismas etapas y el mismo comando que la puerta, migraciones compatibles hacia atrás, **vuelta atrás escrita antes de subir**, checklist (`plantillas/checklist-de-despliegue.md`) y una línea en `docs/DESPLIEGUES.md` por despliegue.

## Recursos y presupuesto: no se abren subagentes a lo loco

Un flujo continuo no se cae por memoria ni por CPU. Esto lo hacen cumplir un medidor y la guardia, no la buena voluntad (`references/25-recursos-y-presupuesto.md`):

- **Presupuesto del ticket:** **4 subagentes** (construir, revisar todo junto, una ronda con su verificación y el recorrido), anotados en el registro al empezar. Para un quinto: el «sí» del dueño y `[sobre-tope: <motivo>]`. **Seguir con un agente vivo por `SendMessage` no cuenta.** Lo mecánico (suites, scripts) lo hace el orquestador.
- **Semáforo:** `node <skill>/scripts/recursos.mjs`.
  - 🟢 hasta 3 agentes vivos y 1 suite.
  - 🟡 un agente en primer plano y suites con pocos workers.
  - 🔴 nada nuevo.
- **Sobrantes:** antes de empezar y al cerrar cada tarea, `recursos.mjs` marca huérfanos, suites colgadas y navegadores de prueba sin dueño, y `--cerrar-sobrantes` los cierra. Nunca cierra una sesión de Claude. Lo que uno lanza en segundo plano se anota con su PID y se cierra al terminar.
- **Una sola suite a la vez:** la guardia frena la segunda.

## Antes de cada `Agent`, cuatro preguntas

1. ¿Qué fila de la tabla es? → ese `model`.
2. ¿Hace falta un agente **nuevo**? ¿No lo puede seguir uno vivo (`SendMessage`) o hacerlo yo con un script? ¿Queda presupuesto del ticket y el semáforo no está en rojo?
3. ¿Le paso sólo lo que necesita? (la ruta de su tarea, lo que dejaron las anteriores, dónde escribir el informe; nunca el historial — 15.4)
4. ¿Lo anoté en el registro con su modelo, **y la descripción empieza con la clave del ticket** (`ABC-123 · revisar`)?

Los encargos listos para copiar (implementador, ronda, re-revisión, revisor, re-auditoría, rama final, diseño, maqueta y los ayudantes `haiku`) están en `plantillas/encargos.md`.

## Qué parte del método abrir en cada fase

Leé `references/02-el-ciclo-completo-de-un.md` para el mapa del ciclo y `references/19-checklists-rapidos.md` para el checklist de la fase en curso. Después, sólo lo que toca:

| Fase / necesidad | Referencia |
|---|---|
| Principios (calidad, medir, regla no parche, tipos de problema) | `references/01-los-principios.md` |
| 1 · Entender y diseñar: preguntas, maqueta, spec, tabla de estados | `references/03-fase-1-entender-y-disenar.md` |
| 2 · Escribir el plan por tareas | `references/04-fase-2-el-plan-de.md` + `references/18-plantillas.md` (18.2, tarea en formato de anclas) |
| 3 · Auditar el plan; re-auditar sólo anclas rotas | `references/05-fase-3-auditar-el-plan.md` |
| 4 · Construir: TDD, implementador + revisor, orden, registro, ciclo de arreglos | `references/06-fase-4-construir-tarea-por.md` |
| 5 · Revisión final de la rama | `references/07-fase-5-revision-final.md` |
| 6 · Verificar en el navegador, seguir el dato, sesiones y permisos | `references/08-fase-6-verificar-en-el.md` |
| 7 · Desplegar (entornos, puertas, secretos) | `references/09-fase-7-desplegar.md` + **`references/28-devops-desplegar-bien.md`** (CI, CD, migraciones, vuelta atrás, observabilidad, bitácora de despliegues) |
| **Git:** ramas, commits, cuándo commitear y cuándo subir, puerta de push, bitácora de ramas, PR, tags, lo que frena la guardia | `references/27-git-ramas-y-bitacora.md` |
| 8 · Cerrar: nota del porqué, guía de prueba para el dueño | `references/10-fase-8-cerrar-y-dejar.md` |
| Pruebas en detalle (niveles, trampas, e2e, mutaciones) | `references/11-las-pruebas-en-detalle.md` |
| **Recursos y presupuesto:** tope de subagentes, semáforo, sobrantes, ciclo sin caídas, guardia | `references/25-recursos-y-presupuesto.md` |
| **QA senior:** ataque al spec, matriz, caza de bugs, seguridad mínima, depurar, evidencia, exploratoria, puerta de cert, guía para QA | `references/24-qa-senior-que-cert-no-lo-devuelva.md` |
| Backend (capas, multi-tenant, migraciones, concurrencia, permisos, jobs) | `references/12-el-backend-patrones-que-usamos.md` |
| Frontend (lo que no se negocia, trinquete) | `references/13-el-frontend-lo-que-no.md` |
| Definición de terminado, qué se mide, qué dejar de hacer | `references/14-como-controlamos-cada-cosa.md` |
| Agentes: roles, encargos, tokens, elección de modelo, lo medido (15.8) | `references/15-trabajar-con-agentes-de-ia.md` |
| Comunicación con el dueño | `references/16-comunicacion-con-el-dueno-del.md` |
| Lecciones: qué pasó → qué regla quedó | `references/17-lecciones-aprendidas-que-paso-que.md` |
| Construir un agente conversacional con LLM | `references/20-agentes-conversacionales-el-codigo-conduce.md` |
| Qué se puede recortar y qué no | `references/21-que-se-puede-recortar-y.md` |
| Lotes y tareas en archivos: nombres y carpetas | `references/23-lotes-y-tareas-en-archivos.md` |
| **Agentes `aiw-*` y el taller en herdr:** qué agente para cada encargo, abrir el taller, darle trabajo al constructor, presupuesto con paneles | `references/26-herdr-el-taller.md` |

Para una sección puntual, buscala por su número (por ejemplo `### 6.10`) en vez de leer el archivo entero.

## Plantillas y scripts

| Plantilla (`<skill>/plantillas/`) | Para qué |
|---|---|
| `encargos.md` | Los prompts de cada encargo, listos para copiar |
| `registro.md` | El registro de construcción, al lado del plan (`<plan>.registro.md`) |
| `tabla-de-estados.md` | Estados × roles del spec, con la función única |
| `sembrar-usuarios-de-prueba.md` | El script idempotente de usuarios para el recorrido |
| `recorrido-de-pantallas.md` | El recorrido como spec del repo (regla 0) |
| `matriz-de-pruebas.md` | Ataque al spec, técnicas de diseño, matriz de entornos, casos, exploratoria y puerta de cert (24) |
| `guia-para-qa.md` | El comentario de Jira para QA y el formato de reporte de bug (24.11, 24.12) |
| `claude-md-git-devops.md` | El bloque «Git y despliegue» para el `CLAUDE.md` del proyecto: la autorización escrita del push de ramas (27.9) |
| `pull-request.md` | El cuerpo del PR; se copia a `.github/pull_request_template.md` (27.6) |
| `ci-github-actions.yml` | El CI con las etapas de 28.2 y el CD a dev |
| `checklist-de-despliegue.md` | Antes, durante y después de cada despliegue, con la vuelta atrás (28.6) |
| `bitacora-de-despliegues.md` | `docs/DESPLIEGUES.md`: qué hay en cada entorno y desde cuándo (28.10) |

| Script (`<skill>/scripts/`) | Uso |
|---|---|
| `tarea-del-plan.sh` | `bash scripts/tarea-del-plan.sh <N> <plan.md>` — se copia a `scripts/` del proyecto |
| `anclas-del-plan.mjs` | `node <skill>/scripts/anclas-del-plan.mjs <plan.md> <ref> [--desde N] [repo]` — qué tareas dejaron de aplicar |
| `fidelidad-tarea.mjs` | `node <skill>/scripts/fidelidad-tarea.mjs <plan.md> <N> <base> <commit> [repo]` — ¿idéntica al plan? |
| `medir-agentes.py` | `python -I <skill>/scripts/medir-agentes.py --proyecto <carpeta> --desde <fecha> [--config <dir>]` |
| `medir-retrabajo.mjs` | `node <skill>/scripts/medir-retrabajo.mjs --desde <fecha> [--primera-subida <sha>]` |
| `trinquete.mjs` | `node <skill>/scripts/trinquete.mjs --config trinquete.config.json [--fijar]` (ejemplo: `trinquete.config.ejemplo.json`) |
| `ramas.mjs` | `node <skill>/scripts/ramas.mjs nueva <tipo>/<TICKET>-<slug> [--base X] [--que …] [--spec …] [--worktree <dir>]` · `subir --test "<cmd>" [--pr] [--seco]` · `puerta` · `estado <estado> [--entorno …] [--pr …]` · `bitacora [--escribir]`: ramas con nombre fijo, ficha por rama, puerta de push y bitácora de todas las ramas (27) |
| `guardia-de-modelos.mjs` | Hook `PreToolUse` sobre `Agent`: frena encargos sin `model`, Opus construyendo/explorando y Haiku revisando. Sobre Bash/PowerShell: push a ramas protegidas, `--force` sin lease, borrar ramas remotas y `--no-verify` (27.10) |
| `recursos.mjs` | `node <skill>/scripts/recursos.mjs [--json] [--cerrar-sobrantes \| --cerrar <pid,…>]`: semáforo de RAM, CPU y disco, procesos de desarrollo abiertos y sobrantes. Salida 0 verde · 1 amarillo · 2 rojo (25) |
| `../herdr/aiw-taller.ps1` | `& <skill>/herdr/aiw-taller.ps1 -Ticket <ABC-123> [-Proyecto <ruta>] [-Cuenta <config>] [-SinConstructor]`, o `ctrl+b alt+a` dentro de herdr: abre el taller del ticket (26) |
| `rojo-sin-arreglo.mjs` | `node <skill>/scripts/rojo-sin-arreglo.mjs --base <ref-sin-arreglo> --test "<cmd de los tests nuevos>" [--enlazar node_modules,.venv,.env]`: en un worktree temporal comprueba VERDE con el arreglo y ROJO sin él. Salida 0 = protege · 1 = NO protege · 2 = entorno (24.7) |

## Preparar un proyecto (una vez, proponiéndoselo al dueño)

- [ ] **`CLAUDE.md`** en la raíz con comandos, arquitectura, convenciones y la línea: «Para trabajar con agentes, usá la skill aiworkflows y aplicala en cada encargo.»
- [ ] `scripts/tarea-del-plan.sh` copiado desde `<skill>/scripts/`; en `.gitattributes`: `*.sh text eol=lf`.
- [ ] Hook de pre-commit (formato y tipos) y comprobado: un commit de prueba y ver su salida.
- [ ] `tmp/` en `.git/info/exclude` del worktree.
- [ ] Mapa del código, si hay graphify: `graphify extract . --code-only` y `graphify hook install`.
- [ ] Dónde se documenta el porqué (vault, `docs/decisiones/`), con numeración.
- [ ] Si hay pantallas con estados: trinquete configurado (copiar `trinquete.mjs` y su config de ejemplo) y la tabla de estados en el spec.
- [ ] **Git y DevOps** (27, 28.11): bloque «Git y despliegue» en el `CLAUDE.md` con la autorización del push de ramas; `aiw.config.json` con base y suite; protección de `main`/`develop` en el remoto; CI con el mismo comando que la puerta; plantilla de PR; `docs/ramas/`, `docs/DESPLIEGUES.md` y `CHANGELOG.md`.

Por cada trabajo grande: alcance escrito → **ataque al spec + matriz de pruebas** → spec y maqueta aprobados → plan con código, auditado → worktree → registro (`plantillas/registro.md`) → construir tarea por tarea → revisión de rama con caza de bugs + diseño + recorrido de la matriz y exploratoria (regla 0) → **`ramas.mjs subir --test … --pr`** (regla 0-ter: push de la rama + PR borrador + ficha) → merge a dev según el `CLAUDE.md` → recorrido en dev → **puerta de cert** (regla 0-bis) + guía para QA → nota del porqué → medir el lote.

Por cada **rebote de QA**: leer el comentario completo → reproducir → causa raíz (24.6) → mostrar al dueño la causa y la corrección → test rojo → un arreglo → `rojo-sin-arreglo.mjs` → re-correr el caso del rebote y los casos de la matriz de ese camino → guía para QA actualizada.

## La guardia (recomendada, por cuenta)

Hace cumplir la tabla de modelos, el **tope de subagentes por ticket**, el **semáforo de recursos**, **una suite a la vez** y las **reglas de git** (nada de push a ramas protegidas, `--force` sin lease ni `--no-verify`; 27.10). Se instala en `hooks.PreToolUse` del `settings.json` de cada carpeta de configuración, con el dueño de acuerdo:

```json
{ "matcher": "Agent|Task|Bash|PowerShell", "hooks": [{ "type": "command", "command": "node \"<skill>/scripts/guardia-de-modelos.mjs\"", "timeout": 15 }] }
```

`node <skill>/instalar.mjs --guardia` lo hace en todas las cuentas (y `node <skill>/instalar.mjs` sólo enlaza la skill en las cuentas nuevas). Cada encargo queda en `<config>/metrics/encargos.jsonl`. Si te frena, no la esquives: corregí el encargo o justificalo con `[opus-justificado: …]`.
