// @vitest-environment node
// `compare` (§ 4.4): el lado a lado. Lo que el contrato pide, como propiedades: G5 entre N mapas (cada banda en la
// misma columna para todos), invariancia al orden de los mapas, el nivel por banda no mueve columnas, cada fila sola
// es la fila de la comparación entera trasladada (lo que usa el producto), N lo declara el consumidor, gramáticas
// distintas no se comparan, y la matriz de envejecimiento (cuatro edades, 0 avisos) sobre el lado a lado y las
// diferencias.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  agingDates,
  compare,
  diff,
  diffToText,
  toSVG,
  type CajaPropia,
  type Geometria,
  type Mapa,
} from "../src/index";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { ANTES, DESPUES, LADO, TODAS_EN_2 } from "./lib/casos";
import { FECHA_LADO } from "./lib/lado";
import { TEXTOS } from "./lib/textos";

const G = GRAMATICAS["plataformas-datos"]!;
const SEMILLA = 20261002;
const OPC = { seed: SEMILLA, numRuns: 60 };
const base = { texts: TEXTOS, queryDate: FECHA_LADO };
const BANDAS = [
  ...G.bandas.filter((b) => b.clase === "capa"),
  ...G.bandas.filter((b) => b.clase === "transversal"),
]
  .sort((a, b) =>
    a.clase === b.clase ? a.orden - b.orden : a.clase === "capa" ? -1 : 1,
  )
  .map((b) => b.id);

/** Subconjunto no vacío y en cualquier orden de los cuatro sujetos. */
const mapas = fc
  .uniqueArray(fc.constantFrom(...LADO.map((_m, i) => i)), {
    minLength: 1,
    maxLength: LADO.length,
  })
  .map((ix) => ix.map((i) => LADO[i]!));
/** Un nivel por banda arbitrario (o ninguno: la rejilla de bloques). */
const niveles = fc.option(
  fc.dictionary(
    fc.constantFrom(...BANDAS),
    fc.constantFrom(1 as const, 2 as const),
  ),
  { nil: undefined },
);
const xs = (geo: Geometria) => geo.columnas.map((c) => `${c.banda}@${c.x}`);
/** La columna de cada caja (la de x más cercana por la izquierda) debe ser la de la banda de su elemento. */
const columnaDe = (geo: Geometria, c: CajaPropia) =>
  [...geo.columnas].reverse().find((col) => col.x <= c.caja.x)!;

describe("compare — G5 y neutralidad", () => {
  it("columnas: una por banda (capas y franjas, en el orden de la gramática), a 118 u o a 152 u, viewBox 1190 o 1496", () => {
    const bloques = compare(LADO, G, base);
    const componentes = compare(LADO, G, { ...base, levelByBand: {} });
    expect(bloques.columnas.map((c) => c.banda)).toEqual(BANDAS);
    expect([bloques.ancho, componentes.ancho]).toEqual([11900, 14960]);
    expect(bloques.columnas.map((c) => c.x)).toEqual(
      BANDAS.map((_b, i) => 80 + i * (1180 + 140)),
    );
    expect(componentes.columnas.map((c) => c.x)).toEqual(
      BANDAS.map((_b, i) => 80 + i * (1520 + 140)),
    );
  });
  it("G5 entre N mapas: las columnas no dependen de cuáles ni de cuántos mapas se comparen", () => {
    fc.assert(
      fc.property(mapas, mapas, niveles, (a, b, lv) => {
        const o = { ...base, ...(lv ? { levelByBand: lv } : {}) };
        expect(xs(compare(a, G, o))).toEqual(xs(compare(b, G, o)));
      }),
      OPC,
    );
  });
  it("cada tarjeta cae en la columna de su banda", () => {
    fc.assert(
      fc.property(mapas, niveles, (ms, lv) => {
        const geo = compare(ms, G, {
          ...base,
          ...(lv ? { levelByBand: lv } : {}),
        });
        for (const c of geo.cajas) {
          const [pre, id] = c.id.split("/");
          const m = ms.find((x) => x.sujeto_id === pre)!;
          const banda =
            c.clase === "nodo"
              ? m.nodos.find((n) => n.id === id)!.banda_id
              : (m.bloques.find((x) => x.id === id)?.banda_id ?? id!.slice(1));
          expect(columnaDe(geo, c).banda, c.id).toBe(banda);
          expect(c.caja.x, c.id).toBe(columnaDe(geo, c).x);
        }
      }),
      OPC,
    );
  });
  it("invariancia al orden: reordenar los mapas no cambia un byte (orden por sujeto_id)", () => {
    fc.assert(
      fc.property(
        mapas,
        niveles,
        fc.constantFrom("es", "en"),
        (ms, lv, idioma) => {
          const o = { ...base, ...(lv ? { levelByBand: lv } : {}) };
          expect(
            toSVG(compare([...ms].reverse(), G, o), { language: idioma }),
          ).toBe(toSVG(compare(ms, G, o), { language: idioma }));
        },
      ),
      OPC,
    );
  });
  it("el nivel por banda no mueve columnas: desplegar cualquier banda deja cada columna donde estaba", () => {
    fc.assert(
      fc.property(mapas, niveles, (ms, lv) => {
        expect(xs(compare(ms, G, { ...base, levelByBand: lv ?? {} }))).toEqual(
          xs(compare(ms, G, { ...base, levelByBand: {} })),
        );
      }),
      OPC,
    );
  });
  it("desplegar una banda solo hace crecer la fila; las cajas de las otras bandas no se mueven", () => {
    const cerrada = compare(LADO.slice(0, 1), G, { ...base, levelByBand: {} });
    const abierta = compare(LADO.slice(0, 1), G, {
      ...base,
      levelByBand: { almacenamiento: 2 },
    });
    const fuera = (geo: Geometria) =>
      geo.cajas
        .filter((c) => columnaDe(geo, c).banda !== "almacenamiento")
        .map((c) => `${c.id}@${c.caja.x},${c.caja.y}`);
    expect(fuera(abierta)).toEqual(fuera(cerrada));
    expect(abierta.filas[0]!.alto).toBeGreaterThan(cerrada.filas[0]!.alto);
  });
});

describe("compare — filas independientes (lo que el producto despliega y contrae)", () => {
  it("la fila de un mapa sola (`part: rows`) es su fila de la comparación entera, trasladada", () => {
    fc.assert(
      fc.property(mapas, niveles, (ms, lv) => {
        const o = { ...base, ...(lv ? { levelByBand: lv } : {}) };
        const todo = compare(ms, G, o);
        for (const m of ms) {
          const sola = compare([m], G, { ...o, part: "rows" });
          const fila = todo.filas.find((f) => f.banda === m.sujeto_id)!;
          const mover = (c: CajaPropia, dy: number) =>
            `${c.id}@${c.caja.x},${c.caja.y + dy},${c.caja.w},${c.caja.h}`;
          expect(sola.cajas.map((c) => mover(c, fila.y))).toEqual(
            todo.cajas
              .filter((c) => c.id.startsWith(`${m.sujeto_id}/`))
              .map((c) => mover(c, 0)),
          );
          expect(sola.filas[0]!.alto).toBe(fila.alto);
          expect(sola.columnas).toEqual(todo.columnas);
        }
      }),
      OPC,
    );
  });
  it("cabecera sola y filas solas: la cabecera no trae filas, las filas no traen cabecera", () => {
    const cab = compare(LADO, G, { ...base, part: "header" });
    const filas = compare(LADO, G, { ...base, part: "rows" });
    expect(cab.filas).toEqual([]);
    expect(cab.cajas).toEqual([]);
    expect(filas.filas[0]!.y).toBe(0);
    expect(toSVG(filas, { language: "es" })).not.toContain(
      'role="group" aria-label="Fuentes',
    );
  });
  it("las dos variantes de una fila conviven en una página: espacios de nombres distintos (D8)", () => {
    const n1 = toSVG(
      compare(LADO.slice(0, 1), G, { ...base, levelByBand: {}, part: "rows" }),
      { language: "es" },
    );
    const n2 = toSVG(
      compare(LADO.slice(0, 1), G, {
        ...base,
        levelByBand: TODAS_EN_2,
        part: "rows",
      }),
      { language: "es" },
    );
    const ids = (s: string) =>
      [...s.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
    expect(ids(n1).filter((i) => ids(n2).includes(i))).toEqual([]);
  });
});

describe("compare — N del consumidor, prefijos y errores", () => {
  it("n y page paginan sobre el orden por sujeto_id; sin n, todos", () => {
    const orden = [...LADO].map((m) => m.sujeto_id).sort();
    expect(
      compare(LADO, G, { ...base, n: 3 }).filas.map((f) => f.banda),
    ).toEqual(orden.slice(0, 3));
    expect(
      compare(LADO, G, { ...base, n: 3, page: 2 }).filas.map((f) => f.banda),
    ).toEqual(orden.slice(3));
    expect(compare(LADO, G, base).filas.map((f) => f.banda)).toEqual(orden);
    expect(() => compare(LADO, G, { ...base, n: 3, page: 3 })).toThrow(
      /la página 3 no existe \(hay 2\)/,
    );
    expect(() => compare(LADO, G, { ...base, n: 0 })).toThrow(
      /«n» es un entero mayor que 0/,
    );
  });
  it("los ids de cada fila llevan el prefijo de su mapa y no se repiten en el SVG (D12)", () => {
    const svg = toSVG(compare(LADO, G, { ...base, levelByBand: TODAS_EN_2 }), {
      language: "es",
    });
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of LADO) expect(svg).toContain(`data-mapa="${m.sujeto_id}"`);
  });
  it("comparar mapas de gramáticas distintas es un error (§ 4.4)", () => {
    const otro = EJEMPLOS.find((m) => m.gramatica_id !== "plataformas-datos")!;
    expect(() => compare([LADO[0]!, otro], G, base)).toThrow(
      /es de la gramática/,
    );
  });
  it("levelByBand con una banda que no existe, y marcas sin dos mapas, se dicen", () => {
    expect(() =>
      compare(LADO, G, { ...base, levelByBand: { inventada: 2 } }),
    ).toThrow(/«inventada» no es una banda/);
    expect(() =>
      compare(LADO, G, { ...base, marks: diff(ANTES, DESPUES) }),
    ).toThrow(/exactamente dos mapas/);
  });
  it("la geometría es la misma en los dos idiomas: mismas cajas, rectángulos y trazos; cambian solo los textos", () => {
    const geo = compare(LADO, G, { ...base, levelByBand: TODAS_EN_2 });
    const forma = (s: string) => [...s.matchAll(/<(rect|path|use)( [^>]*)\/>/g)].map((x) => x[0].replace(/ (id|href)="[^"]*"/g, ""));
    expect(forma(toSVG(geo, { language: "en" }))).toEqual(forma(toSVG(geo, { language: "es" })));
  });
});

describe("compare — marcas de diferencia (§ 4.7)", () => {
  const marks = diff(ANTES, DESPUES);
  it("las cuatro clases caen donde deben: retirado en la fila anterior; nuevo, renombrado y madurez en la nueva", () => {
    const geo = compare([ANTES, DESPUES], G, {
      ...base,
      marks,
      levelByBand: TODAS_EN_2,
    });
    const marcas = geo.rotulos
      .filter((r) => r.id.includes("marca "))
      .map((r) => r.id)
      .sort();
    expect(marcas).toEqual([
      "plataforma-ejemplo-v0-1-0/marca retirado cuadernos",
      "plataforma-ejemplo-v0-2-0/marca madurez agente-datos",
      "plataforma-ejemplo-v0-2-0/marca nuevo busqueda-vectorial",
      "plataforma-ejemplo-v0-2-0/marca renombrado conector-relacional",
    ]);
  });
  it("en bloques, una píldora por clase presente en el bloque (no se colapsan)", () => {
    const geo = compare([ANTES, DESPUES], G, { ...base, marks });
    const agentes = geo.rotulos
      .filter((r) => r.dueno === "plataforma-ejemplo-v0-2-0/agentes")
      .map((r) => r.id);
    expect(agentes).toEqual([
      "plataforma-ejemplo-v0-2-0/marca nuevo agentes",
      "plataforma-ejemplo-v0-2-0/marca madurez agentes",
    ]);
  });
  it("las píldoras no salen de su tarjeta ni pisan otra, y su palabra está en el nombre accesible (G7)", () => {
    for (const lv of [undefined, TODAS_EN_2]) {
      const geo = compare([ANTES, DESPUES], G, {
        ...base,
        marks,
        ...(lv ? { levelByBand: lv } : {}),
      });
      expect(geo.avisos).toEqual([]);
      for (const r of geo.rotulos.filter((x) => x.id.includes("marca "))) {
        const caja = geo.cajas.find((c) => c.id === r.dueno)!;
        expect(r.caja.x, r.id).toBeGreaterThanOrEqual(caja.caja.x);
        expect(r.caja.x + r.caja.w, r.id).toBeLessThanOrEqual(
          caja.caja.x + caja.caja.w,
        );
      }
    }
    const svg = toSVG(compare([ANTES, DESPUES], G, { ...base, marks }), {
      language: "es",
    });
    expect(svg).toMatch(/aria-label="Agentes: [^"]*nuevo, madurez\."/);
  });
});

describe("compare — matriz de envejecimiento (§ 5.6): cuatro edades, 0 avisos", () => {
  const edades = [
    ...new Set(
      [...LADO, ANTES, DESPUES].flatMap((m: Mapa) => agingDates(m, G)),
    ),
  ].sort();
  const vistas: [string, (fecha: string) => Geometria][] = [
    ["bloques", (f) => compare(LADO, G, { texts: TEXTOS, queryDate: f })],
    [
      "contraído",
      (f) => compare(LADO, G, { texts: TEXTOS, queryDate: f, levelByBand: {} }),
    ],
    [
      "desplegado",
      (f) =>
        compare(LADO, G, {
          texts: TEXTOS,
          queryDate: f,
          levelByBand: TODAS_EN_2,
        }),
    ],
    [
      "diferencias",
      (f) =>
        compare([ANTES, DESPUES], G, {
          texts: TEXTOS,
          queryDate: f,
          marks: diff(ANTES, DESPUES),
        }),
    ],
    [
      "diferencias desplegadas",
      (f) =>
        compare([ANTES, DESPUES], G, {
          texts: TEXTOS,
          queryDate: f,
          marks: diff(ANTES, DESPUES),
          levelByBand: TODAS_EN_2,
        }),
    ],
  ];
  it("son cuatro edades por mapa (hoy, umbral 1, umbral 2, +100 días)", () => {
    expect(edades.length).toBeGreaterThanOrEqual(4);
  });
  for (const [nombre, f] of vistas)
    it(nombre, () => {
      const problemas = edades.flatMap((fecha) =>
        f(fecha).avisos.map((a) => `${fecha} · ${a.mensaje}`),
      );
      expect(problemas).toEqual([]);
    });
});

describe("diffToText — la lista explicativa de las diferencias (§ 4.7)", () => {
  const texto = (html: string) => [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) => m[1]!.replace(/<svg.*?<\/svg>/g, "").replace(/<br>/g, " · ").replace(/<[^>]+>/g, ""));
  it("una línea por componente, por clase (nuevo, renombrado, madurez, retirado), con su palabra, su banda y qué cambió", () => {
    expect(texto(diffToText(ANTES, DESPUES, G, { language: "es", texts: TEXTOS }))).toEqual([
      "nuevoBúsqueda vectorial Inteligencia artificial · Nuevo componente en Inteligencia artificial, vista previa pública.",
      "renombradoConector de bases relacionales Ingesta · Antes «Conector JDBC». Mismo componente.",
      "madurezAgente de preguntas sobre datos Inteligencia artificial · Madurez: de vista previa pública a disponible de forma general.",
      "retiradoCuadernos interactivos Procesamiento y transformación · Retirado del mapa.",
    ]);
    expect(texto(diffToText(ANTES, DESPUES, G, { language: "en", texts: TEXTOS }))[1]).toBe("renamedRelational database connector Ingestion · Formerly “JDBC connector”. Same component.");
  });
  it("cada línea lleva el glifo dibujado de su clase (G7: nunca solo el color)", () => {
    const html = diffToText(ANTES, DESPUES, G, { language: "es", texts: TEXTOS });
    expect([...html.matchAll(/<li class="dg-dif-item dg-dif-(\w+)"[^>]*><span class="dg-dif-palabra"><svg[^>]*><path d="([^"]+)"/g)].map((m) => m[1])).toEqual(["nuevo", "renombrado", "madurez", "retirado"]);
  });
  it("sin cambios lo dice; con cambios solo en flujos o pasos, cuántos", () => {
    expect(diffToText(ANTES, ANTES, G, { language: "es", texts: TEXTOS })).toContain(">Sin diferencias entre las dos versiones.<");
    const otro = structuredClone(ANTES);
    otro.flujos = otro.flujos.slice(1);
    expect(diffToText(ANTES, otro, G, { language: "es", texts: TEXTOS })).toContain(">Además, 1 cambio en flujos o pasos.<");
  });
  it("un idioma que la gramática no declara da un error claro (F-025)", () => {
    expect(() => diffToText(ANTES, DESPUES, G, { language: "fr", texts: TEXTOS })).toThrow(/diffToText: la gramática no declara el idioma «fr»/);
  });
});

