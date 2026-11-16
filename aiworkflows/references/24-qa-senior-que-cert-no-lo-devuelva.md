## 24. QA senior: que cert no lo devuelva

La meta de cada ticket: **QA lo pasa en el primer intento.** Para eso no alcanza con «tests verdes + recorrido»: hay que **pensar como el QA antes que el QA**. Esta parte suma al método las prácticas de un QA senior. Viene de las mejores skills de QA del catálogo aitmpl (ver 24.14) y de nuestros rebotes reales.

> Se aplica **en proporción al riesgo** (24.13) y **dentro del tope de 4 subagentes por ticket**. Casi todo lo hace el orquestador o se suma a un encargo que ya existe. No agrega agentes.

### 24.1 Por qué nos rebotaron (lo que esta parte ataca)

| Rebote real | Causa de fondo | Puerta que lo frena |
|---|---|---|
| Pagos por QR: QA lo devolvió por el «riesgo conocido» de un doble pago en silencio | Un riesgo que **dev** dio por aceptado. Para QA, es un bug | 24.10 · ningún riesgo sin la firma del dueño |
| Recuperar el carrito: el estado se heredaba, pero el asistente igual le preguntaba a la persona | Se probó el **estado interno** y no lo que **ve la persona** | 24.3 · el oráculo es el resultado visible |
| Recuperar el carrito: «sigue pendiente» después de pagar, por un 401 del simulador de mensajería en cert | Un camino que **sólo existe en ese entorno** | 24.3 · matriz de entornos |
| Envío a domicilio: la clave del proveedor de envíos en dev tenía un espacio, y el envío nunca cotizaba | Un dato de configuración del entorno que nadie validó | 24.3 · matriz de entornos |
| Buscador del mapa: coordenadas en grados, minutos y segundos, con coma decimal o invertidas no andaban | Las **entradas** no se partieron en clases | 24.3 · particiones y bordes |
| Tres tickets pasaron a cert sin probarse en dev | Se promovió sin evidencia en un entorno desplegado | 24.10 · 0 ❌ en dev antes de cert |

### 24.2 Puerta 1 · Atacar el spec antes de construir

Se hace antes del plan, sobre el ticket, el spec o el comentario de Jira. Los huecos de un documento siempre aparecen en el momento más caro: a mitad de construir, en el rebote de QA o en soporte. **Se ataca lo que el documento calla.**

**Qué se marca:**
- lo que **no está escrito**: un flujo central sin definir;
- lo que está escrito **sólo para el camino feliz**.

**Qué no se marca:** lo que el documento define entero, lo que excluye a propósito o un gusto distinto.

Una falla sólo cuenta como hueco si los casos sin cubrir piden **otro manejo o recuperación para la persona**. Una cuenta bloqueada necesita un camino para desbloquearla; sin red, la persona hace otra cosa que con una clave mala.

**Los 9 pasos, siempre en este orden.** En cada uno, la pregunta es «¿el ticket responde esto?».

| # | Paso | Preguntas concretas |
|---|---|---|
| 1 | Vacío | ¿Sin registros, usuario nuevo, campo nulo, primera vez? ¿Qué se muestra? |
| 2 | Máximo | ¿10.000 ítems, 200 caracteres, 20 sucursales? ¿Hay paginado, corte o tope? |
| 3 | Falla | ¿5xx, timeout, sin red, un tercero caído (mapas, envíos, pasarela de pago, mensajería)? ¿Qué ve la persona y cómo sigue? |
| 4 | Permiso | ¿Sin permiso, sesión vencida, otro rol, otra empresa? |
| 5 | Concurrencia | ¿Doble clic, dos pestañas, dos pagos, un webhook duplicado, cancelar a mitad? |
| 6 | Interrupción | ¿Se va a mitad y vuelve, entra por un link o una notificación al paso 3, recarga, vuelve atrás? |
| 7 | Lo existente | ¿Qué pasa con los datos y usuarios de antes del cambio? ¿Choca con algo? ¿Se puede revertir? |
| 8 | Textos | ¿El texto crece? ¿Singular y plural, accesibilidad, letra grande? |
| 9 | Alrededores | ¿Qué otras pantallas, flujos, reportes o integraciones toca? ¿Se contradice con algo? |

**Al final, el pre-mortem.** Se imagina la frase «QA lo devolvió» y se escriben 3 historias concretas de por qué fue. Para cada una se mira si el ticket la cubre. Si alguna no está cubierta, vuelve al paso que le toca.

**Regla del escenario:** todo hueco se escribe así: «cuando la persona hace X durante Y, Z no está definido». Lo que no se puede escribir así no es un hueco.

**Chequeo del silencio:** antes de preguntar, se vuelve a buscar en el documento. Preguntar algo que ya estaba escrito le quita crédito al dueño frente a su equipo.

**Severidad:**
- **Bloqueante:** no se puede construir el flujo central, o adivinar mal escribe datos que no se pueden corregir (saldos, pagos, facturas).
- **Mayor:** se puede construir adivinando, pero si la adivinanza falla hay retrabajo.
- **Menor:** hay que confirmarlo antes de QA.

Las capas: `[UI]`, `[API]`, `[DATA]` y `[POLICY]`. **`[POLICY]` es el que más suele ser bloqueante:** quién cobra cuánto y cuándo.

**Salida:** las preguntas entran al lote único de preguntas al dueño (3.2), una por una y con recomendación. Lo bloqueante no se construye «provisional» (6.9).

**No inventar huecos.** Un buen ticket se aprueba. La cantidad de hallazgos no mide nada.

### 24.3 Puerta 2 · La matriz de pruebas del ticket

Se escribe **antes de construir**, junto a la tabla de estados (3.5), con `plantillas/matriz-de-pruebas.md`. Es la lista de lo que se va a probar, y después es la guía para QA.

**Técnicas de diseño, una por tipo de cosa:**

| Qué hay en el ticket | Técnica | Ejemplo real |
|---|---|---|
| Una entrada libre (texto, número, coordenada, link) | **Particiones de equivalencia:** una clase válida y cada clase inválida, un caso por clase | Buscador de mapa: decimal con punto, con coma, DMS, invertida, fuera del país, link con y sin coordenadas, texto, vacío |
| Números, fechas, montos, distancias | **Valores límite:** mín−1, mín, mín+1, máx−1, máx, máx+1, 0 y negativo | Umbral de 300 m: 299, 300, 301 |
| Reglas que combinan condiciones | **Tabla de decisión:** una columna por combinación de condiciones | Envío/retiro × QR vivo/vencido × pin igual/distinto |
| Estados y transiciones | **Transición de estados:** cada transición válida y cada una **inválida** (pagar dos veces, cancelar lo pagado) | Pendiente → pagado → pagado otra vez |
| Muchas opciones juntas | **Pairwise:** que cada par de valores aparezca al menos una vez | Rol × método de pago × tipo de entrega |
| Experiencia | **Adivinar errores:** la lista de 24.8 | Doble clic, recargar, sesión vencida |

**El oráculo es lo que ve la persona.** Cada caso dice qué tiene que **ver o recibir** la persona: el texto, la pantalla, el mensaje de WhatsApp, el monto cobrado o la factura. No alcanza con «el estado quedó en X». Si el estado es correcto y la persona ve otra cosa, el caso falla.

**Matriz de entornos.** Para cada caso se marca dónde se probó: local, dev o cert. Y se listan **las diferencias de cada entorno** que tocan el flujo:
- claves y secretos, con su formato (espacios, comillas);
- simuladores contra servicios reales (el wa-simulator devuelve 401 en cert);
- datos sembrados contra datos reales;
- feature flags;
- versiones de servicios y terceros.

Un camino que sólo pasa en un entorno se prueba **en ese entorno** o se declara (24.11).

**Los negativos van primero.** Por cada caso feliz, al menos uno que tiene que fallar bien: entrada inválida, sin permiso, tercero caído o repetido. La mayoría de los rebotes están ahí.

### 24.4 Puerta 3 · Cazar bugs en la revisión (no sólo «revisar»)

La revisión de cada tarea y la de la rama siguen este protocolo, que ya está en los encargos del revisor (`plantillas/encargos.md`).

1. **Alcance.** El diff exacto, más `--stat`. Lo generado, lo vendorizado y los lockfiles, afuera. Si el diff pasa de unas 1.500 líneas, primero lo riesgoso: auth, plata, persistencia, migraciones, concurrencia, APIs públicas y parseo de entradas.
2. **Intención en una frase.** «Este cambio debería…». Muchos bugs graves son un cambio que hace otra cosa que lo que dice: arregla 1 de 3 lugares, chequea el flag en la UI y no en la API.
3. **Leer más allá del diff:**
   - firma o comportamiento cambiado → **todos los que la llaman** (`grep`, graphify);
   - condición nueva → la rama que **no** se toma, el vacío y el borde;
   - código borrado → contra qué protegía;
   - config, env o esquema → que cambiaron juntos en cada entorno;
   - los tests del diff → ¿fallarían si se revierte el arreglo?
4. **Mapa de la superficie.** Por archivo: entradas del usuario, consultas, chequeos de auth y authz, estado de sesión, llamadas externas y webhooks.
5. **Cazar, por área.**
   - **Corrección:** off-by-one, nulos, tipos (número contra texto), zona horaria.
   - **Errores:** excepción tragada, `await` que falta, reintento sin tope, escritura parcial sin rollback.
   - **Seguridad:** ver 24.5.
   - **Datos:** migración que bloquea o borra, caché sin invalidar, lectura y escritura fuera de transacción.
   - **Concurrencia:** chequear y después usar (TOCTOU), webhook duplicado, N+1.
   - **Contratos:** payloads, columnas o eventos renombrados sin actualizar a quien los usa.
   - **Tests:** que no prueban el camino nuevo.
6. **Verificar cada hallazgo antes de informarlo:**
   - escribir el escenario de falla concreto: entrada → camino → resultado malo, con `archivo:línea`;
   - buscar la guarda que se nos pasó: un caller que valida, el framework, el tipo o un test existente;
   - **reproducirlo si es barato**;
   - ponerle una etiqueta: **Confirmado** (reproducido o trazado), **Plausible** (decir qué lo confirmaría) o **Descartado** (no se informa).
7. **Auditoría antes de concluir:**
   - la lista de archivos leídos enteros;
   - cada ítem del checklist marcado como «limpio» o «hallazgo»;
   - **lo que no se pudo verificar y por qué**.
   Un informe sin esto no se acepta.

Ni el estilo ni lo hipotético son hallazgos. Un informe vacío es válido si el cambio está bien.

### 24.5 Seguridad mínima en cada ticket que toca backend

No es un pentest. Es un pase **sobre los endpoints y datos tocados**, que hace el revisor:

- [ ] **Authz e IDOR:** el id que manda la request no alcanza. Se prueba con un usuario de otra empresa (8.3), cambiando el id en la URL, en el body y en los filtros. También con otro verbo (GET protegido, PUT no).
- [ ] **Inyección:** SQL y raw queries, shell, rutas y plantillas. En prompts de LLM, el texto del usuario no da instrucciones al sistema.
- [ ] **XSS:** lo que escribe el usuario y se muestra, incluido lo que viene de terceros, como nombres de Google Places.
- [ ] **Errores que filtran:** stack traces, SQL o claves en la respuesta o en logs. Un secreto se loguea como «seteado», nunca su valor.
- [ ] **Abuso:** endpoints nuevos sin límite de tasa o de tamaño, y paginado sin tope.
- [ ] **Webhooks y pagos:** firma verificada, idempotencia (el mismo evento dos veces) y montos que vienen del servidor, nunca del cliente.

### 24.6 Depurar sin adivinar (bugs y rebotes)

**Ley de hierro: ningún arreglo sin causa raíz.** Proponer un arreglo «para probar» también cuenta como arreglo.

1. **Leer el error entero** y el comentario de QA completo, con su ORD, sus logs y su entorno.
2. **Reproducir** con los pasos exactos. Si no se reproduce, se juntan más datos; no se adivina.
3. **Qué cambió:** `git log` y los deploys. Si hay un commit bueno y un comando que reproduce el bug: `git bisect start <malo> <bueno> && git bisect run <cmd>`.
4. **Evidencia en cada frontera** (UI → API → agente → tercero → base): un log temporal por capa, una sola corrida, y se mira **dónde el dato bueno se vuelve malo**.
5. **Seguir el dato hacia atrás** hasta su origen. Se arregla en el origen, no donde explotó.
6. **Una hipótesis por vez:** «X es la causa porque Y». Se prueba con el experimento más chico y se revierte el experimento.
7. **Primero el test rojo** que reproduce el bug; después **un solo arreglo**, sin «ya que estoy».
8. **Tres arreglos fallidos → no hay cuarto.** Se para, se le cuenta al dueño qué reveló cada intento y se discute el diseño.

Señales de que estás adivinando: «probemos cambiar X», «seguramente es X», «arreglo rápido y después investigo», «uno más» después de dos que fallaron.

El informe: **causa raíz** con su evidencia, **arreglo**, **prueba** (rojo antes y verde ahora) y **descartado**.

En un **rebote**, esto se aplica sólo al punto que reportó QA (alcance mínimo). Lo que QA ya validó no se toca, pero se re-corre su caso de la matriz para no romperlo.

### 24.7 Evidencia antes de afirmar

**Nada se afirma sin una evidencia fresca de este mismo turno.**

| Afirmación | Exige | No alcanza |
|---|---|---|
| «Los tests pasan» | La salida del comando con 0 fallos | Una corrida anterior o «deberían pasar» |
| «Bug arreglado» | El síntoma original reproducido y ahora ausente | «Cambié el código» |
| «El test de regresión sirve» | **Rojo sin el arreglo, verde con el arreglo** (`scripts/rojo-sin-arreglo.mjs`) | Que pasa una vez |
| «El agente terminó» | `git diff` y la verificación propia | El informe del agente |
| «Cumple el ticket» | Cada criterio del ticket con su evidencia | «Los tests pasan» |
| «Anda en cert/dev» | El caso de la matriz recorrido en ese entorno, con captura o log | «Anda en local» |

Palabras que no se usan sin evidencia: «debería», «seguramente», «listo», «perfecto».

### 24.8 Sesión exploratoria con charter (lo que la matriz no imagina)

Se hace después de la matriz, en el mismo encargo del recorrido. Son **30 a 45 minutos** con un charter escrito:

> «Explorar **<área>** con **<recursos: usuarios, datos, entorno>** para descubrir **<riesgo: dobles cobros, estados inconsistentes…>**».

**La lista de ataques (adivinar errores):**
- **Navegación:** atrás, adelante, recargar a mitad, abrir el mismo flujo en dos pestañas, entrar por un deep link al paso intermedio.
- **Tiempo:** dejar vencer la sesión, el QR o el token y seguir; cambiar de día o de zona horaria; que el reintento llegue tarde.
- **Repetición:** doble clic, doble envío, el mismo webhook dos veces, pagar dos veces.
- **Red:** lenta (throttling), offline a mitad, un tercero que responde lento o mal.
- **Datos:** vacío, enorme, con emojis o acentos, con espacios al inicio o al final, en mayúsculas, el formato de otro país.
- **Roles:** el mismo flujo con cada rol sembrado y con una persona de dos empresas.
- **Conversacional (agentes LLM):** cambiar de opinión a mitad, mandar dos mensajes seguidos, escribir lo que el botón haría, o salir y volver horas después. **Cada caso se corre al menos 3 veces, porque el modelo no es determinista**, y se informa el rango.

Las notas: qué se probó, qué se encontró (con captura) y qué quedó sin explorar.

### 24.9 Calidad no funcional, en proporción

| Si el ticket… | Se mide | Con qué |
|---|---|---|
| Tiene pantalla | Accesibilidad básica: teclado, foco visible, labels, contraste 4,5:1, sin `outline: none` | `@axe-core/playwright` en la spec del recorrido; 0 violaciones critical/serious nuevas |
| Agrega una carga o una pantalla pesada | Presupuesto: LCP < 2,5 s, CLS < 0,1, JS nuevo justificado | Lighthouse con throttling, antes y después |
| Agrega un endpoint con volumen | p95 con el volumen real (8.5) | Una medición; **k6** sólo si se espera carga concurrente |
| Llama a un tercero | Timeout, reintento con tope y mensaje claro al caer | Un test con el tercero falso devolviendo 500, timeout y basura |

### 24.10 La puerta de cert (antes de pasar un ticket a QA)

Un ticket **no pasa a cert** si falta algo de esta lista. El informe va en el registro, con una página como máximo.

- [ ] Ataque al spec hecho: 0 bloqueantes abiertos y los mayores respondidos por el dueño (24.2).
- [ ] Matriz de pruebas con **0 ❌ en dev** (o en el entorno desplegado que corresponda), no sólo en local (24.3).
- [ ] Las diferencias de entorno que tocan el flujo, chequeadas en cert: claves, simuladores, flags (24.3).
- [ ] Cada bug arreglado deja su test, **rojo sin el arreglo y verde con el arreglo** (24.7).
- [ ] Revisión con el protocolo de caza, sin Confirmados abiertos (24.4); seguridad mínima, si toca backend (24.5).
- [ ] Sesión exploratoria hecha, con sus notas (24.8).
- [ ] **Ningún «riesgo aceptado» sin la firma del dueño.** Si QA lo puede ver como bug, se arregla o el dueño lo acepta por escrito en el ticket **antes** de pasar a cert.
- [ ] Guía para QA honesta (24.11): describe sólo lo que se verificó.
- [ ] Rebasado sobre el dev más reciente, sin pisar cambios ajenos.

### 24.11 La guía para QA (comentario de Jira)

Con `plantillas/guia-para-qa.md`. Es la cara del ticket para QA:

- **Qué cambió**, en una frase de negocio, con el **entorno y el enlace directo**.
- **Datos de prueba:** usuarios, comercio, productos y montos, listos para usar.
- **Casos** de la matriz, con precondición, pasos, dato y **resultado esperado visible**. Primero los negativos y los bordes que más importan.
- **Qué NO se probó y por qué**, por ejemplo «requiere un pago real de QR». Nunca se afirma un comportamiento que no se probó: así nació el rebote de los pagos por QR.
- **Logs útiles**, para que QA o soporte encuentren el caso (`[ABC-123] …`).

### 24.12 Cuando encontramos un bug ajeno al ticket

Se reporta, no se arregla dentro del ticket (alcance). El formato:

- **título:** qué falla, dónde;
- **entorno**, **pasos exactos**, **esperado contra obtenido**;
- **evidencia:** captura, log u ORD;
- **severidad y prioridad**;
- **sospecha de causa**, si ya hay, marcada como sospecha.

Se le propone al dueño como ticket aparte.

### 24.13 Cuánto aplicar, y quién lo hace dentro del tope de 4 subagentes

| Tipo de ticket | Se aplica |
|---|---|
| Toca plata, pagos, facturas, permisos, multi-tenant, estado de conversación o datos irreversibles | **Todo** (24.2 a 24.11), más mutaciones (11.7) |
| Funcionalidad nueva con pantalla o flujo | 24.2, 24.3, 24.4, 24.7, 24.8, 24.10, 24.11 y accesibilidad básica |
| Cambio chico de texto o estilo | 24.3 reducida (los casos afectados), 24.7 y 24.11 |
| **Rebote de QA** | **Sólo** 24.6 sobre lo reportado, 24.7, el caso del rebote más los casos de la matriz que tocan ese camino, y 24.11 actualizada. Sin extras (alcance mínimo) |

**Quién hace cada cosa sin sumar agentes:**

| Encargo | Quién |
|---|---|
| Ataque al spec, pre-mortem y matriz | Los escribe el orquestador, en la sesión, antes del plan |
| Construir | Construye `sonnet`, con la matriz como fuente de los tests |
| Revisar | Revisa `opus` o `sonnet` según la tabla, con el protocolo de caza (24.4) y la seguridad (24.5) en el mismo encargo |
| Ronda | `sonnet`, que también corre `rojo-sin-arreglo.mjs` |
| Recorrido | `sonnet`, que recorre la matriz, hace la sesión exploratoria y pasa axe en el mismo encargo |
| Suites, Lighthouse y la puerta de cert | Los corre el orquestador |

### 24.14 Fuentes (para profundizar)

Las ideas de esta parte salen de estas skills del catálogo aitmpl.com (licencia MIT), adaptadas al método. Para instalar una aparte: `npx claude-code-templates@latest --skill <ruta>`.

| Skill | Ruta | Qué tomamos |
|---|---|---|
| code-reviewer (34 k descargas) | `development/code-reviewer` | Leer más allá del diff; el escenario de falla; Confirmado, Plausible o Descartado |
| find-bugs (Sentry) | `sentry/find-bugs` | El mapa de la superficie; la auditoría antes de concluir |
| systematic-debugging (obra/superpowers) | `development/systematic-debugging` | La ley de hierro, las 4 fases, bisect y la regla de los 3 arreglos |
| verification-before-completion | `development/verification-before-completion` | La evidencia antes de afirmar; rojo-verde-revertir |
| devil | `productivity/devil` | El ataque al spec en 9 pasos, el pre-mortem y el chequeo del silencio |
| qa-test-planner | `ai-research/qa-test-planner` | El formato de casos, de plan y de reporte de bug |
| test-driven-development | `development/test-driven-development` | Ver fallar cada test por la razón correcta |
| playwright-e2e-builder / e2e-testing-patterns | `development/playwright-e2e-builder` | Locators por rol, fixtures de datos, esperar la red y no timers |
| accessibility | `development/accessibility` | El checklist WCAG 2.1 AA, axe y Lighthouse |
| idor-testing, api-fuzzing-bug-bounty, web-security-testing | `security/...` | El pase de authz e IDOR, la inyección y los webhooks |
| k6-load-testing, web-performance-optimization | `development/k6-load-testing`, `web-development/...` | Los umbrales de rendimiento y la carga |
| pre-mortem | `productivity/pre-mortem` | El fracaso en pasado y las señales tempranas |
