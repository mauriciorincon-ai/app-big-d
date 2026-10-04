#!/usr/bin/env node
// Regla 18 del kit (v1.32.0): ningún paquete queda POR DEBAJO de `main` al mergear dependencias.
// pnpm degrada en silencio al resolver un lockfile en conflicto y la CI pasa verde porque ninguna
// puerta compara el resultado contra la INTENCIÓN del PR. Este script es esa puerta: lee las versiones
// de pnpm-lock.yaml en el árbol actual y en origin/main y falla si alguna bajó.
// Bajada FORZADA (Big-D, PR #6 de dependabot, 2026-10-04): a veces el bump trae un paquete que FIJA una
// versión exacta más vieja que la de main (vitest 5.0.3 fija why-is-node-running 3.2.1; la 5.0.2 pedía
// ^3.2.1). Esa bajada es la intención del PR, no pnpm degradando: se acepta solo si algún paquete del
// lockfile del PR que usa esa versión la declara EXACTA en su package.json (se consulta en el registro con
// `npm view`). Cualquier otra bajada, o una consulta que falla, sigue en rojo.
// Uso: node scripts/verificar-dependencias.mjs [rama-base]   (default: origin/main)
// En CI corre solo en pull_request, tras `git fetch origin main --depth=1`.
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Versiones por paquete en la sección `packages:` del lockfile (v6 y v9: claves `/nombre@ver` o `nombre@ver:`). */
export function versiones(texto) {
  const out = new Map();
  let dentro = false;
  for (const linea of texto.split("\n")) {
    if (/^packages:\s*$/.test(linea)) { dentro = true; continue; }
    if (dentro && /^[A-Za-z]/.test(linea)) dentro = false; // otra sección de primer nivel
    if (!dentro) continue;
    const m = linea.match(/^  ['"]?\/?((?:@[^/@'"]+\/)?[^/@'"]+)@([0-9][^('":\s]*)/);
    if (!m) continue;
    const [, nombre, ver] = m;
    if (!out.has(nombre)) out.set(nombre, []);
    out.get(nombre).push(ver);
  }
  return out;
}
const num = (v) => v.split(/[-+]/)[0].split(".").map((x) => parseInt(x, 10) || 0);
const cmp = (a, b) => { const A = num(a), B = num(b); for (let i = 0; i < Math.max(A.length, B.length); i++) { const d = (A[i] ?? 0) - (B[i] ?? 0); if (d) return d; } return 0; };
const mayor = (vs) => vs.reduce((m, v) => (cmp(v, m) > 0 ? v : m));

/**
 * Los paquetes de la sección `snapshots:` (lockfile v9) que resuelven `nombre` a `version`: `{ nombre, version }` de
 * cada dependiente, sin el sufijo de pares.
 */
export function dependientes(texto, nombre, version) {
  const out = [];
  let dentro = false;
  let actual = null;
  for (const linea of texto.split("\n")) {
    if (/^snapshots:\s*$/.test(linea)) { dentro = true; continue; }
    if (dentro && /^[A-Za-z]/.test(linea)) dentro = false;
    if (!dentro) continue;
    const clave = linea.match(/^  ['"]?((?:@[^/@'"]+\/)?[^/@'"]+)@([0-9][^('":\s]*)/);
    if (clave) { actual = { nombre: clave[1], version: clave[2] }; continue; }
    const dep = linea.match(/^      ['"]?((?:@[^/@'"]+\/)?[^'":\s]+)['"]?: ['"]?([0-9][^('"\s]*)/);
    if (actual && dep && dep[1] === nombre && dep[2] === version && !out.some((d) => d.nombre === actual.nombre && d.version === actual.version)) out.push(actual);
  }
  return out;
}

/** El rango que `dependiente@version` declara para `nombre`, según el registro (`npm view`). */
export function rangoEnElRegistro(dependiente, version, nombre) {
  const json = JSON.parse(execFileSync("npm", ["view", `${dependiente}@${version}`, "dependencies", "optionalDependencies", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) || "{}");
  const campos = "dependencies" in json || "optionalDependencies" in json ? [json.dependencies, json.optionalDependencies] : [json];
  for (const c of campos) if (c && typeof c[nombre] === "string") return c[nombre];
  return null;
}

const exacta = (rango, version) => rango !== null && rango.trim().replace(/^=/, "") === version;

/**
 * Compara dos lockfiles. `consultar(dependiente, version, nombre)` da el rango declarado (inyectable en pruebas).
 * @returns {{ degradados: string[], forzados: string[], paquetes: number }}
 */
export function comparar(lockBase, lockPR, base, consultar = rangoEnElRegistro) {
  const enBase = versiones(lockBase), enPR = versiones(lockPR);
  const degradados = [];
  const forzados = [];
  for (const [nombre, vsBase] of enBase) {
    const vsPR = enPR.get(nombre);
    if (!vsPR) continue; // quitado a propósito: no es degradación
    const a = mayor(vsBase), b = mayor(vsPR);
    if (cmp(b, a) >= 0) continue;
    let quien = null;
    for (const d of dependientes(lockPR, nombre, b)) {
      try {
        if (exacta(consultar(d.nombre, d.version, nombre), b)) { quien = `${d.nombre}@${d.version}`; break; }
      } catch {
        /* sin registro no hay prueba de la intención: sigue en rojo */
      }
    }
    if (quien) forzados.push(`${nombre}: ${a} (${base}) → ${b}, porque ${quien} la fija exacta`);
    else degradados.push(`${nombre}: ${a} (${base}) → ${b} (este árbol)`);
  }
  return { degradados, forzados, paquetes: enPR.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2] ?? "origin/main";
  const LOCK = "pnpm-lock.yaml";
  if (!existsSync(LOCK)) { console.log(`verificar-dependencias: no hay ${LOCK}; nada que comparar`); process.exit(0); }
  let lockBase;
  try { lockBase = execSync(`git show ${base}:${LOCK}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { console.log(`verificar-dependencias: ${base} no tiene ${LOCK} (repo nuevo o rama sin base); se omite`); process.exit(0); }
  const r = comparar(lockBase, readFileSync(LOCK, "utf8"), base);
  for (const f of r.forzados) console.log(`  · bajada forzada, aceptada: ${f}`);
  if (r.degradados.length) {
    console.error(`✗ ${r.degradados.length} paquete(s) quedaron POR DEBAJO de ${base} (regla 18 — el lockfile no se pelea):`);
    for (const d of r.degradados) console.error(`  - ${d}`);
    console.error("Resuelve partiendo del lado que trae los bumps y verifica dependencia por dependencia.");
    process.exit(1);
  }
  console.log(`✓ verificar-dependencias: ${r.paquetes} paquetes, ninguno por debajo de ${base}${r.forzados.length ? ` salvo ${r.forzados.length} bajada(s) forzada(s) por un paquete que la fija exacta` : ""}`);
}
