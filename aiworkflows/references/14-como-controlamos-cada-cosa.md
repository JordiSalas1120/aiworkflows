## 14. Cómo controlamos cada cosa

### 14.1 Definición de "terminado"

Una tarea está terminada cuando:

- [ ] el test que la describe existe y se vio fallar antes;
- [ ] la suite completa está verde, o sus rojos son **la misma lista** que la rama base;
- [ ] tipos, lint y formato están limpios (con la versión del CI);
- [ ] la revisión está hecha y sus hallazgos arreglados y re-revisados;
- [ ] el commit tiene un mensaje con el porqué;
- [ ] el registro de la construcción está actualizado.

Una funcionalidad está terminada cuando, además:

- [ ] la revisión final y la re-revisión salieron limpias;
- [ ] **hay un informe de recorrido en el navegador, de la tabla de estados × roles, con los usuarios de prueba sembrados, en el entorno de verificación, con 0 ❌** (E1), y la spec del recorrido está en el PR (E4);
- [ ] se verificó en el navegador, siguiendo el dato;
- [ ] si toca sesión o permisos, se probó con una persona en dos empresas;
- [ ] el rendimiento está medido con volumen real;
- [ ] la nota del porqué está escrita, el mapa actualizado y la memoria al día.

### 14.2 Qué se mide y se anota siempre

- Tests: cantidad **y lista** de fallos, por nivel.
- Duración de la suite (para detectar cuando se pone lenta).
- Tiempos de las operaciones nuevas con volumen real.
- Coberturas de los datos de los que depende la funcionalidad.
- Cuántos registros afecta un cambio en producción, antes de subirlo.
- **El retrabajo de cada lote** (E11), además del gasto: arreglos por cada función nueva, **arreglos después de la primera subida al entorno de verificación**, rondas hasta 0 ❌ y recorridos completos repetidos. Va al registro junto al gasto. Herramienta: `scripts/medir-retrabajo.mjs`. Una proporción de arreglos por función que sube mes a mes es la señal; una regla de costo sin esta medida apunta al lugar equivocado.

### 14.3 Cómo se analiza y se avanza

```
Síntoma → Medir → Hipótesis → Probar la hipótesis en lo más chico → Arreglo → Medir otra vez
```

- **No se arregla sin causa.** Primero se encuentra por qué pasa (depuración sistemática), después se corrige.
- **Se prueba la hipótesis antes de construir el arreglo.** Si la hipótesis era mala, el arreglo también.
- **Si el arreglo no dio lo esperado, se dice** con números, y se vuelve a medir.
- **Medir el roadmap contra el código:** lo que "está hecho" según los tickets se confirma en el código y en producción.

---

### 14.4 Qué dejar de hacer y qué conservar (retrospectiva del 18-oct-2026)

**Dejar de hacer** (lo medido que no aportaba):

| Dejar de hacer | Por qué | En su lugar |
|---|---|---|
| Recorridos completos repetidos con scripts que se tiran | Cada uno vuelve a probar lo que ya andaba; nadie reutiliza los scripts | **Una** spec de recorrido en el repo; repetirla y recorrer a mano sólo lo que cambió (8.1) |
| Informes de agente de 30 a 46 KB | Nadie los lee enteros; el orquestador pierde contexto | Informe de una página: tabla de resultado, fallas con captura y la ruta a la evidencia |
| Memorias de 50 KB o más por frente | La memoria se vuelve un vault paralelo | Memoria de 3 KB como máximo: estado actual y punteros; la historia va al vault |
| Auditorías «de producto ideal» | Proponen trabajo que el dueño descarta | Auditar contra el alcance escrito (1.11, punto 5) |
| Revisión de lo delicado en 3 vueltas sobre el mismo PR | La 2.ª y la 3.ª revisan arreglos chicos | El modelo más capaz revisa una vez; los arreglos los re-revisa uno intermedio (15.8) |
| La suite completa varias veces por ronda | 15 a 30 minutos con la máquina al límite; los falsos rojos obligan a repetir | Tests de lo tocado en las rondas; la completa al cerrar o integrar (6.4) |
| Trabajar «de noche» con decisiones de comportamiento provisionales | Se construye sobre arena | De noche, sólo lo que no depende de decisiones abiertas (6.9) |
| Planificar sin tope: planes de miles de líneas, re-planes, re-auditorías | Planificar fue más de la mitad del gasto de los subagentes | Planes uno detrás del otro, en formato de anclas, re-auditando sólo lo roto (5.5) |

**No es exceso y no se recorta:** la revisión de lo que toca dinero o permisos, el ensayo sobre una copia de producción, el runbook con vuelta atrás y el «sí» del dueño.

**Conservar** (lo que dio resultado):
- Ensayar sobre una copia de producción, con runbook, plan B y vuelta atrás medida.
- La revisión de quien no construyó, con el modelo más capaz sólo para lo delicado (dinero, permisos, multi-tenant, migraciones).
- El test que falla antes y pasa después.
- Los guardianes que leen el código (mocks completos, textos sin jerga, aritmética de dinero fuera de la pantalla).
- Nada sale de la máquina sin el «sí» del dueño; los reverts no reescriben la historia.
- Seguir el dato hasta la pantalla; probar con una persona en dos empresas.
- Las decisiones una por una con recomendación (ahora, al inicio).
- Auditar el plan contra el código (5) y re-auditar sólo lo roto (5.5).
- La tabla de modelos y la guardia de `SKILL.md`.
- **Un criterio medible desde el inicio**: una lista fija de casos con un número objetivo («capítulo correcto en 16 de 30 → 25 de 30»). Fue el frente con menos arreglos. Conviene copiarlo en cada frente; para uno con pantallas, es la tabla de estados × roles (3.5).
