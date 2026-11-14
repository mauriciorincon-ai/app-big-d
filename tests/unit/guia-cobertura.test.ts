import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Regla 11 del CLAUDE.md: la guía es UN recorrido y trae la matriz `cubre: [ids]` de TODAS las funcionalidades. Aquí «todas» son
// las del export de la vitrina (docs/brochure-export.json, ligadas al manual): una funcionalidad sin una prueba que la cubra, una
// prueba que cite una funcionalidad que no existe o una matriz que no diga lo mismo que los atributos rompen este test.
const GUIA = readFileSync("docs/GUIA-DE-PRUEBA.html", "utf8");
const EXPORT = JSON.parse(readFileSync("docs/brochure-export.json", "utf8")) as {
  funcionalidades: { grupos: { features: { id: string; nombre: string }[] }[] };
};
const FUNCIONES = EXPORT.funcionalidades.grupos.flatMap((g) => g.features);

const pruebas = [...GUIA.matchAll(/<li data-origen="[^"]*" data-cubre="([^"]*)"[^>]*><input type="checkbox" id="([^"]+)"/g)].map(
  ([, cubre, id]) => ({ id: id!, cubre: cubre!.split(/\s+/).filter(Boolean) }),
);
const totalPruebas = [...GUIA.matchAll(/<li data-origen=/g)].length;
const filas = [...GUIA.matchAll(/<tr data-funcion="([^"]+)" data-pruebas="([^"]*)"><th scope="row">([^<]*)<\/th><td>([^<]*)<\/td><\/tr>/g)].map(
  ([, funcion, ids, nombre, visibles]) => ({ funcion: funcion!, ids: ids!.split(" ").filter(Boolean), nombre: nombre!, visibles: visibles! }),
);

describe("cobertura de la guía (docs/GUIA-DE-PRUEBA.html)", () => {
  it("toda prueba declara qué cubre: ids de funcionalidad del export, o «-» si es transversal", () => {
    expect(pruebas).toHaveLength(totalPruebas);
    const validas = new Set(FUNCIONES.map((f) => f.id));
    for (const p of pruebas) {
      expect(p.cubre.length, `${p.id} no declara cubre`).toBeGreaterThan(0);
      if (p.cubre.length === 1 && p.cubre[0] === "-") continue;
      for (const c of p.cubre) expect(validas.has(c), `${p.id} cubre «${c}», que no es una funcionalidad del export`).toBe(true);
    }
  });

  it("cada funcionalidad del export tiene al menos una prueba que la cubre", () => {
    const sinPrueba = FUNCIONES.filter((f) => !pruebas.some((p) => p.cubre.includes(f.id))).map((f) => `${f.id} · ${f.nombre}`);
    expect(sinPrueba, "funcionalidades sin prueba en la guía").toEqual([]);
  });

  it("la matriz del final dice lo mismo que los atributos: una fila por funcionalidad, con sus pruebas en el orden del documento", () => {
    expect(filas.map((f) => f.funcion)).toEqual([...FUNCIONES].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1))).map((f) => f.id));
    for (const f of filas) {
      const esperadas = pruebas.filter((p) => p.cubre.includes(f.funcion)).map((p) => p.id);
      expect(f.ids, `fila ${f.funcion}`).toEqual(esperadas);
      expect(f.visibles).toBe(esperadas.map((i) => i.toUpperCase()).join(" "));
      expect(f.nombre).toBe(`${f.funcion} · ${FUNCIONES.find((x) => x.id === f.funcion)!.nombre}`);
    }
  });

  it("es UN recorrido: los bloques son consecutivos A… y ninguna prueba se repite (ids únicos y textos distintos)", () => {
    const letras = [...GUIA.matchAll(/<span class="letra">(\w)<\/span>/g)].map((m) => m[1]);
    expect(letras).toEqual([..."ABCDEFGHIJKLMNOPQR"].slice(0, letras.length));
    // cada id es «letra del bloque + lugar»: lo que la persona lee en la prosa («L3») es lo que busca en el documento
    const bloques = GUIA.split('<section class="bloque">').slice(1);
    bloques.forEach((b, i) => {
      const ids = [...b.matchAll(/<input type="checkbox" id="(\w+)"/g)].map((m) => m[1]);
      expect(ids).toEqual(ids.map((_, k) => `${letras[i]!.toLowerCase()}${k + 1}`));
    });
    const textos = [...GUIA.matchAll(/<label for="\w+">([\s\S]*?)<\/label>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    expect(new Set(textos).size).toBe(textos.length);
  });

  it("toda referencia a una prueba en la prosa («L3», «b1») apunta a una que existe", () => {
    const ids = new Set(pruebas.map((p) => p.id));
    const prosa = GUIA.slice(GUIA.indexOf("<header>"), GUIA.indexOf('<section class="cobertura"')).replace(/<[^>]+>/g, " ");
    // las miradas históricas M1 y M2 de la lista «Ya aprobado» no son pruebas de la guía
    const sinHistoricas = prosa.replace(/mirada M\d/g, "");
    for (const [, ref] of sinHistoricas.matchAll(/(?<![\w-])\(?([A-R]\d{1,2})\b(?![\w-])/g)) expect(ids.has(ref!.toLowerCase()), `«${ref}» no es una prueba de la guía`).toBe(true);
  });
});
