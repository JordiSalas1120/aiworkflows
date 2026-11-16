#!/usr/bin/env node
// rojo-sin-arreglo.mjs — ¿el test de regresión protege de verdad? (método 24.7)
//
// En un worktree TEMPORAL (nunca toca tu checkout):
//   1. corre el test con el arreglo           → tiene que dar VERDE
//   2. revierte SÓLO el código de producción  → los tests quedan como en <head>
//   3. corre el test otra vez                 → tiene que dar ROJO
//
// Uso:
//   node rojo-sin-arreglo.mjs --base <ref> --test "<comando>" [--head HEAD] [--repo .]
//        [--tests <regex>] [--enlazar node_modules,.venv,.env] [--timeout 900] [--mantener]
//
//   --base      el commit SIN el arreglo (p. ej. origin/dev o el padre del commit del ticket)
//   --test      el comando que corre SÓLO los tests nuevos (p. ej. "npx vitest run src/x.test.ts"
//               o ".venv/Scripts/python -m pytest tests/test_abc123.py -q")
//   --tests     regex de rutas que se consideran tests y NO se revierten
//   --enlazar   carpetas (se enlazan como junction) o archivos (se copian) del repo que el
//               worktree necesita y git no trae: dependencias, venv, .env
//
// Salida: 0 = rojo sin el arreglo (el test protege) · 1 = sigue verde (NO protege)
//         2 = el entorno no sirve (el verde con el arreglo falló, o un error)

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TESTS_POR_DEFECTO =
  '(^|/)(tests?|__tests__|spec|e2e)/|\\.(test|spec)\\.[cm]?[jt]sx?$|(^|/)test_[^/]*\\.py$|_test\\.(py|go)$|(^|/)conftest\\.py$';

function args() {
  const a = process.argv.slice(2);
  const o = { head: 'HEAD', repo: '.', tests: TESTS_POR_DEFECTO, enlazar: '', timeout: 900, mantener: false };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--mantener') { o.mantener = true; continue; }
    if (!k.startsWith('--') || i + 1 >= a.length) { uso(`argumento inválido: ${k}`); }
    o[k.slice(2)] = a[++i];
  }
  if (!o.base || !o.test) uso('faltan --base y/o --test');
  o.timeout = Number(o.timeout) || 900;
  return o;
}

function uso(msg) {
  console.error(`✘ ${msg}\nUso: node rojo-sin-arreglo.mjs --base <ref> --test "<comando>" [--head HEAD] [--repo .] [--tests <regex>] [--enlazar a,b] [--timeout s] [--mantener]`);
  process.exit(2);
}

function git(cwd, ...a) {
  const r = spawnSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}\n${r.stderr || r.stdout}`);
  return r.stdout;
}

function correr(cmd, cwd, timeoutS) {
  const t0 = Date.now();
  const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: timeoutS * 1000, env: process.env });
  const salida = `${r.stdout || ''}${r.stderr || ''}`;
  return { codigo: r.status, senal: r.signal, salida, seg: ((Date.now() - t0) / 1000).toFixed(1) };
}

function cola(texto, n = 25) {
  return texto.trimEnd().split(/\r?\n/).slice(-n).map((l) => `    │ ${l}`).join('\n');
}

const o = args();
const raiz = git(path.resolve(o.repo), 'rev-parse', '--show-toplevel').trim();
const base = git(raiz, 'rev-parse', '--verify', `${o.base}^{commit}`).trim();
const head = git(raiz, 'rev-parse', '--verify', `${o.head}^{commit}`).trim();
const esTest = new RegExp(o.tests);

const cambios = git(raiz, 'diff', '--name-status', '--no-renames', base, head)
  .split(/\r?\n/).filter(Boolean)
  .map((l) => { const [estado, ...r] = l.split('\t'); return { estado: estado[0], ruta: r.join('\t') }; });
const prod = cambios.filter((c) => !esTest.test(c.ruta));
const tests = cambios.filter((c) => esTest.test(c.ruta));

console.log(`rojo-sin-arreglo · base ${base.slice(0, 8)} → head ${head.slice(0, 8)}`);
console.log(`  producción que se revierte (${prod.length}): ${prod.map((c) => `${c.estado} ${c.ruta}`).join(', ') || '—'}`);
console.log(`  tests que quedan como en head (${tests.length}): ${tests.map((c) => c.ruta).join(', ') || '—'}`);
if (!prod.length) { console.error('✘ No hay código de producción entre base y head: nada que revertir. ¿--base correcto? ¿--tests demasiado amplio?'); process.exit(2); }
if (!tests.length) console.log('  ⚠ ningún archivo de test cambió: se usa el comando tal cual contra los tests existentes.');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rojo-sin-arreglo-'));
fs.rmdirSync(dir); // git worktree add quiere crearlo él
const enlaces = [];
let salidaFinal = 2;

try {
  git(raiz, 'worktree', 'add', '--detach', dir, head);

  for (const nombre of o.enlazar.split(',').map((s) => s.trim()).filter(Boolean)) {
    const src = path.join(raiz, nombre);
    const dst = path.join(dir, nombre);
    if (!fs.existsSync(src) || fs.existsSync(dst)) continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (fs.statSync(src).isDirectory()) { fs.symlinkSync(src, dst, 'junction'); enlaces.push(dst); }
    else fs.copyFileSync(src, dst);
  }

  console.log(`\n1) Con el arreglo (tiene que dar VERDE): ${o.test}`);
  const verde = correr(o.test, dir, o.timeout);
  console.log(`   código ${verde.codigo ?? verde.senal} en ${verde.seg} s`);
  if (verde.codigo !== 0) {
    console.log(cola(verde.salida));
    console.log('\n✘ ENTORNO: el test falla CON el arreglo dentro del worktree. Arreglá el comando o pasá --enlazar (dependencias, venv, .env). No se puede concluir nada.');
    salidaFinal = 2;
  } else {
    for (const c of prod) {
      if (c.estado === 'A') fs.rmSync(path.join(dir, c.ruta), { force: true });
      else git(dir, 'checkout', base, '--', c.ruta);
    }
    console.log(`\n2) Sin el arreglo (tiene que dar ROJO): ${prod.length} archivo(s) de producción revertidos a base`);
    const rojo = correr(o.test, dir, o.timeout);
    console.log(`   código ${rojo.codigo ?? rojo.senal} en ${rojo.seg} s`);
    console.log(cola(rojo.salida));
    if (rojo.codigo === 0) {
      console.log('\n✘ SIGUE VERDE sin el arreglo: este test NO protege el cambio. Reescribilo para que afirme el comportamiento nuevo.');
      salidaFinal = 1;
    } else {
      console.log('\n✔ ROJO sin el arreglo y VERDE con el arreglo. Revisá arriba que falle POR LA RAZÓN CORRECTA (una aserción del comportamiento, no un import roto o un error de entorno).');
      salidaFinal = 0;
    }
  }
} catch (e) {
  console.error(`✘ ${e.message}`);
  salidaFinal = 2;
} finally {
  for (const l of enlaces) { try { fs.unlinkSync(l); } catch { try { fs.rmdirSync(l); } catch { /* el enlace queda; worktree remove lo saca */ } } }
  if (o.mantener) console.log(`\n(worktree conservado en ${dir}; borralo con: git worktree remove --force "${dir}")`);
  else { try { git(raiz, 'worktree', 'remove', '--force', dir); } catch (e) { console.error(`⚠ no se pudo borrar el worktree ${dir}: ${e.message}`); } }
}
process.exit(salidaFinal);
