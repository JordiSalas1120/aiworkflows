## 25. Recursos y presupuesto: un flujo continuo que no se cae

Un lote que se corta por falta de memoria pierde más de lo que ahorra: el agente muere a mitad, queda un worktree sucio, la suite queda colgada y hay que retomar. **Los subagentes no se abren a lo loco.** Cada uno cuesta plata y memoria, y la máquina es compartida: sesiones de Claude, servidores, navegadores de prueba y suites. Por eso esto es un sistema, no una buena intención: un **medidor** (`scripts/recursos.mjs`) y una **guardia** (`scripts/guardia-de-modelos.mjs`) que frena lo que no entra.

### 25.1 El presupuesto de un ticket

| Recurso | Tope | Quién lo hace cumplir |
|---|---|---|
| Subagentes por ticket | **4** (construir · revisar todo junto · una ronda con su verificación · el recorrido) | La guardia. Para pasarse hace falta el «sí» del dueño y `[sobre-tope: <motivo>]` en el prompt |
| Agentes vivos a la vez | 3 en verde, 1 en amarillo y 0 en rojo | El semáforo |
| Suites a la vez | **1**, nunca dos | La guardia sobre Bash y PowerShell |
| Opus | Sólo en su fila de la tabla | La guardia |

**Cómo se ahorra un agente sin bajar la calidad:**
- **Seguir con un agente vivo por `SendMessage`.** No cuenta como nuevo, y ese agente ya tiene el contexto.
- **Juntar** la revisión de varias tareas en un solo encargo.
- La ronda y su verificación van en el **mismo** agente.
- **Lo mecánico lo hace el orquestador:** suites, scripts, `rojo-sin-arreglo.mjs`, `recursos.mjs` y Lighthouse.
- Antes de lanzar, se pregunta: «¿esto lo puede hacer un script o yo mismo en dos comandos?».

**La clave del ticket va en la descripción de cada encargo** (`ABC-123 · revisar`). Así la guardia cuenta por ticket. Si no la encuentra, cuenta por sesión.

**Al empezar el ticket, el registro anota** «Presupuesto: 4 encargos (construir sonnet · revisar opus · ronda sonnet · recorrido sonnet)». Al cerrar, se anotan los usados y el gasto medido (`medir-agentes.py`).

### 25.2 El semáforo de la máquina

`node <skill>/scripts/recursos.mjs` mide la RAM libre, la CPU y el disco, y lista los procesos de desarrollo abiertos con su RAM y su antigüedad. Su código de salida es 0 en verde, 1 en amarillo y 2 en rojo.

| Nivel | Cuándo | Qué se puede |
|---|---|---|
| 🟢 Verde | RAM libre ≥ 22 %, CPU < 75 %, disco ≥ 8 GB | Hasta 3 agentes vivos y 1 suite |
| 🟡 Amarillo | RAM libre entre 12 y 22 %, CPU entre 75 y 90 %, o disco entre 3 y 8 GB | 1 agente vivo, en primer plano. Suites sólo de lo tocado, con pocos workers (`vitest --maxWorkers=2`, `pytest -n 2`, `playwright --workers=1`). Antes de seguir, se cierran los sobrantes |
| 🔴 Rojo | RAM libre < 12 % o < 1,5 GB, CPU ≥ 90 %, o disco < 3 GB | **Nada nuevo.** La guardia frena agentes y suites. Se cierran sobrantes o se espera a que termine lo que corre |

Los umbrales están en `UMBRALES` de `scripts/lib-recursos.mjs`.

### 25.3 Las tareas sobrantes: detectarlas y cerrarlas

El medidor marca como **sobrante**:
- un **huérfano**: un servidor de desarrollo, un observador o un navegador cuyo lanzador ya no existe (típico de un `run_in_background` cuya sesión terminó);
- una **suite colgada**: corriendo hace más de 30 minutos;
- un **navegador de pruebas** (Playwright o Chromium headless) sin una suite viva que lo use.

**Cómo se cierran:**
- `recursos.mjs --cerrar-sobrantes` cierra todos los sobrantes.
- `recursos.mjs --cerrar <pid,…>` cierra esos procesos con todo su árbol.

**Nunca cierra una sesión de Claude ni la propia.** Un proceso que no es de desarrollo tampoco, salvo con `--forzar`. Las sesiones de Claude abiertas se informan con lo que ocupan, para que el dueño cierre las que no usa.

**En Windows no se pausan procesos**, porque no hay un SIGSTOP confiable. **Pausar es una decisión del flujo:** no lanzar lo siguiente hasta que haya verde, y dejar lo pendiente anotado en el registro.

### 25.4 El ciclo sin caídas

1. **Al empezar el lote o el ticket:**
   - correr `recursos.mjs`;
   - cerrar los sobrantes de sesiones anteriores;
   - listar `git worktree list`: los worktrees de tickets cerrados se borran con el «sí» del dueño;
   - anotar el presupuesto en el registro.
2. **Antes de cada encargo y de cada suite:** el semáforo. La guardia lo hace sola; sin guardia, lo hace el orquestador.
3. **Lo que uno abre, uno lo cierra:**
   - cada servidor o navegador lanzado en segundo plano se anota con su PID en el registro;
   - al terminar la tarea, se cierra con `recursos.mjs --cerrar <pid>`;
   - el worktree temporal de `rojo-sin-arreglo.mjs` se borra solo.
4. **En amarillo, en serie:** un agente por vez y en primer plano. Los paralelos esperan.
5. **Si algo se cae** (límite de uso, memoria, una sesión cerrada):
   - nada se rehace de cero;
   - `recursos.mjs` cierra lo que quedó colgado;
   - un solo agente retoma con el encargo «Retomar una tarea cortada», usando `git status`, el registro y `git log`.
6. **Sesión nueva por lote**, o pasados unos 150 turnos (regla 6). Una sesión larga es la que más memoria ocupa.

### 25.5 La guardia, instalada

`node <skill>/instalar.mjs --guardia` la registra en cada cuenta con el matcher `Agent|Task|Bash|PowerShell`.

**Qué frena:**
- un encargo sin `model`, o un modelo fuera de su fila;
- el quinto subagente del ticket;
- cualquier agente o suite con la máquina en rojo;
- una segunda suite mientras otra corre.

**Variables:**
- `AIWORKFLOWS_TOPE=<n>` cambia el tope de subagentes;
- `AIWORKFLOWS_RECURSOS=0` apaga los chequeos de recursos (por ejemplo, en CI).

Si un error es de la guardia misma, deja pasar: **nunca bloquea por su propia falla**.

**Si te frena, no la esquives:**
- seguí con un agente vivo por `SendMessage`;
- cerrá sobrantes;
- esperá a que termine lo que corre;
- o pedile el «sí» al dueño.
