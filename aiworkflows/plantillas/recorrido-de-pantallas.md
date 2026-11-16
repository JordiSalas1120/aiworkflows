# Plantilla · El recorrido como prueba repetible del repo (E4)

> El recorrido en el navegador se escribe **una vez**, como spec que vive en el repo y se versiona con el PR. No se escriben scripts descartables en una carpeta temporal.

## Dónde vive

En la carpeta de pruebas de punta a punta del proyecto (por ejemplo `<paquete-frontend>/e2e/specs/recorrido-<funcionalidad>.spec.*`). Es parte del PR: una funcionalidad con pantallas sin su spec no está lista (14.1).

## Estructura

```
datos: los usuarios de prueba sembrados (sembrar-usuarios-de-prueba.md) y la tabla de estados (tabla-de-estados.md)

para cada fila de la tabla de estados (estado x rol):
    entrar como ese usuario
    llegar al estado (por la API de preparación, no clicando todo desde cero)
    verificar en pantalla: pastilla, banner, botones disponibles y los NO disponibles
    guardar captura con nombre  <estado>-<rol>-<viewport>.png
    verificar cero errores en la consola del navegador
para cada salida (documento, hoja de cálculo, correo, otra pantalla):
    comparar el valor con el de la pantalla (8.2, seguir el dato)
```

## Cómo se usa

1. **Primera vez:** se escribe completo y se corre. El informe (una página como máximo, ver 15.3) lista ✅ / ⚠️ / ❌ por fila, con captura de cada ❌.
2. **Cada vez que cambia algo:** se corre la spec entera (es automática) y a mano se recorre **sólo lo que cambió**. No se reescribe el recorrido ni se repite entero a mano.
3. **Cada ❌ nuevo que aparece a mano** se vuelve una fila o un paso de la spec antes de arreglarlo (test que falla antes y pasa después).

## Lo que el recorrido NUNCA hace

- Tocar botones que mandan correos reales, publican o borran datos fuera del entorno de prueba. La lista cerrada de botones prohibidos va escrita en el propio spec.
- Dejar datos distintos a los que encontró: respaldo antes, devolución después, «0 diferencias» (8.1).

## Informe del recorrido (la prueba de «listo»)

Una tabla: filas de la tabla de estados × resultado; fallas con captura; ruta de la spec y commit contra el que se corrió; entorno y usuarios usados. «Listo» exige 0 ❌ (regla 0 de `SKILL.md`).
