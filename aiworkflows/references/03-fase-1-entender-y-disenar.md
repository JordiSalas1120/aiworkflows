## 3. Fase 1 · Entender y diseñar

### 3.1 Antes de proponer, entender

1. **¿Qué problema tiene la persona que va a usarlo?** No qué pantalla quiere: qué decisión quiere tomar o qué trabajo le cuesta.
2. **¿Qué existe hoy?** Buscá en el código antes de diseñar. Muchas veces la pantalla "nueva" ya existe y nadie la usa.
   > **📌 Caso real.** Se pidió una "carga manual de precios". La pantalla ya existía: **0 cargas en producción**. El problema no era construirla, era por qué nadie la usaba.
3. **¿Qué dicen los datos reales?** Contá: cuántos registros, cuántos tienen el campo, cuántos usuarios entran, cuántos usan la funcionalidad.
4. **¿Qué dice el dominio?** Si el tema es especializado (aduanas, impuestos, contabilidad), **no se asume**: se pregunta y se busca la fuente oficial.

### 3.2 Preguntar una cosa por vez, con opciones

Las decisiones de negocio son del dueño del producto, no del desarrollador. Se le presentan:

- **una pregunta por vez**, con 2 a 4 opciones concretas;
- la recomendación primero, con su porqué;
- las consecuencias de cada opción en lenguaje de negocio, no técnico.

Lo técnico con una respuesta convencional **no se pregunta**: se decide y se informa.

**Las preguntas de producto van todas juntas, en un lote, al inicio** (E3), pero se presentan **de a una**, con la recomendación primero. Una lista de 14 decisiones entregada de golpe no sirve: el dueño pide verlas una por una. Y lo que define **quién puede hacer qué, qué se bloquea o sólo se avisa, cuántas firmas hacen falta o qué cambia de estado NO se construye «provisional»**: se espera la respuesta o ese pedazo se saca del lote. Sólo los textos y el aspecto visual pueden ir provisionales. Se midió el costo de no hacerlo: reglas construidas, probadas, revertidas y vueltas a probar (por ejemplo, un bloqueo que pasó a ser un aviso, o un permiso que se construyó y se anuló con el lote ya «listo»).

### 3.3 La maqueta no es el diseño: el diseño son los datos

Toda maqueta o pantalla propuesta se cruza **dato por dato** con el backend: ¿de dónde sale este número?, ¿existe hoy?, ¿qué pasa si falta?

- Si el backend no lo tiene, hay dos caminos, y se decide explícitamente: **construir el backend que falta** (un plan aparte, *antes* de las pantallas) o **sacarlo de la maqueta**.
- Nunca se deja una pantalla prometiendo algo que el sistema no calcula.
- **La maqueta se traduce al sistema de diseño, no se copia** (E7). Antes de construir, cada color, tamaño y espaciado de la maqueta se mapea a un **token del tema**. Si falta el token, se crea en el tema, no en el componente. Copiar los valores deja la pantalla con colores fijos: el modo oscuro, un cambio de marca o un tema por cliente cuestan reescribir cada archivo, y los tests que afirman el color congelan el error (ver 13).
- Quién arma la maqueta: el orquestador escribe el brief (`plantillas/encargos.md`, «Maquetas»), un subagente `sonnet` arma el HTML, otro `sonnet` la revisa en el navegador y el orquestador la publica.

### 3.4 Cuando el dueño dice "¿no es lo mismo que...?"

Sus observaciones de parecido **casi nunca son cosméticas**: suelen señalar que dos cosas que se diseñaron por separado son en realidad la misma. Antes de defender el diseño, hay que tirar del hilo.

### 3.5 El spec

El resultado de esta fase es un **spec** (documento de diseño) con:

- el problema y para quién;
- lo que existe hoy, con números medidos;
- **las decisiones tomadas, numeradas, con quién las tomó y cuándo;**
- lo que queda fuera a propósito, y por qué;
- los riesgos y lo que no se sabe;
- el orden en que se va a construir (qué plan va primero y por qué);
- **el alcance del producto, con SÍ y NO** (1.11);
- **si hay pantallas con estados: la tabla de estados** (E2): estado × qué ve cada rol × qué dicen la pastilla, el banner, la lista, el documento y el correo. El estado visible lo calcula **UNA función compartida** (servidor y pantalla), y **un test recorre la tabla entera**. Plantilla: `plantillas/tabla-de-estados.md`.

> **📌 Caso real.** El estado de un documento se deducía en tres lugares (una pastilla, un banner y una lista). Tres rondas de arreglos seguidas fueron la misma familia de error: cada test pasaba en su lugar y ningún test comparaba los tres. La tabla de estados habría mostrado el desacuerdo antes de escribir una línea.

Plantilla en 18.1.

⚖️ **Regla:** cero decisiones abiertas al pasar a construir. Si falta una, se para y se pregunta.
