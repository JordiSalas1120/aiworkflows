# Encargos listos para copiar

<!-- PLANTILLAS de la skill aiworkflows. Completar lo que está entre <…>. Por qué cada frase: método, 6.3, 6.10 y 15.4. `<skill>` es la carpeta de la skill (~/.claude-skills/aiworkflows). -->

**Regla, no parche (método 1.11):** salvo que el dueño diga «hotfix» o «emergencia», TODO encargo de construcción o arreglo lleva esta frase: «La regla vive en un solo lugar (helper/constante/servicio) y todos los usos existentes pasan a usarlo; agregá un guardián (test que lee el código) que falle si se vuelve a escribir a mano; nada atado a nombres, ids, slugs, monedas o datos de hoy; pensá en un tenant nuevo y en dos tenants a la vez». Y TODO encargo al revisor pregunta: «¿regla o parche?» y «¿qué pasa con un tenant nuevo o con dos tenants a la vez?».

**El modelo de cada encargo (SKILL.md):** cada `Agent` lleva `model` explícito. Construir y aplicar rondas: `sonnet`. Revisar: `sonnet` en pantalla y textos, `opus` si toca dinero, permisos, tenant, concurrencia, migraciones o borrado. Explorar, correr suites, juntar capturas y resumir: `haiku` (encargos al final de esta parte). Opus fuera de su fila sólo con `[opus-justificado: <motivo>]` en el prompt; la guardia frena el resto.

## Al implementador: una tarea (subagente `sonnet` nuevo)

> Sos el implementador de una tarea de un plan (leé primero CLAUDE.md del proyecto). Contexto: las Tareas 1 a <N−1> del plan ya están hechas y aprobadas (ver <registro> y git log). Implementá la Tarea <N>: bash scripts/tarea-del-plan.sh <N> <plan>, más las secciones Global Constraints y Review Focus del plan y las filas de la Tarea <N> en las auditorías. <Lo que cambió desde que se escribió el plan, si algo cambió.> TDD con rojo y verde anotados; un commit local con tu firma (Implementado-por: Claude <modelo>); decí si viste correr el hook; nunca push. Medí los conteos de tests y no atribuyas una diferencia sin comprobarla. Si el git add del plan no nombra todos los archivos que tocás, incluilos y avisalo. Si un Buscar no coincide o un test falla por algo que el plan no previó, pará y explicalo en vez de improvisar. Regla, no parche: la regla vive en un solo lugar y la usan todos, con un guardián que impida escribirla a mano; nada atado a datos de hoy; pensá en un tenant nuevo. Al terminar, tu informe corto.

## Al implementador: ronda de arreglo (`sonnet`; `SendMessage` al mismo implementador si sigue vivo, si no uno nuevo con la ruta de su informe)

> Revisión de la Tarea <N>: aprobada con menores, <0> errores del implementador. Arreglos, ronda 1: (1) <archivo:línea>: <qué pasa, con un ejemplo>. Corrección: <exacta>. (2) … <Ninguna tarea posterior toca estos archivos | La Tarea <M> tiene Buscar sobre <archivo>: antes de commitear, comprobá que cada uno siga apareciendo una vez; si alguno se rompe, pará y avisá.> TDD: un test por arreglo (rojo, después verde); si un test pasa sin el arreglo, no lo dejes y decilo. Commit local aparte: «fix(<área>): <qué>», con tu firma. Nunca push. Informe corto.

Sólo van al implementador los hallazgos con la **corrección exacta**. Si un hallazgo dice «hay que decidir», primero Opus escribe la corrección o decide el dueño (método, 6.10).

## Re-revisión acotada de una ronda (subagente nuevo, mismo nivel que la revisión original)

> Sos el re-revisor de la ronda <R> de arreglos de la Tarea <N>, aplicada por otro agente (<modelo>). SÓLO LEÉS y corrés tests. Lo que revisás: git diff <commit-antes-de-la-ronda>..<commit-de-la-ronda>. Los hallazgos y su corrección pedida: <lista o ruta>. Para cada uno decí: cerrado / cerrado con un problema nuevo / no cerrado, con archivo:línea y un ejemplo. Comprobá que cada test nuevo falla sin el arreglo (revertilo en una copia o razonalo con el código) y corré <tests y tipos>. Mirá también si el diff toca algo que la ronda no pedía. No revises de nuevo lo que no está en la ronda. Conciso.

## Retomar una tarea cortada (límite de uso, sesión cerrada; `sonnet` nuevo)

> Una tarea quedó a medias. Seguí exactamente donde quedó: revisá git status, el registro <ruta> y git log desde <commit-base>, terminá lo que estaba en curso con su commit y seguí con lo que falta de la Tarea <N>, con las mismas reglas. Al final, el informe corto.

## Antes del revisor: la fidelidad, con un script (sin modelo)

    node <skill>/scripts/fidelidad-tarea.mjs <plan.md> <N> <commit-base> <commit-tarea> [repo]

Si da «✔ IDÉNTICA AL PLAN», el revisor no la rehace. Si no, se le pasa la salida al revisor.

## Al revisor (subagente nuevo, por tarea: Opus si toca dinero/precios, motor, concurrencia, permisos, multi-tenant, migraciones o borrado; Sonnet si es pantalla y textos)

> Sos el revisor de la Tarea <N> de un plan, implementada por otro agente (<modelo>). SÓLO LEÉS y corrés tests/chequeos: no edites archivos ni commitees. Repo: <ruta> (rama <rama>). Lo que revisás: git diff <base>..<head> (<qué toca>). Contra qué: la Tarea <N> del plan (<cómo sacarla>; incluí Global Constraints, Review Focus y las filas de la tarea en las auditorías), el spec <ruta> y la maqueta <ruta>.
>
> Verificá, por importancia: 1. <Lo delicado de esta tarea: precios, aislamiento por cliente, permisos, que ningún cálculo cambie.> 2. La fidelidad al plan ya la comprobó un script (idéntica): NO la rehagas; mirá la integración con lo construido antes (piezas compartidas, tipos entre back y front). 3. Corré <tests y tipos>. El implementador midió <números>: confirmá o refutá midiendo. 4. Que la tarea siguiente siga aplicando: probá en seco sus Buscar sobre <head>. 5. Pantalla contra spec y maqueta: textos exactos, singular/plural, «—», un solo botón primario, tokens de color. 6. ¿Regla o parche? Si la tarea arregla o define una regla de negocio, ¿vive en un solo lugar, la usan todos los lugares que la necesitan (buscalos) y hay un guardián? ¿Algo atado a nombres, ids, monedas o datos de hoy? ¿Qué pasa con un tenant nuevo y con dos tenants a la vez?
>
> 7. CAZÁ BUGS (método 24.4):
>    - Escribí en una frase qué debería hacer el cambio.
>    - Leé más allá del diff: todos los que llaman a lo que cambió de firma o comportamiento, la rama que NO se toma, el vacío y el borde, contra qué protegía el código borrado, y config/env/esquema en cada entorno.
>    - Mapeá la superficie: entradas, consultas, auth y authz, sesión, llamadas externas y webhooks.
>    - Cazá por área: corrección, errores (await que falta, excepción tragada), datos y transacciones, concurrencia (TOCTOU, webhook duplicado), contratos y tests que no prueban el camino nuevo.
>    - Si toca backend, hacé el pase de seguridad mínima (24.5): IDOR con un usuario de otra empresa, inyección, XSS, errores que filtran, límites, y en webhooks y pagos la firma, la idempotencia y que el monto venga del servidor.
>    - Comprobá con la matriz (<ruta de la matriz>) que cada caso tiene su test, y que el test afirma lo que VE la persona.
>
> 8. VERIFICÁ cada hallazgo antes de informarlo: el escenario de falla concreto (entrada → camino → resultado malo), buscá la guarda que se te pudo pasar y reproducilo si es barato. Etiquetalo Confirmado o Plausible (decí qué lo confirmaría). Lo Descartado no se informa. Ni el estilo ni lo hipotético son hallazgos.
>
> Formato: hallazgos con severidad (bloqueante / importante / menor), Confirmado o Plausible, archivo:línea, el escenario de falla, la corrección exacta, el TIPO («se salió del plan», «error de criterio», «error mecánico», «falla del plan») y si una tarea posterior toca ese archivo con un Buscar.
>
> Antes del veredicto, la AUDITORÍA DE CIERRE: archivos leídos enteros, cada ítem de 7 marcado «limpio» o «hallazgo», y lo que NO pudiste verificar y por qué.
>
> Cerrá con veredicto: aprobada / aprobada con menores / requiere cambios. Conciso, una página como máximo.

## Re-auditar sólo las tareas con anclas rotas (`sonnet`, método 5.5)

Primero, sin modelo: `node <skill>/scripts/anclas-del-plan.mjs <plan.md> <punta> [--desde N]`. Un encargo por tarea ✘ (en paralelo si son varias):

> Sos auditor de la Tarea <N> de un plan, SÓLO para ponerla al día con el código de hoy. SÓLO LEÉS el código; escribís únicamente el plan, en esa tarea. Repo: <ruta>, punta <commit>. La tarea: bash scripts/tarea-del-plan.sh <N> <plan>. Lo que cambió debajo desde que se escribió: git log --oneline <commit-del-plan>..<punta> -- <archivos de la tarea>. Las anclas rotas que marcó el script: <pegar las líneas ✘ de esa tarea>. Para cada una: encontrá el texto actual equivalente y corregí el Buscar (y el Reemplazar por, si el código de alrededor cambió); si el cambio de abajo vuelve falso un supuesto de la tarea (un nombre, un contrato, un comportamiento), NO lo resuelvas: describilo como «cambia el diseño» con archivo:línea. Al terminar, volvé a correr el script con --desde <N> y pegá su salida. Informe en ≤ 15 líneas.

Si alguna dice «cambia el diseño», esa tarea la re-planifica Opus con `[opus-justificado: …]` o la decide el dueño.

## Revisión de toda la rama (al cerrar)

> Sos el revisor FINAL de una rama completa antes de llevarla a <dev>. SÓLO LEÉS. Lo que revisás: git diff origin/<principal>...HEAD. Material: el plan, el registro (no repitas lo diferido salvo que sea más grave), el spec y la maqueta. Tu valor está en lo que una revisión por tarea NO ve: 1. integración entre tareas (piezas compartidas, archivos que tocaron dos tareas, tipos entre back y front); 2. código suelto; 3. que ninguna función de hoy se haya perdido (recorré cada pantalla y listá cada acción que existía; confirmá que sigue o que un ruling la saca); 4. vocabulario entre pantallas y palabras prohibidas; 5. diseño transversal; 6. seguridad y datos en el backend tocado; 7. regla o parche: reglas de negocio escritas a mano en varios lugares, cosas atadas a datos de hoy, y qué pasa con un tenant nuevo o dos tenants a la vez. Separá lo que BLOQUEA de lo que puede ir después. Veredicto: lista / lista con menores / no está lista.

## Al depurador: un bug o un rebote de QA (`sonnet`; `opus` si toca plata, estado o concurrencia, o si el bug no se reproduce; método 24.6)

> Sos el depurador de <TICKET>. QA reportó: <comentario completo de QA, con ORD, entorno y hora>. Repo: <ruta> (rama <rama>, base <commit>). ALCANCE MÍNIMO: sólo esto; no toques lo que QA ya validó ni agregues mejoras.
>
> Ley de hierro: NINGÚN arreglo sin causa raíz.
> 1. Reproducí con los pasos exactos, o con un test o script que reproduzca el síntoma. Si no se reproduce, juntá evidencia (logs <dónde>) y no adivines.
> 2. Mirá qué cambió (git log, los deploys); si hay un commit bueno conocido, usá git bisect run.
> 3. Seguí el dato por cada frontera (UI → API → agente → tercero → base) hasta donde el dato bueno se vuelve malo, y arreglá en el origen.
> 4. Una hipótesis por vez, con el experimento más chico, y revertí cada experimento.
>
> Entregá ANTES de arreglar: la causa raíz con su evidencia y la corrección propuesta. El orquestador se la muestra al dueño. <Si el dueño ya aprobó: después escribí el test que reproduce el bug (rojo), hacé UN arreglo, corré node <skill>/scripts/rojo-sin-arreglo.mjs --base <commit-base> --test "<cmd>" --enlazar <deps> y los tests de lo tocado; un commit local con tu firma; nunca push.>
>
> Si 3 arreglos no alcanzan, parás y explicás qué reveló cada intento. Informe: causa raíz · arreglo · prueba (rojo/verde, salida del script) · descartado.

## Al probador QA: recorrido de la matriz más exploratoria (`sonnet`; es el encargo de recorrido de la regla 0, ampliado — método 24.3 y 24.8)

> Sos el probador QA de <TICKET> en <entorno: dev | local> (<url / número de prueba>), con los usuarios sembrados (<cómo>). La matriz: <ruta de la matriz>.
>
> 1. Recorré CADA caso de la matriz, primero los negativos y los bordes. El esperado es lo que la persona VE o RECIBE: comparalo literal. Marcá ✅ / ❌ en la columna del entorno, con evidencia (captura con nombre, log u ORD) en <tmp/…/evidencia/>. En los flujos conversacionales con LLM, corré cada caso 3 veces e informá el rango.
> 2. Hacé una sesión exploratoria de <30-45> min con el charter «Explorar <área> con <recursos> para descubrir <riesgo>». Usá la lista de ataques de 24.8: atrás, recargar, dos pestañas, deep link; vencimientos; doble clic y doble envío; red lenta u offline; datos raros; cada rol; en conversación, cambiar de opinión y mandar dos mensajes seguidos.
> 3. <Si hay pantalla:> pasá @axe-core/playwright en cada pantalla tocada y anotá las violaciones critical o serious.
>
> REGLAS: respaldo antes de tocar datos y devolución al terminar; no arregles nada; lo que veas mal va con captura. No digas que algo anda sin evidencia.
>
> Entregá, en una página como máximo: la matriz con los ✅/❌ y la evidencia, los hallazgos (los del ticket y los ajenos, con el formato 24.12), las notas de la exploratoria, la consola y lo que no pudiste probar y por qué.

## Revisión de diseño en el navegador (al cerrar, y después de cada ronda de maquetación)

> Sos el revisor de DISEÑO. Compará la app real contra la maqueta aprobada, pantalla por pantalla, en claro y en oscuro. La app: <url> (sesión iniciada). Confirmá el ancho real de la ventana (<1440> px) antes de capturar. La maqueta: <ruta>. Las desviaciones ya aprobadas: <dónde están los rulings>. REGLAS DURAS: no crees, apruebes, apliques ni guardes nada; asistentes hasta el último paso y Cancelar. Entregá: tabla por pantalla (Coincide / Difiere aprobado / Difiere NO aprobado), la lista de diferencias no aprobadas con captura de cada lado, errores de consola y lo que no pudiste ver.


# Ayudantes `haiku` (lo mecánico: juntan, no juzgan)

Todos devuelven ≤ 15 líneas y escriben lo completo en un archivo. Nunca deciden si algo está bien: eso lo hace quien lee su archivo.

## Explorar

> Encontrá <qué: dónde se define X, quién usa Y, qué archivos tocan Z> en <repo>. Usá graphify (graphify affected / explain / path) si existe graphify-out, y si no, búsqueda en el código. SÓLO LEÉS. Devolvé una lista: archivo:línea y una frase de qué hay ahí. No propongas cambios ni opines. Si no lo encontrás, decilo.

## Correr la suite y comparar con la base

> Corré <comando de la suite> en <worktree> (una sola suite a la vez; nunca dos e2e sobre la misma base). Guardá la salida en <tmp/…/suite-<tarea>.txt>. Compará la LISTA de tests en rojo con la de la base (<archivo con los rojos de la base, o corré lo mismo en <worktree-base>>): escribí en <tmp/…/rojos-<tarea>.md> tres listas: rojos nuevos, rojos que se arreglaron, rojos que siguen. No intentes arreglar nada. Contestá con los tres conteos y la ruta.

## Juntar capturas con una lista fija

> Abrí <url> (sesión iniciada). Confirmá window.innerWidth = <1440>. Para cada pantalla y estado de esta lista: <lista>, sacá una captura en claro y otra en oscuro a <tmp/capturas/<nombre>-<estado>-<tema>.png> y anotá los errores de consola. NO crees, apruebes, apliques ni guardes nada; los asistentes, hasta el último paso y Cancelar. No opines sobre el diseño. Contestá con la lista de capturas y los errores de consola.

Después, `sonnet` compara esas capturas contra la maqueta (la «Revisión de diseño en el navegador» de arriba, con las capturas ya hechas).

## Resumir un informe o un log

> Leé <ruta del informe del implementador / log / salida>. Escribí en ≤ 15 líneas: estado (hecho / hecho con dudas / bloqueado), commits, números de tests tal cual aparecen, cada duda o desvío que el texto menciona (literal, con su línea) y cualquier línea con error, warning o «usage limit». No interpretes ni completes lo que no dice.

---

# Maquetas (método, 3.3): el orquestador escribe el brief, `sonnet` arma, otro `sonnet` revisa, el orquestador publica

## El brief de maqueta (lo escribe Claude: `tmp/maquetas/<nombre>.brief.md`)

    # Maqueta: <nombre>

    ## Para qué
    <Qué decisión quiere tomar el usuario con esta pantalla. Quién la usa.>

    ## Pantallas y estados
    1. <Pantalla A>: con datos · vacío · cargando · error · dato ausente («—», nunca 0)
    2. <Pantalla B / modal / panel>: …

    ## Datos (cada número con su fuente)
    | Dato en pantalla | Fuente | ¿Existe hoy? | Ejemplo realista |

    ## Textos exactos
    <Títulos, botones, vacíos, errores, ayudas. Singular y plural. Palabras prohibidas del proyecto.>

    ## Interacciones que tienen que andar
    <Pestañas, filtros, ordenar, abrir/cerrar modales, pasos de un asistente. Lo que no anda, no se maqueta.>

    ## Estilo
    <Tokens de color, radios, tipografía y espaciados copiados de tailwind.config / el sistema del proyecto. Un solo botón primario por vista. Ancho de diseño: 1440 px.>

    ## Contrato de la página (no se negocia)
    - Un solo archivo HTML: tmp/maquetas/<nombre>.html. <title> de 2 a 4 palabras.
    - Colores como variables en :root; modo oscuro bajo @media (prefers-color-scheme: dark) con :root:not([data-theme="light"]) y otra vez bajo :root[data-theme="dark"]. body con fondo explícito. Un botón para alternar claro/oscuro que pone data-theme.
    - Scripts externos sólo de cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com, cdn.tailwindcss.com o code.jquery.com, con versión EXACTA (react@18.3.1, nunca react@18). Hojas de estilo sólo de Google Fonts. Todo lo demás, en línea.
    - Nada que dependa de localStorage. Menos de 16 MB. Sin datos de clientes reales que no deban salir.

    ## Fuera de alcance
    <Lo que no se maqueta a propósito.>

## Al maquetador: armar la maqueta (subagente `sonnet` nuevo)

> Sos el maquetador. Armá la maqueta del brief tmp/maquetas/<nombre>.brief.md en el archivo tmp/maquetas/<nombre>.html. Seguí el brief al pie de la letra: pantallas, estados, textos exactos, datos de ejemplo y el contrato de la página. Si algo del brief no cierra o falta, pará y preguntá en vez de inventar. Antes de informar, abrila en el navegador si podés (claro y oscuro, cada estado) y revisá la consola. No commitees la maqueta. Al terminar, tu informe corto: qué armaste, qué no pudiste y qué dudas te quedaron.

## Al maquetador: ronda de maqueta (`SendMessage` al mismo maquetador, o uno nuevo con el brief)

> Revisión de la maqueta <nombre>: (1) <pantalla/estado>: <qué se ve mal, con la captura en ruta>. Corrección: <exacta: texto, color, orden, comportamiento>. (2) … Cambiá sólo eso. Volvé a abrirla en claro y oscuro. Informe corto.

## Revisión de la maqueta en el navegador (subagente Sonnet nuevo)

> Sos el revisor de una MAQUETA armada por otro agente. SÓLO MIRÁS. Abrí <ruta del html> en el navegador a 1440 px reales (comprobá window.innerWidth). Contra qué: el brief <ruta>. Recorré cada pantalla y cada estado del brief, en claro y en oscuro, y probá cada interacción que el brief dice que tiene que andar. Verificá textos exactos, que el dato ausente sea «—», un solo botón primario, contraste legible en oscuro y la consola sin errores. Verificá el contrato de la página (title, variables en :root con oscuro, CDNs permitidos con versión exacta). Entregá: tabla por pantalla y estado (Coincide / Difiere), cada diferencia con captura, la corrección exacta propuesta y lo que no pudiste ver.
