// @vitest-environment node
// Gate de VOCABULARIO sobre los datos del atlas (M-8 de la auditoría del S1): los textos de los mapas y de las
// gramáticas —lo que el atlas publica— tampoco llevan calcos vetados ni relleno (design-system.md § 8). Un mapa
// aprobado no se corrige a mano (se vuelve a investigar), así que lo que ya está publicado y viola la regla se
// declara aquí como deuda, con su ruta exacta: la lista solo puede achicarse.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { vocabularioVetado } from "@/lib/datos/vocabulario";

/**
 * Deuda declarada: ninguna. La de «lago de datos» (mapa de Fabric aprobado el 2026-09-29; decisión de la persona del
 * 2026-09-30: «data lake» es el nombre real y no se traduce) se pagó al aprobarse Fabric v0.2.0 el 2026-10-04. Las
 * versiones archivadas (data/mapas/versiones/) no se leen aquí: guardan los bytes que se aprobaron y no cambian.
 */
const CONOCIDAS = new Set<string>([]);

function hallazgos(dir: string): string[] {
  const out: string[] = [];
  for (const sub of ["mapas", "gramaticas"])
    for (const f of readdirSync(join(dir, sub)).filter((x) => x.endsWith(".yaml")).sort())
      for (const { ruta, que } of vocabularioVetado(parse(readFileSync(join(dir, sub, f), "utf8")))) out.push(`data/${sub}/${f} ${ruta} · ${que}`);
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
