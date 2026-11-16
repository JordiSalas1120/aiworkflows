## 2. El ciclo completo, de un vistazo

```
 ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐
 │ 1. ENTENDER  │──▶│ 2. PLAN      │──▶│ 3. AUDITAR EL    │──▶│ 4. CONSTRUIR  │
 │    Y DISEÑAR │   │   por tareas │   │    PLAN contra   │   │  tarea x tarea│
 │  (spec)      │   │              │   │    el código     │   │  impl + revis.│
 └──────────────┘   └──────────────┘   └──────────────────┘   └───────┬───────┘
        ▲                                                             │
        │ si aparece algo estructural,                                ▼
        │ se vuelve a diseñar                                 ┌───────────────┐
        │                                                     │ 5. REVISIÓN   │
 ┌──────┴───────┐   ┌──────────────┐   ┌──────────────────┐   │    FINAL      │
 │ 8. CERRAR:   │◀──│ 7. DESPLEGAR │◀──│ 6. VERIFICAR EN  │◀──│ + arreglos +  │
 │ vault, grafo,│   │  dev → prod  │   │    EL MUNDO REAL │   │ re-revisión   │
 │ memoria      │   │  (con orden) │   │  (navegador,dato)│   └───────────────┘
 └──────────────┘   └──────────────┘   └──────────────────┘
```

**Las puertas de QA senior (24), sobre este ciclo:**
- en la fase 1, el **ataque al spec** y la **matriz de pruebas**;
- en las fases 4 y 5, la **caza de bugs** en cada revisión y el **rojo sin el arreglo** de cada test de regresión;
- en la fase 6, el recorrido de la matriz más la **exploratoria**;
- entre la 7 (dev) y QA, la **puerta de cert** y la **guía para QA**.

Un rebote de QA vuelve directo a **depurar** (24.6), con alcance mínimo.

**Lo que ocupa cada fase (orden de magnitud en una funcionalidad grande):**

| Fase | Tiempo | Qué sale |
|---|---|---|
| Entender y diseñar | 1 a 4 sesiones | Spec con decisiones cerradas |
| Plan | 1 sesión | Documento de tareas con código y tests |
| Auditar | 0,5 a 1 sesión | Plan corregido + registro de decisiones |
| Construir | 1 a 2 sesiones | Commits chicos, uno o varios por tarea |
| Revisión final | 1 a 2 h | Lista de hallazgos, arreglos, re-revisión limpia |
| Verificar | 1 a 3 h | Evidencia en navegador y en datos |
| Desplegar | Minutos, con orden | Dev, y después prod |
| Cerrar | 30 min | Nota del porqué, grafo, memoria |

⚖️ **El diseño y la auditoría parecen lentos y son lo más barato que hay.** Un defecto encontrado en el plan cuesta minutos; en producción cuesta días y confianza.
