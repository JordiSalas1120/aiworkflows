#!/usr/bin/env node
// empaquetar.mjs — valida la skill aiworkflows y arma dist/aiworkflows-v<versión>.zip listo para publicar.
//
//   node herramientas/empaquetar.mjs            # valida y arma el zip
//   node herramientas/empaquetar.mjs --validar  # sólo valida
//
// Valida: frontmatter (name, description ≤ 1024, metadata.version), que cada .mjs compile,
// texto sin mojibake, rutas personales y las palabras privadas de .privado.txt (una por línea,
// fuera de git: así la lista de lo que NO se publica tampoco se publica).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SKILL = path.join(RAIZ, 'aiworkflows');
const DIST = path.join(RAIZ, 'dist');
const soloValidar = process.argv.includes('--validar');
const errores = [];

const todos = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  if (d.name === 'node_modules' || d.name.startsWith('.')) return [];
  return d.isDirectory() ? todos(p) : [p];
});
const rel = (p) => path.relative(RAIZ, p).replaceAll('\\', '/');

// 1. Frontmatter
const skillMd = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
const fm = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fm) errores.push('SKILL.md: falta el frontmatter');
const campo = (k) => (fm?.[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const nombre = campo('name');
const descripcion = campo('description') || '';
const version = (fm?.[1].match(/^\s+version:\s*["']?([\d.]+)/m) || [])[1];
if (nombre !== 'aiworkflows') errores.push(`SKILL.md: name es «${nombre}», se espera «aiworkflows»`);
if (!descripcion) errores.push('SKILL.md: falta description');
if (descripcion.length > 1024) errores.push(`SKILL.md: description tiene ${descripcion.length} caracteres (máximo 1024)`);
if (!version) errores.push('SKILL.md: falta metadata.version (semver)');

// 2. Contenido
const privadas = fs.existsSync(path.join(RAIZ, '.privado.txt'))
  ? fs.readFileSync(path.join(RAIZ, '.privado.txt'), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'))
  : [];
const RE_RUTA_PERSONAL = /[A-Z]:\\Users\\(?!<)[^\\\s<>]+|\/(home|Users)\/(?!<)[a-z0-9._-]+\//i;
const archivos = todos(SKILL);
for (const f of archivos) {
  const ext = path.extname(f);
  if (!['.md', '.mjs', '.js', '.py', '.sh', '.json', '.ps1', '.yml', '.yaml', '.txt'].includes(ext)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/Ã[\u0080-¿]|Â[\u0080-¿]|â€/.test(t)) errores.push(`${rel(f)}: texto con mojibake (codificación rota)`);
  const ruta = t.match(RE_RUTA_PERSONAL);
  if (ruta) errores.push(`${rel(f)}: ruta personal «${ruta[0]}»`);
  for (const p of privadas) if (t.toLowerCase().includes(p.toLowerCase())) errores.push(`${rel(f)}: contiene la palabra privada «${p}»`);
  if (ext === '.mjs') {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) errores.push(`${rel(f)}: no compila\n${r.stderr}`);
  }
}

console.log(`aiworkflows v${version ?? '?'} · ${archivos.length} archivos · description ${descripcion.length}/1024 · ${privadas.length} palabras privadas chequeadas`);
if (errores.length) { console.error(`\n✘ ${errores.length} problema(s):\n- ${errores.join('\n- ')}`); process.exit(1); }
console.log('✔ validación OK');
if (soloValidar) process.exit(0);

// 3. Zip: la carpeta aiworkflows/ en la raíz del zip (se descomprime dentro de ~/.claude/skills/)
fs.mkdirSync(DIST, { recursive: true });
const zip = path.join(DIST, `aiworkflows-v${version}.zip`);
fs.rmSync(zip, { force: true });
const TAR = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe') : 'tar'; // en Git Bash, `tar` es GNU y no hace zip
let r = spawnSync(TAR, ['-a', '-c', '-f', zip, 'aiworkflows'], { cwd: RAIZ, encoding: 'utf8' }); // bsdtar: Windows 10+ y macOS
if (r.status !== 0 || !fs.existsSync(zip)) r = spawnSync('zip', ['-qr', zip, 'aiworkflows'], { cwd: RAIZ, encoding: 'utf8' }); // Linux
if (r.status !== 0 || !fs.existsSync(zip)) { console.error(`✘ no se pudo crear el zip: ${r.stderr || r.error}`); process.exit(1); }
const sha = createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
fs.writeFileSync(`${zip}.sha256`, `${sha}  ${path.basename(zip)}\n`);
console.log(`✔ ${rel(zip)} (${(fs.statSync(zip).size / 1024).toFixed(0)} KB)\n  sha256 ${sha}`);
