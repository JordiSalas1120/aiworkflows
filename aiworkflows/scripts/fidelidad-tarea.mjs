#!/usr/bin/env node
// ¿La tarea construida es idéntica al plan? — sin modelo, en segundos.
//
//   node fidelidad-tarea.mjs <plan.md> <tarea> <commit-base> <commit-tarea> [repo]
//
// Lee del plan la «### Tarea N:» y sus bloques:
//   **Crear** `ruta`        + un bloque de código  → el archivo entero
//   **Modificar** `ruta`    + pares «Buscar:» / «Reemplazar por:» (cada Buscar debe aparecer UNA vez)
//   **Borrar** `ruta`       → el archivo no tiene que existir
// Los aplica sobre <commit-base>, formatea con el prettier del repo (--ignore-unknown) y compara
// contra <commit-tarea>, ignorando CRLF. Lista además los archivos que el commit toca y el plan no.
//
// Sale con 0 si todo coincide; 1 si hay diferencias o Buscar que fallan; 2 si falta algo para correr.
// Por qué existe (método, 15.5): esta comprobación es mecánica; un revisor-modelo gastaba
// 100–250 k tokens por tarea para hacerla. El revisor queda para lo que exige juicio.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const [planPath, tarea, base, commit, repoArg] = process.argv.slice(2);
if (!planPath || !tarea || !base || !commit) {
  console.error('Uso: node fidelidad-tarea.mjs <plan.md> <tarea> <commit-base> <commit-tarea> [repo]');
  process.exit(2);
}
const repo = repoArg ?? process.cwd();
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
const lf = (s) => s.replace(/\r\n/g, '\n');
const enCommit = (ref, ruta) => {
  try { return lf(git('show', `${ref}:${ruta}`)); } catch { return null; }
};

// 1. La tarea del plan.
const planAbs = existsSync(planPath) ? planPath : join(repo, planPath);
const lineasPlan = lf(readFileSync(planAbs, 'utf8')).split('\n');
const ini = lineasPlan.findIndex((l) => l.startsWith(`### Tarea ${tarea}:`));
if (ini < 0) { console.error(`No encontré «### Tarea ${tarea}:» en ${planPath}`); process.exit(2); }
let fin = lineasPlan.length;
for (let i = ini + 1; i < lineasPlan.length; i++) {
  if (lineasPlan[i].startsWith('### Tarea ') || lineasPlan[i].startsWith('## ')) { fin = i; break; }
}
const L = lineasPlan.slice(ini, fin);

// 2. Los bloques.
function leerBloque(i) {
  // desde i busca la próxima apertura de código; devuelve [contenido, índice siguiente]
  while (i < L.length && !/^(`{3,})/.test(L[i])) i++;
  if (i >= L.length) return [null, i];
  const cerca = L[i].match(/^(`{3,})/)[1];
  const cuerpo = [];
  i++;
  while (i < L.length && L[i] !== cerca) { cuerpo.push(L[i]); i++; }
  return [cuerpo.join('\n') + '\n', i + 1];
}
const ops = []; // {tipo, ruta, buscar?, reemplazo?, contenido?}
for (let i = 0; i < L.length; i++) {
  const m = L[i].match(/^\*\*(Crear|Modificar|Borrar)\*\* `([^`]+)`/);
  if (!m) continue;
  const [, tipo, ruta] = m;
  if (tipo === 'Borrar') { ops.push({ tipo, ruta }); continue; }
  if (tipo === 'Crear') {
    const [contenido, sig] = leerBloque(i + 1);
    ops.push({ tipo, ruta, contenido }); i = sig - 1; continue;
  }
  // Modificar: pares hasta el próximo encabezado en negrita
  let j = i + 1;
  while (j < L.length && !/^\*\*(Crear|Modificar|Borrar)\*\* `/.test(L[j])) {
    if (L[j].trim() === 'Buscar:') {
      const [buscar, s1] = leerBloque(j + 1);
      let k = s1;
      while (k < L.length && L[k].trim() !== 'Reemplazar por:') k++;
      const [reemplazo, s2] = leerBloque(k + 1);
      ops.push({ tipo, ruta, buscar, reemplazo });
      j = s2; continue;
    }
    j++;
  }
  i = j - 1;
}
if (!ops.length) { console.error('La tarea no tiene bloques Crear/Modificar/Borrar.'); process.exit(2); }

// 3. Aplicar sobre la base.
const archivos = new Map(); // ruta → contenido | null (borrado)
const fallas = [];
for (const op of ops) {
  if (!archivos.has(op.ruta)) archivos.set(op.ruta, enCommit(base, op.ruta));
  if (op.tipo === 'Borrar') { archivos.set(op.ruta, null); continue; }
  if (op.tipo === 'Crear') { archivos.set(op.ruta, op.contenido); continue; }
  const actual = archivos.get(op.ruta);
  if (actual == null) { fallas.push(`${op.ruta}: Modificar sobre un archivo que no existe en la base`); continue; }
  const buscar = op.buscar.replace(/\n$/, '');
  const n = actual.split(buscar).length - 1;
  if (n !== 1) { fallas.push(`${op.ruta}: un Buscar aparece ${n} veces (debe ser 1): «${buscar.split('\n')[0].slice(0, 70)}…»`); continue; }
  archivos.set(op.ruta, actual.replace(buscar, op.reemplazo.replace(/\n$/, '')));
}

// 4. Formatear con el prettier del repo.
const tmp = mkdtempSync(join(tmpdir(), 'fidelidad-'));
try {
  const escritos = [];
  for (const [ruta, contenido] of archivos) {
    if (contenido == null) continue;
    const abs = join(tmp, ruta);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contenido);
    escritos.push(abs);
  }
  const prettier = ['node_modules/.bin/prettier', 'packages/frontend/node_modules/.bin/prettier']
    .map((p) => join(repo, p)).find((p) => existsSync(p) || existsSync(p + '.cmd'));
  const config = join(repo, '.prettierrc');
  if (prettier && escritos.length) {
    try {
      execFileSync(process.platform === 'win32' ? prettier + '.cmd' : prettier,
        ['--write', '--ignore-unknown', '--log-level', 'warn', '--end-of-line', 'lf',
          ...(existsSync(config) ? ['--config', config] : []), ...escritos],
        { stdio: ['ignore', 'ignore', 'pipe'], shell: process.platform === 'win32' });
    } catch (e) { fallas.push(`prettier falló: ${String(e.stderr ?? e.message).split('\n')[0]}`); }
  } else if (!prettier) fallas.push('no encontré prettier en el repo (node_modules/.bin)');

  // 5. Comparar contra el commit de la tarea.
  const distintos = [];
  for (const [ruta, contenido] of archivos) {
    const real = enCommit(commit, ruta);
    if (contenido == null) { if (real != null) distintos.push(`${ruta}: el plan lo borra y el commit lo tiene`); continue; }
    const formateado = lf(readFileSync(join(tmp, ruta), 'utf8'));
    if (real == null) { distintos.push(`${ruta}: el plan lo crea/modifica y el commit no lo tiene`); continue; }
    if (formateado !== real) {
      const a = formateado.split('\n'), b = real.split('\n');
      let k = 0; while (k < a.length && a[k] === b[k]) k++;
      distintos.push(`${ruta}: difiere desde la línea ${k + 1}\n      plan:   ${JSON.stringify(a[k] ?? '(fin)').slice(0, 110)}\n      commit: ${JSON.stringify(b[k] ?? '(fin)').slice(0, 110)}`);
    }
  }
  const tocados = git('diff', '--name-only', base, commit).split('\n').filter(Boolean);
  const fuera = tocados.filter((r) => !archivos.has(r) && !/\.md$/.test(r));

  // 6. Informe.
  console.log(`Tarea ${tarea}: ${ops.length} operaciones, ${archivos.size} archivos del plan, ${fallas.length} fallas al aplicar.`);
  for (const f of fallas) console.log(`  FALLA  ${f}`);
  for (const d of distintos) console.log(`  DIFIERE ${d}`);
  for (const r of fuera) console.log(`  FUERA DEL PLAN ${r}`);
  const ok = !fallas.length && !distintos.length && !fuera.length;
  console.log(ok ? '  ✔ IDÉNTICA AL PLAN' : `  ✘ ${distintos.length} archivo(s) distintos, ${fuera.length} fuera del plan`);
  process.exit(ok ? 0 : 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
