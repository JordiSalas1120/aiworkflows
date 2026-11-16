# Matriz de pruebas · <TICKET> · <título>

<!-- PLANTILLA de la skill aiworkflows (método 24.2 y 24.3). La escribe el orquestador antes del plan. Va en tmp/<ticket>/matriz.md del worktree. Después es la fuente de los tests, del recorrido y de la guía para QA. -->

## 1. Ataque al spec (24.2)

Lente: <ingeniero | neutral> · Fallo: <✅ aprobado | ⚠️ condicional | ❌ rechazado>

| ID | Capa | Paso (1-9) | Escenario: «cuando la persona hace X durante Y, Z no está definido» | Severidad | Respuesta del dueño |
|---|---|---|---|---|---|
| B-1 | [POLICY] | 5 · Concurrencia | <…> | Bloqueante | <pendiente / decisión + fecha> |

**Pre-mortem: «QA lo devolvió porque…»**
1. <historia concreta> → ¿cubierta? <sí: caso C-x / no: vuelve al paso N>
2. …
3. …

## 2. Entradas y reglas (técnicas de diseño)

| Elemento | Técnica | Clases y valores |
|---|---|---|
| <campo / parámetro> | Particiones + límites | válida: <…> · inválidas: <vacío, formato X, fuera de rango…> · límites: <mín−1, mín, máx, máx+1> |
| <regla A × B × C> | Tabla de decisión | <una columna por combinación> |
| <estado del pedido> | Transición de estados | válidas: <…> · inválidas: <pagar dos veces, cancelar lo pagado…> |

## 3. Matriz de entornos

| Diferencia que toca el flujo | local | dev | cert | ¿Cómo se cubre? |
|---|---|---|---|---|
| <clave de tercero / formato> | <…> | <…> | <…> | <chequeo / caso C-x> |
| <simulador contra real> | | | | |
| <feature flag / dato sembrado> | | | | |

## 4. Casos

El **esperado** es lo que la persona VE o RECIBE: texto, pantalla, mensaje, monto, factura. Un estado interno sólo va como dato extra.

| ID | Tipo | Precondición y datos | Pasos | Esperado (visible) | Prio | local | dev | cert | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| C-1 | Negativo | <usuario, comercio, estado> | 1. … 2. … | <…> | P1 | ✅ | ✅ | — | <captura / log / ORD> |
| C-2 | Borde | | | | | | | | |
| C-3 | Feliz | | | | | | | | |

Tipos: Feliz · Negativo · Borde · Concurrencia · Interrupción · Permiso · Entorno · Regresión (lo que ya andaba y pasa por el camino tocado).

## 5. Sesión exploratoria (24.8)

Charter: «Explorar <área> con <recursos> para descubrir <riesgo>». Duración: <min>.
- Probado: <…>
- Encontrado: <hallazgo + captura> → <bug del ticket / bug ajeno (24.12)>
- Sin explorar: <…>

## 6. Puerta de cert (24.10)

- [ ] 0 bloqueantes abiertos, mayores respondidos
- [ ] 0 ❌ en dev
- [ ] Diferencias de entorno chequeadas en cert
- [ ] Tests de regresión rojo/verde (`rojo-sin-arreglo.mjs`)
- [ ] Revisión con caza de bugs, 0 Confirmados abiertos; seguridad mínima si hay backend
- [ ] Exploratoria hecha
- [ ] Ningún riesgo sin la firma del dueño
- [ ] Guía para QA honesta
- [ ] Rebasado sobre el dev más reciente
