<div align="center">

# aiWorkflows

**Un método de desarrollo con agentes de IA para Claude Code: del spec al deploy, con QA senior, Git y DevOps incluidos.**

[![validar](https://github.com/JordiSalas1120/aiworkflows/actions/workflows/validar.yml/badge.svg)](https://github.com/JordiSalas1120/aiworkflows/actions/workflows/validar.yml)
![versión](https://img.shields.io/badge/versi%C3%B3n-2.3.0-blue)
![licencia](https://img.shields.io/badge/licencia-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude%20Code-skill%20%2B%20agentes-orange)

[Instalar](#instalar-en-un-minuto) · [Qué trae](#qué-trae) · [El ciclo](#el-ciclo-de-un-spec) · [Git y DevOps](#git-y-devops-novedad-en-230) · [English](#in-english)

</div>

---

Los agentes de IA escriben código rápido, pero sin un método **se equivocan rápido**: dicen «listo» sin haberlo probado, gastan Opus donde alcanza Sonnet, abren diez subagentes a la vez, y el código se queda en tu máquina sin que nadie lo revise.

**aiWorkflows** es una *skill* más 11 agentes para Claude Code que convierten eso en un proceso repetible, el mismo para cualquier proyecto:

- 🧠 **Un modelo por encargo.** Opus diseña, audita y revisa lo crítico; Sonnet construye; Haiku explora y corre suites. Medido, no supuesto: una tarea construida con Sonnet cuesta 1 $ y 9 min, contra 5 $ y 26 min con Opus.
- ✅ **«Listo» tiene una definición.** Nada está terminado sin un recorrido en el navegador de la tabla de estados × roles, con 0 ❌.
- 🔍 **QA senior antes de QA.** Atacar el spec, la matriz de pruebas, la caza de bugs, depurar sin adivinar y la puerta de cert, para que QA no te devuelva el ticket.
- 🌿 **Git con disciplina.** Una rama por spec, commits convencionales y **push automático solo cuando la suite está al 100 %**, con una bitácora que dice qué ramas hay y de dónde salió cada una.
- 🚀 **DevOps de verdad.** CI con etapas fijas, un mismo artefacto promovido de dev a prod, migraciones compatibles hacia atrás y una vuelta atrás escrita antes de cada deploy.
- 🛡️ **Una guardia que lo hace cumplir.** Un hook que frena encargos sin modelo, el exceso de subagentes, dos suites a la vez, el push a `main` y `--no-verify`.

## Instalar en un minuto

Hace falta **[Claude Code](https://claude.com/claude-code)**, **git** y **Node 18+** (y Python 3 solo para medir el gasto).

**macOS / Linux / Git Bash**
```bash
curl -fsSL https://raw.githubusercontent.com/JordiSalas1120/aiworkflows/main/install.sh | sh
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/JordiSalas1120/aiworkflows/main/install.ps1 | iex
```

El instalador clona el repo en `~/.claude-skills` y enlaza la skill y los agentes en **cada** carpeta de configuración de Claude que tengas (`~/.claude`, `~/.claude-2`, …). Para actualizar, volvé a correrlo.

Después abrí Claude Code en tu proyecto y decile:

> **trabajá con aiWorkflows en ABC-123**

<details>
<summary><b>Otras formas de instalar</b></summary>

**A mano, con git**
```bash
git clone https://github.com/JordiSalas1120/aiworkflows.git ~/.claude-skills
node ~/.claude-skills/aiworkflows/instalar.mjs            # enlaza skill + agentes en cada cuenta
node ~/.claude-skills/aiworkflows/instalar.mjs --guardia  # además instala la guardia (hook)
```

**Con el zip** (sin git): bajá `aiworkflows-v<versión>.zip` de [Releases](https://github.com/JordiSalas1120/aiworkflows/releases) y descomprimilo de forma que quede `~/.claude/skills/aiworkflows/SKILL.md`.

**Desinstalar:** `node ~/.claude-skills/aiworkflows/instalar.mjs --quitar --guardia`.
</details>

### La guardia (recomendada)

```bash
node ~/.claude-skills/aiworkflows/instalar.mjs --guardia
```

Es un hook `PreToolUse` sobre `Agent|Task|Bash|PowerShell` (con copia `.bak` de tu `settings.json`). Hace cumplir la tabla de modelos, el tope de **4 subagentes por ticket**, el semáforo de RAM, CPU y disco, **una suite a la vez** y las **reglas de git**. Variables: `AIWORKFLOWS_TOPE=<n>`, `AIWORKFLOWS_RECURSOS=0`, `AIWORKFLOWS_GIT=0`, `AIWORKFLOWS_PROTEGIDAS=main,develop`.

## Qué trae

| | |
|---|---|
| **`SKILL.md`** | La versión operativa: tabla de modelos, reglas 0, 0-bis y 0-ter, las 10 reglas y qué parte del método abrir en cada fase |
| **`references/`** | 27 partes del método, una por archivo: principios, cada fase, pruebas, backend, frontend, agentes, lecciones, QA senior, recursos, Git y DevOps |
| **`agentes/`** | 11 agentes `aiw-*`: implementador, revisor, revisor crítico, auditor, depurador, probador de QA, maquetador y 4 ayudantes Haiku |
| **`plantillas/`** | Encargos listos para copiar, registro de construcción, tabla de estados, matriz de pruebas, guía para QA, PR, CI, checklist de despliegue y bitácoras |
| **`scripts/`** | `ramas.mjs` (ramas, bitácora y puerta de push), guardia, medición de gasto y retrabajo, anclas y fidelidad del plan, `rojo-sin-arreglo`, recursos y trinquete de estilos |

## El ciclo de un spec

```
alcance (SÍ/NO) → ataque al spec + matriz de pruebas → spec y maqueta aprobados
  → plan con anclas, auditado por Opus → rama + worktree + ficha (ramas.mjs nueva)
  → construir tarea por tarea (Sonnet construye, otro revisa, commit local por tarea)
  → revisión de toda la rama → recorrido en el navegador con 0 ❌ (regla 0)
  → ramas.mjs subir --test "<suite>" --pr   ← push + PR borrador, solo con la suite al 100 %
  → merge a develop → dev → puerta de cert (regla 0-bis) → prod con el «sí» del dueño + tag
  → nota del porqué → medir el gasto del lote
```

## Git y DevOps (novedad en 2.3.0)

**Regla 0-ter: spec terminado = rama subida.** Cuando un spec tiene la suite completa al 100 %, la revisión de rama aprobada y el recorrido en 0 ❌, se sube a su rama para revisarlo en dev:

```bash
# al empezar: rama con nombre fijo, desde la base del remoto, en su worktree, con su ficha
node ~/.claude-skills/aiworkflows/scripts/ramas.mjs nueva feat/ABC-123-alta-de-clientes \
     --que "Alta de clientes" --spec docs/specs/alta.md --worktree ../repo-ABC-123

# al terminar: la puerta de push (o no sube nada)
node ~/.claude-skills/aiworkflows/scripts/ramas.mjs subir --test "npm run test:ci" --pr

# en cualquier momento: qué ramas hay, de qué spec, en qué estado y en qué entorno
node ~/.claude-skills/aiworkflows/scripts/ramas.mjs bitacora
```

La **puerta de push** frena si la rama es protegida o tiene mal nombre, si hay cambios sin commitear, si quedó detrás de su base, si el diff trae un `.env`, una clave o marcas de conflicto, o si la suite no sale en 0. Si pasa, actualiza la ficha, hace el push y abre el PR borrador.

**La bitácora** es una ficha por rama (`docs/ramas/<rama>.md`, dentro de esa misma rama, así nunca choca en un merge) y una vista de conjunto generada leyendo todas las ramas, locales y del remoto.

**Cuándo se commitea y cuándo se sube, por alcance:** cada tarea → commit local · cada ronda de arreglos → commit encima · spec completo → push + PR borrador · merge a `develop` y deploy a prod → con el «sí» del dueño. El push de ramas de trabajo sin preguntar **solo vale si el proyecto lo autoriza por escrito** en su `CLAUDE.md` (`plantillas/claude-md-git-devops.md`).

**DevOps** (`references/28`): entornos y promoción del mismo artefacto, CI con 7 etapas (y el mismo comando que la puerta), CD a dev automático y a prod con tag y aprobación, configuración y secretos, migraciones *expand/contract*, checklist de despliegue, vuelta atrás escrita, observabilidad mínima, infraestructura como código y bitácora de despliegues.

## Contribuir

Los issues y PR son bienvenidos. Antes de abrir un PR:

```bash
node herramientas/empaquetar.mjs --validar   # frontmatter, scripts que compilan, sin mojibake ni rutas personales
```

Para publicar una versión: subí `metadata.version` en `aiworkflows/SKILL.md`, anotá el cambio en `CHANGELOG.md` y corré `node herramientas/empaquetar.mjs` (genera `dist/aiworkflows-v<versión>.zip` y su `.sha256` para Releases). Si mantenés un fork con datos propios, poné las palabras que no deben publicarse en `.privado.txt` (una por línea; está en `.gitignore`) y el validador las frena.

Si te sirve, **dejale una ⭐** — ayuda a que más gente lo encuentre.

## Créditos

La parte 24 (QA senior) adapta ideas de skills MIT del catálogo [aitmpl.com](https://www.aitmpl.com/skills/): `code-reviewer`, `systematic-debugging` (obra/superpowers), `devil`, `verification-before-completion`, `find-bugs` (Sentry) y `qa-test-planner`, entre otras. El detalle está en `references/24-…md`, sección 24.14.

Licencia [MIT](LICENSE).

---

## In English

**aiWorkflows** is a development method for AI coding agents, packaged as a **Claude Code skill plus 11 subagents** (written in Spanish). It covers the whole cycle: spec → audited plan → task-by-task build → review → in-browser verification → push → deploy.

- **One model per job:** Opus designs, audits and reviews critical code; Sonnet builds; Haiku explores and runs test suites.
- **A strict definition of "done":** an in-browser walkthrough of every state × role, with zero failures.
- **Senior QA before QA:** spec attacks, test matrices, bug hunting, root-cause debugging and a cert gate.
- **Git discipline:** one branch per spec, conventional commits, a branch log, and an **automatic push + draft PR only when the full suite is 100% green** (`scripts/ramas.mjs`).
- **DevOps guidelines:** a fixed CI pipeline, one artifact promoted from dev to prod, backward-compatible migrations and a written rollback plan before every deploy.
- **A guard hook** that blocks agents launched without a model, too many subagents, parallel suites, pushes to `main`, force-pushes and `--no-verify`.

Install: `curl -fsSL https://raw.githubusercontent.com/JordiSalas1120/aiworkflows/main/install.sh | sh` (or `irm …/install.ps1 | iex` on Windows), then tell Claude Code: *"trabajá con aiWorkflows"*. If you find it useful, a ⭐ is appreciated.
