#!/usr/bin/env node
// Guardia de aiWorkflows: hook PreToolUse de Claude Code sobre Agent/Task y Bash/PowerShell.
//
// Sobre Agent/Task hace cumplir:
//   1. MODELO (SKILL.md, método 15.8): todo encargo lleva `model` explícito (salvo un fork);
//      Opus no construye, no aplica, no explora ni corre suites; no re-planifica sin justificar (5.5);
//      Haiku no revisa ni decide. Excepción para Opus: «[opus-justificado: <motivo>]».
//   2. PRESUPUESTO (método 25): como máximo AIWORKFLOWS_TOPE (por defecto 4) subagentes por ticket.
//      El ticket es la primera clave tipo JIRA (ABC-123) en la descripción o el prompt; sin clave, la sesión.
//      Para pasarse: el dueño lo aprueba y el prompt dice «[sobre-tope: <motivo>]».
//      Seguir con un agente vivo por SendMessage NO cuenta: es la forma de no gastar uno nuevo.
//   3. RECURSOS (método 25): con la máquina en ROJO (RAM, CPU o disco) no se lanza nada.
// Sobre Bash/PowerShell, sólo si el comando lanza una suite de tests:
//   4. una sola suite a la vez, y ninguna con la máquina en ROJO.
// Sobre Bash/PowerShell, si el comando es de git (método 27):
//   5. nada de push a una rama protegida (main, master, develop, dev, staging, production, prod), ni explícito
//      ni desde una rama protegida; nada de --force sin --force-with-lease; nada de --no-verify;
//      nada de borrar ramas remotas. Pasa con el «sí» del dueño escrito en el comando como comentario:
//      `git push origin main  # [git-autorizado: el dueño lo pidió el 16-nov para el hotfix X]`.
//
// Variables: AIWORKFLOWS_TOPE=<n> · AIWORKFLOWS_RECURSOS=0 apaga los chequeos de recursos ·
//   AIWORKFLOWS_GIT=0 apaga las reglas de git · AIWORKFLOWS_PROTEGIDAS=main,master,… cambia la lista.
// Anota cada encargo en <config>/metrics/encargos.jsonl (medir-agentes.py lo lee).
// Nunca bloquea por un error propio: si algo falla, deja pasar.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REGLAS = join(dirname(AQUI), 'SKILL.md').replaceAll('\\', '/');
const RECURSOS = join(AQUI, 'recursos.mjs').replaceAll('\\', '/');
const TOPE = Number(process.env.AIWORKFLOWS_TOPE) || 4;
const CON_RECURSOS = process.env.AIWORKFLOWS_RECURSOS !== '0';
const METRICAS = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'metrics');

const RE_JUSTIFICADO = /\[opus-justificado:\s*[^\]]{8,}\]/i;
const RE_SOBRE_TOPE = /\[sobre-tope:\s*[^\]]{5,}\]/i;
const RE_TICKET = /\b([A-Z][A-Z0-9]{1,9}-\d{1,6})\b/;
const RE_REPLAN = /\bre-?plan|\bre-?audit|re-?escrib\w* (el |los )?plan|rewrite .*plan|rehac\w* (el |los )?plan/i;
const RE_REVISION = /revis|review|audit|verific|re-?check|valid|criterio|decid|diseñ|design|spec|plan\b|planes|plans\b|escrib\w* (la |las )?correcci|exact fix/i;
const RE_MECANICO = [
  ['construir o aplicar', /implement|constru|\bbuild\b|aplic\w* (la |las |el )?(tarea|correcci|arreglo|fix)|\bapply\b|transcrib|ronda de arreglo|fix round|ola (final )?de arreglos|fix wave|wave of fixes/i, 'sonnet'],
  ['explorar o buscar', /explor|busc\w* d[oó]nde|\bmap(ea|ear|eo)?\b|\bfind\b|\bsearch\b|\blocate\b|d[oó]nde (est[aá]|vive|se usa)/i, 'haiku'],
  ['correr pruebas o medir', /corr\w* (la |las )?(suite|pruebas|tests)|\brun (the )?(suite|tests)\b|lista de rojos|contar|medir|measure/i, 'haiku'],
  ['juntar capturas o resumir', /captur|screenshot|resum|summar/i, 'haiku'],
];

function salir(decision, motivo) {
  if (decision === 'deny') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `${motivo}\nReglas: ${REGLAS}` },
    }));
  }
  process.exit(0);
}

// ── reglas de git (método 27) ─────────────────────────────────────────────
function reglasDeGit(comando, cwd) {
  if (!/\bgit\b/.test(comando) || /\[git-autorizado:\s*[^\]]{8,}\]/i.test(comando)) return;
  const PROTEGIDAS = (process.env.AIWORKFLOWS_PROTEGIDAS || 'main,master,develop,dev,staging,production,prod').split(',').map((x) => x.trim()).filter(Boolean);
  const esProtegida = (x) => PROTEGIDAS.includes(x);
  const pie = 'Si el dueño lo autorizó para ESTE caso, agregá al final del comando «# [git-autorizado: <quién y por qué>]». Método: references/27-git-ramas-y-bitacora.md';
  for (const parte of comando.split(/&&|\|\||;|\r?\n/)) {
    const p = parte.replace(/#.*$/, '').trim();
    if (!/\bgit\b/.test(p)) continue;
    if (/\s--no-verify\b/.test(p)) salir('deny', `aiWorkflows (27): --no-verify saltea los hooks (tipos, lint, formato). Arreglá lo que el hook marca. ${pie}`);
    if (!/\bgit\s+push\b/.test(p)) continue;
    const args = p.replace(/^.*?\bgit\s+push\b/, '').split(/\s+/).filter(Boolean);
    const opciones = args.filter((x) => x.startsWith('-'));
    const posicionales = args.filter((x) => !x.startsWith('-'));
    const forzado = opciones.some((x) => x === '--force' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(x)) || posicionales.slice(1).some((x) => x.startsWith('+'));
    if (forzado) salir('deny', `aiWorkflows (27): push forzado sin --force-with-lease. En tu propia rama, después de un rebase, usá «git push --force-with-lease». Nunca sobre una rama compartida. ${pie}`);
    if (opciones.some((x) => x === '--delete' || x === '-d') || posicionales.slice(1).some((x) => x.startsWith(':'))) salir('deny', `aiWorkflows (27): borrar una rama remota se pregunta siempre al dueño. ${pie}`);
    if (opciones.some((x) => x === '--all' || x === '--mirror')) salir('deny', `aiWorkflows (27): --all/--mirror sube también las ramas protegidas. Subí sólo tu rama de trabajo. ${pie}`);
    const destinos = posicionales.slice(1).map((x) => x.replace(/^\+/, '').split(':').pop().replace(/^refs\/heads\//, ''));
    if (destinos.some(esProtegida)) salir('deny', `aiWorkflows (27): push directo a una rama protegida (${PROTEGIDAS.join(', ')}). A esas ramas se llega por PR. Subí tu rama de trabajo: «node <skill>/scripts/ramas.mjs subir --test "<cmd>"». ${pie}`);
    if (!destinos.length || destinos.every((x) => x === 'HEAD')) {
      let actual = null;
      try { actual = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: cwd || process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* sin repo: deja pasar */ }
      if (actual && esProtegida(actual)) salir('deny', `aiWorkflows (27): estás en «${actual}», que es protegida, y el push la subiría. Creá una rama de trabajo («ramas.mjs nueva <tipo>/<TICKET>-<slug>»), mové ahí tus commits y subí esa. ${pie}`);
    }
  }
}

function anotar(registro) {
  try { mkdirSync(METRICAS, { recursive: true }); appendFileSync(join(METRICAS, 'encargos.jsonl'), JSON.stringify(registro) + '\n'); } catch { /* medir nunca bloquea */ }
}

function usados(sesion, ticket) {
  try {
    const f = join(METRICAS, 'encargos.jsonl');
    if (!existsSync(f)) return 0;
    return readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter((r) => r && r.decision === 'allow' && r.session_id === sesion && (r.ticket ?? null) === ticket).length;
  } catch { return 0; }
}

async function recursos({ conProcesos = false } = {}) {
  if (!CON_RECURSOS) return null;
  try {
    const lib = await import('./lib-recursos.mjs');
    const s = lib.semaforo(lib.maquina({ ms: 250 }));
    const suites = conProcesos ? lib.analizar().suitesVivas : [];
    return { ...s, suites, quePuede: lib.QUE_SE_PUEDE[s.nivel], reSuite: lib.RE_COMANDO_SUITE };
  } catch { return null; }
}

let entrada;
try { entrada = JSON.parse(readFileSync(0, 'utf8').replace(/^﻿/, '')); } catch { process.exit(0); }
const herramienta = entrada?.tool_name;
const i = entrada?.tool_input ?? {};

// ── Bash / PowerShell: sólo comandos que lanzan una suite ─────────────────
if (herramienta === 'Bash' || herramienta === 'PowerShell') {
  const comando = String(i.command ?? '');
  if (process.env.AIWORKFLOWS_GIT !== '0') reglasDeGit(comando, entrada?.cwd);
  if (!CON_RECURSOS) process.exit(0);
  let lib;
  try { lib = await import('./lib-recursos.mjs'); } catch { process.exit(0); }
  if (!lib.RE_COMANDO_SUITE.test(comando) || /recursos\.mjs/.test(comando)) process.exit(0);
  const r = await recursos({ conProcesos: true });
  if (!r) process.exit(0);
  if (r.nivel === 'rojo') salir('deny', `aiWorkflows (25): máquina en ROJO (${r.motivos.join(' · ')}). No se lanza una suite ahora. ${r.quePuede}\nMirá qué sobra: node "${RECURSOS}"`);
  if (r.suites.length) salir('deny', `aiWorkflows (25): ya hay una suite corriendo: ${r.suites.map((s) => `PID ${s.pid} (${s.min} min, ${s.ramMB} MB) ${s.cmd.slice(0, 80)}`).join(' | ')}. Nunca dos a la vez: esperá su resultado, o si quedó colgada cerrala con node "${RECURSOS}" --cerrar <PID>.`);
  process.exit(0);
}

if (herramienta !== 'Agent' && herramienta !== 'Task') process.exit(0);

// ── Agent / Task ──────────────────────────────────────────────────────────
const tipo = i.subagent_type ?? 'general-purpose';
const modelo = (i.model ?? '').toLowerCase();
const descripcion = i.description ?? '';
const prompt = i.prompt ?? '';
const texto = `${descripcion}\n${prompt.slice(0, 600)}`;
const justificado = RE_JUSTIFICADO.test(prompt);
const sobreTope = RE_SOBRE_TOPE.test(prompt);
const ticket = (texto.match(RE_TICKET) || [])[1] ?? null;

let decision = 'allow';
let motivo = '';

// 1. Modelo
if (tipo === 'fork') {
  // Un fork hereda el modelo de la sesión: no se le pide model.
} else if (!modelo) {
  decision = 'deny';
  motivo = 'aiWorkflows: todo encargo lleva `model` explícito (haiku | sonnet | opus), elegido por la tabla de la skill. Volvé a lanzarlo con el parámetro model.';
} else if (modelo.includes('opus') && !justificado) {
  if (RE_REPLAN.test(texto)) {
    decision = 'deny';
    motivo = 'aiWorkflows (5.5): no se re-planifica ni se re-audita un plan entero. Primero `node <skill>/scripts/anclas-del-plan.mjs <plan> <ref>` y re-auditá con Sonnet sólo las tareas con anclas rotas. Si cambió el diseño, agregá «[opus-justificado: <motivo>]» y anotalo en el registro.';
  } else if (!RE_REVISION.test(texto)) {
    const golpe = RE_MECANICO.find(([, re]) => re.test(texto));
    if (golpe) {
      decision = 'deny';
      motivo = `aiWorkflows (15.8): este encargo parece «${golpe[0]}», que no es trabajo de Opus → model: ${golpe[2]}. Si de verdad exige juicio de Opus, agregá «[opus-justificado: <motivo>]» y anotalo en el registro.`;
    }
  }
} else if (modelo.includes('haiku') && /revis|review|audit|decid|criterio/i.test(descripcion)) {
  decision = 'deny';
  motivo = 'aiWorkflows (15.8): Haiku no revisa, no audita ni decide; el piso para revisar es Sonnet (Opus si toca dinero, permisos, tenant, concurrencia, migraciones o borrado).';
}

// 2. Presupuesto
const n = usados(entrada.session_id, ticket);
if (decision === 'allow' && n >= TOPE && !sobreTope) {
  decision = 'deny';
  motivo = `aiWorkflows (25): tope de ${TOPE} subagentes ${ticket ? `para ${ticket}` : 'en esta sesión'} alcanzado (${n} usados). Antes de otro: seguí con un agente vivo por SendMessage, juntá el trabajo en un encargo, o hacelo vos si es mecánico (suites, scripts). Si de verdad hace falta, pedile el «sí» al dueño y agregá al prompt «[sobre-tope: <motivo>]».`;
}

// 3. Recursos
let nivel = null;
if (decision === 'allow') {
  const r = await recursos();
  nivel = r?.nivel ?? null;
  if (r?.nivel === 'rojo') {
    decision = 'deny';
    motivo = `aiWorkflows (25): máquina en ROJO (${r.motivos.join(' · ')}). No se lanza otro agente ahora. ${r.quePuede}\nMirá qué sobra y cerralo: node "${RECURSOS}"`;
  }
}

anotar({ ts: new Date().toISOString(), cwd: entrada.cwd, session_id: entrada.session_id, ticket, tipo, modelo: modelo || null, descripcion, justificado, sobreTope, usados: n, recursos: nivel, decision });
salir(decision, motivo);
