// @vitest-environment node
// El lado a lado en la app (`/[idioma]/comparar`). (1) El estado de la URL: la regla de `estadoDeConsulta` y la del
// script en línea que corre antes de pintar son LA MISMA (se ejecuta el script y se comparan, consulta por
// consulta); la consulta que escribe el componente vuelve a dar el mismo estado. (2) La vista: una fila por
// plataforma en orden de id, todo lo que se toca abre algo, el teléfono agrupa como el motor dibujó, N plataformas
// sin número cableado, y reordenar las plataformas en el dato no cambia un byte.
import { runInNewContext } from "node:vm";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ATRIBUTO_ELEGIDAS, ATRIBUTO_VISIBLES, completar, consultaDe, estadoDeConsulta, POR_PAGINA, scriptLado, tituloLado, vistaLado } from "@/lib/atlas";
import { cargarDatos, type Datos } from "@/lib/datos";
import { IDIOMAS, textos } from "@/lib/i18n";

const FC = { seed: 20261002, numRuns: 200 };
const FECHA = "2026-09-26";

/** Corre el script en línea con una consulta y devuelve los dos atributos que puso en el `<html>`. */
function correrScript(ids: string[], porPagina: number, consulta: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  runInNewContext(scriptLado(ids, porPagina), {
    URLSearchParams,
    location: { search: consulta },
    document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
  });
  return attrs;
}

describe("estado del lado a lado en la URL", () => {
  const ids = ["databricks", "fabric", "plataforma-ejemplo", "snowflake"];
  it.each([
    ["", ["databricks", "fabric", "plataforma-ejemplo", "snowflake"], 1, ["databricks", "fabric", "plataforma-ejemplo"]],
    ["?pagina=2", ["databricks", "fabric", "plataforma-ejemplo", "snowflake"], 2, ["snowflake"]],
    ["?plataformas=snowflake,fabric", ["fabric", "snowflake"], 1, ["fabric", "snowflake"]],
    ["?plataformas=fabric,snowflake&pagina=2", ["fabric", "snowflake"], 1, ["fabric", "snowflake"]],
    ["?plataformas=otra,,fabric,fabric", ["fabric"], 1, ["fabric"]],
    ["?plataformas=", ["databricks", "fabric", "plataforma-ejemplo", "snowflake"], 1, ["databricks", "fabric", "plataforma-ejemplo"]],
    ["?pagina=9", ["databricks", "fabric", "plataforma-ejemplo", "snowflake"], 1, ["databricks", "fabric", "plataforma-ejemplo"]],
    ["?pagina=2x", ["databricks", "fabric", "plataforma-ejemplo", "snowflake"], 1, ["databricks", "fabric", "plataforma-ejemplo"]],
  ])("«%s» → elegidas %j, página %d, se ven %j", (consulta, elegidas, pagina, visibles) => {
    expect(estadoDeConsulta(consulta, ids, 3)).toEqual({ elegidas, pagina, paginas: Math.ceil(elegidas.length / 3), visibles });
  });

  it("la URL limpia es la de siempre: todas y la página 1 no escriben consulta", () => {
    expect(consultaDe({ elegidas: ids, pagina: 1 }, ids)).toBe("");
    expect(consultaDe({ elegidas: ["fabric", "snowflake"], pagina: 1 }, ids)).toBe("?plataformas=fabric,snowflake");
    expect(consultaDe({ elegidas: ids, pagina: 2 }, ids)).toBe("?pagina=2");
  });

  const arbIds = fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/), { minLength: 1, maxLength: 9 }).map((xs) => [...xs].sort());
  it("ida y vuelta: la consulta de un estado vuelve a dar el mismo estado (propiedad)", () => {
    fc.assert(
      fc.property(arbIds, fc.integer({ min: 1, max: 4 }), fc.integer({ min: 0, max: 5 }), fc.array(fc.nat(), { maxLength: 9 }), (xs, n, pagina, elegir) => {
        const estado = completar({ elegidas: elegir.map((k) => xs[k % xs.length]!), pagina }, xs, n);
        expect(estadoDeConsulta(consultaDe(estado, xs), xs, n)).toEqual(estado);
      }),
      FC,
    );
  });

  it("el script previo al pintado aplica la misma regla que el componente (propiedad, consultas al azar)", () => {
    const pieza = (xs: string[]) => fc.oneof(fc.constantFrom(...xs), fc.constantFrom("", "x", "FABRIC", "a b"));
    fc.assert(
      fc.property(
        arbIds.chain((xs) =>
          fc.tuple(
            fc.constant(xs),
            fc.integer({ min: 1, max: 4 }),
            fc.option(fc.array(pieza(xs), { maxLength: 6 }).map((ps) => ps.join(","))),
            fc.option(fc.oneof(fc.integer({ min: -1, max: 6 }).map(String), fc.constantFrom("", "2x", "1.5", "007"))),
          ),
        ),
        ([xs, n, lista, pagina]) => {
          const q = new URLSearchParams();
          if (lista !== null) q.set("plataformas", lista);
          if (pagina !== null) q.set("pagina", pagina);
          const consulta = q.toString() ? `?${q}` : "";
          const e = estadoDeConsulta(consulta, xs, n);
          expect(correrScript(xs, n, consulta)).toEqual({ [ATRIBUTO_VISIBLES]: e.visibles.join(" "), [ATRIBUTO_ELEGIDAS]: e.elegidas.join(" ") });
        },
      ),
      FC,
    );
  });

  it("tres a la vez es la constante declarada de la vista, no del motor", () => {
    expect(POR_PAGINA).toBe(3);
    expect(scriptLado(["a", "b"], POR_PAGINA)).toContain(",n=3,");
  });
});

/** Las mismas plataformas y atlas, en otro orden de llegada. */
function alReves(d: Datos): Datos {
  return { ...d, plataformas: [...d.plataformas].reverse(), atlas: new Map([...d.atlas].reverse()) };
}

/** Una plataforma más, con el mapa de la de ejemplo bajo otro id: N por diseño. */
function conOtra(d: Datos, id: string): Datos {
  const base = d.atlas.get("plataforma-ejemplo")!;
  const plataforma = { ...base.plataforma, id, nombre: { es: `Otra ${id}`, en: `Other ${id}` } };
  return {
    ...d,
    plataformas: [...d.plataformas, plataforma],
    atlas: new Map([...d.atlas, [id, { ...base, plataforma, mapa: { ...base.mapa, sujeto_id: id, sujeto_nombre: plataforma.nombre } }]]),
  };
}

/**
 * La de ejemplo con dos bloques en una misma banda: el primero de sus bloques con más de un componente cede uno a un
 * bloque nuevo cuyo id va antes. Con los datos de hoy cada banda trae un solo bloque y el orden dentro de una banda
 * no se podía medir (la mutación «al revés dentro de la banda» pasaba en verde).
 */
function conDosBloques(d: Datos): Datos {
  const a = d.atlas.get("plataforma-ejemplo")!;
  const bloque = a.mapa.bloques.find((b) => a.mapa.nodos.filter((n) => n.bloque_id === b.id).length > 1)!;
  const movido = a.mapa.nodos.find((n) => n.bloque_id === bloque.id)!;
  const nuevo = { ...bloque, id: `0-${bloque.id}`, nombre: { es: "Bloque nuevo", en: "New block" } };
  const mapa = { ...a.mapa, bloques: [...a.mapa.bloques, nuevo], nodos: a.mapa.nodos.map((n) => (n === movido ? { ...n, bloque_id: nuevo.id } : n)) };
  return { ...d, atlas: new Map([...d.atlas, ["plataforma-ejemplo", { ...a, mapa }]]) };
}

/**
 * Y un bloque con componentes de dos tipos: su glifo es el de su primer componente (§ 4.1). Con los datos de hoy cada
 * bloque es de un solo tipo y «el glifo de otro componente» pasaba en verde.
 */
function conTiposMezclados(d: Datos): Datos {
  const a = d.atlas.get("plataforma-ejemplo")!;
  const orden = (n: (typeof a.mapa.nodos)[number]) => [n.orden ?? Number.MAX_SAFE_INTEGER, n.id] as const;
  const bloque = a.mapa.bloques.find((b) => a.mapa.nodos.filter((n) => n.bloque_id === b.id).length > 1)!;
  const ultimo = a.mapa.nodos
    .filter((n) => n.bloque_id === bloque.id)
    .sort((x, y) => orden(x)[0] - orden(y)[0] || (orden(x)[1] < orden(y)[1] ? -1 : 1))
    .at(-1)!;
  const otro = a.gramatica.tipos_de_nodo.find((t) => t.id !== ultimo.tipo_id && t.glifo)!;
  const mapa = { ...a.mapa, nodos: a.mapa.nodos.map((n) => (n === ultimo ? { ...n, tipo_id: otro.id } : n)) };
  return { ...d, atlas: new Map([...d.atlas, ["plataforma-ejemplo", { ...a, mapa }]]) };
}

const activables = (svg: string) => [...svg.matchAll(/<g [^>]*class="dg-elem[^"]*"[^>]*data-dueno="([^"]+)"/g)].map((m) => m[1]!);

describe("vista del lado a lado", () => {
  const d = cargarDatos();

  it.each(IDIOMAS)("en %s: una fila por plataforma en orden de id; las que no tienen mapa, «próximamente» con su investigador", (idioma) => {
    const v = vistaLado(d, idioma, FECHA);
    expect(v.ids).toEqual([...d.plataformas.map((p) => p.id)].sort());
    expect(v.filas.map((f) => f.id)).toEqual(v.ids);
    for (const f of v.filas) {
      const publicada = d.atlas.has(f.id);
      expect(Boolean(f.n1 && f.n2), f.id).toBe(publicada);
      expect(f.investigador).toBe(`/${idioma}/investigador/${f.id}`);
      if (publicada) {
        expect(f.n1).toContain('data-vista="compare"');
        expect(f.n1).toContain(`aria-details="lectura-texto-${f.id}"`);
        expect(v.lectura).toContain(`id="lectura-texto-${f.id}"`);
        expect(f.n2!.match(/dg-lado-nodo/g)!.length).toBe(d.atlas.get(f.id)!.mapa.nodos.length);
      }
    }
    expect(v.cabecera).toContain('aria-details="lectura-texto"');
    expect(v.lectura).toMatch(/^<div id="lectura-texto">/);
    expect(v.columnas).toHaveLength(d.atlas.values().next().value!.gramatica.bandas.length);
  });

  it.each(IDIOMAS)("en %s: todo lo que se toca abre algo, y nada sobra (bloques → ventana, componentes → ficha)", (idioma) => {
    const v = vistaLado(d, idioma, FECHA);
    const tocables = new Set(v.filas.flatMap((f) => [f.n1 ?? "", f.n2 ?? ""]).flatMap(activables));
    expect(Object.keys(v.fichas).sort()).toEqual([...tocables].sort());
    for (const id of tocables) expect(v.titulos[id], id).toBe(id.includes("/") && v.fichas[id]!.includes('data-vista="bloque"') ? textos(idioma).atlas.ventana.titulo : textos(idioma).atlas.ficha.titulo);
    // La ventana de un bloque dice su banda y su plataforma (en el lado a lado no se ven alrededor).
    const ventana = Object.entries(v.fichas).find(([, h]) => h.includes('data-vista="bloque"'))![1];
    expect(ventana).toMatch(/^<p class="dg-ficha-tipo"><span class="dg-ficha-cod">\d\d<\/span>[^<]+ · [^<]+<\/p><h2>/);
  });

  it("los ids del dibujo no chocan: cabecera y las dos variantes de cada fila conviven en la página", () => {
    for (const idioma of IDIOMAS) {
      const v = vistaLado(d, idioma, FECHA);
      const ids = [v.cabecera, ...v.filas.flatMap((f) => [f.n1 ?? "", f.n2 ?? ""])].flatMap((h) => [...h.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!));
      expect(ids.length).toBe(new Set(ids).size);
    }
  });

  it("el teléfono agrupa como el motor dibujó: mismos bloques por banda, en el mismo orden, con los mismos componentes", () => {
    const v = vistaLado(conTiposMezclados(conDosBloques(d)), "es", FECHA);
    expect(v.angosto.some((b) => b.celdas.some((c) => c.elementos.length > 1))).toBe(true);
    for (const f of v.filas.filter((x) => x.n1)) {
      const dibujados = [...f.n1!.matchAll(/<g [^>]*class="dg-elem dg-lado-bloque[^"]*"[^>]*data-dueno="([^"]+)" data-nodos="([^"]*)"/g)].map((m) => ({ id: m[1]!, nodos: m[2]!.split(" ").filter(Boolean) }));
      const telefono = v.angosto.flatMap((b) => b.celdas.find((c) => c.plataforma === f.id)!.elementos);
      expect(telefono.map((e) => e.id)).toEqual(dibujados.map((x) => x.id));
      telefono.forEach((e, i) => expect([...e.tarjetas.matchAll(/data-nodo="([^"]+)"/g)].map((m) => m[1]).sort(), e.id).toEqual([...dibujados[i]!.nodos].sort()));
      // El glifo del resumen es el del tipo que el motor dibujó en el bloque compacto (mismo color de tipo).
      const colores = [...f.n1!.matchAll(/<g [^>]*class="dg-elem dg-lado-bloque[^"]*"[^>]*>(?:(?!<g [^>]*class="dg-elem)[\s\S])*?<use [^>]*class="(dg-c-[^"]+)"/g)].map((m) => m[1]);
      expect(telefono.filter((e) => e.glifo).map((e) => /class="(dg-c-[^"]+)"/.exec(e.glifo)![1])).toEqual(colores);
    }
    for (const b of v.angosto) expect(b.celdas.filter((c) => c.pronto).map((c) => c.plataforma)).toEqual(v.filas.filter((x) => !x.n1).map((x) => x.id));
  });

  it("CSS generado: una regla por plataforma en cada estado; las filas miden lo que el dibujo", () => {
    const v = vistaLado(d, "es", FECHA);
    for (const id of v.ids) {
      expect(v.css).toContain(`:root[${ATRIBUTO_VISIBLES}~="${id}"] .lado-fila[data-fila="${id}"]{display:block}`);
      expect(v.css).toContain(`:root[${ATRIBUTO_ELEGIDAS}~="${id}"] .lado-pl[data-pl="${id}"]{display:grid}`);
    }
    expect(v.css).toMatch(/\.lado-filas\{width:1496px\}/);
    expect(v.css).toMatch(/\.lado-filas::before\{left:\d+(\.\d)?px\}/);
  });

  it("N plataformas: una quinta entra sola, en su lugar por id, sin tocar código", () => {
    const v = vistaLado(conOtra(d, "ocelote"), "es", FECHA);
    expect(v.ids).toEqual([...d.plataformas.map((p) => p.id), "ocelote"].sort());
    expect(v.filas.find((f) => f.id === "ocelote")!.n1).toContain('data-mapa="ocelote"');
    expect(v.script).toContain('"ocelote"');
    expect(tituloLado("es", v.ids.length)).toBe("Cinco plataformas, el mismo mapa");
  });

  it("neutralidad: reordenar las plataformas en el dato no cambia un byte", () => {
    const una = vistaLado(conOtra(d, "ocelote"), "en", FECHA);
    expect(JSON.stringify(vistaLado(alReves(conOtra(d, "ocelote")), "en", FECHA))).toBe(JSON.stringify(una));
  });

  it("el título dice cuántas en palabras, y en cifras si la lista no llega", () => {
    expect(tituloLado("es", 1)).toBe("Una plataforma, el mismo mapa");
    expect(tituloLado("en", 4)).toBe("Four platforms, the same map");
    expect(tituloLado("es", 12)).toBe("12 plataformas, el mismo mapa");
  });
});
