#!/usr/bin/env node
// recursos.mjs — semáforo de la máquina y procesos sobrantes (método 25).
//
//   node recursos.mjs                      # semáforo + procesos de desarrollo abiertos + sobrantes
//   node recursos.mjs --json               # lo mismo, para scripts
//   node recursos.mjs --cerrar 1234,5678   # cierra esos PID (con su árbol); sólo procesos de desarrollo
//   node recursos.mjs --cerrar-sobrantes   # cierra todos los marcados como sobrantes
//   node recursos.mjs --forzar --cerrar N  # permite cerrar un PID que no es de desarrollo (nunca Claude ni esta sesión)
//
// Salida: 0 verde · 1 amarillo · 2 rojo (útil en un `&&` antes de lanzar una suite).
import { analizar, cerrar, maquina, QUE_SE_PUEDE, semaforo } from './lib-recursos.mjs';

const a = process.argv.slice(2);
const json = a.includes('--json');
const forzar = a.includes('--forzar');
const cerrarSobrantes = a.includes('--cerrar-sobrantes');
const iCerrar = a.indexOf('--cerrar');
const aCerrar = iCerrar >= 0 ? (a[iCerrar + 1] || '').split(',').map(Number).filter(Boolean) : [];

const m = maquina({ ms: 800 });
const s = semaforo(m);
const { grupos } = analizar();

const cerrados = [];
if (aCerrar.length || cerrarSobrantes) {
  const objetivo = cerrarSobrantes ? grupos.filter((g) => g.sobrante && !g.propio).map((g) => g.pid) : aCerrar;
  for (const pid of objetivo) {
    const g = grupos.find((x) => x.pid === pid);
    if (g?.propio || g?.categoria === 'claude') { cerrados.push({ pid, resultado: 'NO: es Claude o esta misma sesión' }); continue; }
    if (!g && !forzar) { cerrados.push({ pid, resultado: 'NO: no es un proceso de desarrollo conocido (usá --forzar si estás seguro)' }); continue; }
    cerrados.push({ pid, resultado: cerrar(pid) });
  }
}

if (json) {
  process.stdout.write(JSON.stringify({ maquina: m, semaforo: s, quePuede: QUE_SE_PUEDE[s.nivel], grupos, cerrados }, null, 2) + '\n');
} else {
  const icono = { verde: '🟢', amarillo: '🟡', rojo: '🔴' }[s.nivel];
  console.log(`${icono} ${s.nivel.toUpperCase()} · RAM libre ${m.libreGB.toFixed(1)}/${m.totalGB.toFixed(1)} GB (${m.librePct.toFixed(0)} %) · CPU ${m.cpuPct} % (${m.nucleos} núcleos)${m.discoLibreGB != null ? ` · disco libre ${m.discoLibreGB.toFixed(0)} GB` : ''}`);
  if (s.motivos.length) console.log(`   por: ${s.motivos.join(' · ')}`);
  console.log(`   ${QUE_SE_PUEDE[s.nivel]}`);
  const claude = grupos.filter((g) => g.categoria === 'claude');
  const dev = grupos.filter((g) => g.categoria !== 'claude');
  console.log(`\nSesiones de Claude abiertas: ${claude.length} (${claude.reduce((t, g) => t + g.ramMB, 0)} MB). Cada una ocupa memoria: cerrá las que no estés usando.`);
  console.log(`\nProcesos de desarrollo (${dev.length}):`);
  if (!dev.length) console.log('   — ninguno');
  for (const g of dev) console.log(`   ${g.sobrante ? '⚠' : ' '} PID ${String(g.pid).padEnd(6)} ${g.categoria.padEnd(18)} ${String(g.ramMB).padStart(5)} MB  ${String(g.min).padStart(4)} min  ${g.cmd.slice(0, 90)}${g.sobrante ? `\n       └ SOBRANTE: ${g.sobrante}` : ''}`);
  const sob = dev.filter((g) => g.sobrante);
  if (sob.length && !cerrarSobrantes) console.log(`\n${sob.length} sobrante(s), ${sob.reduce((t, g) => t + g.ramMB, 0)} MB. Cerralos con: node recursos.mjs --cerrar-sobrantes   (o --cerrar ${sob.map((g) => g.pid).join(',')})`);
  for (const c of cerrados) console.log(`   cerrar ${c.pid}: ${c.resultado}`);
}
process.exit({ verde: 0, amarillo: 1, rojo: 2 }[s.nivel]);
