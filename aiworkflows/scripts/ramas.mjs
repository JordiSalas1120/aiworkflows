#!/usr/bin/env node
// aiWorkflows · ramas y bitácora (método 27). Crea ramas con nombre fijo, lleva la ficha de cada rama
// (docs/ramas/<rama>.md, versionada DENTRO de su rama: cada rama toca sólo su ficha, así no hay conflictos)
// y sube la rama sólo si pasa la puerta de push.
//
//   node ramas.mjs nueva <tipo>/<TICKET>-<slug> [--base develop] [--que "texto"] [--spec ruta] [--worktree <dir>]
//   node ramas.mjs subir [--test "<cmd>"] [--pr] [--seco] [--permitir-atras]
//   node ramas.mjs estado <en curso|subida|en PR|en dev|en cert|mergeada|abandonada> [--pr <url>] [--entorno <x>] [--nota "..."]
//   node ramas.mjs bitacora [--escribir]      # junta las fichas de TODAS las ramas (locales y origin/*) en una tabla
//   node ramas.mjs puerta [--test "<cmd>"]    # sólo corre la puerta, sin subir nada
//
// Config opcional en la raíz del repo: aiw.config.json
//   { "base": "develop", "test": "npm test", "protegidas": ["main","master","develop"], "fichas": "docs/ramas", "bitacora": "docs/RAMAS.md" }
// Salida: 0 ok · 1 la puerta no pasó / uso incorrecto · 2 error de entorno (sin git, sin remoto).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TIPOS = ['feat', 'fix', 'hotfix', 'chore', 'docs', 'refactor', 'test', 'perf', 'ci', 'release', 'spike'];
const RE_RAMA = new RegExp(`^(${TIPOS.join('|')})/([A-Z][A-Z0-9]{1,9}-\\d{1,6}-)?[a-z0-9]+(-[a-z0-9]+)*$`);
const ESTADOS = ['en curso', 'subida', 'en PR', 'en dev', 'en cert', 'mergeada', 'abandonada'];
const RE_SECRETO = [
  [/AKIA[0-9A-Z]{16}/, 'clave de AWS'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'token de GitHub'],
  [/\bsk-(ant-|proj-)?[A-Za-z0-9_-]{20,}/, 'clave de API (sk-…)'],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/, 'token de Slack'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'clave de Google'],
  [/(password|passwd|contrase(ñ|n)a|secret|api[_-]?key|token)\s*[:=]\s*["'][^"'\s$<{]{8,}["']/i, 'credencial escrita a mano'],
];

// ── utilidades ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k) => { const i = argv.indexOf(k); return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : undefined; };
const flag = (k) => argv.includes(k);
const hoy = () => new Date().toISOString().slice(0, 10);
const ok = (m) => console.log(`✔ ${m}`);
const mal = (m) => console.log(`✘ ${m}`);
function git(args, { permitirFallo = false } = {}) {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (e) { if (permitirFallo) return null; throw new Error(`git ${args.join(' ')}: ${(e.stderr || e.message).toString().trim()}`); }
}
function morir(m, codigo = 1) { console.error(`✘ ${m}`); process.exit(codigo); }

const raiz = git(['rev-parse', '--show-toplevel'], { permitirFallo: true });
if (!raiz) morir('no estoy dentro de un repositorio git', 2);
const cfgArchivo = join(raiz, 'aiw.config.json');
const cfg = existsSync(cfgArchivo) ? JSON.parse(readFileSync(cfgArchivo, 'utf8').replace(/^﻿/, '')) : {};
const PROTEGIDAS = cfg.protegidas ?? ['main', 'master', 'develop', 'dev', 'staging', 'production', 'prod'];
const DIR_FICHAS = cfg.fichas ?? 'docs/ramas';
const BITACORA = cfg.bitacora ?? 'docs/RAMAS.md';
const remoto = () => git(['remote'], { permitirFallo: true })?.split('\n').filter(Boolean)[0] ?? null;
const baseDefecto = () => {
  if (cfg.base) return cfg.base;
  for (const b of ['develop', 'dev', 'main', 'master']) if (git(['rev-parse', '--verify', '--quiet', b], { permitirFallo: true }) || git(['rev-parse', '--verify', '--quiet', `origin/${b}`], { permitirFallo: true })) return b;
  return 'main';
};
const archivoFicha = (rama) => `${DIR_FICHAS}/${rama.replaceAll('/', '--')}.md`;
const ramaActual = () => git(['rev-parse', '--abbrev-ref', 'HEAD']);

// ── ficha: markdown simple, campos «- **Campo:** valor» + historial ──────────
function leerFicha(texto) {
  const f = { campos: {}, historial: [] };
  let enHistorial = false;
  for (const l of texto.split(/\r?\n/)) {
    if (/^##\s+Historial/i.test(l)) { enHistorial = true; continue; }
    const m = l.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
    if (!enHistorial && m) f.campos[m[1].trim()] = m[2].trim();
    else if (enHistorial && l.startsWith('- ')) f.historial.push(l.slice(2));
  }
  return f;
}
function escribirFicha(rama, f, dir = raiz) {
  const orden = ['Ticket', 'Qué', 'Spec', 'Base', 'Estado', 'PR', 'Entorno', 'Creada'];
  const c = f.campos;
  const cuerpo = [`# ${rama}`, '', '<!-- Ficha de rama de aiWorkflows (método 27). La mantiene scripts/ramas.mjs; se puede editar a mano. -->', '',
    ...orden.map((k) => `- **${k}:** ${c[k] ?? '—'}`), '', '## Historial', '', ...f.historial.map((h) => `- ${h}`), ''].join('\n');
  mkdirSync(join(dir, DIR_FICHAS), { recursive: true });
  writeFileSync(join(dir, archivoFicha(rama)), cuerpo);
}
function fichaDe(rama) {
  const p = join(raiz, archivoFicha(rama));
  return existsSync(p) ? leerFicha(readFileSync(p, 'utf8')) : null;
}
function commitearFicha(rama, mensaje) {
  git(['add', '--', archivoFicha(rama)]);
  if (!git(['diff', '--cached', '--name-only'])) return null;
  git(['commit', '-m', mensaje, '--', archivoFicha(rama)]);
  return git(['rev-parse', '--short', 'HEAD']);
}

// ── nueva ───────────────────────────────────────────────────────────────────
function nueva() {
  const rama = argv[1];
  if (!rama || !RE_RAMA.test(rama)) morir(`nombre inválido: «${rama ?? ''}». Formato: <tipo>/<TICKET>-<slug> (tipos: ${TIPOS.join(', ')}), p. ej. feat/ABC-123-alta-de-clientes`);
  if (git(['rev-parse', '--verify', '--quiet', rama], { permitirFallo: true })) morir(`la rama ${rama} ya existe`);
  const base = opt('--base') ?? baseDefecto();
  const r = remoto();
  if (r) git(['fetch', r, base], { permitirFallo: true });
  const desde = r && git(['rev-parse', '--verify', '--quiet', `${r}/${base}`], { permitirFallo: true }) ? `${r}/${base}` : base;
  const wt = opt('--worktree');
  if (wt) git(['worktree', 'add', '--no-track', '-b', rama, wt, desde]);
  else git(['switch', '--no-track', '-c', rama, desde]);
  const ticket = rama.match(/\/([A-Z][A-Z0-9]{1,9}-\d{1,6})-/)?.[1] ?? '—';
  const sha = git(['rev-parse', '--short', desde]);
  const f = { campos: { Ticket: ticket, 'Qué': opt('--que') ?? '—', Spec: opt('--spec') ? `\`${opt('--spec')}\`` : '—', Base: base, Estado: 'en curso', PR: '—', Entorno: 'local', Creada: hoy() },
    historial: [`${hoy()} · creada desde ${desde} (${sha})`] };
  if (wt) process.chdir(wt);
  escribirFicha(rama, f, git(['rev-parse', '--show-toplevel']));
  git(['add', '--', archivoFicha(rama)]);
  git(['commit', '-m', `docs(ramas): abre ${rama}`, '--', archivoFicha(rama)]);
  ok(`rama ${rama} creada desde ${desde}${wt ? ` en el worktree ${wt}` : ''}; ficha en ${archivoFicha(rama)} (commit local, sin push)`);
}

// ── puerta de push ────────────────────────────────────────────────────────────
function puerta({ conTests = true } = {}) {
  const rama = ramaActual();
  const fallas = [];
  if (rama === 'HEAD') fallas.push('HEAD separado: no hay rama');
  if (PROTEGIDAS.includes(rama)) fallas.push(`«${rama}» es protegida: a ella se llega por PR, nunca por push directo`);
  if (!RE_RAMA.test(rama)) fallas.push(`el nombre «${rama}» no sigue <tipo>/<TICKET>-<slug>`);
  const sucio = git(['status', '--porcelain']);
  if (sucio) fallas.push(`árbol sin commitear:\n${sucio.split('\n').slice(0, 10).map((l) => `    ${l}`).join('\n')}`);
  const ficha = fichaDe(rama);
  if (!ficha) fallas.push(`falta la ficha ${archivoFicha(rama)} (creala con «ramas.mjs nueva» o a mano)`);
  const base = ficha?.campos.Base && ficha.campos.Base !== '—' ? ficha.campos.Base : baseDefecto();
  const r = remoto();
  if (!r) fallas.push('el repo no tiene remoto');
  let refBase = base;
  if (r) {
    git(['fetch', r, base], { permitirFallo: true });
    if (git(['rev-parse', '--verify', '--quiet', `${r}/${base}`], { permitirFallo: true })) refBase = `${r}/${base}`;
  }
  const atras = Number(git(['rev-list', '--count', `HEAD..${refBase}`], { permitirFallo: true }) ?? 0);
  if (atras > 0 && !flag('--permitir-atras')) fallas.push(`la rama está ${atras} commit(s) detrás de ${refBase}: rebasá (git rebase ${refBase}), corré los tests y volvé a subir`);
  const diff = git(['diff', `${refBase}...HEAD`, '--unified=0', '--no-color'], { permitirFallo: true }) ?? '';
  let archivo = '';
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) { archivo = l.slice(6); continue; }
    if (!l.startsWith('+') || l.startsWith('+++')) continue;
    if (/^\+(<{7}|>{7})( |$)/.test(l)) fallas.push(`marca de conflicto en ${archivo}`);
    if (/\.(md|lock)$|lock\.json$|\.ejemplo|\.example|\.sample/i.test(archivo)) continue;
    for (const [re, que] of RE_SECRETO) if (re.test(l)) fallas.push(`posible ${que} en ${archivo}: ${l.slice(1, 90).trim()}`);
  }
  const nuevos = git(['diff', '--name-only', '--diff-filter=A', `${refBase}...HEAD`], { permitirFallo: true }) ?? '';
  for (const f of nuevos.split('\n').filter(Boolean)) if (/(^|\/)\.env(\.[^/]*)?$/.test(f) && !/\.(example|ejemplo|sample)$/.test(f)) fallas.push(`se agregó ${f}: los .env no se versionan`);
  let resumenTests = 'sin tests';
  if (conTests) {
    const test = opt('--test') ?? cfg.test;
    if (!test) fallas.push('falta el comando de tests (--test "<cmd>" o "test" en aiw.config.json): sin tests en verde no se sube');
    else if (!fallas.length) {
      console.log(`… corriendo la suite: ${test}`);
      const t = spawnSync(test, { shell: true, stdio: 'inherit', cwd: raiz });
      if (t.status !== 0) fallas.push(`la suite no quedó en verde (salida ${t.status}): ${test}`);
      else resumenTests = `\`${test}\` en verde`;
    }
  }
  return { rama, base, refBase, ficha, fallas, resumenTests, remoto: r };
}

function informar(p) {
  if (p.fallas.length) { mal(`la puerta de push NO pasa (${p.rama}):`); for (const f of p.fallas) console.log(`  - ${f}`); return false; }
  ok(`puerta de push OK para ${p.rama} (base ${p.refBase}; ${p.resumenTests})`);
  return true;
}

function subir() {
  const p = puerta();
  if (!informar(p)) process.exit(1);
  if (flag('--seco')) { ok(`en seco: actualizaría la ficha (estado «subida»), haría git push -u ${p.remoto} ${p.rama}${flag('--pr') ? ` y abriría un PR borrador hacia ${p.base}` : ''}`); return; }
  const sha = git(['rev-parse', '--short', 'HEAD']);
  p.ficha.campos.Estado = 'subida';
  p.ficha.historial.push(`${hoy()} · subida · ${p.resumenTests} · ${sha}`);
  escribirFicha(p.rama, p.ficha);
  commitearFicha(p.rama, `docs(ramas): ${p.rama} subida (${sha})`);
  git(['push', '-u', p.remoto, `HEAD:refs/heads/${p.rama}`]);
  ok(`subida: ${p.remoto}/${p.rama}`);
  if (flag('--pr')) {
    const gh = spawnSync('gh', ['--version'], { encoding: 'utf8' });
    if (gh.status !== 0) { mal('gh no está instalado: abrí el PR a mano y anotalo con «ramas.mjs estado "en PR" --pr <url>»'); return; }
    const ya = spawnSync('gh', ['pr', 'view', '--json', 'url', '-q', '.url'], { encoding: 'utf8' });
    let url = ya.status === 0 ? ya.stdout.trim() : '';
    if (!url) {
      const plantilla = ['.github/pull_request_template.md', '.github/PULL_REQUEST_TEMPLATE.md'].map((x) => join(raiz, x)).find(existsSync);
      const titulo = git(['log', '-1', '--format=%s', `${p.refBase}..HEAD`, '--', '.', `:(exclude)${DIR_FICHAS}`], { permitirFallo: true }) || p.rama;
      const args = ['pr', 'create', '--draft', '--base', p.base, '--head', p.rama, '--title', titulo];
      if (plantilla) args.push('--body-file', plantilla); else args.push('--body', `Ficha: \`${archivoFicha(p.rama)}\`\n\nTests: ${p.resumenTests}`);
      const pr = spawnSync('gh', args, { encoding: 'utf8' });
      if (pr.status !== 0) { mal(`no pude abrir el PR: ${pr.stderr.trim()}`); return; }
      url = pr.stdout.trim().split('\n').pop();
    }
    p.ficha.campos.Estado = 'en PR';
    p.ficha.campos.PR = url;
    p.ficha.historial.push(`${hoy()} · PR borrador hacia ${p.base}: ${url}`);
    escribirFicha(p.rama, p.ficha);
    if (commitearFicha(p.rama, `docs(ramas): ${p.rama} en PR`)) git(['push', p.remoto, `HEAD:refs/heads/${p.rama}`]);
    ok(`PR: ${url}`);
  }
}

function estado() {
  const nuevo = argv[1];
  if (!ESTADOS.includes(nuevo)) morir(`estado inválido. Usá uno de: ${ESTADOS.join(' · ')}`);
  const rama = ramaActual();
  const f = fichaDe(rama) ?? morir(`falta la ficha de ${rama}`);
  f.campos.Estado = nuevo;
  if (opt('--pr')) f.campos.PR = opt('--pr');
  if (opt('--entorno')) f.campos.Entorno = opt('--entorno');
  f.historial.push(`${hoy()} · ${nuevo}${opt('--entorno') ? ` · entorno ${opt('--entorno')}` : ''}${opt('--nota') ? ` · ${opt('--nota')}` : ''}`);
  escribirFicha(rama, f);
  const sha = commitearFicha(rama, `docs(ramas): ${rama} ${nuevo}`);
  ok(`ficha de ${rama}: ${nuevo}${sha ? ` (commit ${sha}, local)` : ''}`);
}

// ── bitácora: junta las fichas de todas las ramas ─────────────────────────────
function bitacora() {
  const r = remoto();
  if (r) git(['fetch', '--prune', r], { permitirFallo: true });
  const refs = (git(['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes'], { permitirFallo: true }) ?? '').split('\n').filter((x) => x && !x.endsWith('/HEAD') && x !== r);
  const porRama = new Map();
  // primero las locales (van al día o adelantadas), después las del remoto que no están en local
  const ordenadas = [...refs.filter((x) => !(r && x.startsWith(`${r}/`))), ...refs.filter((x) => r && x.startsWith(`${r}/`))];
  for (const ref of ordenadas) {
    const esRemota = r && ref.startsWith(`${r}/`);
    const rama = esRemota ? ref.slice(r.length + 1) : ref;
    if (PROTEGIDAS.includes(rama) || porRama.has(rama)) continue;
    const texto = git(['show', `${ref}:${archivoFicha(rama)}`], { permitirFallo: true });
    const f = texto ? leerFicha(texto) : { campos: { Estado: 'sin ficha' }, historial: [] };
    const fecha = git(['log', '-1', '--format=%cs', ref], { permitirFallo: true });
    const sha = git(['rev-parse', '--short', ref], { permitirFallo: true });
    let nota = '';
    if (!esRemota) {
      const enRemoto = r && git(['rev-parse', '--verify', '--quiet', `${r}/${rama}`], { permitirFallo: true });
      const sinSubir = enRemoto ? Number(git(['rev-list', '--count', `${r}/${rama}..${ref}`], { permitirFallo: true }) ?? 0) : null;
      nota = !enRemoto ? ' (sólo local)' : sinSubir ? ` (${sinSubir} commit(s) sin subir)` : '';
    }
    porRama.set(rama, { rama, f, fecha, sha, nota });
  }
  // las mergeadas y borradas siguen en la base: sus fichas viven en el árbol de la base
  const baseRef = r && git(['rev-parse', '--verify', '--quiet', `${r}/${baseDefecto()}`], { permitirFallo: true }) ? `${r}/${baseDefecto()}` : baseDefecto();
  const enBase = (git(['ls-tree', '--name-only', `${baseRef}:${DIR_FICHAS}`], { permitirFallo: true }) ?? '').split('\n').filter((x) => x.endsWith('.md'));
  for (const archivo of enBase) {
    const rama = archivo.replace(/\.md$/, '').replaceAll('--', '/');
    if (porRama.has(rama)) continue;
    const f = leerFicha(git(['show', `${baseRef}:${DIR_FICHAS}/${archivo}`], { permitirFallo: true }) ?? '');
    porRama.set(rama, { rama, f, fecha: f.historial.at(-1)?.slice(0, 10) ?? '—', sha: '—', nota: ' (rama borrada)' });
  }
  const filas = [...porRama.values()].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const tabla = ['| Rama | Ticket | Qué | Base | Estado | PR | Entorno | Último | Actualizada |', '|---|---|---|---|---|---|---|---|---|',
    ...filas.map(({ rama, f, fecha, sha, nota }) => `| \`${rama}\` | ${f.campos.Ticket ?? '—'} | ${f.campos['Qué'] ?? '—'} | ${f.campos.Base ?? '—'} | ${f.campos.Estado ?? '—'}${nota} | ${f.campos.PR ?? '—'} | ${f.campos.Entorno ?? '—'} | ${sha} | ${fecha} |`)].join('\n');
  const doc = `# Bitácora de ramas\n\n<!-- Generada por scripts/ramas.mjs bitacora --escribir (método 27). No se edita a mano: se edita la ficha de cada rama en ${DIR_FICHAS}/. -->\n\nGenerada el ${hoy()} · ${filas.length} rama(s).\n\n${tabla}\n`;
  if (flag('--escribir')) {
    mkdirSync(join(raiz, BITACORA, '..'), { recursive: true });
    writeFileSync(join(raiz, BITACORA), doc);
    ok(`bitácora escrita en ${BITACORA} (${filas.length} ramas). Commiteala en la rama base por PR, no a mano.`);
  } else console.log(doc);
}

try {
  if (cmd === 'nueva') nueva();
  else if (cmd === 'subir') subir();
  else if (cmd === 'puerta') process.exit(informar(puerta({ conTests: !flag('--sin-tests') })) ? 0 : 1);
  else if (cmd === 'estado') estado();
  else if (cmd === 'bitacora') bitacora();
  else { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(cmd ? 1 : 0); }
} catch (e) { morir(e.message, 2); }
