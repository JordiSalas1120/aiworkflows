// lib-recursos.mjs — medir la máquina y encontrar procesos sobrantes (método 25).
// Lo usan scripts/recursos.mjs (a mano) y scripts/guardia-de-modelos.mjs (hook).
// Sin dependencias: Node 18+, Windows (PowerShell/CIM), macOS y Linux (ps).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

export const UMBRALES = {
  ramLibreRojoPct: 12, ramLibreRojoGB: 1.5, ramLibreAmarilloPct: 22,
  cpuRojoPct: 90, cpuAmarilloPct: 75,
  discoRojoGB: 3, discoAmarilloGB: 8,
  suiteColgadaMin: 30, navegadorViejoMin: 30,
};

// Categorías por línea de comando. El orden importa: la primera que coincide gana.
export const CATEGORIAS = [
  ['claude', /(^|[\\/\s"])claude(\.exe)?(["\s]|$)|@anthropic-ai[\\/]claude-code|claude-code[\\/]cli/i],
  ['suite', /vitest|[\\/\s]jest(\.js)?(\s|$)|pytest|playwright(\.cmd)?["\s]+test|[\\/]@playwright[\\/]test[\\/]cli|mocha|cypress["\s]+run|\bgo(\.exe)?\s+test\b/i],
  ['navegador-pruebas', /ms-playwright|puppeteer|(chrome|chromium|msedge|headless_shell|firefox)(\.exe)?["\s].*(--headless|--remote-debugging-port)/i],
  ['servidor-dev', /[\\/]vite[\\/]bin|vite(\.js|\.cmd)?["\s]+(dev|serve|preview)?|next(\.cmd)?["\s]+dev|nodemon|ts-node-dev|tsx(\.cmd)?["\s]+watch|uvicorn|flask["\s]+run|manage\.py["\s]+runserver|webpack(-dev-server|["\s]+serve)|(npm|pnpm|yarn)(\.cmd)?["\s]+(run\s+)?(dev|start|serve)\b/i],
  ['observador', /--watch\b|\btsc(\.cmd)?["\s]+-w\b|chokidar/i],
];

export function categoria(cmd = '') {
  for (const [nombre, re] of CATEGORIAS) if (re.test(cmd)) return nombre;
  return null;
}

// ── Máquina ─────────────────────────────────────────────────────────────
function tiemposCpu() {
  return os.cpus().map((c) => { const t = c.times; return { ocupado: t.user + t.nice + t.sys + t.irq, total: t.user + t.nice + t.sys + t.irq + t.idle }; });
}

export function cpuPct(ms = 300) {
  const a = tiemposCpu();
  const fin = Date.now() + ms;
  while (Date.now() < fin) { /* espera activa corta: el hook no puede ser async-lento */ }
  const b = tiemposCpu();
  let ocupado = 0; let total = 0;
  b.forEach((x, i) => { ocupado += x.ocupado - a[i].ocupado; total += x.total - a[i].total; });
  return total > 0 ? Math.round((ocupado / total) * 100) : 0;
}

export function maquina({ ms = 300, ruta = process.cwd() } = {}) {
  const totalGB = os.totalmem() / 1024 ** 3;
  const libreGB = os.freemem() / 1024 ** 3;
  let discoLibreGB = null;
  try { const s = fs.statfsSync(ruta); discoLibreGB = (s.bavail * s.bsize) / 1024 ** 3; } catch { /* Node < 18.15 */ }
  return { totalGB, libreGB, librePct: (libreGB / totalGB) * 100, cpuPct: cpuPct(ms), nucleos: os.cpus().length, discoLibreGB };
}

export function semaforo(m, u = UMBRALES) {
  const motivos = [];
  let nivel = 'verde';
  const subir = (n, motivo) => { motivos.push(motivo); if (n === 'rojo' || nivel === 'verde') nivel = n; };
  if (m.librePct < u.ramLibreRojoPct || m.libreGB < u.ramLibreRojoGB) subir('rojo', `RAM libre ${m.libreGB.toFixed(1)} GB (${m.librePct.toFixed(0)} %)`);
  else if (m.librePct < u.ramLibreAmarilloPct) subir('amarillo', `RAM libre ${m.libreGB.toFixed(1)} GB (${m.librePct.toFixed(0)} %)`);
  if (m.cpuPct >= u.cpuRojoPct) subir('rojo', `CPU ${m.cpuPct} %`);
  else if (m.cpuPct >= u.cpuAmarilloPct) subir('amarillo', `CPU ${m.cpuPct} %`);
  if (m.discoLibreGB != null && m.discoLibreGB < u.discoRojoGB) subir('rojo', `disco libre ${m.discoLibreGB.toFixed(1)} GB`);
  else if (m.discoLibreGB != null && m.discoLibreGB < u.discoAmarilloGB) subir('amarillo', `disco libre ${m.discoLibreGB.toFixed(1)} GB`);
  return { nivel, motivos };
}

export const QUE_SE_PUEDE = {
  verde: 'Se puede: hasta 3 agentes vivos y 1 suite a la vez.',
  amarillo: 'Con cuidado: 1 agente vivo a la vez, en primer plano; suites sólo de lo tocado y con pocos workers (vitest --maxWorkers=2, pytest -n 2, playwright --workers=1). Cerrá los sobrantes.',
  rojo: 'Frenado: no se lanza ningún agente ni suite. Primero cerrá los sobrantes (recursos.mjs --cerrar-sobrantes) o esperá a que termine lo que corre.',
};

// ── Procesos ────────────────────────────────────────────────────────────
function listarWindows() {
  const ps = "$ErrorActionPreference='SilentlyContinue'; $ahora=Get-Date; Get-CimInstance Win32_Process | ForEach-Object { [pscustomobject]@{ pid=[int]$_.ProcessId; ppid=[int]$_.ParentProcessId; nombre=$_.Name; cmd=$_.CommandLine; ramMB=[math]::Round($_.WorkingSetSize/1MB); seg=$(if($_.CreationDate){[int]($ahora-$_.CreationDate).TotalSeconds}else{0}) } } | ConvertTo-Json -Compress";
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 8000, windowsHide: true });
  if (r.status !== 0 || !r.stdout) return [];
  const datos = JSON.parse(r.stdout);
  return (Array.isArray(datos) ? datos : [datos]).map((p) => ({ ...p, cmd: p.cmd || p.nombre || '' }));
}

function etimeASeg(t) { // [[dd-]hh:]mm:ss
  const [dias, resto] = t.includes('-') ? t.split('-') : ['0', t];
  const p = resto.split(':').map(Number);
  while (p.length < 3) p.unshift(0);
  return Number(dias) * 86400 + p[0] * 3600 + p[1] * 60 + p[2];
}

function listarUnix() {
  const r = spawnSync('ps', ['-axo', 'pid=,ppid=,rss=,etime=,args='], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 8000 });
  if (r.status !== 0) return [];
  return r.stdout.split('\n').filter(Boolean).map((l) => {
    const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
    if (!m) return null;
    return { pid: +m[1], ppid: +m[2], ramMB: Math.round(+m[3] / 1024), seg: etimeASeg(m[4]), cmd: m[5], nombre: m[5].split(/\s/)[0].split('/').pop() };
  }).filter(Boolean);
}

export function listarProcesos() {
  try { return process.platform === 'win32' ? listarWindows() : listarUnix(); } catch { return []; }
}

function ancestros(pid, porPid) {
  const out = new Set();
  let p = porPid.get(pid);
  for (let i = 0; p && i < 64; i++) { if (out.has(p.ppid)) break; out.add(p.ppid); p = porPid.get(p.ppid); }
  return out;
}

// Agrupa por raíz de categoría (un dev server son varios node.exe), suma RAM de descendientes
// y marca SOBRANTES: huérfanos (el padre ya no existe), suites colgadas, navegadores de prueba sin suite viva.
export function analizar(procesos = listarProcesos(), u = UMBRALES) {
  const porPid = new Map(procesos.map((p) => [p.pid, p]));
  const yo = new Set([process.pid, ...ancestros(process.pid, porPid)]);
  const cat = new Map(procesos.map((p) => [p.pid, categoria(p.cmd)]));
  const hijos = new Map();
  for (const p of procesos) { if (!hijos.has(p.ppid)) hijos.set(p.ppid, []); hijos.get(p.ppid).push(p); }
  const ramArbol = (pid, vistos = new Set()) => {
    if (vistos.has(pid)) return 0; vistos.add(pid);
    return (porPid.get(pid)?.ramMB || 0) + (hijos.get(pid) || []).reduce((s, h) => s + ramArbol(h.pid, vistos), 0);
  };
  const suitesVivas = procesos.filter((p) => cat.get(p.pid) === 'suite').map((p) => p.pid);

  const grupos = [];
  for (const p of procesos) {
    const c = cat.get(p.pid);
    if (!c || p.pid === process.pid) continue;
    const padre = porPid.get(p.ppid);
    if (padre && cat.get(padre.pid) === c) continue; // no es raíz: lo cuenta su padre
    const anc = ancestros(p.pid, porPid);
    let sobrante = null;
    const huerfano = !padre && p.ppid > 4;
    if (c === 'claude') sobrante = null;
    else if (c === 'suite' && p.seg > u.suiteColgadaMin * 60) sobrante = `suite corriendo hace ${Math.round(p.seg / 60)} min: ¿colgada?`;
    else if (c === 'navegador-pruebas' && !suitesVivas.some((s) => anc.has(s)) && (huerfano || p.seg > u.navegadorViejoMin * 60)) sobrante = 'navegador de pruebas sin suite viva que lo use';
    else if (huerfano) sobrante = 'huérfano: quien lo lanzó ya no existe';
    grupos.push({ pid: p.pid, ppid: p.ppid, categoria: c, min: Math.round(p.seg / 60), ramMB: ramArbol(p.pid), cmd: p.cmd.replace(/\s+/g, ' ').slice(0, 160), sobrante, propio: yo.has(p.pid) });
  }
  grupos.sort((a, b) => b.ramMB - a.ramMB);
  return { grupos, suitesVivas: grupos.filter((g) => g.categoria === 'suite') };
}

export function cerrar(pid) {
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { encoding: 'utf8', windowsHide: true });
    return r.status === 0 ? 'cerrado' : (r.stderr || r.stdout || '').trim();
  }
  try { process.kill(pid, 'SIGTERM'); return 'cerrado (SIGTERM)'; } catch (e) { return e.message; }
}

// Comandos que lanzan una suite (para la guardia sobre Bash/PowerShell).
export const RE_COMANDO_SUITE = /\b(vitest(\s+run)?|jest|pytest|playwright\s+test|cypress\s+run|go\s+test|npm(\.cmd)?\s+(run\s+)?test|pnpm\s+(run\s+)?test|yarn\s+test|python(3)?(\.exe)?\s+-m\s+pytest)\b/i;
