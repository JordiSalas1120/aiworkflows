## 20. Agentes conversacionales: el código conduce, el modelo conversa

> Esta parte vale para construir **un agente con LLM que atiende a una persona** (chat, mensajería, voz). Las partes 1 a 19 valen enteras; acá se agrega lo propio de un agente. Salió del diagnóstico de un agente real que se perdía en la conversación; el detalle de ese caso vive en el proyecto, no acá.

### 20.1 El principio

Un agente se pierde cuando **el modelo tiene que adivinar en qué paso está la conversación**.

| Lo decide el **código** (determinista, probado) | Lo hace el **modelo** (lenguaje) |
|---|---|
| En qué paso está la persona y cuál sigue | Entender qué quiso decir |
| Qué herramientas se pueden usar en este paso | Elegir entre esas pocas herramientas |
| Todo el dinero: montos, cuotas, saldos, límites | Explicar esos números con palabras |
| Botones, listas, pantallas, enlaces | Una frase que acompañe lo que el sistema ya mandó |
| Permisos, identidad, firma | Pedir con amabilidad lo que falta |

Si una decisión de la izquierda está escrita en el prompt, **es un bug que todavía no apareció**.

> **📌 Caso real.** El orden de un alta estaba escrito en tres lugares (el código, el prompt, y el estado que se inyectaba cada turno), y los tres se contradecían. Cada falla sumaba una regla al prompt; ninguna sacaba la causa.

### 20.2 El paso actual es un dato, no una deducción

- Cada flujo tiene un campo **explícito** con su paso, que escribe **el código** en cada transición. Nadie lo deduce de banderas, del historial ni de expresiones regulares sobre lo que dijo la persona.
- Cada flujo es una **tabla de pasos** (qué lo completa, qué sigue, qué herramientas se permiten, qué ve la persona), y esa tabla es su spec.
- **Una sola fuente por dato** y **un solo dueño de «qué sigue»**: botones, filtros, router y modelo pueden *proponer*; sólo la máquina de pasos *decide*. Un test compara que el texto de estado que ve el modelo nombre el mismo paso que el código.

### 20.3 El prompt: corto, por dominio, sin historia

- Un **núcleo común chico** y un **bloque por dominio** que entra sólo cuando la persona está en ese dominio. Referencia: el núcleo no pasa de unos 8.000 caracteres.
- **El prompt dice cómo hablar, no qué paso sigue.**
- **Sin historia:** ni fechas, ni «antes había…», ni nombres de casos. La historia va al vault.
- **Cada «NUNCA» nuevo es una alarma:** primero, qué fuente de verdad le está diciendo al modelo que lo haga; se arregla esa.
- **Se mide al cambiarlo:** tamaño y resultado de las evals, antes y después.

### 20.4 Las herramientas: pocas, chicas, sin textos adentro

- El modelo ve **sólo las herramientas del paso actual** (entre 3 y 8). Un dominio «sin clasificar» que las expone todas es donde el agente se pierde.
- **Una herramienta = una acción.** Recibe datos y devuelve datos; la frase para la persona no la arma la herramienta. Así la lógica del dinero se prueba sin leer texto.
- Descripción corta (2 a 4 líneas). Si necesita mil caracteres para explicar cuándo usarla, son dos herramientas o falta un paso.
- Herramienta muerta se borra. Lo que mueve plata va con candado por persona (leer → modificar → guardar), porque corren en hilos.

### 20.5 El historial: sólo lo que se dijo

- Queda lo que la persona dijo y lo que el agente respondió. **Las notas del sistema de este turno** van en un mensaje efímero que no se guarda; si se guardan pegadas al mensaje, el modelo las relee como órdenes vigentes.
- Los reintentos del verificador se borran al cerrar el turno y sus contadores miran **sólo el turno actual**.

### 20.6 Las pruebas de un agente: tres niveles

| Nivel | Qué prueba | Cuándo corre |
|---|---|---|
| **1 · Determinista** | Motores de dinero, máquina de pasos, herramientas con datos, botones, formateos | Antes de cada commit, en segundos, con la red bloqueada |
| **2 · Agente con modelo falso** | Que ante tal mensaje y tal estado, el grafo llame la herramienta correcta y pase al paso correcto | Antes de cada commit |
| **3 · Evals con modelo real** | Que el agente no se pierda: tasa de éxito por flujo | Antes de cada deploy, cada caso 3 a 5 veces |

Las evals se juzgan **por código, no a ojo**: ¿llamó la herramienta esperada?, ¿el estado final es el esperado?, ¿las cifras coinciden con el motor al centavo?, ¿dijo una frase prohibida? Sólo la calidad de la redacción la juzga un modelo con rúbrica. Umbrales de ejemplo: seguridad e inyección 100 %, dinero ≥ 95 %, el resto ≥ 85 %, y nunca por debajo de la línea base guardada. El reporte trae el **costo por conversación**.

Reglas: **un bug de conversación entra primero como caso de eval**, se lo ve fallar y recién después se arregla (el TDD de los agentes). Ninguna prueba toca el estado real. Una sola forma de correr todo. Nunca contra producción.

### 20.7 Estructura del código y señales de alarma

Separar: una máquina de pasos por dominio, herramientas por dominio, motores de dinero puros (sin entrada/salida ni textos), prompts (núcleo + un bloque por dominio), presentación (plantillas de texto), estado (con candado, único que escribe), utilidades en **una sola copia**, y un grafo que sólo arma el flujo.

Señales de alarma (cada una es un hallazgo **Importante** en la revisión): un archivo de más de ~800 líneas o una función de más de ~80; un objeto global tocado desde todos lados; imports dentro de funciones para esquivar un ciclo; la misma utilidad escrita dos veces; `except: pass` en algo que borra, cobra o guarda; nombres de personas o de casos en el código (el caso va al test y al vault; el código lleva la regla).

**Datos personales:** conversaciones reales, documentos y teléfonos **nunca van al repo**. Para un caso real se escribe un caso de eval con datos inventados. Si algo real ya se subió, borrarlo no alcanza: hay que purgarlo del historial, coordinado con el dueño.

### 20.8 Elegir el modelo del agente y el ciclo

- El modelo que **atiende** se elige con las evals, sobre el flujo actual, en tres ejes: éxito por flujo, costo por conversación y latencia. Gana el más barato que pasa los umbrales. **Antes de subir de modelo, achicar el problema** (menos herramientas a la vista, prompt por dominio, paso explícito). El modelo y su configuración viven en un solo lugar y se anotan en cada reporte.
- El ciclo de las partes 3 a 10 se aplica así: la **tabla de pasos** es el spec; el plan arranca por los motores y la máquina de pasos, después las herramientas, el prompt y al final las evals; la auditoría busca **todas las fuentes** que dicen algo del flujo; la verificación es en el **canal real** (el teléfono, el chat) siguiendo el dato hasta el panel; el paquete a producción sale de un **commit**, no del directorio local.
- **Cómo pedirle trabajo a Claude en un agente:** no «arreglá que se pierde» (va a sumar otra regla al prompt); sí «este caso falla: agregalo primero a las evals y mostrame que falla; después buscá todas las fuentes que dicen qué sigue y decime cuál está mal».
