#!/usr/bin/env node
// Trinquete de patrones prohibidos: el conteo por archivo puede BAJAR, nunca SUBIR (E6).
// Sirve para cualquier lenguaje: cuenta coincidencias de expresiones regulares en archivos de texto.
//
//   node trinquete.mjs --config trinquete.config.json            # compara con la línea base; sale 1 si algo subió
//   node trinquete.mjs --config trinquete.config.json --fijar    # (re)escribe la línea base con los conteos de hoy
//   node trinquete.mjs --config trinquete.config.json --archivos a.tsx b.tsx   # sólo esos (para pre-commit)
//
// Config (ejemplo en trinquete.config.ejemplo.json): raiz, incluir (extensiones), excluir (fragmentos de ruta),
// base (archivo de línea base) y reglas [{ id, patron, bandera, porque }].
// Regla de oro: un archivo NUEVO arranca en 0 (no está en la base); uno tocado no puede superar su conteo guardado.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const cfgPath = val('--config') || 'trinquete.config.json';
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const raiz = path.resolve(path.dirname(cfgPath), cfg.raiz || '.');
const baseFile = path.resolve(path.dirname(cfgPath), cfg.base || 'trinquete.base.json');
const reglas = cfg.reglas.map((r) => ({ ...r, re: new RegExp(r.patron, r.bandera || 'g') }));
const exts = new Set(cfg.incluir || ['.ts', '.tsx', '.js', '.jsx', '.css']);
const excluir = (cfg.excluir || ['node_modules', '.git', 'dist', 'build']).map((s) => s.replaceAll(path.sep, '/'));

function* recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = path.relative(raiz, p).replaceAll(path.sep, '/');
    if (excluir.some((x) => rel.includes(x))) continue;
    if (e.isDirectory()) yield* recorrer(p);
    else if (exts.has(path.extname(e.name))) yield p;
  }
}
const elegidos = args.includes('--archivos')
  ? args.slice(args.indexOf('--archivos') + 1).map((a) => path.resolve(a)).filter((a) => fs.existsSync(a))
  : [...recorrer(raiz)];

const hoy = {};
for (const f of elegidos) {
  const rel = path.relative(raiz, f).replaceAll(path.sep, '/');
  const txt = fs.readFileSync(f, 'utf8');
  for (const r of reglas) {
    const n = (txt.match(r.re) || []).length;
    if (n) (hoy[rel] ||= {})[r.id] = n;
  }
}

if (args.includes('--fijar')) {
  const previa = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : {};
  const nueva = args.includes('--archivos') ? { ...previa } : {};
  for (const f of elegidos) delete nueva[path.relative(raiz, f).replaceAll(path.sep, '/')];
  Object.assign(nueva, hoy);
  fs.writeFileSync(baseFile, JSON.stringify(nueva, null, 1) + '\n');
  console.log(`Línea base escrita: ${Object.keys(nueva).length} archivos con coincidencias.`);
  process.exit(0);
}

const base = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile, 'utf8')) : {};
const subio = [];
for (const [rel, porRegla] of Object.entries(hoy)) {
  for (const [id, n] of Object.entries(porRegla)) {
    const antes = base[rel]?.[id] ?? 0;
    if (n > antes) subio.push({ rel, id, antes, n, porque: reglas.find((r) => r.id === id)?.porque });
  }
}
if (subio.length) {
  console.error('El trinquete se movió para el lado equivocado:');
  for (const s of subio) console.error(`  ${s.rel}  [${s.id}]  ${s.antes} -> ${s.n}   ${s.porque || ''}`);
  console.error('Arreglalo (usá el token del tema / el permiso configurable). No subas la línea base para esquivarlo.');
  process.exit(1);
}
const total = Object.values(hoy).reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0);
console.log(`Trinquete OK. Coincidencias hoy: ${total} (la base sólo puede bajar).`);
