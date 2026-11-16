## 4. Fase 2 · El plan de implementación

### 4.1 Qué es un buen plan

Un documento que una persona (o un agente) **sin contexto previo** puede ejecutar tarea por tarea. Cada tarea tiene:

- **objetivo** en una frase;
- **archivos** que crea o modifica, con ruta;
- **tests primero:** qué casos se prueban y con qué datos;
- **el código** (o su esqueleto preciso);
- **comandos** para verificar (qué correr, qué debe salir);
- **dependencias** con otras tareas;
- **el commit** con que termina.

Plantilla en 18.2.

### 4.2 Reglas para partir en tareas

- **Chicas:** una tarea se construye y se revisa en menos de una hora.
- **Cada una deja todo verde:** no hay tareas que "rompen y la siguiente arregla".
- **Ordenadas por dependencia:** migraciones y modelo de datos primero, después la lógica pura, después la API y al final las pantallas.
- **Las migraciones de datos se diseñan para no cambiar nada visible:** si una regla corría, sigue corriendo igual. Se escribe en la tarea cómo se verifica.

### 4.3 Planes grandes se parten en varios planes

Una épica grande se parte en planes que se construyen en orden. **El final de cada plan tiene un "contrato"**: qué deja listo, con qué nombres, qué endpoints, qué estados y qué garantías. El plan siguiente se escribe contra ese contrato.

> **📌 Caso real.** Una épica quedó así: plan 1 (cimientos) → plan 2 (motor) → plan 3 (el backend que las pantallas necesitan) → plan 4 (pantallas) → plan 5. Otro plan corre en paralelo, cuando se puede.

### 4.4 Lo que el plan NO debe hacer

- Traer código "completo" sin haberlo compilado nunca. Se trata como borrador hasta la auditoría.
- Dar por verdes tests que no se corrieron.
- Asumir nombres de funciones, tablas o campos sin buscarlos.
- Poner fechas a las migraciones sin mirar las que ya existen: una migración con fecha anterior a otra ya aplicada se desordena.
