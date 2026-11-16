## 12. El backend: patrones que usamos

### 12.1 Capas

```
Ruta (HTTP) → Middleware (auth, empresa, permisos) → Validación (esquema) → Servicio (lógica) → ORM → Base
                                                                              ↘ Cola de jobs → Worker
```

- **La validación de entrada es un esquema** (Zod o equivalente), en el servidor **y** en el formulario del frontend.
- **La lógica de negocio que calcula va en funciones puras:** reciben datos y devuelven un resultado, sin tocar la base. Son las que más tests unitarios tienen.
- Las rutas sólo orquestan: leen, llaman a la lógica y guardan.

### 12.2 Una sola función para calcular lo mismo

Si hay dos lugares que calculan el mismo resultado (un simulador y el motor real, una vista previa y el guardado, la pantalla y el servidor), **llaman a la misma función con los mismos datos**. Dos implementaciones terminan divergiendo.

> **📌 Caso real.** El simulador calculaba con la configuración original del producto y el evaluador con la estrategia aplicada. Mostraba un precio y el sistema proponía otro. Se unificó en una sola llamada.

### 12.3 Multi-tenant: todo lleva la empresa

- Cada tabla de negocio tiene el identificador de la empresa (`tenantId`) y **cada consulta lo filtra**. Se audita periódicamente buscando consultas sin ese filtro.
- La empresa sale **de la sesión**, nunca de un parámetro que manda el cliente.
- Lo que depende de la empresa (rol, permisos, preferencias) vive en la **relación persona-empresa**, no en la persona. Si vive en la persona, se filtra de una empresa a otra.

### 12.4 Los datos

- **Montos en `Decimal`**, nunca en punto flotante, en código nuevo. Si el modelo existente usa otro tipo, se es consistente dentro del mismo modelo.
- **Ausente ≠ cero ≠ falso** (ver 1.6). El tipo lo expresa: `null` cuando no se sabe.
- **Porcentajes:** se decide y se documenta si son enteros (7) o fracciones (0,07). La mezcla es un bug clásico.
- **Texto para buscar:** sin distinguir mayúsculas y **sin tildes** ("colchon" encuentra "colchón").
- **Listas que crecen solas** (glosarios, sinónimos): sólo se agrega. Borrar o modificar puede romper resultados que ya estaban bien.
- **Campos que parecen una cosa y son otra:** se mide el contenido real antes de usarlo (el caso de la "marca" que era el vendedor).

### 12.5 Migraciones

- Cada cambio de esquema es una migración versionada. Su fecha va **después** de la última existente.
- Las migraciones de datos **preservan el comportamiento visible** y se verifica con una consulta antes y después.
- Se ensayan en una copia antes de producción.
- Si la base local se desfasó (drift) por otra rama, se regenera la migración comparando esquema con esquema; no se "arregla" a mano.

### 12.6 Automatización supervisada

Cuando el sistema toma decisiones que afectan al negocio (precios, aprobaciones, envíos):

- **Propone y una persona aprueba**, salvo que se haya configurado explícitamente lo contrario y con permiso.
- Ningún camino "mueve solo" por accidente: si no hay una salida válida, se queda como está y lo dice.
- **Cada propuesta guarda su porqué** (una traza): qué reglas actuaron, qué datos usó, qué alternativas había. La traza tiene **versión**, para poder leer las viejas cuando cambia el formato.
- La persona puede ver **por qué** el sistema propone lo que propone.

### 12.7 Concurrencia y consistencia

- **Doble operación:** si dos personas aprueban lo mismo a la vez, la segunda recibe "ya resuelta" y no se aplica dos veces. Se implementa con una condición en la actualización (sólo si sigue pendiente) y se prueba con dos llamadas simultáneas.
- **El mundo cambió desde que se calculó:** si el costo cambió entre la propuesta y la aprobación, se avisa ("el costo cambió") en vez de aplicar algo calculado con datos viejos.

### 12.8 Lecturas rápidas con cálculos pesados

Si una pantalla necesita un cálculo caro sobre todo el catálogo, se calcula **en segundo plano** (un worker) y se guarda una "foto" que la pantalla lee al instante. Se define explícitamente **qué recalcula la foto** (cada noche, al cambiar una regla, al aprobar, un botón) y la pantalla muestra cuándo se calculó y si se está recalculando.

### 12.9 Permisos granulares

- Permisos por acción (ver · crear · editar · encender/apagar · borrar), asignables por rol, **incluidos los roles personalizados**.
- **La pantalla calcula los permisos igual que el servidor**, clave por clave. Si la pantalla muestra un botón que el servidor rechaza (o al revés), es un bug.
- Un permiso nuevo trae una migración que se lo da a quien hoy ya tiene acceso por el camino viejo, para no quitarle nada a nadie sin querer.
- **Nada se decide por el nombre del rol base** (`rol === 'ADMIN'`) en código nuevo o tocado: se consulta la clave de permiso, que es configurable por rol (E6). Cada comparación con un rol fijo es una persona con un rol personalizado a la que le funciona distinto. El trinquete del punto 13 las cuenta y no las deja subir.
- Recordar: **un cambio de rol no surte efecto hasta que la persona vuelve a entrar** si el rol viaja en un token de larga duración.

### 12.10 Jobs y workers

- Los procesos largos o programados van en una cola, con un worker aparte.
- Cada job es **idempotente**: correrlo dos veces no duplica efectos.
- Cada corrida queda registrada (inicio, fin, estado, errores); una corrida que queda "en progreso" para siempre se detecta.
- ⚠️ Correr el worker localmente ejecuta también sus jobs programados: puede escribir datos en la base local.
