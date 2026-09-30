// @vitest-environment node
// Gate de VOCABULARIO sobre los datos del atlas (M-8 de la auditoría del S1): los textos de los mapas y de las
// gramáticas —lo que el atlas publica— tampoco llevan calcos vetados ni relleno (design-system.md § 8). Un mapa
// aprobado no se corrige a mano (se vuelve a investigar), así que lo que ya está publicado y viola la regla se
// declara aquí como deuda, con su ruta exacta: la lista solo puede achicarse.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { VETADAS } from "./lib/vocabulario";

/**
 * Deuda declarada: «lago de datos» en el mapa de Fabric aprobado el 2026-09-29. Se paga volviendo a investigar
 * esas afirmaciones (/investigar fabric) y aprobando la propuesta; entonces se borran de aquí.
 */
const CONOCIDAS = new Set([
  "data/mapas/fabric.mapa.yaml /nodos/1/fuentes/0/titulo/es",
  "data/mapas/fabric.mapa.yaml /nodos/5/fuentes/0/titulo/es",
  "data/mapas/fabric.mapa.yaml /nodos/6/experto/es",
  "data/mapas/fabric.mapa.yaml /nodos/6/terminos/es/lakehouse",
  "data/mapas/fabric.mapa.yaml /glosario/es/OneLake",
]);

/** Cada texto del dato con su ruta (JSON Pointer). */
function textos(v: unknown, ruta = ""): [string, string][] {
  if (typeof v === "string") return [[ruta, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => textos(x, `${ruta}/${i}`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => textos(x, `${ruta}/${k}`));
  return [];
}

function hallazgos(dir: string): string[] {
  const out: string[] = [];
  for (const sub of ["mapas", "gramaticas"])
    for (const f of readdirSync(join(dir, sub)).filter((x) => x.endsWith(".yaml")).sort())
      for (const [ruta, t] of textos(parse(readFileSync(join(dir, sub, f), "utf8"))))
        for (const [re, que] of VETADAS) if (re.test(t)) out.push(`data/${sub}/${f} ${ruta} · ${que}`);
  return out;
}

describe("datos del atlas — vocabulario", () => {
  const todos = hallazgos("data");
  it("ningún calco ni relleno fuera de la deuda declarada", () => {
    expect(todos.filter((h) => !CONOCIDAS.has(h.split(" · ")[0]!))).toEqual([]);
  });
  it("la deuda declarada existe de verdad (si se pagó, se borra de la lista)", () => {
    const vigentes = new Set(todos.map((h) => h.split(" · ")[0]!));
    expect([...CONOCIDAS].filter((c) => !vigentes.has(c))).toEqual([]);
  });
});
