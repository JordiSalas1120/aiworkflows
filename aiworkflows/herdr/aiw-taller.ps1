<#
  aiw-taller.ps1 — abre en herdr el "taller" de aiWorkflows para un proyecto o ticket.

  Arma un workspace con tres paneles:
    ┌──────────────────────┬──────────────────────┐
    │ orq-<slug>           │ cons-<slug>          │
    │ Claude · opus        │ Claude · sonnet      │
    │ (orquestador: spec,  │ (construye tareas y  │
    │  plan, revisión,     │  aplica rondas)      │
    │  subagentes aiw-*)   ├──────────────────────┤
    │                      │ pruebas (terminal):  │
    │                      │ suites, servidores,  │
    │                      │ semáforo de recursos │
    └──────────────────────┴──────────────────────┘

  Uso (desde una terminal con herdr abierto, o con el atajo prefix+alt+a):
    aiw-taller.ps1 [-Proyecto <ruta>] [-Ticket ABC-123] [-Cuenta <CLAUDE_CONFIG_DIR>] [-SinConstructor]

  Reglas del método: máximo 3 sesiones de Claude vivas. El taller abre 2 (o 1 con -SinConstructor).
  El revisor y los ayudantes son subagentes aiw-* del orquestador, no paneles.
#>
param(
  [string]$Proyecto = (Get-Location).Path,
  [string]$Ticket = "",
  [string]$Cuenta = "",
  [switch]$SinConstructor,
  # Lo usa el atajo prefix+alt+a: pregunta el ticket y, si algo falla, deja el error a la vista.
  [switch]$Popup
)

$ErrorActionPreference = "Stop"

if ($Popup) {
  trap {
    Write-Host ""
    Write-Host "No se pudo abrir el taller: $_" -ForegroundColor Red
    Read-Host "Enter para cerrar" | Out-Null
    exit 1
  }
  if (-not $Ticket) { $Ticket = (Read-Host "Ticket (ej. ABC-123; Enter = sin ticket)").Trim() }
}

function Get-Herdr {
  if ($env:HERDR_BIN_PATH -and (Test-Path $env:HERDR_BIN_PATH)) { return $env:HERDR_BIN_PATH }
  $cmd = Get-Command herdr -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $alias = Join-Path $env:LOCALAPPDATA "Programs\Herdr\bin\herdr.exe"
  if (Test-Path $alias) { return $alias }
  throw "No encuentro herdr. Instalalo: powershell -ExecutionPolicy Bypass -c `"irm https://herdr.dev/install.ps1 | iex`""
}

$herdr = Get-Herdr

# Corre herdr y devuelve el JSON parseado; si falla, lanza con el error de herdr.
function Invoke-Hd {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$A)
  $prev = $ErrorActionPreference; $ErrorActionPreference = "Continue"
  $salida = & $herdr @A 2>&1
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = $prev
  $out = ($salida | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] }) -join "`n"
  $err = ($salida | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] }) -join "`n"
  if ($codigo -ne 0) { throw "herdr $($A -join ' ') → $err $out" }
  if ([string]::IsNullOrWhiteSpace($out)) { return $null }
  try { return $out | ConvertFrom-Json } catch { return $out }
}

# ── Datos ────────────────────────────────────────────────────────────────
$Proyecto = (Resolve-Path $Proyecto).Path
if (-not $Cuenta) {
  $Cuenta = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE ".claude" }
}
if (-not (Test-Path (Join-Path $Cuenta "settings.json"))) { throw "La cuenta de Claude '$Cuenta' no tiene settings.json." }

$base = if ($Ticket) { $Ticket } else { Split-Path $Proyecto -Leaf }
$slug = ($base.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
if (-not $slug -or $slug -notmatch '^[a-z]') { $slug = "t-$slug".TrimEnd('-') }
if ($slug.Length -gt 24) { $slug = $slug.Substring(0, 24).TrimEnd('-') }
$orq = "orq-$slug"
$cons = "cons-$slug"
$etiqueta = if ($Ticket) { "$Ticket · $(Split-Path $Proyecto -Leaf)" } else { Split-Path $Proyecto -Leaf }

# ── ¿Hay servidor de herdr? ──────────────────────────────────────────────
$estado = & $herdr status server 2>&1 | Out-String
if ($estado -match 'not running') {
  throw "El servidor de herdr no está corriendo. Abrí herdr primero (comando: herdr) y corré esto desde un panel, o usá el atajo prefix+alt+a."
}

# ¿Ya existe un taller con esos nombres?
$vivos = Invoke-Hd agent list
$nombres = @()
if ($vivos -and $vivos.result -and $vivos.result.agents) { $nombres = @($vivos.result.agents | ForEach-Object { $_.name }) }
if ($nombres -contains $orq) {
  Write-Host "Ya hay un taller abierto para '$base' (agente $orq). Enfocándolo." -ForegroundColor Yellow
  Invoke-Hd agent focus $orq | Out-Null
  return
}

# ── Layout ───────────────────────────────────────────────────────────────
$envCuenta = "CLAUDE_CONFIG_DIR=$Cuenta"
$ws = Invoke-Hd workspace create --cwd $Proyecto --label $etiqueta --env $envCuenta --focus
$panelOrq = $ws.result.root_pane.pane_id

$panelCons = $null
if (-not $SinConstructor) {
  $s1 = Invoke-Hd pane split $panelOrq --direction right --cwd $Proyecto --env $envCuenta --no-focus
  $panelCons = $s1.result.pane.pane_id
  $s2 = Invoke-Hd pane split $panelCons --direction down --ratio 0.65 --cwd $Proyecto --env $envCuenta --no-focus
  $panelPruebas = $s2.result.pane.pane_id
} else {
  $s2 = Invoke-Hd pane split $panelOrq --direction right --ratio 0.65 --cwd $Proyecto --env $envCuenta --no-focus
  $panelPruebas = $s2.result.pane.pane_id
}

# ── Agentes ──────────────────────────────────────────────────────────────
function Iniciar($nombre, $panel, $modelo) {
  try {
    Invoke-Hd agent start $nombre --kind claude --pane $panel --timeout 90000 '--' '--model' $modelo | Out-Null
    Write-Host "  ✔ $nombre ($modelo) en $panel"
  } catch {
    # agent_not_ready = Claude arrancó pero pide algo (p. ej. confiar en la carpeta). Se responde a mano.
    Write-Host "  ! $nombre en $panel arrancó pero espera una respuesta tuya (por ejemplo, confiar en la carpeta). Miralo en el panel." -ForegroundColor Yellow
  }
}

Write-Host "Taller aiWorkflows · $etiqueta · cuenta $(Split-Path $Cuenta -Leaf)"
Iniciar $orq $panelOrq "opus"
if ($panelCons) { Iniciar $cons $panelCons "sonnet" }

# Panel de pruebas: muestra el semáforo de recursos para arrancar.
$recursos = Join-Path $env:USERPROFILE ".claude-skills\aiworkflows\scripts\recursos.mjs"
if (Test-Path $recursos) { Invoke-Hd pane run $panelPruebas "node `"$recursos`"" | Out-Null }

try { Invoke-Hd agent focus $orq | Out-Null } catch { }

Write-Host ""
Write-Host "Desde el orquestador ($orq), para darle trabajo al constructor:"
Write-Host "  herdr agent prompt $cons `"<encargo del implementador>`" --wait"
Write-Host "  herdr agent read $cons --source recent-unwrapped --lines 120"
Write-Host "Suites y servidores: panel $panelPruebas  (herdr pane run $panelPruebas `"<comando>`")"
if ($Popup) { Start-Sleep -Seconds 4 }
