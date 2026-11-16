## 5. Fase 3 · Auditar el plan contra el código

Es la fase que más problemas evita. **Ningún plan se construye sin pasar por acá**, aunque lo haya escrito uno mismo ayer.

### 5.1 Cómo se audita

1. **Partir el plan en grupos de tareas** (por ejemplo 1-3, 4-5, 6-7, 8-10) y darle cada grupo a un auditor distinto, en paralelo.
2. Cada auditor, por cada tarea:
   - busca **cada nombre** que el plan usa (función, tabla, campo, ruta, componente) y confirma que existe con esa firma;
   - lee el código real que la tarea modifica;
   - confirma que los tests que el plan da por verdes lo están;
   - busca **quién más usa** lo que se cambia (análisis de impacto);
   - razona la **lógica**, no sólo los nombres: ¿el cálculo nuevo usa los mismos datos que el cálculo que ya existe?
3. **Revisión cruzada entre planes:** lo que el plan A promete, ¿el plan B lo consume con el mismo nombre y el mismo significado?
4. **Prueba en seco:** aplicar el código del plan en una rama descartable, compilar y correr las pruebas. Es la única forma de saber si el código del plan anda.

### 5.2 Qué buscar (lo que más se encontró)

- Nombres que cambiaron desde que se escribió el plan.
- **Dos caminos que calculan lo mismo de forma distinta.** Por ejemplo, un simulador que usa la configuración original mientras el motor real usa la aplicada: el simulador muestra un precio y el sistema aplica otro.
- Validaciones que el plan olvidó (valores infinitos, negativos, vacíos).
- Casos sin datos: ¿qué pasa si falta el costo, la competencia, la marca?
- Concurrencia: ¿qué pasa si dos personas aprueban lo mismo a la vez?
- Consultas N+1 y límites silenciosos: un endpoint que recorta a 100 cuando la pantalla pide 500.
- Permisos: ¿la pantalla calcula lo mismo que el servidor?

### 5.3 El registro de decisiones

Todo lo que la auditoría encuentra y requiere una decisión va a un **registro** (un documento al lado del plan):

- qué se encontró, de qué tipo es (ver 1.9) y en qué tarea;
- las opciones;
- **qué decidió el dueño, y cuándo**, o qué se resolvió técnicamente y por qué.

Después se corrige **el cuerpo del plan**, no sólo el registro: quien construya lee el plan.

### 5.4 La auditoría previa, en paralelo con la primera tarea

Aunque el plan ya se haya auditado, **entre la auditoría y la construcción el código se mueve**: otro plan se construyó encima, se renombró algo, cambió un contrato. Justo antes de construir se hace una pasada más, rápida y de sólo lectura, **mientras se construye la primera tarea**. La primera tarea suele ser de backend, así que no hay choque.

Lo que entrega no es un «está bien», sino dos tablas y una lista:

| Tabla | Una fila por… | Qué dice |
|---|---|---|
| **A · Entre tareas** | cada par de tareas que comparte un archivo o una interfaz | qué produce una y qué consume la otra, y si calzan |
| **B · Cada tarea** | cada tarea | si su texto es coherente consigo mismo (los tests que pide contra el código que pide) y si sus diffs todavía aplican sobre el código de hoy (`git apply --check`) |
| **C · Hallazgos** | cada problema | gravedad (bloquea / importante / menor), evidencia `archivo:línea` y la corrección más chica del plan |

Cada hallazgo se **decide antes de despachar la tarea que lo toca** (ver 6.9), y la decisión viaja en el encargo de esa tarea.

> **📌 Caso real (plan de referencia).** El plan se había auditado el 25 y el 26 de septiembre, pero entre medio se construyó un saneamiento que cambió siete puntos del contrato. La pasada previa no encontró bloqueantes y sí 5 hallazgos importantes. Uno: el plan explicaba todo producto «sin datos» como «falta competencia», cuando el backend usaba ese estado para tres causas distintas, una de ellas «la estrategia pide un precio imposible». Se decidió mostrar la causa real y se corrigió en tres tareas **antes** de escribirlas.

### 5.5 Cuando el código se movió: re-auditar sólo lo roto, sin re-planificar (decidido con Sebastián el 12-oct)

Re-planificar y re-auditar planes enteros fue **el 13 % del gasto de subagentes y la fase más lenta** de un proyecto grande durante dos meses: 25 encargos de Opus de **69 minutos cada uno**, todos en el camino crítico (la construcción esperaba). La causa fue siempre la misma: planes escritos antes de construir el anterior (tres planes seguidos escritos el mismo día; un plan auditado cuatro veces).

**Las reglas:**

1. **Uno detrás del otro** (15.6): el plan N+1 **con código** se escribe cuando el N está construido. Antes se puede escribir su **esqueleto** (tareas, archivos, contratos, decisiones), que no envejece.
2. **El plan va en formato de anclas** (18.2): `**Crear**` / `**Modificar**` / `**Borrar**` `ruta` con bloques `Buscar:` / `Reemplazar por:`. Es lo que permite verificar con un script, y construir con Sonnet. Un plan en prosa («buscá X y agregá arriba…») obliga a construir con Opus y no se puede verificar sin modelo: un plan estaba así, y Opus construyó sus 15 tareas.
3. **Si el código se movió**, primero el script, sin modelo y en milisegundos:
   ```
   node <skill>/scripts/anclas-del-plan.mjs <plan.md> <punta> [--desde N]
   ```
   Simula el plan en orden sobre la punta y marca ✘ cada tarea cuyas anclas no aparecen una sola vez o cuyos `Crear` pisarían un archivo.
4. **Se re-auditan sólo las tareas ✘**, con Sonnet, cada una con su lista de anclas rotas y el `git log` de lo que cambió debajo. La corrección va al cuerpo del plan.
5. **Re-planificar entero** sólo si cambió **el diseño**: un supuesto falso, un dato que no existe, una decisión nueva del dueño. Lo hace Opus, con `[opus-justificado: <motivo>]` en el encargo y la línea en el registro.

La auditoría previa de 5.4 sigue igual: es otra cosa (busca lógica, no anclas).
