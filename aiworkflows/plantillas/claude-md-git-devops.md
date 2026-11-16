<!-- PLANTILLA de aiWorkflows (método 27.9 y 28.11). Pegá este bloque en el CLAUDE.md del proyecto y completalo con el dueño.
     Es la autorización ESCRITA que permite subir ramas de trabajo sin preguntar cada vez. -->

## Git y despliegue (aiWorkflows 27-28)

- **Ramas:** base de trabajo `develop` · producción `main` · nombre `<tipo>/<TICKET>-<slug>` · una rama por spec, en su worktree.
- **Bitácora:** cada rama tiene su ficha en `docs/ramas/` (`ramas.mjs nueva`); la vista de conjunto, `node <skill>/scripts/ramas.mjs bitacora`.
- **Suite completa (la de la puerta y la del CI):** `npm run test:ci` (también en `aiw.config.json`).
- **Push de ramas de trabajo:** AUTORIZADO cuando pasa `node <skill>/scripts/ramas.mjs subir --test "npm run test:ci" --pr` (suite al 100 % verde, árbol limpio, rebasada, sin secretos). PR borrador: autorizado.
- **Merge a `develop` (sale a dev):** <PREGUNTAR siempre | AUTORIZADO con CI verde y recorrido en local en 0 ❌>.
- **Estrategia de merge:** <squash | merge commit>.
- **Siempre con el «sí» del dueño:** merge a `main`, deploy a cert y prod, borrar ramas remotas, push forzado fuera de la propia rama, reescribir historia publicada.
- **Entornos:**
  - dev: <https://dev.ejemplo.com> — se despliega solo al mergear a `develop`.
  - cert: <https://cert.ejemplo.com> — promoción manual del mismo artefacto.
  - prod: <https://ejemplo.com> — tag `vX.Y.Z` sobre `main` + aprobación del entorno protegido.
- **Despliegue:** `scripts/desplegar.sh <entorno> <sha>` · checklist `plantillas/checklist-de-despliegue.md` · bitácora `docs/DESPLIEGUES.md`.
