#!/usr/bin/env node
// ¿Qué tareas de un plan siguen aplicando sobre el código de hoy? — sin modelo, en segundos.
//
//   node anclas-del-plan.mjs <plan.md> <ref> [--desde N] [repo]
//
// Simula el plan EN ORDEN sobre <ref> (la punta actual de la rama): cada tarea aplica sus
// **Crear** / **Modificar** (Buscar → Reemplazar por) / **Borrar** sobre lo que dejaron las anteriores.
// Por cada tarea dice si sus «Buscar» aparecen exactamente una vez y si sus «Crear» pisan un archivo
// que ya existe. Con --desde N empieza en la tarea N (las anteriores se dan por construidas en <ref>).
//
// Para qué (método 5.5): cuando el código se movió debajo de un plan, NO se re-planifica entero.
// Se corre esto y se re-audita (con Sonnet) sólo cada tarea marcada ✘, con su lista de anclas rotas.
// Sale con 0 si todo aplica, 1 si alguna tarea tiene anclas rotas, 2 si falta algo para correr.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const iDesde = args.indexOf('--desde');
const desde = iDesde >= 0 ? args.splice(iDesde, 2)[1] : null;
const [planPath, ref, repoArg] = args;
if (!planPath || !ref) {
  console.error('Uso: node anclas-del-plan.mjs <plan.md> <ref> [--desde N] [repo]');
  process.exit(2);
}
const repo = repoArg ?? process.cwd();
const lf = (s) => s.replace(/\r\n/g, '\n');
const enRef = (ruta) => {
  try {
    return lf(execFileSync('git', ['-C', repo, 'show', `${ref}:${ruta}`], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch { return null; }
};

const planAbs = existsSync(planPath) ? planPath : join(repo, planPath);
const lineas = lf(readFileSync(planAbs, 'utf8')).split('\n');
const RE_TAREA = /^### (?:Tarea|Task) ([0-9]+[A-Za-z]?)\b/;

// Las tareas, en el orden del plan.
const tareas = [];
for (let i = 0; i < lineas.length; i++) {
  const m = lineas[i].match(RE_TAREA);
  if (!m) continue;
  let fin = lineas.length;
  for (let j = i + 1; j < lineas.length; j++) {
    if (RE_TAREA.test(lineas[j]) || lineas[j].startsWith('## ')) { fin = j; break; }
  }
  tareas.push({ id: m[1], L: lineas.slice(i, fin) });
}
if (!tareas.length) { console.error(`No encontré «### Tarea N:» ni «### Task N:» en ${planPath}`); process.exit(2); }

function operaciones(L) {
  const bloque = (i) => {
    while (i < L.length && !/^`{3,}/.test(L[i])) i++;
    if (i >= L.length) return [null, i];
    const cerca = L[i].match(/^(`{3,})/)[1];
    const cuerpo = [];
    i++;
    while (i < L.length && L[i] !== cerca) { cuerpo.push(L[i]); i++; }
    return [cuerpo.join('\n'), i + 1];
  };
  const ops = [];
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(/^\*\*(Crear|Modificar|Borrar)\*\* `([^`]+)`/);
    if (!m) continue;
    const [, tipo, ruta] = m;
    if (tipo === 'Borrar') { ops.push({ tipo, ruta }); continue; }
    if (tipo === 'Crear') { const [contenido, sig] = bloque(i + 1); ops.push({ tipo, ruta, contenido }); i = sig - 1; continue; }
    let j = i + 1;
    while (j < L.length && !/^\*\*(Crear|Modificar|Borrar)\*\* `/.test(L[j])) {
      if (L[j].trim() === 'Buscar:') {
        const [buscar, s1] = bloque(j + 1);
        let k = s1;
        while (k < L.length && L[k].trim() !== 'Reemplazar por:') k++;
        const [reemplazo, s2] = bloque(k + 1);
        ops.push({ tipo, ruta, buscar, reemplazo });
        j = s2; continue;
      }
      j++;
    }
    i = j - 1;
  }
  return ops;
}

const archivos = new Map(); // ruta → contenido simulado | null
const leer = (ruta) => { if (!archivos.has(ruta)) archivos.set(ruta, enRef(ruta)); return archivos.get(ruta); };
let empezo = desde == null;
let rotas = 0;
for (const t of tareas) {
  if (!empezo && t.id === desde) empezo = true;
  if (!empezo) continue;
  const ops = operaciones(t.L);
  const problemas = [];
  let buscares = 0;
  for (const op of ops) {
    if (op.tipo === 'Borrar') { if (leer(op.ruta) == null) problemas.push(`${op.ruta}: Borrar un archivo que no existe`); archivos.set(op.ruta, null); continue; }
    if (op.tipo === 'Crear') { if (leer(op.ruta) != null) problemas.push(`${op.ruta}: Crear un archivo que ya existe (se pisaría)`); archivos.set(op.ruta, op.contenido); continue; }
    buscares++;
    const actual = leer(op.ruta);
    if (actual == null) { problemas.push(`${op.ruta}: Modificar un archivo que no existe`); continue; }
    const n = actual.split(op.buscar).length - 1;
    if (n !== 1) { problemas.push(`${op.ruta}: un Buscar aparece ${n} veces: «${op.buscar.split('\n')[0].trim().slice(0, 80)}»`); continue; }
    archivos.set(op.ruta, actual.replace(op.buscar, op.reemplazo ?? ''));
  }
  if (problemas.length) rotas++;
  console.log(`${problemas.length ? '✘' : '✔'} Tarea ${t.id}: ${ops.length} operaciones (${buscares} Buscar)${problemas.length ? `, ${problemas.length} anclas rotas` : ''}`);
  for (const p of problemas) console.log(`    ${p}`);
}
if (!empezo) { console.error(`No encontré la tarea ${desde}`); process.exit(2); }
console.log(rotas ? `\n${rotas} tarea(s) a re-auditar (sólo esas, con Sonnet; método 5.5).` : '\nTodo el plan aplica sobre la punta: no hace falta re-auditar por cambios de código.');
process.exit(rotas ? 1 : 0);
