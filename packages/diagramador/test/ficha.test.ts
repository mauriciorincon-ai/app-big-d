// @vitest-environment node
// § 4.5 — la ficha de un nodo (`toCard`): todo lo que el panel muestra sale del mapa validado y de la
// gramática, con los mismos glifos y el mismo medidor del dibujo. Términos: los del nodo y los del glosario
// del mapa que aparecen en sus textos, marcados. La maqueta (atlas-nivel-2.html) es el oráculo de cuáles.
import { describe, expect, it } from "vitest";
import { toCard, type Mapa } from "../src/index";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const ejemplo = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const g = (m: Mapa) => GRAMATICAS[m.gramatica_id]!;
const ficha = (m: Mapa, id: string, language = "es", fechaConsulta?: string) =>
  toCard(m, g(m), id, { language, texts: TEXTOS, ...(fechaConsulta ? { queryDate: fechaConsulta } : {}) });

describe("la ficha dice lo que dice el mapa", () => {
  it("cada nodo de cada mapa, en cada idioma: nombre, tipo con su glifo, madurez con su medidor y todas sus fuentes", () => {
    for (const m of EJEMPLOS)
      for (const n of m.nodos)
        for (const l of g(m).idiomas) {
          const html = ficha(m, n.id, l);
          const tipo = g(m).tipos_de_nodo.find((t) => t.id === n.tipo_id)!;
          const madurez = g(m).escala_madurez.find((x) => x.id === n.madurez)!;
          expect(html, `${m.sujeto_id}/${n.id}/${l}`).toContain(`data-ficha="${n.id}"`);
          expect(html).toContain(`lang="${l}"`);
          expect(html).toContain(`class="dg-c-${tipo.token_color}"`);
          expect(html).toContain("dg-madurez-caja");
          expect(html).toContain(`<span>${madurez.nombre[l]!.replace(/&/g, "&amp;")}</span>`);
          for (const s of n.fuentes) expect(html).toContain(`href="${s.url.replace(/&/g, "&amp;")}"`);
          expect(html).toContain(`verif`); // «verificado» / «verified»
        }
  });

  it("términos como en la maqueta: propios, y «catálogo» del glosario donde aparece", () => {
    const terminos = (id: string) => [...ficha(ejemplo, id).matchAll(/<div( class="dg-del-glosario")?><dt>([^<]+?)(?: <span|<\/dt>)/g)].map((x) => `${x[2]}${x[1] ? " (glosario)" : ""}`);
    // La tabla de la maqueta aprobada, nodo por nodo (los que no aparecen no llevan términos).
    const MAQUETA: Record<string, string[]> = {
      "captura-cambios": ["registro de transacciones"],
      "almacen-tablas-abiertas": ["catálogo (glosario)"],
      "motor-transformacion": ["cómputo"],
      "agente-datos": ["catálogo (glosario)"],
      "catalogo-central": ["linaje", "catálogo (glosario)"],
      "filtros-filas": ["catálogo (glosario)"],
      "monitor-capacidad": ["cómputo"],
    };
    for (const n of ejemplo.nodos) expect(terminos(n.id), n.id).toEqual(MAQUETA[n.id] ?? []);
    expect(ficha(ejemplo, "sistema-admisiones")).not.toContain("<h3>Términos</h3>");
  });

  it("con la fecha de consulta la dice, y marca lo por revisar o vencido (§ 4.8)", () => {
    expect(ficha(ejemplo, "tablero", "es", "2026-09-26")).toContain("<span>consultado 2026-09-26</span>");
    expect(ficha(ejemplo, "tablero", "es", "2026-09-26")).not.toContain("verificado hace");
    expect(ficha(ejemplo, "tablero", "es", "2026-10-20")).toContain("<b>Por revisar: verificado hace 30 días.</b>");
    expect(ficha(ejemplo, "tablero", "en", "2026-11-19")).toContain("<b>Expired: verified 60 days ago.</b>");
    expect(ficha(ejemplo, "tablero")).not.toContain("consultado");
  });

  it("escapa el texto del dato y rechaza un nodo que no existe", () => {
    const raro = structuredClone(ejemplo);
    raro.nodos[0]!.nombre.es = "A <b> & «C»";
    expect(ficha(raro, raro.nodos[0]!.id)).toContain("<h2>A &lt;b&gt; &amp; «C»</h2>");
    expect(() => ficha(ejemplo, "no-existe")).toThrow(/no tiene el nodo/);
    expect(() => toCard(ejemplo, g(ejemplo), "tablero", { language: "en", texts: { es: TEXTOS.es! } })).toThrow(/cadenas de interfaz/);
  });
});
