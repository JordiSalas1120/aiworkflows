# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versiones [SemVer](https://semver.org/lang/es/).

## [2.3.0] — 2026-11-16

### Agregado
- **Regla 0-ter: spec terminado = rama subida.** Cada spec con la suite completa al 100 % se sube a su rama y abre un PR borrador para revisarlo en dev.
- `references/27-git-ramas-y-bitacora.md`: ramas con nombre fijo, commits convencionales, cuándo se commitea y cuándo se sube según el alcance, la puerta de push, la bitácora de ramas, PR y merge, tags y SemVer, higiene y la autorización escrita en el `CLAUDE.md`.
- `references/28-devops-desplegar-bien.md`: entornos y promoción, CI, CD, configuración y secretos, migraciones *expand/contract*, checklist de despliegue, vuelta atrás, observabilidad, infraestructura como código y bitácora de despliegues.
- `scripts/ramas.mjs`: `nueva`, `subir`, `puerta`, `estado` y `bitacora`.
- Plantillas: `pull-request.md`, `ci-github-actions.yml`, `checklist-de-despliegue.md`, `bitacora-de-despliegues.md` y `claude-md-git-devops.md`.
- Guardia: reglas de git (sin push a ramas protegidas, sin `--force` salvo `--force-with-lease`, sin borrar ramas remotas, sin `--no-verify`), con la salida `# [git-autorizado: …]`.
- Instaladores de una línea (`install.sh`, `install.ps1`), CI del repo (`.github/workflows/validar.yml`) y licencia MIT.

### Cambiado
- `instalar.mjs`: en una máquina sin configuración crea `~/.claude`; si la cuenta ya tiene su carpeta `agents/`, copia ahí los `aiw-*.md`.
- Checklists, fases 4 y 7, registro y agente implementador alineados con la parte 27.

## [2.2.0]
- Agentes `aiw-*` (`agentes/`) enlazados en cada cuenta y el taller en herdr (`references/26`).

## [2.1.0]
- Recursos y presupuesto (`references/25`): tope de subagentes por ticket, semáforo de recursos, cierre de sobrantes, una suite a la vez. Paquete publicable.

## [2.0.0]
- QA senior (`references/24`): ataque al spec, matriz de pruebas, caza de bugs, depurar sin adivinar, puerta de cert y guía para QA.
