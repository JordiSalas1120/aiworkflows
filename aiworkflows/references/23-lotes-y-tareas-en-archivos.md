## 23. Lotes y tareas en archivos: la convención

> **11-oct-2026.** Desde hoy, todo trabajo con agentes (Claude orquesta, los subagentes construyen) deja sus lotes y tareas **en archivos con nombres fijos**, en una carpeta de trabajo del proyecto. Así cualquier sesión nueva sabe qué se encargó, qué se implementó, qué se revisó y qué lote está cerrado, sin depender del historial de la conversación.

### 23.1 Dónde

Una carpeta de trabajo por proyecto, fuera del código que se despliega: `<proyecto>-trabajo\` (como `Personal\asvs-trabajo\`) o `<repo>\tmp\` si el proyecto ya la usa. Dentro:

```
tareas\                          encargos (uno por tarea)
informes\                        lo que devuelven el implementador y el revisor
```

### 23.2 Nombres (formato por tareas)

| Archivo | Quién lo escribe | Significa |
|---|---|---|
| `tareas\<LOTE>-T<n>.md` | Orquestador | Tarea encargada (el primer archivo de un lote abre el lote) |
| `informes\<LOTE>-T<n>-impl.md` | Implementador | Implementada, pendiente de revisión |
| `informes\<LOTE>-T<n>-rev.md` | Revisor | Revisada: la tarea queda cerrada si el veredicto no es «rechazado» |
| `informes\<LOTE>-T<n>-rerev.md` | Revisor | Re-revisión tras arreglos |
| `informes\<LOTE>-cierre.md` o `<LOTE>-final-rev.md` | Orquestador / revisor | Lote cerrado |

- `<LOTE>`: corto y sin espacios (`24M`, `F2`, `U1`, `RPD`). Tareas juntas en un encargo: `<LOTE>-T3T4.md`.
- La **primera línea** del `-rev.md` dice el veredicto: `Veredicto: APROBADO` o `Veredicto: RECHAZADO` (con arreglos).
- Los `.diff`, capturas y salidas de pruebas pueden ir al lado con el mismo prefijo.

### 23.3 Formato por rondas

Para trabajo por rondas de arreglo sobre una rama (por ejemplo, una integración grande), en `tmp\`:

| Archivo | Significa |
|---|---|
| `encargo-<agente>-<frente>[-N][letra].md` | Ronda N del frente encargada |
| `correcciones-<frente>-ronda-<N>[letra].md` | Revisión de Opus de esa ronda; la primera línea dice `RECHAZADO` si se rechazó |

Una ronda revisada sin rechazo queda cerrada; rechazada, sigue abierta con sus correcciones.

### 23.4 Reglas

1. **Siempre archivo, nunca solo chat:** el encargo, el informe y la revisión existen como archivo aunque la tarea sea chica.
2. **Nombres fijos:** no inventar variantes (`-review.md`, `-revision.md`); si hace falta otra, se agrega aquí primero.
3. **Una carpeta de trabajo por proyecto**, declarada en su `CLAUDE.md` («Carpeta de trabajo: `...`»), para que cualquier sesión la encuentre.
4. **El título de cada sesión** lleva el lote cuando se puede (`F2 · frente B`), para saber de un vistazo qué sesión trabaja en qué lote.
5. **Lo viejo no se renombra:** la convención rige para lo nuevo.

---

> **Última palabra.** Este método parece lento al principio y es rápido en el total. El tiempo que se "pierde" auditando un plan o revisando una tarea se recupera muchas veces en defectos que no llegan a producción, en decisiones que no hay que deshacer y en sesiones que arrancan sabiendo dónde quedó todo. Lo que sí es lento sin aportar nada (infraestructura, esperas, repeticiones) se mide y se arregla sin tocar la calidad.
