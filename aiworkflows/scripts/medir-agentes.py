"""Mide en qué se fue el gasto y el tiempo de los agentes de Claude Code: sesión principal y subagentes.

    python -I medir-agentes.py --proyecto mi-proyecto --desde 2026-10-01 [--hasta 2026-10-12] [--config ~/.claude]

Lee los transcripts de <config>/projects/*<proyecto>*/ (sesiones y sus subagents/), toma el
`usage` de cada respuesta (una vez por mensaje) y lo valoriza a precio de lista de la API, en $
equivalentes (con suscripción no se paga eso: sirve para comparar cupo entre modelos y fases).
El log de ~/.claude/metrics/costs.jsonl NO sirve para esto: no ve a los subagentes.

Imprime un informe en markdown para pegar en la sección «Gasto (medido)» del registro:
quién gastó (principal / subagentes, por modelo), en qué fase (por la descripción del encargo),
los desvíos del método (Opus construyendo, explorando o en rondas; encargos sin modelo) y las
sesiones más caras. Método, 15.8.
"""
import argparse, collections, glob, json, os, re, sys, datetime as dt

# $/MTok: entrada, salida, lectura de caché, escritura de caché (5 min). Actualizar si cambian.
PRECIOS = [
    ("opus-5-5", (4, 20, 0.20, 5)), ("opus-5", (5, 25, 0.50, 6.25)), ("opus-4", (5, 25, 0.50, 6.25)),
    ("sonnet-5", (2, 10, 0.20, 2.5)), ("sonnet-4", (3, 15, 0.30, 3.75)),
    ("haiku-5", (0.1, 0.5, 0.01, 0.125)), ("haiku-4", (1, 5, 0.10, 1.25)), ("fable", (10, 50, 0.25, 12.5)),
]
FASES = [
    ("re-planificar / re-auditar", r"re-?plan|re-?audit|rewrite.*plan|re-?escrib.*plan|apply .*fix.*plan|fix(es)? (to|in) plan|corregir (el )?plan"),
    ("correcciones exactas", r"exact fix|correcci[oó]n exacta|write .*fix"),
    ("re-revisión", r"re-?revi|re-?review|re-?verif|recheck"),
    ("ronda de arreglos", r"fix round|ronda|\bola\b|wave|arregl|\bfix"),
    ("auditoría", r"audit"),
    ("plan / spec", r"plan|spec"),
    ("revisión", r"review|revis"),
    ("navegador / QA", r"naveg|\bqa\b|browser|walkthrough|recorrido|captur|visual|dise[ñn]o|verify"),
    ("construir", r"build|implement|constru|task|tarea|apply|aplicar"),
    ("explorar / medir", r"explor|investig|\bmap|research|diagn|medir|measure|busc|find"),
]
MECANICAS = {"construir", "ronda de arreglos", "explorar / medir"}


def precio(modelo):
    for clave, p in PRECIOS:
        if clave in modelo:
            return p
    return None


def familia(modelo):
    for f in ("opus", "sonnet", "haiku", "fable"):
        if f in modelo:
            return f
    return "?"


def ts(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()


def leer(path):
    msgs, agentes, tiempos, titulo = {}, [], [], None
    for linea in open(path, encoding="utf-8", errors="replace"):
        try:
            r = json.loads(linea)
        except ValueError:
            continue
        t = r.get("type")
        if t == "ai-title":
            titulo = r.get("aiTitle")
        if t in ("user", "assistant") and "timestamp" in r:
            tiempos.append(ts(r["timestamp"]))
        if t == "assistant":
            m = r["message"]
            msgs[m.get("id") or r.get("uuid")] = (m.get("model", "?"), m.get("usage") or {})
            for c in m.get("content") or []:
                if c.get("type") == "tool_use" and c.get("name") in ("Agent", "Task"):
                    i = c.get("input", {})
                    agentes.append((i.get("subagent_type"), i.get("model"), i.get("description") or ""))
    tiempos.sort()
    activo = sum(min(b - a, 900) for a, b in zip(tiempos, tiempos[1:]) if b - a < 900)
    porm = collections.defaultdict(lambda: [0.0, 0, 0])  # $, salida, lectura de caché
    for modelo, u in msgs.values():
        p = precio(modelo)
        a = porm[modelo]
        a[1] += u.get("output_tokens", 0)
        a[2] += u.get("cache_read_input_tokens", 0)
        if p:
            a[0] += (u.get("input_tokens", 0) * p[0] + u.get("output_tokens", 0) * p[1]
                     + u.get("cache_read_input_tokens", 0) * p[2] + u.get("cache_creation_input_tokens", 0) * p[3]) / 1e6
    return {"porm": porm, "agentes": agentes, "activo": activo, "titulo": titulo,
            "inicio": tiempos[0] if tiempos else None}


def costo(x):
    return sum(v[0] for v in x["porm"].values())


def principal_modelo(x):
    return max(x["porm"].items(), key=lambda kv: kv[1][0])[0] if x["porm"] else "?"


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # la consola de Windows no es UTF-8 y -I ignora PYTHONIOENCODING
    ap = argparse.ArgumentParser()
    ap.add_argument("--proyecto", required=True, help="parte del nombre de la carpeta en <config>/projects")
    ap.add_argument("--desde", required=True)
    ap.add_argument("--hasta")
    ap.add_argument("--config", default=os.environ.get("CLAUDE_CONFIG_DIR") or os.path.expanduser("~/.claude"))
    a = ap.parse_args()
    desde = ts(a.desde + "T00:00:00+00:00")
    hasta = ts(a.hasta + "T23:59:59+00:00") if a.hasta else float("inf")
    carpetas = [d for d in glob.glob(os.path.join(a.config, "projects", "*")) if a.proyecto.lower() in os.path.basename(d).lower()]
    if not carpetas:
        sys.exit(f"No hay carpetas de proyecto con «{a.proyecto}» en {a.config}/projects")

    sesiones = []
    for carpeta in carpetas:
        for f in glob.glob(os.path.join(carpeta, "*.jsonl")):
            if os.path.getmtime(f) < desde:
                continue
            s = leer(f)
            if s["inicio"] is None or not (desde <= s["inicio"] <= hasta):
                continue
            s["id"] = os.path.basename(f)[:8]
            s["subs"] = []
            for sf in glob.glob(os.path.join(f[:-6], "subagents", "*.jsonl")):
                sub = leer(sf)
                meta = sf[:-6] + ".meta.json"
                sub["meta"] = json.load(open(meta, encoding="utf-8")) if os.path.exists(meta) else {}
                s["subs"].append(sub)
            sesiones.append(s)
    if not sesiones:
        sys.exit("No hay sesiones en ese rango.")

    quien = collections.defaultdict(lambda: [0.0, 0])
    fases = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0.0, 0.0]))
    for s in sesiones:
        for m, v in s["porm"].items():
            quien[("principal", familia(m))][0] += v[0]
            quien[("principal", familia(m))][1] += v[2]
        for u in s["subs"]:
            fam = familia(principal_modelo(u))
            quien[("subagentes", fam)][0] += costo(u)
            quien[("subagentes", fam)][1] += sum(v[2] for v in u["porm"].values())
            desc = u["meta"].get("description") or ""
            fase = next((n for n, p in FASES if re.search(p, desc, re.I)), "otro")
            f = fases[fase][fam]
            f[0] += 1; f[1] += costo(u); f[2] += u["activo"]
    total = sum(v[0] for v in quien.values()) or 1

    print(f"## Gasto de agentes · {a.proyecto} · {a.desde} → {a.hasta or 'hoy'}\n")
    print(f"{len(sesiones)} sesiones, {sum(len(s['subs']) for s in sesiones)} subagentes, "
          f"{total:,.0f} $ equivalentes de API (precio de lista; con suscripción es cupo).\n")
    print("| Quién · modelo | $ | % | Lectura de caché (M) |\n|---|---|---|---|")
    for (q, m), v in sorted(quien.items(), key=lambda kv: -kv[1][0]):
        if v[0] >= 0.5:
            print(f"| {q} · {m} | {v[0]:,.0f} | {100 * v[0] / total:.0f} % | {v[1] / 1e6:,.0f} |")

    print("\n| Fase (por la descripción del encargo) | $ | % | Encargos por modelo: cantidad · $ c/u · min c/u |\n|---|---|---|---|")
    total_subs = sum(f[1] for d in fases.values() for f in d.values()) or 1
    for fase, d in sorted(fases.items(), key=lambda kv: -sum(f[1] for f in kv[1].values())):
        t = sum(f[1] for f in d.values())
        detalle = " · ".join(f"{m}: {f[0]} · {f[1] / f[0]:.1f} · {f[2] / f[0] / 60:.0f}" for m, f in sorted(d.items()))
        print(f"| {fase} | {t:,.0f} | {100 * t / total_subs:.0f} % | {detalle} |")

    desvios = collections.Counter()
    sin_modelo = 0
    for s in sesiones:
        for tipo, modelo, desc in s["agentes"]:
            if tipo != "fork" and not modelo:
                sin_modelo += 1
        for u in s["subs"]:
            desc = u["meta"].get("description") or ""
            fase = next((n for n, p in FASES if re.search(p, desc, re.I)), "otro")
            if familia(principal_modelo(u)) == "opus" and fase in MECANICAS:
                desvios[fase] += 1
    print("\n**Desvíos del método (15.8):** "
          + (", ".join(f"Opus en «{k}»: {v}" for k, v in desvios.items()) or "ningún Opus en trabajo mecánico")
          + f"; encargos sin modelo explícito: {sin_modelo}.")

    print("\n**Sesiones más caras:**\n")
    for s in sorted(sesiones, key=lambda s: -(costo(s) + sum(costo(u) for u in s["subs"])))[:8]:
        subs = sum(costo(u) for u in s["subs"])
        print(f"- `{s['id']}` {costo(s) + subs:,.0f} $ (principal {costo(s):,.0f} · {len(s['subs'])} subagentes {subs:,.0f}) · "
              f"{s['activo'] / 3600:.1f} h activas · {s['titulo'] or ''}")


if __name__ == "__main__":
    main()
