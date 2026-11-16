# aiWorkflows - instalador de una linea (Windows PowerShell):
#   irm https://raw.githubusercontent.com/JordiSalas1120/aiworkflows/main/install.ps1 | iex
# Opciones:  $env:AIWORKFLOWS_DIR = '<carpeta>' (por defecto ~\.claude-skills)  -  $env:AIWORKFLOWS_GUARDIA = '1' (instala el hook)
# (Este archivo es ASCII a proposito: asi `irm | iex` funciona igual en Windows PowerShell 5.1 y en PowerShell 7.)
$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/JordiSalas1120/aiworkflows.git'
$Dir = if ($env:AIWORKFLOWS_DIR) { $env:AIWORKFLOWS_DIR } else { Join-Path $env:USERPROFILE '.claude-skills' }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Host 'Falta git (https://git-scm.com).' -ForegroundColor Red; return }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Falta Node 18 o mas nuevo (https://nodejs.org).' -ForegroundColor Red; return }
$Mayor = [int](node -e "console.log(process.versions.node.split('.')[0])")
if ($Mayor -lt 18) { Write-Host "Node $Mayor es viejo: hace falta 18 o mas nuevo." -ForegroundColor Red; return }

if (Test-Path (Join-Path $Dir '.git')) {
  Write-Host "... actualizando $Dir"
  git -C $Dir pull --ff-only
} elseif ((Test-Path $Dir) -and (Get-ChildItem $Dir -Force | Select-Object -First 1)) {
  Write-Host "$Dir ya existe y no es este repo. Elegi otra carpeta: `$env:AIWORKFLOWS_DIR = '$env:USERPROFILE\aiworkflows'" -ForegroundColor Red; return
} else {
  Write-Host "... clonando en $Dir"
  git clone --depth 1 $Repo $Dir
}

$Instalar = Join-Path $Dir 'aiworkflows\instalar.mjs'
if ($env:AIWORKFLOWS_GUARDIA -eq '1') { node $Instalar --guardia } else { node $Instalar }
Write-Host ''
Write-Host "Listo. Abri Claude Code en tu proyecto y decile: 'trabaja con aiWorkflows'." -ForegroundColor Green
Write-Host "  Guardia (recomendada): node `"$Instalar`" --guardia"
Write-Host '  Actualizar: volve a correr este instalador.'
