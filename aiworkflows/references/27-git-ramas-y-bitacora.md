## 27. Git: ramas, commits, push y la bitácora de ramas

> **16-nov-2026.** Hasta ahora el método terminaba un spec con todo verde **en la máquina**: nadie más lo veía hasta que el dueño pedía el push. Desde hoy, **cada spec terminado y con su suite al 100 % se sube a su rama** para revisarlo en dev, y cada rama deja una **ficha** en el repo para que siempre se sepa qué ramas hay, de qué spec salió cada una y en qué estado está. Lo hace cumplir `scripts/ramas.mjs` (la puerta) y la guardia (lo prohibido).

### 27.1 Las ramas: una por spec, con nombre fijo

| Rama | Para qué | Quién escribe |
|---|---|---|
| `main` (o `master`) | Lo que está en producción. Cada merge acá lleva tag de versión | Nadie directo: sólo por PR, con el «sí» del dueño |
| `develop` (o `dev`) | Lo integrado que se despliega a dev | Nadie directo: sólo por PR |
| `staging` / `cert` (si existe) | Lo que QA certifica | Nadie directo |
| `<tipo>/<TICKET>-<slug>` | **El trabajo de un spec** | El orquestador y sus agentes |

- **Nombre:** `<tipo>/<TICKET>-<slug-en-minúsculas>`, por ejemplo `feat/ABC-123-alta-de-clientes`. Sin ticket: `chore/actualizar-dependencias`.
- **Tipos:** `feat` (funcionalidad), `fix` (bug), `hotfix` (bug en producción, sale de `main`), `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `release`, `spike` (prueba descartable, **nunca se mergea**).
- **Una rama = un spec = un PR.** Si el spec se parte en planes, los planes van en la misma rama, uno detrás del otro (regla 3). Dos specs no comparten rama.
- **Sale de la base más reciente del remoto** (`origin/develop`; un `hotfix`, de `origin/main`), nunca de otra rama de trabajo salvo que el plan lo diga y quede en la ficha.
- **En su worktree** (6.1): `node <skill>/scripts/ramas.mjs nueva feat/ABC-123-alta --que "Alta de clientes" --spec docs/specs/alta.md --worktree ../repo-ABC-123`. Crea la rama desde la base del remoto, el worktree y la ficha, y la commitea (local).
- Si el proyecto no tiene `develop`, la base es `main` y dev se despliega desde el PR (entorno de vista previa) o desde `main`: se dice en el `CLAUDE.md` del proyecto (27.9).

### 27.2 Los commits: chicos, con el porqué, en formato convencional

- **Formato:** `<tipo>(<TICKET>): <qué, en imperativo>` + cuerpo con el **porqué**. Por ejemplo `feat(ABC-123): bloquea el alta si el RUC ya existe`. Mismos tipos que las ramas. Un cambio que rompe compatibilidad lleva `!` (`feat(ABC-123)!: …`) y un párrafo `BREAKING CHANGE:`.
- **Un commit = una cosa** (6.6): una tarea del plan, un arreglo de revisión, la documentación. El registro anota el rango de cada tarea (`a1b2c3d..e4f5g6h`).
- **Firma de quién lo hizo**, como trailer: `Implementado-por: Claude Sonnet` / `Co-Authored-By: …`. El que revisa no firma el commit: firma el informe.
- **Nunca** `--no-verify` (la guardia lo frena), nunca secretos ni `.env`, nunca archivos generados que el `.gitignore` debería tapar (builds, `node_modules`, capturas de QA: van a `tmp/`).
- Antes de commitear, `git diff --staged` leído (o resumido por un `haiku` si es largo): **lo que entra es lo que se quiso**.

### 27.3 Cuándo se commitea y cuándo se sube: por alcance

| Alcance terminado | Qué se exige | Qué se hace | ¿Pregunta? |
|---|---|---|---|
| **Una tarea** del plan | Tests de lo tocado en verde, revisión independiente aprobada | **Commit local** (lo hace el implementador) | No |
| **Una ronda de arreglos** | Re-revisión aprobada | Commit encima, aparte | No |
| **Un plan** de un spec con varios planes | Suite completa sin rojos nuevos, registro al día | Commit del registro. Se puede subir la rama para respaldo (`ramas.mjs subir`) | No, si el proyecto autorizó el push de ramas (27.9) |
| **Un spec completo** | **La puerta de push (27.4)**: suite completa al **100 % verde**, revisión de rama aprobada, recorrido de la regla 0 en local, árbol limpio | **`ramas.mjs subir --test "<cmd>" --pr`**: push de la rama + **PR borrador** hacia `develop` + ficha en «en PR» | No, si el proyecto autorizó el push de ramas (27.9). Si no, se pregunta una vez |
| **Merge a `develop`** (sale a dev) | CI verde en el PR, PR pasado de borrador a listo, rebasado sobre `develop` | Merge por squash o merge commit (27.6); ficha en «en dev» | **Sí**, salvo que el `CLAUDE.md` del proyecto autorice merge a dev |
| **A cert / QA** | Puerta de cert (regla 0-bis, 24.10) con la matriz en 0 ❌ **en dev** | PR o promoción a `staging`; ficha en «en cert» | Sí |
| **A producción** | Checklist de despliegue (28.6) y orden del dueño | PR a `main` + tag de versión (27.7) | **Siempre, explícito**. No se ofrece por iniciativa propia (9.1) |

**Lo que cambia respecto de antes:** el push de **la rama de trabajo** deja de esperar al dueño **cuando el proyecto lo autorizó por escrito** (27.9) y la puerta pasa. Así cada spec terminado queda visible en el remoto y en dev para revisarlo. Lo que sigue pidiendo el «sí» del dueño, siempre: merge a ramas protegidas, deploy a cert y prod, push forzado sobre algo compartido, borrar ramas remotas, reescribir historia publicada.

**El implementador nunca sube.** Sube el orquestador, al cerrar el spec, con la puerta.

### 27.4 La puerta de push

`node <skill>/scripts/ramas.mjs subir --test "<comando de la suite completa>" [--pr]` (o `puerta` para chequear sin subir). Frena si:

1. la rama actual es protegida, está en HEAD separado o su nombre no sigue `<tipo>/<TICKET>-<slug>`;
2. hay cambios sin commitear;
3. falta la ficha de la rama (27.5);
4. la rama está **detrás de su base** en el remoto: se rebasa, se corre todo de nuevo y recién ahí se sube (con `--permitir-atras` sólo si el dueño lo pide);
5. el diff contra la base trae marcas de conflicto, un `.env` o algo con forma de secreto (claves de nube, tokens, claves privadas, contraseñas escritas a mano);
6. **la suite completa no sale en 0.** Sin comando de tests no se sube: «al 100 %» quiere decir que el comando que el CI va a correr salió verde en esta máquina, ahora, sobre este commit.

Si pasa: anota en la ficha `subida · <cmd> en verde · <sha>`, commitea la ficha, hace `git push -u origin <rama>` y, con `--pr`, abre el **PR borrador** hacia la base con la plantilla del repo (`.github/pull_request_template.md`, ver `plantillas/pull-request.md`) y anota la URL.

La puerta **no reemplaza** la regla 0 ni la 0-bis: la suite verde es la condición para subir, no para decir «listo». Después del push, el recorrido se repite **en dev** (24.10).

Config del proyecto en `aiw.config.json` (raíz del repo, versionado):

```json
{ "base": "develop", "test": "npm run test:ci", "protegidas": ["main", "develop"], "fichas": "docs/ramas", "bitacora": "docs/RAMAS.md" }
```

### 27.5 La bitácora de ramas: una ficha por rama

Cada rama tiene su **ficha** en `docs/ramas/<tipo>--<TICKET>-<slug>.md`, **versionada dentro de esa misma rama**. Como cada rama toca sólo su ficha, las fichas no chocan nunca en un merge (una tabla única en un archivo sí chocaría en cada PR).

La ficha dice: ticket, qué (en palabras del dueño), spec, base, **estado**, PR, entorno donde se ve, fecha de creación, y un historial de una línea por evento (creada, subida con qué tests y en qué commit, en PR, en dev, en cert, mergeada, abandonada y por qué).

Estados: `en curso` → `subida` → `en PR` → `en dev` → `en cert` → `mergeada` · o `abandonada` (con el motivo).

- `ramas.mjs nueva` la crea; `ramas.mjs subir` la pasa a «subida» / «en PR»; `ramas.mjs estado "en dev" --entorno dev --nota "<enlace>"` registra el resto.
- **La vista de conjunto:** `node <skill>/scripts/ramas.mjs bitacora` junta las fichas de **todas** las ramas (locales y del remoto, y las ya mergeadas, cuyas fichas quedaron en la base) en una tabla: rama, ticket, qué, base, estado, PR, entorno, último commit y si hay commits sin subir. Con `--escribir` deja `docs/RAMAS.md`; ese archivo se actualiza en la base por PR, nunca a mano.
- **Al empezar una sesión** el orquestador corre `ramas.mjs bitacora` junto con el registro y `git log`: es el mapa de qué está abierto. Una rama «sin ficha» o «sólo local» de hace días es un pendiente que se nombra al dueño.
- Lo que la ficha **no** es: no es el registro de construcción (ese detalla tareas, modelos y decisiones, 6.7). La ficha es el índice; el registro, el detalle. La ficha enlaza al registro.

### 27.6 El PR y el merge

- **Borrador** apenas se sube el spec; **listo para revisar** cuando el CI está verde y el recorrido en dev salió en 0 ❌.
- El cuerpo sigue `plantillas/pull-request.md`: qué y por qué, ticket, spec, cómo probarlo en dev (enlace directo, usuario sembrado), tests (comando y conteo), riesgos, migraciones, plan de vuelta atrás, capturas, y lo que **no** se probó.
- **Antes del merge:** rebase sobre la base actualizada (`git rebase origin/develop`), tests de nuevo, `git push --force-with-lease` sobre **tu** rama (el único forzado permitido, y la guardia lo deja pasar).
- **Estrategia:** squash si los commits de la rama son ruido; merge commit si cuentan la historia (planes, tareas, rondas). El proyecto elige una y la escribe en su `CLAUDE.md`; no se mezcla.
- **Protección de ramas** (una vez, en GitHub/GitLab): `main` y `develop` con PR obligatorio, checks del CI obligatorios, sin push forzado y sin borrado. La guardia es la red local; la protección del remoto, la de verdad.
- Al mergear: ficha en «mergeada», rama remota borrada (con el «sí»), worktree quitado (`git worktree remove`), `git worktree prune`.

### 27.7 Versiones y tags

- **SemVer**: `MAYOR.MENOR.PARCHE`. `feat` sube MENOR, `fix` sube PARCHE, `!`/`BREAKING CHANGE` sube MAYOR.
- **Cada salida a producción lleva tag anotado** (`git tag -a v1.4.0 -m "…"`) sobre el commit de `main` que se desplegó, y su entrada en `CHANGELOG.md` (agrupada por tipo, con los tickets). El tag es el punto al que se vuelve si hay que dar marcha atrás (28.7).
- Un `hotfix` sale de `main`, se mergea a `main` con su tag de parche **y también a `develop`**, para que no vuelva el bug en la próxima salida.

### 27.8 Higiene

- `git fetch --prune` al empezar; ramas mergeadas, borradas; worktrees viejos, listados (25.4) y quitados con el «sí».
- Nunca `git reset --hard`, `git clean -fd`, `git checkout -- .` ni `git stash drop` sobre cambios que no son tuyos (6.1).
- Nunca se reescribe historia que ya está en el remoto de una rama compartida. En tu rama, sólo con `--force-with-lease`.
- **Si entró un secreto**, borrarlo no alcanza: se rota (9.4) y se avisa al dueño.
- `.gitattributes` con `* text=auto` y `*.sh text eol=lf`; `.gitignore` con `.env`, `tmp/`, builds y salidas de pruebas.

### 27.9 La autorización, por escrito, en el proyecto

La regla general sigue siendo **«nada sale de la máquina sin el sí del dueño»**. El push de ramas de trabajo es la excepción **cuando el dueño la deja escrita** en el `CLAUDE.md` del proyecto, con este bloque (está en `plantillas/claude-md-git-devops.md`):

```markdown
## Git y despliegue (aiWorkflows 27-28)
- Base de trabajo: `develop` · producción: `main` · dev se despliega al mergear a `develop`.
- Push de ramas de trabajo (`<tipo>/<TICKET>-<slug>`): **autorizado** cuando pasa `ramas.mjs subir`. PR borrador: autorizado.
- Merge a `develop`: pregunta / autorizado con CI verde (elegir uno).
- Merge a `main`, deploy a cert y prod, borrar ramas remotas: **siempre con el sí del dueño**.
- Suite completa: `npm run test:ci` · estrategia de merge: squash.
```

Sin ese bloque, al cerrar un spec se pregunta **una vez**: «¿Subo la rama y abro el PR borrador?», con las opciones, y se ofrece dejarlo escrito para la próxima.

### 27.10 Lo que la guardia frena (con la guardia instalada)

Sobre cualquier comando de Bash o PowerShell:
- `git push` a `main`, `master`, `develop`, `dev`, `staging`, `production` o `prod` (explícito, o desde una de ellas), y `--all`/`--mirror`;
- `git push --force` / `-f` / `+refspec` (sí deja `--force-with-lease`);
- borrar una rama remota (`--delete`, `:rama`);
- `--no-verify`.

Si el dueño lo autorizó **para ese caso**, el comando lleva al final `# [git-autorizado: <quién y por qué>]` y la misma línea va al registro. `AIWORKFLOWS_PROTEGIDAS=main,develop` cambia la lista; `AIWORKFLOWS_GIT=0` apaga estas reglas.

> **Por qué la ficha va dentro de la rama.** Una tabla única `RAMAS.md` editada por cada rama haría que tres specs en paralelo tocaran las mismas líneas, y cada merge sería un conflicto. Una ficha por rama no choca nunca, y la tabla se genera leyendo todas.
