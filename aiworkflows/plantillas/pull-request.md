<!-- PLANTILLA de aiWorkflows (método 27.6). Copiala a .github/pull_request_template.md del proyecto. -->
## Qué y por qué

<!-- En palabras del dueño: qué problema resuelve. Una o dos líneas. -->

- **Ticket:** ABC-123 · **Spec:** `docs/specs/…` · **Ficha:** `docs/ramas/<tipo>--<TICKET>-<slug>.md` · **Registro:** `…registro.md`

## Cómo probarlo en dev

- Enlace directo: <https://dev.ejemplo.com/…>
- Usuario sembrado: `…` (rol …)
- Pasos y esperado **visible** (lo que ve la persona, no el estado interno):
  1. …

## Pruebas

- Suite completa: `<comando>` → **N tests, 0 rojos** (sha `…`)
- Recorrido de la regla 0 (tabla de estados × roles): `<spec del recorrido>` → 0 ❌ en local · ☐ en dev
- Tests de regresión verificados con `rojo-sin-arreglo.mjs`: sí / no aplica

## Riesgos y despliegue

- Migraciones: no / sí (`…`, compatibles hacia atrás: sí)
- Variables de entorno nuevas: no / sí (agregadas a `.env.example`)
- ¿Tiene que salir junto con otra cosa?: no / sí (…)
- Vuelta atrás: redeploy del tag anterior / apagar flag `…` / revert

## Lo que NO se probó

<!-- Honesto. Lo que no se verificó va acá, no se omite. -->

- …

## Capturas

<!-- Antes / después, 1440 px, claro y oscuro si aplica. -->
