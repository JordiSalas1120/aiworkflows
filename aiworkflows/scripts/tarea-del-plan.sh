#!/usr/bin/env bash
# Imprime una tarea entera de un plan, para pasársela a un subagente.
# Los títulos de las tareas en el plan son «### Tarea N:» (también «### Tarea 11B:»).
#
#   bash scripts/tarea-del-plan.sh <N> [ruta/al/plan.md]
#   PLAN=docs/superpowers/plans/mi-plan.md bash scripts/tarea-del-plan.sh 3
#
# Copiar a scripts/ del proyecto y guardarlo con finales de línea LF
# (en .gitattributes: «*.sh text eol=lf»): bash no corre un script con CRLF.
set -euo pipefail

tarea="${1:?Uso: bash scripts/tarea-del-plan.sh <número de tarea> [plan.md]}"
plan="${2:-${PLAN:-}}"
if [ -z "$plan" ]; then
  echo "Falta el plan: pasalo como segundo argumento o en la variable PLAN." >&2
  exit 1
fi

salida="$(awk -v t="$tarea" '
  $0 ~ "^### Tarea " t ":" { p = 1; print; next }
  /^### Tarea / { if (p) exit }
  /^## /        { if (p) exit }
  p
' "$plan")"

if [ -z "$salida" ]; then
  echo "No encontré «### Tarea $tarea:» en $plan" >&2
  exit 1
fi
printf '%s\n' "$salida"
