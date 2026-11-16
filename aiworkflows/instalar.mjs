#!/usr/bin/env node
// Enlaza la skill aiworkflows en TODAS las carpetas de configuración de Claude de este usuario
// (~/.claude, ~/.claude-2, ~/.claude-100, ~/.claude-200, … y las que aparezcan después).
// La skill vive una sola vez (en la carpeta de este archivo); cada cuenta la ve por un enlace en su skills/.
//
//   node instalar.mjs              # enlaza la skill, sus agentes (agents/) y la skill de herdr donde falte (idempotente)
//   node instalar.mjs --guardia    # además agrega el hook guardia-de-modelos a cada settings.json (con copia .bak)
//   node instalar.mjs --quitar     # saca los enlaces (y el hook, si se pasa también --guardia)
//
// Una carpeta cuenta como configuración de Claude si se llama .claude o .claude-<algo> y tiene settings.json
// o projects/. Se saltean .claude-mem (datos de un plugin) y .claude-skills (donde vive esto).
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = dirname(fileURLToPath(import.meta.url));
const NOMBRE = 'aiworkflows';
const GUARDIA = join(SKILL, 'scripts', 'guardia-de-modelos.mjs').replaceAll('\\', '/');
const COMANDO = `node "${GUARDIA}"`;
const args = new Set(process.argv.slice(2));
const quitar = args.has('--quitar');
const conGuardia = args.has('--guardia');

const casa = homedir();
let configs = readdirSync(casa, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\.claude(-.+)?$/.test(d.name) && !['.claude-mem', '.claude-skills'].includes(d.name))
  .map((d) => join(casa, d.name))
  .filter((c) => existsSync(join(c, 'settings.json')) || existsSync(join(c, 'projects')));

const mismoDestino = (p) => { try { return realpathSync(p) === realpathSync(SKILL); } catch { return false; } };

function enlazar(config) {
  const skills = join(config, 'skills');
  const enlace = join(skills, NOMBRE);
  let existe = false;
  try { lstatSync(enlace); existe = true; } catch { /* no existe */ }
  if (quitar) {
    if (existe && lstatSync(enlace).isSymbolicLink()) { rmSync(enlace); return 'enlace quitado'; }
    return existe ? 'NO se tocó: hay una carpeta real, no un enlace' : 'no estaba';
  }
  if (existe) return mismoDestino(enlace) ? 'ya enlazada' : 'NO se tocó: ya hay otra skill con ese nombre';
  mkdirSync(skills, { recursive: true });
  symlinkSync(SKILL, enlace, 'junction');
  return 'enlazada';
}

// Los agentes del método (agentes/aiw-*.md) se ven en cada cuenta por un enlace <config>/agents → <skill>/agentes.
// Si la cuenta ya tiene su propia carpeta agents/, se copian ahí sólo los aiw-*.md (y se re-copian al actualizar).
const AGENTES = join(SKILL, 'agentes');
function enlazarAgentes(config) {
  if (!existsSync(AGENTES)) return 'sin agentes/';
  const enlace = join(config, 'agents');
  let existe = false;
  try { lstatSync(enlace); existe = true; } catch { /* no existe */ }
  const nuestro = () => { try { return realpathSync(enlace) === realpathSync(AGENTES); } catch { return false; } };
  if (quitar) {
    if (existe && nuestro()) { rmSync(enlace); return 'agentes quitados'; }
    return 'agentes: no se tocó';
  }
  if (existe && nuestro()) return 'agentes ya enlazados';
  if (existe && lstatSync(enlace).isDirectory()) {
    // la cuenta ya tiene su carpeta agents/: se copian sólo los aiw-*.md (se re-copian al actualizar)
    const nombres = readdirSync(AGENTES).filter((n) => /^aiw-.*\.md$/.test(n));
    for (const n of nombres) copyFileSync(join(AGENTES, n), join(enlace, n));
    return `agentes copiados (${nombres.length}) a su carpeta agents/`;
  }
  if (existe) return 'agentes: NO se tocó (agents existe y no es carpeta)';
  symlinkSync(AGENTES, enlace, 'junction');
  return 'agentes enlazados';
}

// La skill de herdr (si herdr está instalado: herdr --skill la deja en ~/.herdr/skill/herdr).
const SKILL_HERDR = join(casa, '.herdr', 'skill', 'herdr');
function enlazarHerdr(config) {
  if (!existsSync(join(SKILL_HERDR, 'SKILL.md'))) return null;
  const enlace = join(config, 'skills', 'herdr');
  let existe = false;
  try { lstatSync(enlace); existe = true; } catch { /* no existe */ }
  if (quitar) return null;
  if (existe) return null;
  mkdirSync(join(config, 'skills'), { recursive: true });
  symlinkSync(SKILL_HERDR, enlace, 'junction');
  return 'skill herdr enlazada';
}

function guardia(config) {
  const archivo = join(config, 'settings.json');
  if (!existsSync(archivo)) return 'sin settings.json';
  const texto = readFileSync(archivo, 'utf8');
  let s;
  try { s = JSON.parse(texto.replace(/^﻿/, '')); } catch { return 'NO se tocó: settings.json no es JSON válido'; }
  const pre = ((s.hooks ??= {}).PreToolUse ??= []);
  const esNuestro = (h) => (h.command ?? '').includes('guardia-de-modelos.mjs');
  const antes = JSON.stringify(pre);
  for (const m of pre) if (Array.isArray(m.hooks)) m.hooks = m.hooks.filter((h) => !esNuestro(h));
  s.hooks.PreToolUse = pre.filter((m) => !Array.isArray(m.hooks) || m.hooks.length > 0);
  if (!quitar) s.hooks.PreToolUse.push({ matcher: 'Agent|Task|Bash|PowerShell', hooks: [{ type: 'command', command: COMANDO, timeout: 15 }] });
  if (JSON.stringify(s.hooks.PreToolUse) === antes) return quitar ? 'hook no estaba' : 'hook ya estaba';
  copyFileSync(archivo, `${archivo}.bak`);
  writeFileSync(archivo, JSON.stringify(s, null, 2) + '\n');
  return quitar ? 'hook quitado (copia en settings.json.bak)' : 'hook instalado (copia en settings.json.bak)';
}

if (!configs.length) {
  if (quitar) { console.error(`No encontré carpetas de configuración de Claude en ${casa}`); process.exit(1); }
  // instalación nueva: Claude Code usa ~/.claude por defecto
  mkdirSync(join(casa, '.claude'), { recursive: true });
  configs.push(join(casa, '.claude'));
}
console.log(`Skill: ${resolve(SKILL)}`);
for (const c of configs) {
  const partes = [enlazar(c), enlazarAgentes(c)];
  const h = enlazarHerdr(c);
  if (h) partes.push(h);
  if (conGuardia) partes.push(guardia(c));
  console.log(`  ${c}: ${partes.join(' · ')}`);
}
