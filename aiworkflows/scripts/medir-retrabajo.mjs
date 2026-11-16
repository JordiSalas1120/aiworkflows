#!/usr/bin/env node
// Mide el RETRABAJO de un lote (E11): cuántos arreglos hubo por cada función nueva, y cuántos DESPUÉS de la
// primera subida a un entorno de verificación. Complementa a medir-agentes.py (que mide gasto y modelo).
//
//   node medir-retrabajo.mjs --desde 2026-10-01 [--hasta 2026-10-31] [--repo .] [--rama origin/main]
//                            [--primera-subida <sha-o-fecha>] [--tema <texto del asunto>]
//
// Cuenta commits cuyo asunto empieza con «feat» y con «fix» (convención de commits). Si el proyecto usa otra,
// cambiá los dos patrones de abajo. «Después de la primera subida» es lo más importante: son los arreglos que
// encontró el navegador o el dueño sobre algo que ya se había dado por listo.
// La salida se pega en el registro, junto al gasto. Lo que el script no puede saber (rondas hasta 0 ❌ y
// recorridos completos repetidos) se anota a mano en las dos últimas líneas.
import { execFileSync } from 'node:child_process';

const a = process.argv.slice(2);
const v = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const repo = v('--repo', '.');
const rama = v('--rama', 'HEAD');
const desde = v('--desde');
const hasta = v('--hasta');
const primera = v('--primera-subida');
const tema = v('--tema');
if (!desde) { console.error('Falta --desde AAAA-MM-DD'); process.exit(2); }

const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
function commits(since, until) {
  const args = ['log', rama, '--no-merges', `--since=${since}`, '--format=%H%x09%cI%x09%s'];
  if (until) args.push(`--until=${until}`);
  return git(...args).split('\n').filter(Boolean).map((l) => { const [sha, fecha, asunto] = l.split('\t'); return { sha, fecha, asunto }; })
    .filter((c) => !tema || c.asunto.toLowerCase().includes(tema.toLowerCase()));
}
const esFeat = (c) => /^feat(\(|:|!)/i.test(c.asunto);
const esFix = (c) => /^fix(\(|:|!)/i.test(c.asunto);
const razon = (f, n) => (n ? (f / n).toFixed(2) : 'n/a');

const todos = commits(desde, hasta);
const feat = todos.filter(esFeat).length;
const fix = todos.filter(esFix).length;
console.log('## Retrabajo (medido)');
console.log(`- Período: ${desde} a ${hasta || 'hoy'}${tema ? ` · tema «${tema}»` : ''} · rama ${rama}`);
console.log(`- Funciones nuevas (feat): ${feat} · Arreglos (fix): ${fix} · **arreglos por función: ${razon(fix, feat)}**`);

if (primera) {
  const fechaCorte = /^[0-9a-f]{7,40}$/i.test(primera) ? git('show', '-s', '--format=%cI', primera).trim() : primera;
  const despues = todos.filter((c) => c.fecha > fechaCorte);
  const fixDespues = despues.filter(esFix);
  console.log(`- Arreglos DESPUÉS de la primera subida (${fechaCorte.slice(0, 16)}): **${fixDespues.length}** de ${fix} (${fix ? Math.round((100 * fixDespues.length) / fix) : 0} %)`);
}
console.log('- Rondas de arreglo hasta 0 ❌ en el recorrido: <anotar a mano>');
console.log('- Recorridos completos repetidos (no sólo lo que cambió): <anotar a mano>');
