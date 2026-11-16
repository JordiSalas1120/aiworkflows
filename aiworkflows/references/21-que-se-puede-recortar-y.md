## 21. Qué se puede recortar y qué no

Cuando un plan propone «recortes para no desperdiciar esfuerzo», se evalúan con esta tabla (medida en un plan de 12 tareas):

| Propuesta | Veredicto | Por qué |
|---|---|---|
| Eliminar una tarea que mueve y blinda código que dos tareas después se reemplaza | ✅ Se recorta | Blindar código que se tira es desperdicio. La pantalla nueva nace en su archivo; **la vieja se borra cuando la nueva está verificada**, buscando que nadie la use |
| Revisión por otro agente sólo al cerrar la tanda, no en cada tarea chica | 🔴 **No se recorta** | Es donde se cazan los defectos: las tareas «chicas» trajeron fechas un día antes, una pestaña de permisos olvidada y un error crudo en inglés (1.1). Lo que se ajusta es el tamaño de la revisión (6.3) |
| Actualizar los documentos una vez, al cerrar la sesión | ✅ Con condición | El estado de las fases y la bitácora, al cierre. **El registro de la construcción, en cada tarea**: es corto y es lo único que sobrevive a una compactación (6.7) |
| Pocos despliegues en total (fin de cada bloque) | ✅ | No baja la calidad, siempre que cada uno tenga orden del dueño, medición antes y después idéntica, y navegador en el entorno |
| No rediseñar lo ya hecho; si aparece un problema de diseño, se anota y se decide con el dueño | ✅ | Es 6.8 |
| La tarea que acelera la suite, primero | ✅ La mejor idea de la lista | Abarata todo lo que viene (ejemplo medido: de 498 s a 160 s). Medir el cambio solo antes de la suite larga (1.2) |

**Y lo que esos planes no traían y hay que sumar:**
1. **Auditoría previa del plan contra el código**, en paralelo con la primera tarea (5.4).
2. **Revisión final de la rama con el revisor más capaz**, la clasificación del registro, una sola ola y su re-revisión (7).
3. **Navegador también en las tandas que «no cambian pantallas».** Si una tanda arregla «lo que hoy le miente a quien mira» (costos, textos, una proyección), se mira en la pantalla antes y después del despliegue.
4. **Mutaciones en lo que toca dinero** (11.7).
5. **Decidir sin frenar** lo técnico, con el registro y la lista completa para el dueño al final (6.9).
6. **La guía de prueba** si el dueño va a probar él mismo antes de desplegar (10.3).

> **La referencia de cómo se ve bien hecho:** un plan de 12 tareas y 40 commits, con 2 o 3 agentes a la vez y ningún choque; cada tarea con su revisión y ningún arreglo pasó de la primera ronda; 60 decisiones técnicas anotadas con su costo; una auditoría previa, una revisión final, una sola ola de arreglos y dos recorridos en el navegador; más de 20 defectos reales encontrados que los tests no veían; todo en verde y nada fuera de la máquina sin orden del dueño.
