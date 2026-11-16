## 26. El taller: los agentes del método y herdr

### 26.1 Qué es cada cosa

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **Agentes `aiw-*`** | Subagentes de Claude Code, uno por fila de la tabla de modelos. Traen el rol, el modelo y las herramientas fijas. | `<skill>/agentes/`, enlazado como `<config>/agents` en cada cuenta (`instalar.mjs`) |
| **herdr** | Multiplexor de terminal para agentes. Las sesiones siguen vivas al cerrar la ventana, cada panel se marca como trabajando, bloqueado o libre, y un agente puede darle trabajo a otro panel con `herdr agent prompt`. | `%USERPROFILE%\.herdr`; config en `%APPDATA%\herdr\config.toml` |
| **El taller** | Un workspace de herdr por ticket con el orquestador, el constructor y la terminal de pruebas. | `<skill>/herdr/aiw-taller.ps1`; atajo `prefix+alt+a` (prefix = `ctrl+b`) |

Los subagentes `aiw-*` corren **dentro** de la sesión del orquestador. Los paneles de herdr son **sesiones aparte**, visibles, que sobreviven a cerrar la terminal.

### 26.2 Los agentes y su fila de la tabla

| Encargo | `subagent_type` | `model` |
|---|---|---|
| Construir una tarea · aplicar una ronda | `aiw-implementador` | sonnet |
| Revisar pantalla y textos · re-revisar ronda | `aiw-revisor` | sonnet |
| Revisar dinero, permisos, tenant, concurrencia, migraciones o borrado · revisión de rama · diseño al cerrar | `aiw-revisor-critico` | opus |
| Atacar el spec · auditar el plan · escribir la corrección exacta | `aiw-auditor` | opus |
| Bug o rebote de QA | `aiw-depurador` | sonnet (opus si toca plata, estado o concurrencia, o si no se reproduce) |
| Recorrido de la matriz y exploratoria (regla 0) | `aiw-probador-qa` | sonnet |
| Maqueta y ronda de maqueta | `aiw-maquetador` | sonnet |
| Explorar | `aiw-explorador` | haiku |
| Correr una suite y comparar los rojos | `aiw-suites` | haiku |
| Juntar capturas con lista fija | `aiw-capturas` | haiku |
| Resumir un informe o log | `aiw-resumidor` | haiku |

- **El `model` se sigue pasando explícito** en cada `Agent`: la guardia lo exige, y así queda medido. El modelo del archivo es solo el valor por defecto.
- El prompt del encargo sigue saliendo de `plantillas/encargos.md`. El agente trae lo fijo del rol; el encargo, lo concreto: tarea, rutas e informe.
- **Para mejorar un rol, se edita su archivo en `agentes/`.** Llega a todas las cuentas por el enlace. Se commitea en el repo de la skill, como cualquier cambio del método.

### 26.3 El taller en herdr

```
┌──────────────────────┬──────────────────────┐
│ orq-<ticket>         │ cons-<ticket>        │
│ Claude · opus        │ Claude · sonnet      │
│ spec, plan, revisión,│ construye tareas y   │
│ subagentes aiw-*     │ aplica rondas        │
│                      ├──────────────────────┤
│                      │ pruebas (terminal)   │
│                      │ suites · servidores  │
└──────────────────────┴──────────────────────┘
```

Hay dos formas de abrirlo:
- dentro de herdr, en un panel parado en la carpeta del proyecto: `prefix+alt+a` (`ctrl+b`, después `alt+a`). Pregunta el ticket;
- desde la línea de comandos: `& "$env:USERPROFILE\.claude-skills\aiworkflows\herdr\aiw-taller.ps1" -Ticket ABC-123 [-Proyecto <ruta>] [-Cuenta <CLAUDE_CONFIG_DIR>] [-SinConstructor]`.

Si el taller del ticket ya está abierto, lo enfoca en vez de duplicarlo. Cada panel recibe `CLAUDE_CONFIG_DIR` de la cuenta elegida, que por defecto es la de la terminal.

### 26.4 Cómo trabaja el orquestador con el taller

- **Construir:** dos opciones.
  - Por defecto, el subagente `aiw-implementador` (sonnet), como siempre.
  - Para una tarea larga, o para ver la construcción en vivo, se la da al panel constructor:
    ```
    herdr agent prompt cons-<ticket> "<encargo del implementador>" --wait --timeout 1800000
    herdr agent read cons-<ticket> --source recent-unwrapped --lines 120
    ```
    El informe lo escribe el constructor en el archivo del encargo, y el orquestador lee solo ese archivo (regla 5). Si `agent prompt` vuelve con `blocked`, se mira con `agent read` antes de responder. Nunca se aprueba un diálogo a ciegas.
- **Suites y servidores:** en el panel de pruebas (`herdr pane run <panel> "<cmd>"` y `herdr pane wait-output <panel> --regex "passed|failed"`), o con `aiw-suites`. Siempre **una suite a la vez**.
- **Revisar y auditar:** siempre como subagentes `aiw-*` del orquestador. Así cuentan en el presupuesto y la guardia los ve.

### 26.5 Presupuesto y recursos con herdr

- Cada panel con Claude es una sesión completa que ocupa memoria. **Como máximo hay 3 sesiones de Claude vivas en total**, sumando los paneles de herdr y los subagentes que corren a la vez. El taller ya usa 2.
- Darle un encargo al panel constructor **cuenta como un subagente** del presupuesto del ticket (4). Anotalo en el registro: `Tarea N · construye: sonnet (panel cons-<ticket>)`.
- El semáforo `recursos.mjs` aparece en el panel de pruebas al abrir el taller. **En rojo no se lanza nada.**
- Al cerrar el ticket se cierra su workspace de herdr: `ctrl+b` y el menú, o `herdr workspace close <id>`. Solo se cierran los paneles que abrió el taller.

### 26.6 Lo que no se hace

- **No se controla herdr desde fuera de herdr.** La skill `herdr` exige `HERDR_ENV=1`.
- No se cierran workspaces ni paneles ajenos, y no se corre `herdr server stop` en la sesión de trabajo: mata todos los paneles. Para probar, se usa una sesión con nombre: `herdr --session prueba server`.
- No se usa `--trust-repository` sin que el dueño haya verificado el repo.
