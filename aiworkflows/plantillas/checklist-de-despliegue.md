# Checklist de despliegue — <entorno> · <versión/tag> · <fecha>

<!-- PLANTILLA de aiWorkflows (método 28.6). Se copia por despliegue a prod/cert y se pega en el ticket o el PR. -->

## Antes

- [ ] **Orden explícita del dueño** (prod y cert): «…» — <quién, cuándo>
- [ ] CI verde sobre el commit exacto que sale: `<sha>` · artefacto: `<tag / digest>`
- [ ] Lo que entra, listado: tickets / ramas (de la bitácora de ramas) — …
- [ ] Migraciones: ninguna / `<lista>` — ensayadas contra copia de prod (duración: …), compatibles hacia atrás
- [ ] Backup verificado antes de migrar (prod)
- [ ] Impacto medido en prod con sólo lectura (precios, permisos, lo que ve cada rol) y mostrado al dueño (9.2)
- [ ] Rellenos de datos corridos en seco: «haría esto con N registros»
- [ ] ¿Algo tiene que salir junto con otra cosa? no / sí: …
- [ ] Variables de entorno nuevas cargadas en el gestor del entorno
- [ ] **Vuelta atrás escrita:** <redeploy de vX.Y.Z / apagar flag … / revert> · criterio: «si … se vuelve»
- [ ] Ventana: <día y hora>, alguien disponible las dos horas siguientes · aviso a: …

## Durante

- [ ] Desplegado con el script versionado: `<comando>`
- [ ] Logs mirados mientras sale; health checks en verde antes del tráfico

## Después

- [ ] Humo en el navegador del camino principal, en el entorno real, con el enlace: …
- [ ] Errores y latencia de la primera hora contra la línea base: …
- [ ] Línea en `docs/DESPLIEGUES.md`
- [ ] Fichas de las ramas actualizadas (`ramas.mjs estado …`)
- [ ] Prod: tag anotado `vX.Y.Z` + `CHANGELOG.md`; hotfix también mergeado a `develop`
- [ ] Al dueño: qué cambió, dónde se ve (enlace y entorno), qué mirar (10.3)
