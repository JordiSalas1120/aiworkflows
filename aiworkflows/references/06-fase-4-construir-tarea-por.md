## 6. Fase 4 · Construir, tarea por tarea

### 6.1 Aislamiento: cada frente en su rama y su carpeta

- Cada funcionalidad vive en su **rama** y en su propio **worktree** (una carpeta aparte del mismo repositorio). Nunca se hacen commits directos a la rama principal. Nombre, ficha y creación: `ramas.mjs nueva` (27.1).
- Con varias sesiones en paralelo, hay un registro de **quién está tocando qué** (por ejemplo, un archivo `SESSIONS.md` en el repo).
- Los cambios sin commitear que no son tuyos **no se tocan**: son de otra sesión.
- Cada worktree tiene sus propios `.env` y puertos, así dos backends pueden correr a la vez sin pisarse.

### 6.2 Test primero (TDD), siempre

1. Escribir el test que describe el comportamiento.
2. Correrlo y **verlo fallar por la razón correcta**. Si pasa sin código nuevo, el test no prueba nada.
3. Escribir el mínimo código que lo hace pasar.
4. Correr la suite completa del área.
5. Limpiar el código sin cambiar el comportamiento.

Un arreglo de bug empieza con **un test que reproduce el bug**.

### 6.3 Un implementador y una revisión por tarea

Por cada tarea:

1. **Implementador:** construye con TDD, corre las pruebas y hace el commit.
2. **Revisor:** alguien distinto de quien escribió (otra persona u otro agente) lee el diff contra el plan y contra el código de alrededor, y busca defectos de lógica, casos sin datos, concurrencia, seguridad y consistencia con el resto.
3. Los hallazgos se arreglan **encima, en un commit aparte**, y se vuelve a revisar lo arreglado.

⚖️ La revisión **sólo lee**. Por eso puede correr en paralelo con la construcción de la tarea siguiente (ver 6.5).

**La revisión da dos veredictos, y hacen falta los dos:**
1. **¿Cumple lo pedido?** ¿Falta algo, sobra algo o se entendió mal?
2. **¿Está bien hecho?** Errores manejados, casos sin datos, tests que prueban comportamiento, lógica duplicada.

**El revisor no le cree al informe del implementador.** «Lo dejé así por simplicidad» es el implementador calificándose a sí mismo. Se juzga el código.

**Lo que el plan manda también se marca.** Si el plan pide algo que es un defecto (un test que no afirma nada, una lógica copiada, un texto que miente), el revisor lo marca igual como importante, rotulado «lo manda el plan». El plan no se califica a sí mismo: decide el orquestador, con el spec como autoridad.

**El nivel del revisor se escala con el cambio; la revisión nunca se saltea:**

| El cambio | Revisor |
|---|---|
| Chico y mecánico (una línea, un texto, un tipo) | Nivel medio. Es el piso: nunca el más barato, porque tarda más vueltas y termina costando más |
| Grande, o que toca **plata, concurrencia, permisos, borrado de datos o seguridad** | El más capaz |
| Re-revisión de un arreglo chico | Nivel medio |

Revisar un cambio de una línea con un revisor de nivel medio cuesta un par de minutos, y corre mientras se construye la tarea siguiente. No es desperdicio.

### 6.4 La suite completa: al cerrar una fase o al integrar, no en cada ronda

*(Corrige la versión anterior, que pedía la suite completa «en cada tarea». Medido: con tres suites completas por ronda — constructor, revisor, integrador —, de 15 a 30 minutos cada una y la máquina al límite, los rojos por carga obligaban a repetirlas.)*

- **En cada tarea y en cada ronda de arreglos** se corren **los tests de lo tocado** (los archivos que cambian y los que los importan) más el test nuevo que falla antes y pasa después.
- **La suite completa** (unitarias y de punta a punta) se corre **sólo al cerrar una fase y al integrar** en la rama principal, **una vez por cierre** — no una vez por constructor, por revisor y por integrador. Lo que se rompe lejos del cambio sigue apareciendo: en el cierre.
- Se compara **la lista** de fallos contra la de la rama base, no la cantidad. "Seguimos con 6 rojos" puede esconder que se arreglaron 3 y se rompieron 3 distintos.
- Un rojo que "ya estaba" se verifica: se corre en la rama base y se anota.
- **Máximo 3 agentes vivos a la vez, y nunca dos suites completas a la vez** (ni dos de punta a punta sobre la misma base). La suite la corre un agente mecánico que devuelve la lista a un archivo (`SKILL.md`). Al terminar se limpian los procesos huérfanos.

### 6.5 El orden que ahorra tiempo sin perder calidad

```
Tiempo ─────────────────────────────────────────────────────────────▶
Construir:  [ T1 ][ T2 ][ T3 ][ T4 ] ...
Revisar:          [ R1 ][ R2 ][ R3 ][ R4 ]
Arreglar:               [a1]  [a2]  [a3]     ← commit aparte, encima
```

Mientras se construye la tarea N+1 se revisa la N. Se mantienen todas las revisiones, todas las pruebas y todos los arreglos; lo único que cambia es que dejan de esperarse unos a otros.

Hace falta cuidado cuando N+1 depende fuerte de algo que la revisión de N puede cambiar. En ese caso se espera.

**Tres reglas para que el paralelo no choque:**
- **Un solo agente escribe a la vez en el mismo árbol.** Los revisores leen; el que construye escribe. Si la revisión de N pide arreglos mientras se construye N+1, **el arreglo espera a que termine N+1**. Dos commits a la vez en el mismo índice de git se pisan.
- **Nunca dos suites de punta a punta a la vez sobre la misma base de pruebas.** Se vacían la base una a la otra y dan rojos falsos.
- **El arreglo va encima, en un commit aparte**, y se re-revisa sólo ese arreglo (ver 6.10).

> **📌 Caso real (plan de referencia).** Así se construyeron 12 tareas: con 2 o 3 agentes vivos a la vez y nueve arreglos esperando su turno, sin un solo choque de archivos ni de base. La espera costó minutos; un choque habría costado horas.

### 6.6 Commits chicos, por alcance

- Un commit = una cosa: la tarea, un arreglo de revisión, la documentación.
- Mensajes que dicen el **porqué**, no sólo el qué.
- Los hooks de commit (tipos, formato, lint) **no se saltean** (`--no-verify` sólo con autorización explícita, commit por commit).
- Un commit "checkpoint WIP de X, Y, Z" es señal de que la sesión perdió el foco.
- Formato convencional y cuándo se sube cada alcance (tarea, ronda, plan, spec): ver **27.2 y 27.3**. El implementador commitea; **sube el orquestador, al cerrar el spec, con la puerta** (`ramas.mjs subir`).

### 6.7 El registro de la construcción

Mientras se construye se lleva un registro, tarea por tarea:

- qué se hizo;
- qué encontró la revisión y cómo se arregló;
- **decisiones tomadas durante la construcción**: cuando el plan no alcanzaba y se decidió algo, se anota quién y por qué;
- **pendientes diferidos**: lo que se vio y a propósito no se hizo, con el motivo.

Es lo que permite, semanas después, entender por qué el código es como es.

**El registro es un archivo, no la memoria de la sesión.** La conversación se compacta, o se corta, y el orquestador olvida qué tareas ya hizo. El caso más caro que se conoce es volver a encargar tareas que ya estaban terminadas. Por eso:
- la primera línea del registro dice **a qué plan pertenece**;
- cada tarea cerrada tiene su línea: `Tarea N: completa (commits a..b, revisión limpia)`;
- después de una compactación, **se confía en el registro y en `git log`**, no en el recuerdo;
- al terminar, el registro se commitea al repo, al lado de los otros registros de construcción, para que las decisiones sobrevivan.

### 6.8 Cuando aparece algo estructural, se para

Si durante la construcción aparece algo que cambia el diseño (un supuesto falso, un dato que no existe, un caso que el spec no contempló), **no se improvisa**: se para, se explica, el dueño decide y se actualiza el plan.

### 6.9 Decidir sin frenar, y anotar el costo

Un plan en marcha no espera a nadie. Los choques, las ambigüedades y los defectos chicos del plan **se deciden**: el spec es la autoridad, el plan es su argumento, y el criterio del orquestador resuelve lo que ninguno de los dos contesta. Cada decisión va al registro con este formato:

```
Decisión: <qué se decidió> — <por qué> — <qué cuesta si está mal>
```

Una decisión equivocada cuesta trabajo que el dueño puede ver y deshacer. Una sesión parada esperando una respuesta le cuesta el día entero y no compra nada.

**Esto vale para lo técnico y lo visual** (cómo se escribe, qué componente, qué espaciado, un texto provisional). **Las decisiones de comportamiento de producto NO se deciden sin frenar** (E3): quién puede hacer qué, qué se bloquea o sólo se avisa, cuántas firmas hacen falta, qué cambia de estado. Esas se preguntan al inicio (3.2) y, mientras no haya respuesta, ese pedazo no se construye. Tampoco se «avanza de noche» sobre decisiones abiertas: de noche, o sin el dueño, sólo se hace lo que no depende de ellas.

**Sólo cinco cosas frenan y se pregunta:**
1. algo irreversible o destructivo;
2. algo sensible de seguridad;
3. un efecto fuera del árbol de trabajo que se pregunta siempre (merge, push, publicar, desplegar) — salvo el push de la rama de trabajo de un spec terminado, si el `CLAUDE.md` del proyecto lo autoriza y pasa la puerta (27.9);
4. un plan tan roto que cualquier camino es adivinar;
5. una decisión de comportamiento de producto sin respuesta (ver arriba).

**Al terminar, el dueño recibe la lista completa de decisiones**, en orden, cada una con su costo si está mal. Es la única forma de que las decisiones tomadas en su nombre le lleguen. Una decisión que muere con el registro fue una decisión tomada en secreto.

> **📌 Caso real (un plan de 12 tareas).** 60 decisiones técnicas durante la construcción, ninguna sesión parada. Ejemplos:
> - un CSV **sin** la columna de costo borraba el costo de todos los productos: se decidió «sin columna = no se toca», por analogía con la regla de la marca que el dueño ya había fijado;
> - la celda vacía **con** la columna se dejó como estaba y se le preguntó a él.

### 6.10 El ciclo de arreglos

Cuando la revisión encuentra algo que no cumple lo pedido, o un problema crítico o importante:

1. **Los menores no entran al ciclo.** Van al registro como «diferido», con una línea cada uno, y la revisión final decide cuáles se arreglan antes del merge.
2. **Rondas 1 a 3: se retoma al mismo implementador**, con los hallazgos textuales. Conoce la tarea, el código y sus propias decisiones.
3. **Rondas 4 y 5: implementador nuevo, de un nivel más capaz.** Si tres rondas no alcanzaron, el que construyó no ve su propio problema.
4. **Cada ronda termina con una re-revisión acotada:** sólo los hallazgos y el diff del arreglo. El re-revisor dice «resuelto» o «no resuelto» por cada hallazgo y busca roturas nuevas **sólo en el arreglo**. Lo que vea fuera de eso va al registro, no alarga el ciclo.
5. **El arreglo trae su evidencia:** el test que lo cubre, el comando y la salida. Sin las tres cosas no se manda a re-revisar.
6. **Tope de 5 rondas.** Si se llega, el orquestador juzga cada hallazgo abierto:
   - el revisor se equivocó: se estaciona, con la decisión;
   - es real pero nada lo usa después: se estaciona como diferido;
   - es real y otra tarea construye encima: se decide el cambio más chico que destraba y viaja a la tarea siguiente.

**El orquestador no arregla nada él mismo.** Se ensucia su contexto y el arreglo se saltea la revisión.

> **📌 Caso real (plan de referencia).** Ninguna tarea pasó de la primera ronda: cada arreglo se re-revisó una vez y salió limpio. Lo que hizo que alcanzara una ronda fue mandar todos los hallazgos juntos, con `archivo:línea` y la corrección esperada.
