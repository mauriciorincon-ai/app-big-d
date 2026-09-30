// @vitest-environment node
// Vista «bloque» y `toBlockCards` (enmienda del piloto, D-S1-53): lo que hay dentro de cada elemento activable
// del nivel 1, en todos los mapas del contrato y en la carnada P1. Mismas tarjetas que el nivel 2 (la de capa o
// la ficha compacta de franja), solo los flujos de adentro, sin avisos ni cruces; y una tarjeta de texto por
// componente con TODAS sus conexiones.
import { describe, expect, it } from "vitest";
import { crossings, layout, toBlockCards, toSVG, type Mapa } from "../src/index";
import { nodosDelGrupo } from "../src/util/grupo";
import { disponer, FECHA } from "./lib/casos";
import { EJEMPLOS, GRAMATICAS, leerJson } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const P1 = leerJson<Mapa>("test/carnadas-piloto/P1-mapa-denso.mapa.json");
const MAPAS = [...EJEMPLOS, P1];
const bloque = (m: Mapa, grupo: string, fecha = FECHA) => layout(m, GRAMATICAS[m.gramatica_id]!, "bloque", { textos: TEXTOS, fechaConsulta: fecha, grupo });
const grupos = (m: Mapa) => disponer(m, "nivel-1").vigencia.elementos.map((e) => e.id);

describe("vista «bloque»: cada elemento activable del nivel 1, en todos los mapas", () => {
  for (const m of MAPAS)
    for (const grupo of grupos(m))
      it(`${m.sujeto_id} · ${grupo}`, () => {
        const G = GRAMATICAS[m.gramatica_id]!;
        const geo = bloque(m, grupo);
        const ns = nodosDelGrupo(m, G, grupo);
        const dentro = new Set(ns.map((n) => n.id));
        expect(geo.avisos).toEqual([]);
        expect(crossings(geo)).toEqual([]);
        expect(geo.cajas.map((c) => c.id)).toEqual(ns.map((n) => n.id));
        const internos = m.flujos.filter((f) => dentro.has(f.origen) && dentro.has(f.destino) && f.origen !== f.destino).map((f) => f.id).sort();
        expect(geo.trazados.map((t) => t.id).sort()).toEqual(internos);
        // La misma tarjeta que el nivel 2: la de capa (152 × 84) o la ficha compacta de franja (168 × 44).
        const franja = G.bandas.find((b) => b.id === ns[0]!.banda_id)!.clase === "transversal";
        for (const c of geo.cajas) expect([c.caja.w, c.caja.h]).toEqual(franja ? [1680, 440] : [1520, 840]);
        // Cabe en un panel de 420 px y en un teléfono sin deslizar.
        expect(geo.ancho).toBeLessThanOrEqual(2400);
      });

  it("el grupo con un flujo adentro lo dibuja (Consumo del mapa de ejemplo: modelo → tablero)", () => {
    const m = EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!;
    expect(bloque(m, "consumo-bi").trazados.map((t) => t.id)).toEqual(["f-semantico-tablero"]);
  });
  it("las tarjetas no son activables dentro del panel (sin foco ni «dg-elem»)", () => {
    const svg = toSVG(bloque(P1, "almacen"), { language: "es" });
    expect(svg).not.toContain("tabindex");
    expect(svg).not.toContain("dg-elem");
    expect(svg).toContain('data-vista="bloque"');
  });
  it("en una franja, el canal va centrado tras la ficha compacta (168 u), no tras una columna de capa", () => {
    // Tres componentes en el bloque de gobierno y un flujo que salta la fila del medio: sale por el canal.
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    const base = m.nodos.find((n) => n.id === "catalogo-central")!;
    m.nodos.push({ ...base, id: "auditoria", orden: 3, nombre: { es: "Auditoría", en: "Audit" } });
    m.flujos.push({ ...m.flujos.find((f) => f.id === "f-catalogo-limpias")!, id: "f-catalogo-auditoria", destino: "auditoria" });
    const geo = bloque(m, "gobierno");
    expect(geo.avisos).toEqual([]);
    expect(crossings(geo)).toEqual([]);
    const t = geo.trazados.find((x) => x.id === "f-catalogo-auditoria")!;
    const pista = t.puntos.find(([x], k) => k > 0 && x === t.puntos[k - 1]![0] && t.puntos[k]![1] !== t.puntos[k - 1]![1])![0];
    expect(pista).toBe(80 + 1680 + 250 - 50); // M + ficha + mitad del canal + la primera pista (−5 u)
  });
  it("A-6 (a): un flujo entre dos fichas vecinas de una franja va por el canal, no entre las cajas", () => {
    // Entre dos fichas compactas hay 8 u: la etiqueta del flujo (18 u) quedaba encima de las dos cajas.
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    m.flujos.push({ ...m.flujos.find((f) => f.id === "f-catalogo-limpias")!, id: "f-catalogo-filtros", destino: "filtros-filas" });
    const geo = bloque(m, "gobierno");
    expect(geo.avisos).toEqual([]);
    expect(crossings(geo)).toEqual([]);
  });
  it("A-6 (b): un flujo y su vuelta entre dos componentes vecinos no comparten el trazado", () => {
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    const ida = m.flujos.find((f) => f.id === "f-semantico-tablero")!;
    m.flujos.push({ ...ida, id: "f-tablero-semantico", origen: ida.destino, destino: ida.origen });
    const geo = bloque(m, "consumo-bi");
    expect(geo.avisos).toEqual([]);
    expect(crossings(geo)).toEqual([]);
    const puntos = (id: string) => new Set(geo.trazados.find((t) => t.id === id)!.puntos.map((p) => p.join(",")));
    const comunes = [...puntos("f-semantico-tablero")].filter((p) => puntos("f-tablero-semantico").has(p));
    expect(comunes).toEqual([]);
  });
  it("mismos bytes en dos corridas", () => {
    expect(toSVG(bloque(P1, "almacen"), { language: "en" })).toBe(toSVG(bloque(P1, "almacen"), { language: "en" }));
  });
  it("errores explícitos: sin grupo, un bloque o una banda que no existen", () => {
    const m = EJEMPLOS[0]!;
    const G = GRAMATICAS[m.gramatica_id]!;
    expect(() => layout(m, G, "bloque", { textos: TEXTOS, fechaConsulta: FECHA })).toThrow(/pide `grupo`/);
    expect(() => bloque(m, "no-existe")).toThrow(/no tiene el bloque «no-existe»/);
    expect(() => bloque(m, "_no-existe")).toThrow(/no tiene la banda «no-existe»/);
  });
});

describe("toBlockCards", () => {
  const m = EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!;
  const G = GRAMATICAS[m.gramatica_id]!;
  const html = (grupo: string, language = "es", fecha?: string) => toBlockCards(m, G, grupo, { language, textos: TEXTOS, fechaConsulta: fecha });

  it("una tarjeta por componente, en el orden de su banda, con TODAS sus conexiones (salen y entran)", () => {
    for (const grupo of grupos(m)) {
      const h = html(grupo);
      const ns = nodosDelGrupo(m, G, grupo);
      expect([...h.matchAll(/<article class="dg-tarjeta" data-nodo="([^"]+)"/g)].map((x) => x[1])).toEqual(ns.map((n) => n.id));
      for (const n of ns) {
        const tarjeta = h.slice(h.indexOf(`data-nodo="${n.id}"`)).split("</article>")[0]!;
        const suyos = m.flujos.filter((f) => f.origen === n.id || f.destino === n.id).map((f) => f.id).sort();
        expect([...tarjeta.matchAll(/data-flujo="([^"]+)"/g)].map((x) => x[1]).sort()).toEqual(suyos);
        expect(tarjeta).toContain(`<h3>${n.nombre.es}</h3>`);
      }
    }
  });
  it("cada conexión con el trazo y el marcador de su modo, y el texto «Hacia» / «Desde» del idioma", () => {
    const h = html("consumo-bi", "en");
    expect(h).toContain('lang="en"');
    expect(h).toMatch(/<li data-flujo="f-semantico-tablero"><svg class="dg-svg" viewBox="0 0 62 14"[^>]*>.*?<\/svg><span>To /);
    expect(h).toMatch(/<li data-flujo="f-semantico-tablero"><svg[^>]*>.*?<\/svg><span>From /);
  });
  it("B-41: con `id`, el contenedor lo lleva (el SVG de la ventana lo enlaza como su versión en texto)", () => {
    expect(toBlockCards(m, G, "consumo-bi", { language: "es", textos: TEXTOS, id: "v-texto" })).toMatch(/^<div class="dg-tarjetas" id="v-texto" lang="es"/);
    expect(html("consumo-bi")).toMatch(/^<div class="dg-tarjetas" lang="es"/);
  });
  it("la vigencia solo si no está vigente", () => {
    expect(html("consumo-bi", "es", FECHA)).not.toContain("dg-tarjeta-vigencia");
    expect(html("consumo-bi", "es", "2026-10-20")).toContain("Por revisar: verificado hace 30 días.");
  });
  it("sin las cadenas de un idioma, falla", () => {
    expect(() => toBlockCards(m, G, "consumo-bi", { language: "en", textos: { es: TEXTOS.es! } })).toThrow(/faltan las cadenas/);
  });
});
