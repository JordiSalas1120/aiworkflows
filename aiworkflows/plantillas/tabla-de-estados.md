# Plantilla · Tabla de estados (E2)

> Se escribe en el spec **antes** de construir cualquier pantalla con estados. Ejemplo neutro: una cotización con tres estados (borrador, en revisión, aprobada).

## 1. La función única

El **estado visible** lo calcula UNA función compartida. La usan el servidor y la pantalla; si son lenguajes distintos, la regla vive en el servidor y la pantalla la recibe ya calculada. Nombre y lugar: `<función>` en `<archivo>`.

Prohibido: que la pastilla, el banner, la lista y el documento deduzcan el estado cada uno por su cuenta. Un guardián (test que lee el código) falla si aparece una segunda deducción (1.11).

## 2. La tabla

Una fila por cada combinación **estado × rol**. Una columna por cada lugar donde el estado se muestra.

| Estado | Rol | Pastilla (lista) | Banner (detalle) | Botones disponibles | Documento al cliente | Correo |
|---|---|---|---|---|---|---|
| Borrador | vendedor | «Borrador» | — | Editar, Enviar a revisión | no se puede generar | — |
| Borrador | observador | «Borrador» | — | ninguno | no | — |
| En revisión | aprobador | «En revisión» | «Esperando tu firma» | Aprobar, Pedir ajuste | no | al aprobador |
| En revisión | vendedor | «En revisión» | «Esperando al aprobador» | Retirar | no | — |
| Aprobada | vendedor | «Aprobada» | «Lista para enviar» | Generar documento | sí | al vendedor |
| … | … | … | … | … | … | … |

Reglas de la tabla:
- **Los estados raros también van**: reabierto, retirado, ajuste pedido, vencido, sin firmar. Los bugs viven ahí.
- Cada celda es el texto literal (lo que se ve), no una descripción.
- Las decisiones que la tabla obliga a tomar (quién puede qué, qué se bloquea, cuántas firmas hacen falta) son **decisiones de producto**: se preguntan al dueño al inicio (3.2), no se construyen «provisionales».

## 3. Tests que salen de la tabla

1. **Un test recorre la tabla entera**: para cada fila arma el caso, llama a la función única y compara pastilla, banner, botones, documento y correo con la fila. La tabla es un dato, no código: si se agranda, el test se agranda solo.
2. **Un test de coherencia entre lugares**: para cada estado, lo que dicen la pastilla, el banner y la lista viene del mismo valor. Las cadenas no se duplican.
3. **El recorrido en el navegador (8.1) usa esta misma tabla como lista**: una fila es un paso a verificar con el usuario de prueba de ese rol.
