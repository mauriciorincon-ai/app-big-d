// @vitest-environment node
// Bordes del motor: los errores explícitos (jamás un dibujo a medias) y las utilidades de texto.
import { describe, expect, it } from "vitest";
import { layout, METRICAS_PILOTO, toJourneyCSS, toLegend, toSVG, toText } from "../src/index";
import { contarFrases, contieneTermino } from "../src/validar/lider";
import { medidor } from "../src/texto/metricas";
import { dividirRedondeando, u } from "../src/util/numeros";
import { compararCodigo, ordenarPor } from "../src/util/orden";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { disponer } from "./lib/casos";
import { TEXTOS } from "./lib/textos";

const M = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const G = GRAMATICAS["plataformas-datos"]!;

describe("errores explícitos", () => {
  it("layout sin las cadenas de un idioma, con una fuente que no existe o un recorrido que no existe", () => {
    expect(() => layout(M, G, "nivel1", { texts: { es: TEXTOS.es! }, queryDate: "2026-09-26" })).toThrow(/faltan las cadenas de interfaz en «en»/);
    expect(() => layout(M, G, "nivel1", { texts: TEXTOS, queryDate: "2026-09-26", fuente: "otra" })).toThrow(/no tiene las fuentes/);
    expect(() => layout(M, G, "recorrido", { texts: TEXTOS, queryDate: "2026-09-26", recorrido: "no-existe" })).toThrow(/no tiene el recorrido/);
  });
  it("toSVG, toText y toLegend en un idioma que la gramática no declara", () => {
    const geo = disponer(M, "nivel1");
    expect(() => toSVG(geo, { language: "fr" })).toThrow(/no declara el idioma/);
    expect(() => toText(M, G, { language: "fr", texts: TEXTOS })).toThrow(/no declara el idioma/);
    expect(() => toLegend(G, { language: "fr", texts: TEXTOS })).toThrow(/no declara el idioma/);
    // Declarado en la gramática, pero sin sus cadenas de interfaz:
    expect(() => toText(M, G, { language: "en", texts: { es: TEXTOS.es! } })).toThrow(/faltan las cadenas/);
    expect(() => toLegend(G, { language: "en", texts: { es: TEXTOS.es! } })).toThrow(/faltan las cadenas/);
  });
  it("el CSS del recorrido solo existe para la vista «recorrido»", () => {
    expect(() => toJourneyCSS(disponer(M, "nivel2"), ".rec")).toThrow(/no es de la vista/);
  });
  it("prefijo propio y enlace a la lectura en texto (G10)", () => {
    const svg = toSVG(disponer(M, "nivel1"), { language: "es", prefix: "a", textId: "lectura-es" });
    expect(svg).toContain('id="a-lienzo"');
    expect(svg).toContain('aria-details="lectura-es"');
  });
  it("un recorrido con nombre explícito es el que se dibuja", () => {
    expect(layout(M, G, "recorrido", { texts: TEXTOS, queryDate: "2026-09-26", recorrido: "admision-paciente" }).recorrido?.id).toBe("admision-paciente");
  });
});

describe("vigencia dentro del lienzo (§ 4.8)", () => {
  it("por revisar desde el día 30 y vencido desde el 60; lo vigente no se marca", () => {
    const insignias = (fecha: string) => (toSVG(disponer(M, "nivel1", fecha), { language: "es" }).match(/dg-insignia-(revisar|vencido)/g) ?? []).sort();
    expect(insignias("2026-10-19")).toEqual([]);
    expect(insignias("2026-10-20")).toHaveLength(9); // 6 bloques de capa + 3 fichas de franja
    expect(new Set(insignias("2026-10-20"))).toEqual(new Set(["dg-insignia-revisar"]));
    expect(new Set(insignias("2026-11-19"))).toEqual(new Set(["dg-insignia-vencido"]));
  });
  it("el nombre accesible dice el estado y los días", () => {
    expect(toSVG(disponer(M, "nivel2", "2026-10-20"), { language: "en" })).toContain("To review: verified 30 days ago.");
  });
});

describe("utilidades", () => {
  it("frases y términos", () => {
    expect(contarFrases("")).toBe(0);
    expect(contarFrases("Sin punto final")).toBe(1);
    expect(contarFrases("Una. ¿Dos? ¡Tres!")).toBe(3);
    expect(contieneTermino("Se alimenta del Lakehouse.", "lakehouse")).toBe(true);
    expect(contieneTermino("Un sqlite local", "sql")).toBe(false);
  });
  it("métricas: peso inexistente y abreviatura extrema", () => {
    const m = medidor(METRICAS_PILOTO.fuentes["space-grotesk"]!);
    expect(() => m.ancho("x", 12, 500)).toThrow(/no tiene el peso 500/);
    expect(m.abreviar("Palabraenormequenocabe nunca", 12, 400, 10)).toBe("…");
  });
  it("números y orden", () => {
    expect(u(3)).toBe(30);
    expect(() => u(0.5)).toThrow();
    expect(() => dividirRedondeando(1, 0)).toThrow();
    expect(compararCodigo("b", "a")).toBe(1);
    expect(ordenarPor([{ a: 2, b: "x" }, { a: 1, b: "y" }, { a: 1, b: "x" }], (o) => o.a, (o) => o.b)).toEqual([{ a: 1, b: "x" }, { a: 1, b: "y" }, { a: 2, b: "x" }]);
  });
});
