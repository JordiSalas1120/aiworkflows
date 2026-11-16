## 15. Trabajar con agentes de IA

### 15.1 Roles

| Rol | Qué hace | Qué modelo |
|---|---|---|
| **Orquestador** (la sesión principal) | Entiende, planifica, reparte, integra, conversa con el dueño | El más capaz |
| **Auditores** | Revisan un plan contra el código, en paralelo por grupos de tareas | Capaz |
| **Auditor previo** | La pasada rápida antes de construir, en paralelo con la primera tarea (5.4) | El más capaz |
| **Implementador** | Construye una tarea con TDD | El más barato **sólo** si el plan trae el código completo y es transcribir; si tiene que juzgar o integrar, capaz; si toca varias áreas o reglas del negocio, el más capaz |
| **Revisor por tarea** | Lee el diff y busca defectos | Escalado al cambio (6.3): nivel medio como piso, el más capaz si toca plata, concurrencia, permisos o datos |
| **Re-revisor** | Verifica un arreglo y nada más | Nivel medio |
| **Implementador de la ronda 4 o 5** | Toma una tarea que no convergió | Un nivel más que el anterior |
| **Revisor final** | Revisa la rama entera y clasifica el registro | El más capaz |
| **Exploradores** | Búsquedas amplias en el código | **Haiku** (15.8) |
| **Ayudantes mecánicos** | Correr suites y comparar la lista de rojos, juntar capturas con una lista fija, resumir informes y logs | **Haiku** (nunca revisa ni decide) |

⚖️ **Las vueltas pesan más que el precio.** Un modelo barato que tarda el triple de vueltas cuesta más en total. El nivel medio es el piso para revisar y para implementar desde una descripción.

### 15.2 Reglas

- **Cada subagente recibe todo el contexto que necesita** en su instrucción: no sabe lo que se habló en la sesión.
- **Lo que un agente dice se verifica.** "Los tests pasan" se confirma corriéndolos; "no hay otros usos" se confirma buscando.
- **Verificar que el agente tenga los permisos** que la tarea requiere antes de delegarle (escribir archivos, correr comandos).
- **Sesiones nuevas cuando el contexto crece mucho:** trabajan mejor. Por eso importa dejar la memoria y las notas al día.
- **Varias sesiones en paralelo:** cada una en su worktree, con el registro de quién toca qué.
- **La IA no decide lo del negocio.** Presenta opciones y recomienda; el dueño decide.
- **La IA no despliega a producción ni hace push sin orden**, ni lo ofrece por su cuenta. La única excepción es subir la rama de trabajo de un spec terminado, con la puerta y si el `CLAUDE.md` del proyecto lo autoriza por escrito (27.9). Los subagentes nunca suben: sube el orquestador.

### 15.3 La memoria de la IA

Se guarda lo que no está en el código ni en el historial:

- cómo le gusta trabajar al equipo (correcciones y enfoques confirmados, con el porqué);
- dónde quedó cada frente y qué sigue;
- las trampas del entorno (comandos que no andan en Windows, puertos, credenciales, qué base es cuál);
- las reglas del negocio que cuestan redescubrir.

Lo que ya está en el código, en git o en las notas del vault **no se duplica en la memoria**.

**Corta** (E10): la memoria de un frente ocupa **3 KB como máximo** (estado actual y punteros); la historia va al vault. Un **informe de agente** ocupa **una página** como máximo. Lo largo va en un anexo que nadie está obligado a leer.

### 15.4 Cómo se le encarga una tarea a un agente

Todo lo que se le pega a un agente en su encargo, y todo lo que él devuelve, **queda en el contexto del orquestador** y se relee en cada turno. Por eso el trabajo se pasa **en archivos**:

- **El resumen de la tarea es un archivo** con el texto exacto de esa tarea sacado del plan, y es la única fuente de requisitos. El agente nunca lee el plan entero.
- **El encargo trae sólo:**
  1. una línea de dónde encaja la tarea;
  2. la ruta del resumen («leelo primero, son tus requisitos»);
  3. lo que las tareas anteriores dejaron y el resumen no puede saber (nombres, contratos);
  4. las decisiones que modifican el plan;
  5. dónde escribir el informe.
  **Nunca el historial de la sesión.** Un encargo de 42 mil caracteres, con el 99 % de historia pegada, no le sirve a nadie.
- **El informe completo va a un archivo.** El agente contesta en menos de 15 líneas: estado (hecho / hecho con dudas / bloqueado / falta contexto), commits, una línea de pruebas, dudas y la ruta del informe.
- **El revisor recibe el diff como archivo.** Commits, resumen y diff con contexto, armados desde la base anotada **antes** de la tarea. Nunca `HEAD~1`, que pierde los commits anteriores de una tarea con varios.
- **Los agentes no lanzan agentes.** Un implementador que lanza su propio revisor duplica una revisión que igual se va a hacer, y su aprobación no cuenta.
- **No se le pre-juzga al revisor:** nada de «no marques X» ni «a lo sumo es menor». Si el orquestador cree que un hallazgo es falso, lo juzga después (6.10).

### 15.5 Dónde se desperdician tokens de verdad (y dónde no)

| ❌ Desperdicio real | ✅ Parece gasto y no lo es |
|---|---|
| Pegar el historial de la sesión en cada encargo | La revisión de cada tarea, escalada al cambio |
| Que el revisor vuelva a correr la suite que el implementador ya corrió con evidencia | La auditoría previa del plan |
| Un agente por cada hallazgo en vez de una ola con la lista completa | La re-revisión acotada de cada arreglo |
| Que el orquestador lea archivos enormes o diffs enteros en vez de delegarlos | El recorrido en el navegador con lista y capturas |
| Volver a hacer tareas terminadas porque el registro no estaba en un archivo | La suite completa en cada tarea |
| Mover y blindar código que dos tareas después se tira | Romper el código a propósito en lo que toca plata o permisos |
| Esperar sin hacer nada en vez de revisar N mientras se construye N+1 | Escribir las decisiones con su costo |
| Un modelo barato que tarda el triple de vueltas | |
| **Re-planificar o re-auditar planes enteros** porque se escribieron antes de construir el anterior (13 % del gasto de subagentes, 69 min cada uno; 5.5) | |
| **Opus construyendo, aplicando rondas o explorando** (en dos meses de un proyecto grande: 75 tareas, 100 rondas y 25 exploraciones; 15.8) | |
| **El modelo más capaz para todo**, también para transcribir código que el plan ya trae entero o revisar un diff de una pantalla (en un plan: 98 % del gasto en Opus; entre 30 y 40 % se podía ahorrar sin perder una sola revisión) | |

### 15.6 Elegir el modelo con criterio (decidido con Sebastián el 28-sep)

**La calidad la garantizan el plan auditado, los tests y la revisión independiente; no el modelo que escribe.** Por eso el modelo se elige por lo que la tarea exige *pensar*, no por lo importante que sea. Opus no es el valor por defecto: se usa donde hace falta juicio.

**Cómo decidir, tarea por tarea** (el orquestador lo anota en el registro junto a cada encargo, con una línea de por qué):

| Señal en la tarea | Implementador | Revisor |
|---|---|---|
| El plan trae **el código completo** (archivos nuevos enteros, buscar/reemplazar exactos, tests escritos) y la tarea es aplicarlo, correr las pruebas y verificar | **Sonnet** | Sonnet si el diff es chico (≲ 40 KB) y no toca lo de abajo; si no, Opus |
| La tarea se describe en prosa, o hay que **reconciliar el plan con código que cambió** después de escrito | Opus | Opus |
| Toca **plata, precios que se escriben, concurrencia, permisos, borrado de datos, multi-tenant o migraciones** | Opus | Opus |
| Pantalla nueva grande o flujo con estados (asistente, ficha, permisos por rol) | Opus | Opus |
| Textos, rótulos, un tipo, un test que falta | Sonnet | Sonnet |
| Re-revisión de un arreglo | — | Sonnet (Opus si el arreglo tocó lo de la fila 3) |
| Auditoría del plan, revisión final de la rama, ola de arreglos final | Opus | Opus |
| Búsquedas amplias, «¿dónde está X?» | Haiku | — |
| Correr suites, juntar capturas, resumir salidas largas | Haiku | — (lo que junta lo juzga Sonnet u Opus) |

**Las barandas para que un modelo más barato no escriba código suelto** (van en cada encargo a Sonnet, y el revisor las verifica):

1. **Sólo con brief completo.** Sonnet implementa únicamente si el resumen de la tarea trae el código, los nombres, la estructura de archivos y los tests. Si el brief tiene huecos, el implementador **para y contesta «falta contexto» o «bloqueado»**; no rellena por su cuenta. Improvisar diseño es motivo de re-hacer la tarea con Opus.
2. **Nada fuera del plan.** Ningún archivo, export, prop, helper o dependencia que el plan no nombre. Si ve que falta algo, lo reporta como duda; no lo agrega.
3. **Estructura del plan, patrones de la casa.** Mismos nombres, misma ubicación, `mensajeDeError`, `usePedidoConEspera`, `hrefDeLaEmpresa`, `tenantId` en toda consulta; nada de copiar lógica que ya existe en una función.
4. **TDD con evidencia** (rojo y verde, con el comando y la salida) y la suite completa antes del último commit.
5. **Autorrevisión antes de informar:** código muerto, imports sin uso, `any`, comentarios que mienten, textos prohibidos.
6. **El revisor mira además «código suelto»:** exports o archivos sin consumidor, lógica duplicada, algo que no está en la estructura del plan, tests que no pueden fallar. Cualquiera de esos es **Importante**, no menor.
7. **Escalada automática:** si una tarea de Sonnet vuelve con un Importante de diseño (no de texto), el arreglo lo hace Opus; si no converge en 2 rondas, la toma Opus desde el informe.

**Lo que no cambia con ningún modelo:** la revisión de cada tarea, la re-revisión de cada arreglo, la suite completa, el navegador y la revisión final.

**El navegador, por hito y no por cada tarea:** en toda tarea que cambia una pantalla de verdad, y un recorrido completo cada 2 o 3 tareas y al cerrar el plan. Las tareas de texto o de tipos se ven en el recorrido siguiente.

**El registro de hallazgos se endurece solo** (idea tomada de [dev-workflow-kit](https://github.com/dsnger/dev-workflow-kit)): cada hallazgo de revisión se anota con su **tipo**. Si un tipo se repite en otra tarea, deja de ser una nota y sube un escalón: nota → regla de lint → tipo de TypeScript → test. Lo mecánico lo atrapa la máquina gratis; el revisor queda para lo que pide juicio. En un plan grande se repitieron: palabras prohibidas en pantalla (4 tareas), plurales armados a mano («1 productos», 4 tareas), consultas sin `tenantId` (3 tareas) y textos que prometen lo que no pasa (5 tareas). Las tres primeras son candidatas a test o lint.

**Medir cada plan:** al cerrarlo, `ecc:cost-report` y el número en su nota del vault, junto al modelo usado por encargo.

**Los planes, uno detrás del otro:** el plan N+1 se escribe entero (con el código) recién cuando el N está construido. Escribirlo antes obliga a re-auditarlo cada vez que el código cambia debajo: un plan se auditó cuatro veces.

### 15.7 El traspaso vive en el repo

Nada importante vive en la memoria de una sesión: vive en el repo. Así cualquier sesión nueva (otra cuenta, otro día, otra máquina) retoma sin perder nada.

| Pieza | Para qué |
| --- | --- |
| `CLAUDE.md` en la raíz | Comandos, arquitectura, convenciones y la línea que pide aplicar este método en cada encargo |
| `scripts/tarea-del-plan.sh <N>` | Saca una tarea entera del plan (también la `11B`) para pasársela a un subagente. En LF por `.gitattributes`: bash no corre con CRLF |
| `<plan>.registro.md` | **El traspaso.** Quien retoma lee el registro y `git log`, no su memoria (6.7) |

**Las reglas del traspaso:**

1. **Se cambia de sesión entre tareas**, nunca a mitad: todo commiteado y la línea de la tarea en el registro.
2. **Nunca dos sesiones escribiendo a la vez en el mismo worktree.**
3. **Un subagente nuevo por tarea, y por bloque dentro de una ronda.** En la misma sesión, la tarea siguiente relee todo lo anterior: una tarea leyó 18 M de caché contra 5,9 M de una de tamaño parecido en sesión nueva.
4. El navegador con el dueño y la revisión final de la rama se hacen igual, construya quien construya.

**Lo que se aprendió al separar orquestar de construir:**

- **Reparto que funcionó: el orquestador planifica y revisa, otro agente construye.** Casi todo lo que encontraron las revisiones fue «falla del plan», no del constructor. Un constructor que para y avisa cuando algo no cierra vale más que uno que improvisa.
- **Revisar en el navegador lo que es de forma.** Después de una ronda de arreglos de maquetación, 5 de 14 seguían mal o empeorados y ningún test lo veía: la verificación visual contra la maqueta se hace con capturas, a 1440 px reales.
- **El hook tiene que existir:** en un worktree nuevo, `npm ci` en la raíz antes del primer commit; sin `.husky/_` git no corre el hook y no avisa. «El pre-commit pasó» sólo si se lo vio correr.

### 15.8 Velocidad y costo: lo medido en un proyecto grande y las reglas que salen (decidido con Sebastián el 12-oct)

> **La versión operativa está en `SKILL.md`** (raíz de esta skill): la tabla y las 10 reglas que todo agente aplica en cada encargo. Acá queda el porqué, con los números.

**Qué se midió** (70 sesiones y 1.119 subagentes de un proyecto grande, seis semanas, a precio de lista de la API; con suscripción es cupo, no dinero):

| Hallazgo | Número |
|---|---|
| Quién gasta | **Subagentes 74 %**, sesión principal 26 %. El log `~/.claude/metrics/costs.jsonl` no ve a los subagentes: no sirve para medir esto |
| En qué fase se fue el gasto de subagentes | Escribir planes 27 % · **re-planificar y re-auditar 13 %** (69 min por encargo) · auditar 10 % · correcciones exactas 2 % → **planificar, 52 %**. Construir 14 %, rondas 10 %, revisar 9 %, navegador 6 % |
| Construir una tarea | Sonnet: **1 $ y 9 min** (165 tareas) · Opus: 5 $ y 26 min (75 tareas) |
| Una ronda de arreglo | Sonnet: 1,2 $ y 11 min · Opus: 3,5 $ y 23 min (100 rondas) |
| Revisar una tarea | Sonnet: 0,5 $ y 4 min · Opus: 1,8 $ y 9 min |
| Navegador y QA | Opus: 10,7 $ y **56 min** por encargo (uno, 3 h 20 min) · Sonnet: 4,8 $ y 27 min |
| Releer | La mitad del costo de los subagentes Opus fue **lectura de caché**: planes de 4 a 11 mil líneas que cada auditor y constructor cargaba entero |
| Lo que ya estaba bien | Encargos cortos (mediana 2 mil caracteres, ninguno > 9 mil); esfuerzo en `medium` el 85 % de las veces; revisar por tarea es sólo el 9 % del gasto |

**Qué pasó:** las reglas de 15.6 ya decían que Opus no construye ni aplica rondas y que los planes van uno detrás del otro. **No se cumplieron**, porque nada lo hacía cumplir y el método era demasiado largo para releerlo en cada encargo. Por eso ahora hay tres piezas:

1. **`SKILL.md`** (antes AGENTES): una página que todo agente lee primero y confirma con una línea.
2. **La guardia** (`scripts/guardia-de-modelos.mjs`, hook `PreToolUse` de `Agent` en la configuración de cada cuenta de Claude): frena un encargo sin `model`, a Opus construyendo, aplicando, explorando, corriendo suites o re-planificando sin `[opus-justificado: …]`, y a Haiku revisando. Anota cada encargo en `<config>/metrics/encargos.jsonl`. Probada contra los 1.077 encargos reales del lote medido: habría frenado 125 de Opus (construir, rondas, re-planes, mapeos), 74 sin modelo y 5 re-revisiones con Haiku, sin tocar ninguna revisión, auditoría ni plan.
3. **El medidor** (`scripts/medir-agentes.py`): al cerrar cada lote, el informe por modelo y por fase, con los desvíos, va al registro.

**Haiku 5.5 (0,10 $ / 0,50 $ por millón de tokens; Sonnet 5.5, 2 $ / 10 $; Opus 5.5, 4 $ / 20 $):** es 40 veces más barato que Opus y el más rápido, pero **sólo para lo mecánico que algo más verifica**: explorar, correr suites y devolver la lista de rojos, juntar capturas con una lista fija, resumir. Nunca revisa ni decide: sigue valiendo que *las vueltas pesan más que el precio* (15.1). Por encima de 100 mil tokens de entrada cuesta 5 veces más: rinde en encargos de contexto chico.

**Lo que más acelera no es el modelo, es el orden:** sacar los re-planes del camino crítico (5.5), que construya quien construye en 9 minutos, y que el orquestador no lea lo pesado.

**El esfuerzo, por rol:** orquestador en `high` mientras planifica o audita y en `medium` mientras despacha y espera; una sesión de Claude que construye aparte, `/model sonnet` y `/effort medium` (rondas: `high`). El esfuerzo ya estaba en `medium` casi siempre: no es una palanca grande.

**Una sesión de orquestador por lote.** La sesión más cara (un rework grande) tuvo 360 turnos, 314 subagentes y 32 horas activas. Al cerrar un lote, o pasando ~150 turnos, sesión nueva: el traspaso es el registro (6.7) y `git log`.

**Estimado:** entre 30 y 40 % menos de gasto y ~25 horas menos de camino crítico por mes de trabajo como el medido, con las mismas revisiones, pruebas y navegador. Se confirma midiendo los próximos lotes con el medidor.
