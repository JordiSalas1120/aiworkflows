# Guía para QA (comentario de Jira)

<!-- PLANTILLA de la skill aiworkflows (método 24.11). Sale de la matriz (plantillas/matriz-de-pruebas.md). REGLA: sólo se afirma lo que se verificó. Lo no probado va en «Qué no se probó», con el motivo. Ningún «riesgo aceptado» sin la firma del dueño en el ticket. -->

**<TICKET> · <qué cambió, en una frase de negocio>**

**Dónde:** <entorno> · <enlace directo a la pantalla / número de WhatsApp de prueba> · PR <#n> (<commit>)

**Datos de prueba**
- Usuario: <…> / <clave o cómo entrar>
- Comercio / sucursal: <…>
- Productos, montos y lo necesario para pagar: <…>

**Casos a probar** (primero los que más importan)

| # | Precondición | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | <…> | 1. … 2. … | <lo que se ve o se recibe, exacto> |
| 2 | | | |

**Verificado por nosotros:** <casos N-M en dev el <fecha>, con capturas>

**Qué no se probó y por qué:** <caso X: requiere un pago real de QR> · <nada>

**Riesgos conocidos aceptados por el dueño:** <ninguno | riesgo + «aceptado por <dueño> el <fecha>, comentario <id>»>

**Para buscar en logs:** `<etiqueta de log>`

---

### Si se encuentra un bug ajeno al ticket (24.12)

**Título:** <qué falla, dónde>
**Entorno:** <…> · **Severidad:** <crítica/alta/media/baja> · **Prioridad:** <…>
**Pasos:** 1. … 2. …
**Esperado:** <…> · **Obtenido:** <…>
**Evidencia:** <captura / log / ORD>
**Sospecha de causa (sin confirmar):** <…>
