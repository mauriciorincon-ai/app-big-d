// @vitest-environment node
// `escala_madurez[].etiqueta_corta` (CONTRATO v0.4.0 § 3, D-S1-17): opcional y por idioma; es lo que se dibuja
// en bloques (nivel 1) y nodos (nivel 2), donde el nombre largo no cabe, y mide hasta 4 caracteres (G2). Si
// falta, el motor usa el nombre. El nombre accesible del elemento conserva el nombre largo: lo visible es lo que cambia.
import { describe, expect, it } from "vitest";
import { layout, toSVG, validateGrammar, type Gramatica, type Mapa } from "../src/index";
import { FECHA } from "./lib/casos";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const G = GRAMATICAS["plataformas-datos"]!;
const ejemplo = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo") as Mapa;
const CORTA = { es: "Prev", en: "PPrv" };
const conCorta: Gramatica = {
  ...G,
  escala_madurez: G.escala_madurez.map((m) => (m.id === "vista-previa-publica" ? { ...m, etiqueta_corta: CORTA } : m)),
};
const dibujo = (g: Gramatica, vista: "nivel-1" | "nivel-2", language: string) => toSVG(layout(ejemplo, g, vista, { texts: TEXTOS, queryDate: FECHA }), { language });

describe("etiqueta corta de la madurez", () => {
  it("la gramática con etiqueta corta valida (el esquema v0.4.0 la admite), y una de más de 4 caracteres no (G2)", () => {
    expect(validateGrammar(conCorta).errores).toEqual([]);
    const larga = { ...G, escala_madurez: G.escala_madurez.map((m) => (m.id === "beta" ? { ...m, etiqueta_corta: { es: "Betas", en: "Beta" } } : m)) };
    expect(validateGrammar(larga).errores.map((e) => `${e.regla} · ${e.ruta}`)).toEqual(["G2 · /escala_madurez/3/etiqueta_corta/es"]);
  });
  for (const vista of ["nivel-1", "nivel-2"] as const)
    for (const idioma of ["es", "en"] as const)
      it(`${vista} · ${idioma}: dibuja la etiqueta corta y no el nombre largo`, () => {
        const largo = G.escala_madurez.find((m) => m.id === "vista-previa-publica")!.nombre[idioma]!;
        expect(dibujo(G, vista, idioma)).not.toContain(`>${CORTA[idioma]}<`);
        const svg = dibujo(conCorta, vista, idioma);
        expect(svg).toContain(`>${CORTA[idioma]}<`);
        expect(svg).not.toContain(`>${largo}<`);
        expect(svg).toContain(`aria-label=`);
      });
});
