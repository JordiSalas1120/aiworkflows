## 18. Plantillas

### 18.1 Spec

```markdown
# NN · Spec · <Título>

**Fecha:** · **Épica/ticket:** · **Dueño de las decisiones:** · **Anterior:** [[...]]

## El problema
Quién lo tiene, qué decisión quiere tomar o qué trabajo le cuesta.

## Lo que existe hoy (medido)
- Pantallas / endpoints / tablas que ya existen.
- Números: registros, cobertura de los campos que importan, uso real.

## Alcance del producto
SÍ: ... · NO: ... (ver 1.11)

## Estados y quién ve qué
(Si hay pantallas con estados: la tabla de `plantillas/tabla-de-estados.md`; una función única; un test que la recorre.)

## Decisiones
| # | Decisión | Quién | Cuándo | Por qué |
|---|---|---|---|---|
| D1 | ... | ... | ... | ... |

## Fuera de alcance, a propósito
- ... (por qué)

## Datos que la pantalla necesita, y de dónde salen
| Dato en pantalla | Fuente | ¿Existe hoy? | Si falta |
|---|---|---|---|

## Riesgos y lo que no se sabe

## Orden de construcción
Plan 1 → Plan 2 → ... (por qué este orden)
```

### 18.2 Tarea de un plan

El código va **en formato de anclas**, que es el que leen `fidelidad-tarea.mjs`, `anclas-del-plan.mjs` y `tarea-del-plan.sh`: `**Crear** \`ruta\`` + el archivo entero; `**Modificar** \`ruta\`` + pares `Buscar:` / `Reemplazar por:` (cada Buscar aparece **una** vez en el archivo); `**Borrar** \`ruta\``. Un plan en prosa no se puede verificar sin modelo y obliga a construir con Opus (5.5).

````markdown
### Tarea N: <objetivo en una frase>

**Depende de:** Tarea M · **Archivos:** `ruta/a/archivo.ts` (modifica), `ruta/test.ts` (crea)

**Tests primero**
- caso normal: ...
- caso sin datos: ...
- borde: ...
- concurrencia / permisos / dos empresas (si aplica): ...

**Código**

**Modificar** `ruta/a/archivo.ts`

Buscar:
```ts
<texto exacto que aparece una sola vez>
```

Reemplazar por:
```ts
<texto nuevo>
```

**Crear** `ruta/test.ts`
```ts
<archivo entero>
```

**Verificar**
- `comando` → debe salir ...
- suite completa: la lista de rojos igual a la base

**Commit:** `tipo(alcance): qué y por qué`
````

### 18.3 Instrucción para un revisor

```markdown
Revisá la tarea N (commits X..Y) de la rama <rama>, contra el plan <ruta> y el código de alrededor.

Buscá, en este orden:
1. Defectos de lógica: ¿hace lo que el plan pide? ¿Hay otro camino que calcule lo mismo distinto?
2. Casos sin datos, bordes, nulos (ausente ≠ 0).
3. Concurrencia (dos operaciones a la vez).
4. Aislamiento entre empresas y permisos (¿la pantalla calcula igual que el servidor?).
5. Tests: ¿prueban el comportamiento o sólo la implementación? ¿Falta un caso?
6. Consistencia con las convenciones del repo.

Para cada hallazgo: archivo:línea, escenario concreto que falla, tipo (plan / código / previo / datos) y gravedad.
No modifiques archivos.
```

### 18.4 Descripción de un PR

```markdown
## Qué cambia
- ...

## Por qué
Enlace a la nota del porqué / spec.

## Cómo se verificó
- Unitarios: N verdes (lista de rojos igual a main: ...)
- De punta a punta: N verdes
- Navegador: recorrido de ...
- Rendimiento: ...

## Riesgos y cómo desplegar
- Migraciones: ... (ensayadas en ...)
- Cambios visibles en producción: ... (medido: afecta a N registros)
- Orden de despliegue: ...
```

### 18.5 Nota del porqué (informe de cierre)

```markdown
# NN · Informe · <Título>

**Fecha:** · **Rama:** · **Épica:** · **Anterior:** [[...]]

🔴 Estado de despliegue: (local / dev / prod — y quién lo autorizó)

## Qué quedó construido y para qué sirve

## Cómo se construyó
(tareas, revisiones, números de la suite)

## Lo que atraparon las revisiones, y de qué tipo era cada problema

## Decisiones tomadas en el camino

## Lo que se midió
(tablas con antes / después)

## Lo que no se hizo, a propósito

## Lo que sigue
```

### 18.6 Registro de la construcción

```markdown
# Registro de construcción · <plan>

| Tarea | Commits | Revisión encontró | Arreglo | Decisiones | Diferido (por qué) |
|---|---|---|---|---|---|
| 1 | abc123 | ... | def456 | ... | ... |
```
