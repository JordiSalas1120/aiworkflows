## 10. Fase 8 · Cerrar y dejar memoria

Al terminar un trabajo, el progreso se guarda en **lugares distintos, cada uno con su función**:

| Dónde | Qué guarda | Por qué |
|---|---|---|
| **El código y sus commits** | El qué y el cómo | Es la fuente de verdad del comportamiento |
| **Notas del porqué** (vault de Obsidian, ADRs) | Qué se midió, qué se decidió y por qué, qué se descartó a propósito | Es lo que nadie puede deducir del código |
| **Mapa del código** (grafo de conocimiento) | Dónde vive cada cosa y qué depende de qué | Para ubicarse sin leer medio proyecto |
| **Tickets** (Jira) | Qué está, qué falta y qué sigue, **presentable al gerente** | Para gestión |
| **Memoria de la IA** | Cómo trabajar con este equipo, dónde quedó cada frente, trampas del entorno | Para que la sesión siguiente arranque sin repreguntar |

### 10.1 Las notas del porqué

- Numeradas y con título descriptivo: `NN - Tipo Título.md` (Tipo: Spec, Plan, Informe, Decisión).
- Enlazadas entre sí (`[[otra nota]]`).
- ⚠️ **Con varias ramas en paralelo, los números chocan.** Antes de crear una nota, mirá el último número **en todas las ramas activas y en la principal**.
- El análisis honesto (lo que salió mal, los riesgos, lo que no se sabe) va a las notas internas. El ticket del gerente dice el estado sin rodeos, pero en lenguaje de gestión.

- **Corta** (E10): una nota del vault ocupa **dos páginas como máximo**; lo largo va a un anexo que nadie está obligado a leer.

Plantilla en 18.5.

### 10.2 El cierre de sesión

- Todo commiteado y el árbol de trabajo limpio (o lo pendiente, con nombre).
- Servidores locales apagados (matar **por PID**, nunca todos los `node`).
- La nota del porqué escrita, el mapa actualizado y la memoria con "dónde quedó y qué sigue".
- Si la sesión acumuló mucho contexto, se recomienda seguir en una sesión nueva: trabaja mejor y más rápido.
- El registro de la construcción (con todas las decisiones) commiteado al repo, y la lista completa de decisiones mostrada al dueño.

### 10.3 La guía de prueba para el dueño

Cuando el dueño quiere probar todo él mismo antes de subir, **no se le entrega sólo el informe**: se le escribe una **guía de prueba** como nota numerada del vault. Una sesión nueva la sigue con él de punta a punta, explicándole cada cosa. Tiene:

1. **Cómo levantar el entorno** paso a paso: base, backend, worker, frontend, cómo entrar, qué dirección abrir.
2. **Qué datos de prueba hay que preparar** para que se vea todo (casos límite, choques, propuestas pendientes, archivos de ejemplo), **con respaldo y devolución** al terminar.
3. **Por cada pantalla:** qué es en una frase, qué probar (con casillas) y qué tiene que pasar, incluidos los casos borde.
4. **Lo que ya se sabe que está mal**, para no reportarlo dos veces.
5. **Las preguntas que el dueño tiene que contestar.**
6. **Qué pasa después:** lo que falle se arregla en la misma rama con test y revisión; recién con su orden se sube.

⚖️ **Toda guía o resumen para el dueño trae el enlace directo a lo que tiene que mirar y dice en qué entorno está** (E13). Si la funcionalidad vive detrás de un interruptor o en una ruta aparte y nadie le dio la dirección, el dueño no la encuentra y concluye que no está hecha.

⚖️ **La guía dice explícitamente qué NO está.** Si una pantalla que el dueño va a ver sigue siendo la vieja porque su rework es de otro plan, se dice arriba de todo.

> **📌 Caso real (plan de referencia).** El dueño abrió una pantalla en medio de la construcción, vio la versión vieja y creyó que el rework ya estaba hecho y algo andaba mal. El plan cambiaba otro módulo y dejaba piezas sueltas dentro de esa pantalla; su rework era el plan siguiente. Desde entonces, cada resumen y cada guía dicen **qué pantalla cambia, en qué plan, y dónde se ve hoy**: sólo en la rama local, en dev o en prod.
