## 19. Checklists rápidos

### Antes de diseñar
- [ ] ¿Qué problema tiene la persona, en sus palabras?
- [ ] ¿Existe ya algo parecido? (buscar en el código)
- [ ] ¿Qué dicen los datos reales? (contar)
- [ ] ¿El dominio es especializado? (preguntar, fuente oficial)
- [ ] Alcance escrito (SÍ / NO) y todas las preguntas de producto hechas en un lote, una por una

### Antes de construir
- [ ] **Ataque al spec** (9 pasos + pre-mortem «QA lo devolvió porque…»), con los huecos en el lote de preguntas al dueño (24.2)
- [ ] **Matriz de pruebas** escrita: particiones, bordes, decisión, transiciones, entornos; esperado = lo que ve la persona (24.3, `plantillas/matriz-de-pruebas.md`)
- [ ] Spec con cero decisiones abiertas, alcance escrito y tabla de estados (si hay pantallas con estados)
- [ ] Maqueta mapeada a tokens del tema; trinquete de colores, alturas y roles configurado (13)
- [ ] Usuarios de prueba sembrados por script (8.3)
- [ ] CI y deploy chequeados; si no andan, deploy manual declarado (9.1)
- [ ] Plan por tareas chicas, con tests primero
- [ ] Plan auditado contra el código, tarea por tarea
- [ ] Revisión cruzada con los otros planes
- [ ] Prueba en seco del código del plan
- [ ] Rama `<tipo>/<TICKET>-<slug>` + worktree propios, creados con `ramas.mjs nueva` (ficha en `docs/ramas/`), `.env` y puertos propios (27.1)
- [ ] `ramas.mjs bitacora` mirada: qué ramas hay abiertas, sin ficha o sólo locales
- [ ] Registro de la construcción creado como archivo, con el plan en la primera línea
- [ ] Auditoría previa lanzada en paralelo con la primera tarea; sus hallazgos decididos antes de despachar la tarea que tocan
- [ ] Plan en formato de anclas; si el código se movió desde que se auditó, `anclas-del-plan.mjs` y re-auditar sólo las ✘ (5.5)
- [ ] Sesión de orquestador nueva para el lote; `SKILL.md` leído y confirmado
- [ ] `recursos.mjs` en verde; sobrantes de sesiones anteriores cerrados; worktrees viejos listados (25.4)
- [ ] Presupuesto del ticket anotado en el registro: 4 encargos con su modelo (25.1)

### En cada tarea
- [ ] `model` explícito por la tabla de `SKILL.md`, anotado en el registro (Opus no construye ni aplica; Haiku no revisa)
- [ ] Resumen de la tarea en un archivo; encargo sin historial; base anotada antes de despachar
- [ ] Test que falla por la razón correcta
- [ ] Código mínimo, tests de lo tocado (la suite completa, sólo al cerrar una fase o integrar; lista de rojos igual a la base)
- [ ] Tipos, lint, formato (versión del CI)
- [ ] Revisión por alguien distinto, escalada al cambio, con los dos veredictos; arreglos encima; re-revisión acotada
- [ ] Un solo agente escribiendo a la vez; nunca dos suites de punta a punta a la vez
- [ ] Commit chico, convencional (`feat(ABC-123): …`), con el porqué; registro actualizado (completa, diferidos, decisiones con su costo)

### Antes del PR
- [ ] Revisión final de la rama, con la clasificación de diferidos y defectos del navegador
- [ ] Una sola ola de arreglos con la lista completa + re-revisión acotada; lo que quede, estacionado y anotado
- [ ] **Recorrido de la tabla de estados × roles con usuarios sembrados, en el entorno de verificación, 0 ❌; spec del recorrido en el PR (regla 0)**
- [ ] Navegador, siguiendo el dato, con lista, capturas y datos devueltos
- [ ] Mutaciones, si toca plata, permisos o aislamiento
- [ ] Dos empresas, si toca sesión o permisos
- [ ] Rendimiento medido con volumen real
- [ ] Tests de regresión verificados con `rojo-sin-arreglo.mjs` (24.7)
- [ ] Revisión con caza de bugs y auditoría de cierre; seguridad mínima si hay backend (24.4, 24.5)

### Al terminar el spec: subir la rama (regla 0-ter, 27.3-27.4)
- [ ] Suite completa al 100 % verde, revisión de rama aprobada, recorrido en local en 0 ❌, árbol limpio
- [ ] Rebasada sobre la base del remoto y vuelta a probar
- [ ] `ramas.mjs subir --test "<suite>" --pr` en 0: push de la rama, PR borrador con la plantilla, ficha en «en PR»
- [ ] Si el `CLAUDE.md` no autoriza el push de ramas: preguntado una vez, con la oferta de dejarlo escrito
- [ ] CI del PR en verde; merge a dev según el `CLAUDE.md`; ficha en «en dev»; recorrido repetido en dev

### Antes de pasar a cert / QA (regla 0-bis, 24.10)
- [ ] Matriz con **0 ❌ en dev**, con evidencia; exploratoria hecha, con notas
- [ ] Diferencias de entorno (claves, simuladores, flags) chequeadas en cert
- [ ] Ningún «riesgo aceptado» sin la firma del dueño en el ticket
- [ ] Guía para QA (`plantillas/guia-para-qa.md`): enlace, datos, casos con el esperado visible, qué NO se probó
- [ ] Rebasado sobre el dev más reciente, sin pisar cambios ajenos

### En un rebote de QA (24.6, alcance mínimo)
- [ ] Comentario de QA leído completo; bug reproducido
- [ ] Causa raíz con evidencia, mostrada al dueño **antes** de arreglar
- [ ] Test rojo → un arreglo → `rojo-sin-arreglo.mjs` en 0
- [ ] Re-corridos el caso del rebote y los casos de la matriz que pasan por ese camino; nada más tocado

### Antes de producción
- [ ] **Orden explícita del dueño**
- [ ] Migraciones ensayadas
- [ ] Impacto medido en producción (sólo lectura) y mostrado
- [ ] Scripts de datos corridos en seco
- [ ] ¿Algo tiene que subir junto con otra cosa?
- [ ] Checklist de despliegue (`plantillas/checklist-de-despliegue.md`) con la **vuelta atrás escrita** y su criterio (28.6, 28.7)
- [ ] Mismo artefacto que pasó por dev y cert; CI verde sobre el commit exacto
- [ ] Después: humo en el navegador, primera hora mirada, línea en `docs/DESPLIEGUES.md`, tag + `CHANGELOG.md`

### Al cerrar
- [ ] Todo commiteado, árbol limpio; rama subida y ficha al día (o, si no se subió, el motivo en la ficha)
- [ ] Servidores apagados (por PID); `recursos.mjs` sin sobrantes de este ticket
- [ ] Encargos usados contra el presupuesto, anotados en el registro
- [ ] Nota del porqué (número libre en todas las ramas)
- [ ] Mapa del código actualizado
- [ ] Memoria: dónde quedó y qué sigue
- [ ] Ticket presentable para gestión
- [ ] Registro de la construcción commiteado; lista completa de decisiones mostrada al dueño
- [ ] Gasto medido con `medir-agentes.py` y pegado en el registro, con los desvíos explicados (15.8)
- [ ] Retrabajo medido con `medir-retrabajo.mjs` (14.2); informe de una página, nota de dos, memoria de 3 KB (E10)
- [ ] Si el dueño va a probar él mismo: guía de prueba en el vault (10.3)
- [ ] Qué pantalla cambió y dónde se ve, dicho explícitamente, con el enlace directo y el entorno (E13)
