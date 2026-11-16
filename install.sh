#!/usr/bin/env sh
# aiWorkflows — instalador de una línea (macOS / Linux / Git Bash):
#   curl -fsSL https://raw.githubusercontent.com/JordiSalas1120/aiworkflows/main/install.sh | sh
# Opciones por variable:  AIWORKFLOWS_DIR=<carpeta> (por defecto ~/.claude-skills) · AIWORKFLOWS_GUARDIA=1 (instala el hook)
set -eu
REPO="https://github.com/JordiSalas1120/aiworkflows.git"
DIR="${AIWORKFLOWS_DIR:-$HOME/.claude-skills}"

command -v git >/dev/null 2>&1 || { echo "✘ Falta git."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "✘ Falta Node 18 o más nuevo (https://nodejs.org)."; exit 1; }
MAYOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$MAYOR" -ge 18 ] || { echo "✘ Node $MAYOR es viejo: hace falta 18 o más nuevo."; exit 1; }

if [ -d "$DIR/.git" ]; then
  echo "… actualizando $DIR"
  git -C "$DIR" pull --ff-only
elif [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2>/dev/null)" ]; then
  echo "✘ $DIR ya existe y no es este repo. Elegí otra carpeta: AIWORKFLOWS_DIR=~/aiworkflows sh install.sh"; exit 1
else
  echo "… clonando en $DIR"
  git clone --depth 1 "$REPO" "$DIR"
fi

if [ "${AIWORKFLOWS_GUARDIA:-0}" = "1" ]; then node "$DIR/aiworkflows/instalar.mjs" --guardia; else node "$DIR/aiworkflows/instalar.mjs"; fi
echo ""
echo "✔ Listo. Abrí Claude Code en tu proyecto y decile: «trabajá con aiWorkflows»."
echo "  Guardia (recomendada): node \"$DIR/aiworkflows/instalar.mjs\" --guardia"
echo "  Actualizar: volvé a correr este instalador (o git -C \"$DIR\" pull)."
