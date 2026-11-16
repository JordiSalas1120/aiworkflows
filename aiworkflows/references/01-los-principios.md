## 1. Los principios

Son pocos y todo lo demás sale de ellos.

### 1.1 La calidad no se negocia; la lentitud sí

Cuando algo tarda, **no se recortan revisiones ni pruebas**. Se optimiza lo que es lento sin aportar nada (la infraestructura) y el **orden** del trabajo.

- ❌ Saltear la suite completa "porque la tarea es chica", saltear la revisión de una tarea, revisar lo delicado (plata, permisos, concurrencia, datos) con un modelo que no alcanza, o escribir menos pruebas de punta a punta.
- ✅ Arreglar la infraestructura lenta, paralelizar lo que no depende de otra cosa, revisar la tarea N mientras se construye la N+1 y **elegir el modelo por lo que la tarea exige pensar**, con barandas (15.6). Usar el más capaz para todo no sube la calidad: la sube la revisión.

> **📌 Caso real.** Un plan de 15 tareas tardó 4 h 35 min. Las revisiones por tarea habían atrapado 5 defectos reales que ningún test veía. En vez de recortarlas se midió en qué se iba el tiempo: la suite de pruebas de punta a punta gastaba 12 s por archivo sólo en vaciar la base. Se arregló eso y la suite pasó de 498 s a 160 s, con los mismos 310 tests.
>
> **📌 Caso real (plan de referencia).** Las tareas que parecían «chicas» fueron las que más sorprendieron:
> - una de tipos y textos traía las fechas de las reglas un día antes en Bolivia;
> - una de dos archivos de permisos se había olvidado de toda una pestaña (Roles Base);
> - un formulario **pisaba la configuración de estrategia** de cada producto en cada guardado.
>
> Ningún test lo veía y la revisión por tarea lo encontró. «Es chica, no hace falta revisarla» es exactamente cómo se cuelan esos defectos.

### 1.2 Medir antes de opinar, y medir antes de cambiar

Ninguna afirmación sobre rendimiento, cobertura, cantidad de datos o impacto se hace sin un número. Se mide **antes** de escribir el arreglo, para saber qué problema se tiene, y **después**, para saber si se resolvió.

- Medí el cambio **solo**, en el lugar más chico posible, antes de correr la prueba larga.
- Guardá el "antes": sin línea de base, el "después" no demuestra nada.

> **📌 Caso real.** El primer intento de acelerar las pruebas mejoró sólo un 3 %, y se descubrió después de 8 minutos de suite. Si se hubiera medido la consulta sola en la base, se habría visto en 10 segundos que el `CASCADE` arrastraba todo.

### 1.3 Los tests verdes no prueban que la funcionalidad sirva

Los tests prueban lo que alguien pensó probar. La pregunta que manda es otra: **¿dónde tiene que aparecer el resultado para una persona?** Hay que ir ahí y mirarlo.

> **📌 Caso real.** Una funcionalidad llegó con 2.296 tests verdes y no servía: el dato nunca llegaba a la pantalla donde la persona lo buscaba. En otro caso, 885 tests no vieron dos defectos que un minuto en el navegador mostró.

### 1.4 Verificar el camino del DATO, no el de las funciones

Que cada función ande no significa que el dato llegue. Seguí un dato real desde que entra (formulario, archivo, integración) hasta donde se usa (pantalla, reporte, exportación, API externa).

### 1.5 El plan se audita contra el código antes de construir

Un plan escrito hace días describe un código que ya cambió. **Cada plan se revisa contra el código real, tarea por tarea**, y también contra los otros planes, antes de escribir una línea.

> **📌 Caso real.** Un plan de pantallas escrito dos días antes no conocía el motor que se había construido mientras tanto: nombres de funciones distintos, estados que no existían, 3 errores de tipos que bloqueaban el commit. Y la maqueta prometía **13 datos que el backend no tenía**. Se decidió construir primero ese backend como un plan aparte.

### 1.6 Ausente significa "no sé", nunca `false` ni `0`

Un dato que falta no es un cero ni un "no": es "no se sabe". Si se confunden, las cuentas mienten sin fallar.

> **📌 Caso real.** Un producto sin costo cargado mostraba margen 0 %, y el sistema lo trataba como "margen malo". Ahora el margen queda vacío y la pantalla dice "sin costo".

### 1.7 Con datos malos las pantallas no fallan: se ven mal

Un error de datos casi nunca tira una excepción: muestra un número razonable y equivocado. Por eso se valida con datos reales, se miden coberturas y se desconfía de lo que "se ve bien".

> **📌 Caso real.** Se creía que la marca de los productos estaba cargada en el 87 % del catálogo. Al medir, en una de las fuentes el campo "marca" era **el nombre del vendedor**. La cobertura real era **7 %**, y una funcionalidad entera ("reglas por marca") alcanzaba a mucha menos gente de la que prometía.

### 1.8 Nada sale a producción sin la orden del dueño

Producción se toca sólo cuando el dueño del producto lo dice, con esas palabras. Una condición de contexto también es una orden: "estoy presentando", "hoy no", "esperá a que termine X".

> **📌 Caso real.** Se desplegó a producción durante una presentación del dueño. Técnicamente todo estaba bien, pero el momento era el peor posible.

### 1.9 Cada problema se nombra por su tipo

Cuando aparece un defecto se dice de qué tipo es, porque cada tipo pide una acción distinta:

| Tipo | Qué significa | Qué se hace |
|---|---|---|
| **Del plan** | La auditoría no lo vio | Mejorar la auditoría, corregir el plan |
| **Del código** | El implementador se equivocó | Arreglar y agregar el test que faltaba |
| **Previo** | Ya estaba en producción; el trabajo nuevo sólo lo hizo visible | Avisar, medir el impacto real, decidir aparte |
| **De datos** | El código está bien y el dato está mal | Medir la cobertura, limpiar, no "arreglar" el código |
| **De entorno** | La máquina, la red, la configuración | Documentar, no tocar el código |

### 1.10 El porqué se escribe; el dónde se deduce

El código dice **qué** hace y **dónde**. Nunca dice **por qué** se decidió así, qué se descartó ni qué se midió. Eso se escribe (ver Fase 8), o se pierde.

### 1.11 Se construye regla, no parche (decidido con Sebastián el 11-oct)

Todo lo que se construye o se arregla en las plataformas se hace **con estructura que aguante lo que venga**: el próximo cliente, tenant, tienda, lector, país, moneda o pantalla. La única excepción es cuando el dueño dice explícitamente **«hotfix»** o **«emergencia»**; aun así, se anota la deuda para volverla regla después.

Qué significa en la práctica, en cada plan, encargo, construcción y revisión:

1. **Una regla de negocio vive en un solo lugar** (un helper, una constante o un servicio) y **todos** los usos existentes pasan a usarlo. Si un arreglo aparece en una pantalla, se busca dónde más se escribe esa misma regla a mano.
2. **Un guardián la cuida**: un test que lee el código y falla si alguien vuelve a escribirla a mano (como el guardián de textos sin jerga). Lo que hoy está escrito a mano fuera del alcance va en una lista `PENDIENTES` explícita que **sólo puede achicarse**: un archivo nuevo nunca entra.
3. **Pensar en el tenant que todavía no existe**: nada atado a nombres, ids, slugs, dominios, lectores o datos de hoy (monedas, zonas horarias y países sólo si el alcance escrito, punto 5, los incluye); lo que cambia entre clientes es un ajuste del tenant o de la plataforma; toda consulta filtra por tenant; lo compartido entre tenants no se daña por la acción de uno.
4. **El revisor pregunta siempre dos cosas**: «¿esto es regla o parche?» y «¿qué pasa con un tenant nuevo, o con dos tenants a la vez?». Un arreglo correcto pero puntual vuelve como corrección.
5. **El alcance del producto se escribe al inicio, con un SÍ y un NO** (E8). Por ejemplo: SÍ aislamiento por cliente y permisos configurables por rol; NO varios países, monedas, zonas horarias ni idiomas, salvo pedido del dueño. Si una parte es de un solo cliente por decisión, se dice ahí. **Las auditorías y las revisiones se hacen contra ese alcance escrito**, no contra «lo que un SaaS ideal tendría»: una auditoría que propone trabajo fuera del alcance es trabajo caro que se descarta, y una memoria suelta que contradice al documento escrito es una fuente de verdad duplicada. Un cambio de alcance lo decide el dueño y se anota en el mismo lugar.

> **📌 Caso real (un rework grande).** El recorrido en DEV encontró que el catálogo de una tienda mostraba «1 artículo»: una carga manual de planilla tapaba al barrido real. La causa no era una pantalla: **cada pantalla elegía «el último barrido» a su manera**, y una ya lo hacía bien. Lo mismo con «vínculo vigente» (dos definiciones y lugares sin ninguna; el asistente de IA citaba vínculos marcados «No es») y con los porcentajes (un helper y unos 200 formateos a mano). Arreglarlo donde apareció habría dejado que la próxima pantalla repitiera el error; se resolvió con un helper único por regla, todos los usos migrados y un guardián.
