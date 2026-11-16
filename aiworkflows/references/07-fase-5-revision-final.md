## 7. Fase 5 · Revisión final

Con todas las tareas terminadas:

1. **Revisión de la rama entera** con el revisor más capaz disponible. Mira lo que ninguna revisión por tarea puede ver: cómo encajan las piezas, duplicaciones, caminos que se contradicen y consistencia entre la pantalla y el servidor.
   - Con una rama grande, el revisor recibe el diff por áreas (backend, cada pantalla, permisos) y lee lo borrado sólo para confirmar con búsquedas que nadie lo usa.
   - Antes del veredicto, **lista lo que dejó de lado** como fuera del spec, una línea cada cosa y su porqué. Nada se descarta en silencio.
2. **La clasificación del registro.** El revisor final recibe todos los «diferidos» de las tareas y los defectos que vio el navegador, y a cada uno le pone **ARREGLAR ANTES DEL MERGE** o **PUEDE ESPERAR**, con su motivo y su `archivo:línea`. Lo que se difirió en cada tarea no se pierde: acá se decide.
3. **Una sola ola de arreglos, con la lista completa**, para un solo implementador. No uno por hallazgo: cada uno reconstruye contexto y corre suites, y una ola repartida llegó a costar más que todas las tareas juntas.
   - Se pueden sumar, por decisión, «puede esperar» baratos que la persona vería: textos que se contradicen, un número que miente.
   - Cada arreglo lleva su test.
4. **Una re-revisión acotada de la ola.** Lo que quede se juzga como al tope del ciclo de arreglos (6.10): se estaciona con su decisión, o se decide el cambio mínimo. **No hay segunda ola.** Lo que queda se anota en la nota del porqué, en «Quedó para después», y se le muestra al dueño.
5. **Verificación final** sobre el último commit: suite completa backend y frontend, tipos, lint y build.

> **📌 Caso real.** Lo que atraparon las revisiones de un solo plan de 15 tareas:
> - editar una regla podía encenderla o apagarla sin querer;
> - sacar un producto de una estrategia a mano: la estrategia lo retomaba en la siguiente corrida;
> - aprobar una propuesta ignoraba que el costo había cambiado desde que se calculó;
> - dos aprobaciones simultáneas aplicaban el cambio dos veces;
> - la pantalla de permisos era "todo o nada" y el servidor controlaba permiso por permiso.
>
> Ningún test existente lo veía.
