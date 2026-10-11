// @vitest-environment node
// Lo que la 0.5.0 y la 0.6.0 del contrato le piden al motor (S3, fase 0): `papel`, `condicion` en tres formas con V17,
// `fuente codigo`, el glifo `hexagono`, la tabla de métricas por fuente (`fuente_metricas`), los plurales por la regla
// del idioma y el `diff` de bloques (F-030). Ningún artefacto del contrato usa `papel`, `funcion`, `por_defecto` ni
// `codigo`: estas pruebas los ejercitan sobre copias de los ejemplos.
import { describe, expect, it } from "vitest";
import { METRICAS_PILOTO, diff, diffToText, layout, toCard, toSVG, toText, validate, type Gramatica, type Mapa, type TablaMetricas } from "../src/index";
import { plural } from "../src/layout/contexto";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- documentos rotos a propósito (regla 1: un solo alias)
type Json = any;
const FECHA = "2026-10-04";
const AGENTE = EJEMPLOS.find((m) => m.sujeto_id === "agente-ejemplo")!;
const PLATAFORMA = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const gDe = (m: Mapa): Gramatica => GRAMATICAS[m.gramatica_id]!;
const copia = (m: Mapa, f: (x: Json) => void): Json => {
  const c = structuredClone(m) as Json;
  f(c);
  return c;
};
const errores = (m: Json) => validate(m, gDe(m), { mode: "privado" }).errores;

describe("formas nuevas del esquema (0.5.0)", () => {
  it("`papel` inicio y fin se aceptan; otro valor es V3 del nodo, una sola entrada", () => {
    expect(errores(copia(AGENTE, (m) => ((m.nodos[0].papel = "inicio"), (m.nodos[6].papel = "fin"))))).toEqual([]);
    const e = errores(copia(AGENTE, (m) => (m.nodos[0].papel = "medio")));
    expect(e.map((x) => `${x.regla} · ${x.id}`)).toEqual([`V3 · ${AGENTE.nodos[0]!.id}`]);
  });

  it("una fuente de código con ruta y líneas se acepta; con URL se rechaza en una sola entrada", () => {
    const codigo = { ruta: "agentes/coordinador.py", lineas: "12-40", titulo: { es: "Coordinador", en: "Coordinator" }, fecha: FECHA, tipo: "codigo" };
    expect(errores(copia(AGENTE, (m) => m.nodos[1].fuentes.push(codigo)))).toEqual([]);
    expect(errores(copia(AGENTE, (m) => m.nodos[1].fuentes.push({ ...codigo, lineas: undefined })))).toEqual([]);
    const e = errores(copia(AGENTE, (m) => m.nodos[1].fuentes.push({ ...codigo, url: "https://example.org/x" })));
    expect(e).toHaveLength(1);
    expect(e[0]!.regla).toBe("V3");
  });

  it("una fuente sin título da UNA entrada (la forma más cercana), no una por forma", () => {
    const e = errores(copia(PLATAFORMA, (m) => delete m.nodos[0].fuentes[0].titulo));
    expect(e.map((x) => x.mensaje)).toEqual(["falta el campo «titulo»"]);
  });

  it("condición: función nombrada y rama por defecto se aceptan; una tripleta incompleta es V13, una sola entrada", () => {
    const funcion = copia(AGENTE, (m) => (m.flujos.find((f: Json) => f.id === "f2").condicion = { funcion: "texas_y_no_aprobar", entradas: ["complejidad", "region"] }));
    expect(errores(funcion)).toEqual([]);
    const defecto = copia(AGENTE, (m) => (m.flujos.find((f: Json) => f.id === "f3").condicion = { por_defecto: true }));
    expect(errores(defecto)).toEqual([]);
    const incompleta = errores(copia(AGENTE, (m) => delete m.flujos.find((f: Json) => f.id === "f2").condicion.valor));
    expect(incompleta.map((x) => `${x.regla} · ${x.id} · ${x.mensaje}`)).toEqual(["V13 · f2 · falta el campo «valor»"]);
  });

  it("V17: dos ramas por defecto desde el mismo origen → V17 en la segunda", () => {
    const m = copia(AGENTE, (x) => {
      x.flujos.find((f: Json) => f.id === "f2").condicion = { por_defecto: true };
      x.flujos.find((f: Json) => f.id === "f3").condicion = { por_defecto: true };
    });
    expect(errores(m).map((x) => `${x.regla} · ${x.id}`)).toEqual(["V17 · f3"]);
  });
});

describe("cómo se dibujan y se leen (0.5.0)", () => {
  const conPapel = copia(AGENTE, (m) => ((m.nodos[0].papel = "inicio"), (m.nodos[6].papel = "fin"))) as Mapa;

  it("`papel`: el marcador junto a la tarjeta, su definición solo donde se usa, y su palabra en el nombre y en la lectura", () => {
    const geo = layout(conPapel, gDe(conPapel), "nivel2", { texts: TEXTOS, queryDate: FECHA });
    const svg = toSVG(geo, { language: "es" });
    expect(svg).toContain('-p-inicio"');
    expect(svg).toContain('-p-fin"');
    expect(svg).toMatch(/aria-label="Recepción[^"]*inicio\./);
    expect(toSVG(layout(AGENTE, gDe(AGENTE), "nivel2", { texts: TEXTOS, queryDate: FECHA }), { language: "es" })).not.toContain("-p-inicio");
    const texto = toText(conPapel, gDe(conPapel), { language: "en", texts: TEXTOS });
    expect(texto).toContain(" · start.");
    expect(texto).toContain(" · end.");
  });

  it("sin los textos `papel`, un mapa que lo usa da un error claro", () => {
    const sinPapel = Object.fromEntries(Object.entries(TEXTOS).map(([l, t]) => [l, { ...t, papel: undefined }]));
    expect(() => toText(conPapel, gDe(conPapel), { language: "es", texts: sinPapel })).toThrow(/faltan los textos `papel`/);
  });

  it("la condición se lee junto a su flujo, en sus tres formas", () => {
    const m = copia(AGENTE, (x) => {
      x.flujos.find((f: Json) => f.id === "f2").condicion = { funcion: "texas_y_no_aprobar", entradas: ["complejidad", "region"] };
      x.flujos.find((f: Json) => f.id === "f3").condicion = { por_defecto: true };
    }) as Mapa;
    const es = toText(m, gDe(m), { language: "es", texts: TEXTOS });
    expect(es).toContain("(si texas_y_no_aprobar(complejidad, region))");
    expect(es).toContain("(si no)");
    expect(es).toContain("(si cifras-sin-fuente &gt; 0)");
    expect(toText(m, gDe(m), { language: "en", texts: TEXTOS })).toContain("(otherwise)");
  });

  it("una fuente de código se escribe `ruta:lineas`, nunca como enlace", () => {
    const m = copia(AGENTE, (x) => x.nodos[1].fuentes.push({ ruta: "agentes/coordinador.py", lineas: "12-40", titulo: { es: "Coordinador", en: "Coordinator" }, fecha: FECHA, tipo: "codigo" })) as Mapa;
    const html = toCard(m, gDe(m), m.nodos[1]!.id, { language: "es", texts: TEXTOS });
    expect(html).toContain(">agentes/coordinador.py:12-40<");
    expect(html).not.toContain('href="agentes/');
    expect(html).toContain("código");
  });

  it("`hexagono`: lo usa `regla` de la gramática de agentes; su definición va solo en los SVG que lo usan", () => {
    expect(gDe(AGENTE).tipos_de_nodo.find((t) => t.id === "regla")!.glifo).toBe("hexagono");
    const agente = toSVG(layout(AGENTE, gDe(AGENTE), "nivel2", { texts: TEXTOS, queryDate: FECHA }), { language: "es" });
    expect(agente).toContain('-g-hexagono" d="M0,-8 L6.9,-4 L6.9,4 L0,8 L-6.9,4 L-6.9,-4 Z"');
    const plataforma = toSVG(layout(PLATAFORMA, gDe(PLATAFORMA), "nivel2", { texts: TEXTOS, queryDate: FECHA }), { language: "es" });
    expect(plataforma).not.toContain("g-hexagono");
  });
});

describe("tabla de métricas por fuente (G15, 0.5.0)", () => {
  // Una segunda tabla de fixture (Inter no entra al paquete: el lock se queda en 57): la de Space Grotesk con cada
  // avance un 20 % más ancho, bajo otro nombre.
  const otra: TablaMetricas = (() => {
    const sg = METRICAS_PILOTO.fuentes["space-grotesk"]!;
    const pesos = Object.fromEntries(Object.entries(sg.pesos).map(([p, av]) => [p, Object.fromEntries(Object.entries(av).map(([c, a]) => [c, Math.ceil((a * 12) / 10)]))]));
    return { fuentes: { "fuente-ancha": { ...sg, pesos }, "jetbrains-mono": METRICAS_PILOTO.fuentes["jetbrains-mono"]! } };
  })();

  it("la geometría es determinista POR tabla y cambia con la tabla", () => {
    const a = layout(PLATAFORMA, gDe(PLATAFORMA), "nivel2", { texts: TEXTOS, queryDate: FECHA, fuente_metricas: otra, fuente: "fuente-ancha" });
    const b = layout(PLATAFORMA, gDe(PLATAFORMA), "nivel2", { texts: TEXTOS, queryDate: FECHA, fuente_metricas: otra, fuente: "fuente-ancha" });
    const piloto = layout(PLATAFORMA, gDe(PLATAFORMA), "nivel2", { texts: TEXTOS, queryDate: FECHA });
    expect(toSVG(a, { language: "es" })).toBe(toSVG(b, { language: "es" }));
    expect(toSVG(a, { language: "es" })).not.toBe(toSVG(piloto, { language: "es" }));
  });

  it("una fuente que la tabla no trae es un error que dice cuáles trae", () => {
    expect(() => layout(PLATAFORMA, gDe(PLATAFORMA), "nivel2", { texts: TEXTOS, queryDate: FECHA, fuente_metricas: otra })).toThrow(/trae: fuente-ancha, jetbrains-mono/);
  });
});

describe("plurales por la regla del idioma (§ 8, 0.6.0)", () => {
  const formas = { one: "{n} fuente", other: "{n} fuentes" };
  it("español e inglés: `one` solo para 1; francés y portugués: también para 0", () => {
    expect([0, 1, 2].map((n) => plural(formas, n, "es"))).toEqual(["0 fuentes", "1 fuente", "2 fuentes"]);
    expect([0, 1, 2].map((n) => plural(formas, n, "en"))).toEqual(["0 fuentes", "1 fuente", "2 fuentes"]);
    expect(plural(formas, 0, "fr")).toBe("0 fuente");
    expect(plural(formas, 0, "pt")).toBe("0 fuente");
  });
  it("un idioma sin regla es un error claro", () => {
    expect(() => plural(formas, 2, "xx")).toThrow(/no hay regla de plural para el idioma «xx»/);
  });
});

describe("diff de bloques (0.6.0, F-030)", () => {
  const antes = PLATAFORMA;
  const despues = copia(PLATAFORMA, (m) => {
    m.bloques.find((b: Json) => b.id === "consumo-bi").nombre = { es: "Tableros y aplicaciones", en: "Dashboards and apps" };
    m.bloques = m.bloques.filter((b: Json) => b.id !== "agentes");
    m.nodos.forEach((n: Json) => n.bloque_id === "agentes" && delete n.bloque_id);
    m.bloques.push({ id: "nuevo-bloque", nombre: { es: "Bloque nuevo", en: "New block" }, banda_id: "gobierno", lider: { es: "Un bloque nuevo.", en: "A new block." } });
  }) as Mapa;

  it("compara bloques por id, con su nombre", () => {
    const d = diff(antes, despues);
    expect(d.bloques.renombrados.map((r) => [r.id, r.antes.es, r.ahora.es])).toEqual([["consumo-bi", "Tableros", "Tableros y aplicaciones"]]);
    expect(d.bloques.retirados).toEqual(["agentes"]);
    expect(d.bloques.nuevos).toEqual(["nuevo-bloque"]);
    expect(diff(antes, antes).bloques).toEqual({ nuevos: [], retirados: [], renombrados: [] });
  });

  it("diffToText dice cada bloque con su glifo y su palabra, en los dos idiomas", () => {
    const es = diffToText(antes, despues, gDe(antes), { language: "es", texts: TEXTOS });
    expect(es).toContain('data-bloque="consumo-bi"');
    expect(es).toContain("Bloque; antes «Tableros».");
    expect(es).toContain('data-bloque="agentes"');
    expect(es).toContain('data-bloque="nuevo-bloque"');
    expect(diffToText(antes, despues, gDe(antes), { language: "en", texts: TEXTOS })).toContain("Block; formerly “Dashboards”.");
  });

  it("sin los textos de bloque, unas diferencias con bloques dan un error claro", () => {
    const sin = Object.fromEntries(Object.entries(TEXTOS).map(([l, t]) => [l, { ...t, lado: { ...t.lado, detalle: { ...t.lado.detalle, bloque: undefined } } }]));
    expect(() => diffToText(antes, despues, gDe(antes), { language: "es", texts: sin })).toThrow(/lado.detalle.bloque/);
  });
});
