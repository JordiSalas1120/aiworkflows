## 28. DevOps: desplegar siempre igual, y poder volver atrás

> **16-nov-2026.** La fase 7 (9) dice **quién** decide subir. Esta parte dice **cómo** se sube, para que cada proyecto despliegue igual: el mismo pipeline, las mismas puertas, una bitácora de despliegues y una vuelta atrás escrita **antes** de subir. Se aplica al preparar un proyecto (28.11) y en cada despliegue (28.6).

### 28.1 Los entornos y la promoción

```
rama de trabajo ──PR──▶ develop ──▶ DEV ──▶ staging/cert ──▶ CERT ──PR + tag──▶ main ──▶ PROD
     (local)         CI completo   auto        promoción         QA          manual, con aprobación
```

- **Un artefacto, promovido.** Lo que se probó en dev es **lo mismo** (la misma imagen, el mismo build, por su digest o su sha) que llega a cert y a prod. No se recompila por entorno: cambia la configuración, no el código.
- **Paridad:** misma versión del runtime, de la base y de los servicios en todos los entornos (fijada en `Dockerfile`, `.nvmrc`, `.python-version`, `docker-compose.yml`). Las diferencias que sí existen (claves de pago de prueba, simuladores, flags) se listan en el README de despliegue y se chequean en cert (24.10).
- **Dev se despliega solo** al mergear a `develop`. **Prod nunca se despliega solo:** lleva aprobación manual (entorno protegido con revisores) y un tag.
- Cada entorno tiene su URL fija, anotada en el `CLAUDE.md` del proyecto: es el «enlace directo» que piden las guías (10.3).

### 28.2 El CI: lo mismo que la puerta, en la nube

Corre en **cada push a una rama de trabajo y en cada PR**. Etapas, en este orden y cortando en la primera que falla:

1. **Instalar con el lockfile** (`npm ci`, `pnpm install --frozen-lockfile`, `pip install -r` con hashes, `uv sync --frozen`). Con caché.
2. **Formato y lint** (la misma versión que el hook de pre-commit).
3. **Tipos** (`tsc --noEmit`, `mypy`, …).
4. **Tests unitarios y de integración**, con la base en un contenedor de servicio, no con mocks de la base.
5. **Build** del artefacto (imagen de Docker o bundle) — una sola vez; se sube como artefacto del pipeline.
6. **Seguridad mínima:** auditoría de dependencias (`npm audit --audit-level=high`, `pip-audit`), escaneo de secretos (gitleaks) y, si hay imagen, escaneo de la imagen.
7. **E2E de humo** contra el build (Playwright, pocos caminos críticos). El recorrido completo de la regla 0 no va en cada push: va en dev.

Reglas:
- **El comando de la puerta (27.4) y el del CI son el mismo** (`npm run test:ci`, `make ci`). Si local pasa y el CI no, la diferencia es un defecto del proyecto y se arregla, no se ignora.
- **Checks obligatorios** en la protección de `develop` y `main` (27.6). Un CI que se puede saltear no es CI.
- **Un CI rojo en la base es la prioridad** del equipo: nadie mergea arriba de rojo.
- **Antes de un lote**, se chequea que el CI y el deploy anden (9.1, E12): minutos de la plataforma, runners, acceso al entorno.
- Plantilla para GitHub Actions: `plantillas/ci-github-actions.yml`.

### 28.3 El CD: cómo sale cada entorno

| Entorno | Disparador | Puerta | Quién |
|---|---|---|---|
| Dev | merge a `develop` | CI verde | Automático |
| Cert / staging | promoción del mismo artefacto (o merge a `staging`) | Recorrido en dev en 0 ❌, puerta de cert lista | El dueño, o el equipo con aviso |
| Prod | tag `vX.Y.Z` sobre `main` | Checklist 28.6 + aprobación del entorno protegido | **Sólo el dueño, explícito** |

- **El despliegue es un script versionado** (`scripts/desplegar.sh`, un workflow, un `Makefile`), nunca una lista de comandos tipeados a mano. Si el deploy manual es el oficial (9.1), igual es un script en el repo, y su uso queda en la bitácora de despliegues.
- **Sin pasos manuales en el servidor.** Lo que se hizo a mano en un servidor se pierde en la próxima reinstalación: va a la infraestructura como código (28.9).
- Estrategia según el riesgo: **rolling** por defecto; **blue-green** o **canary** si hay mucho tráfico o el cambio es delicado; **feature flag** cuando una funcionalidad tiene que estar desplegada pero apagada.

### 28.4 Configuración y secretos

- **La configuración vive en variables de entorno** (doce factores), no en el código. `.env.example` versionado con **todas** las variables, sin valores reales y con un comentario por cada una. `.env` nunca se versiona (la puerta y el escaneo lo frenan).
- **Los secretos, en el gestor del entorno** (secretos del CI, del proveedor de nube o un vault), con un dueño y una fecha de rotación. Uno por entorno: dev nunca usa las claves de prod.
- **Al arrancar, la app valida su configuración** (un esquema) y no levanta si falta algo. Un error claro al arrancar es mejor que un 500 a las tres horas.
- Producción nunca usa credenciales de ejemplo o de demo (9.4). Si un secreto entró a git, **se rota** (9.4, 27.8).

### 28.5 Migraciones de base: compatibles hacia atrás

- **Expandir y contraer:** primero se agrega (columna nueva, nullable o con default), se despliega el código que escribe en las dos, se rellena, se pasa a leer de la nueva y **recién en un despliegue posterior** se borra la vieja. Así el código viejo y el nuevo conviven durante el despliegue y la vuelta atrás no rompe nada.
- Cada migración: probada **contra una copia de producción** (cuánto tarda, si bloquea tablas), con su bajada escrita o con la explicación de por qué no tiene.
- **Backup verificado antes** de migrar en prod (no sólo «se hizo»: se sabe restaurar y se probó alguna vez).
- Los rellenos de datos, primero en seco (9.2), y en lotes si son grandes.

### 28.6 El checklist de cada despliegue

Está completo en `plantillas/checklist-de-despliegue.md`. Lo esencial:

**Antes:** orden del dueño (prod) · CI verde sobre el commit exacto · artefacto identificado (tag, sha, digest) · migraciones ensayadas y compatibles · impacto medido en prod con sólo lectura (9.2) · ¿algo tiene que salir junto? · **vuelta atrás escrita** (28.7) · ventana elegida (no viernes a la tarde sin guardia) · aviso a quien corresponda.

**Durante:** se despliega con el script · se miran los logs mientras sale · los health checks tienen que pasar antes de mandar tráfico.

**Después:** humo en el navegador del camino principal, en el entorno real (8.1) · errores y latencia de la primera hora contra la línea base · entrada en la bitácora de despliegues · ficha de la rama en «en dev» / «mergeada» · tag y `CHANGELOG.md` (prod).

### 28.7 La vuelta atrás, escrita antes de subir

- Cada despliegue a prod dice **cómo se vuelve**, antes de empezar: redeploy del tag anterior (lo normal), apagar el feature flag, o `git revert` + deploy. Con migraciones, cuál de las dos versiones del código soporta la base actual (por eso expandir y contraer, 28.5).
- **Criterio de vuelta atrás** decidido antes: «si la tasa de errores pasa X o el camino principal falla, se vuelve, sin discutir».
- Se vuelve primero y se investiga después. Ante una caída, primero mirar si es el proveedor (9.3).
- Se ensaya la vuelta atrás en dev al menos una vez por proyecto.

### 28.8 Observabilidad mínima

- **Health check** (`/health` vivo, `/ready` con dependencias) que usan el balanceador y el deploy.
- **Logs estructurados** (JSON) con id de pedido y de tenant; nunca datos sensibles ni secretos en los logs.
- **Errores a un tracker** (Sentry o similar) con la versión desplegada como «release», para saber qué despliegue trajo qué error.
- **Métricas y alertas** de lo que importa: tasa de errores, latencia, colas, disco y memoria del servidor. Cada alerta tiene a quién le llega.
- Las primeras horas después de prod se miran (9.3).

### 28.9 Infraestructura como código y builds reproducibles

- Servidores, bases, colas, DNS y permisos en código (Terraform, Pulumi, `docker-compose`, manifiestos), versionados y revisados por PR como el resto.
- Imágenes con **versiones fijas** (nada de `:latest`), usuario no root, multi-stage, sólo lo necesario. Dependencias con lockfile.
- Dependabot/Renovate para las actualizaciones, en PR chicos, por el mismo CI.

### 28.10 La bitácora de despliegues

`docs/DESPLIEGUES.md` (plantilla en `plantillas/bitacora-de-despliegues.md`): **una línea por despliegue**, la más nueva arriba — fecha y hora, entorno, versión/tag, commit, ramas o tickets que entraron, quién lo autorizó, migraciones, resultado (ok / vuelto atrás / con incidentes) y el enlace. Junto con la bitácora de ramas (27.5), contesta las dos preguntas que siempre se hacen: **qué hay en cada entorno** y **desde cuándo**.

### 28.11 Preparar el DevOps de un proyecto (una vez, proponiéndoselo al dueño)

- [ ] Ramas `main` y `develop` (o la decisión de trabajar sólo con `main`) y su protección en el remoto: PR obligatorio, checks obligatorios, sin forzado ni borrado.
- [ ] `aiw.config.json` con base, comando de la suite y ramas protegidas (27.4).
- [ ] Bloque «Git y despliegue» en el `CLAUDE.md` (27.9, `plantillas/claude-md-git-devops.md`), con las URLs de cada entorno.
- [ ] CI con las etapas de 28.2 (`plantillas/ci-github-actions.yml`), y su comando igual al de la puerta.
- [ ] Deploy a dev automático al mergear a `develop`; prod con tag y aprobación.
- [ ] `.env.example` completo; secretos en el gestor, uno por entorno; validación de config al arrancar.
- [ ] Health checks, logs estructurados, tracker de errores con la release.
- [ ] `docs/ramas/`, `docs/DESPLIEGUES.md` y `CHANGELOG.md` creados.
- [ ] `.github/pull_request_template.md` copiado desde `plantillas/pull-request.md`.
- [ ] Vuelta atrás ensayada una vez en dev.
