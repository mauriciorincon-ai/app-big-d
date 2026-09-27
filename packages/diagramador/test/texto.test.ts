// @vitest-environment node
// G10 — la versión en texto dice lo mismo que el dibujo: todo nodo, flujo y referencia del SVG aparece en
// la lectura y al revés, en cada idioma. Además: leyenda (§ 4.9), CSS del recorrido (§ 4.3) y diff (§ 4.7).
import { describe, expect, it } from "vitest";
import { diff, toJourneyCSS, toLegend, toSVG, toText, type Mapa } from "../src/index";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";
import { disponer } from "./lib/casos";
import { TEXTOS } from "./lib/textos";

const conjunto = (s: string, re: RegExp) => new Set([...s.matchAll(re)].flatMap((m) => m[1]!.split(" ")));

describe("G10 — el texto equivale al dibujo", () => {
  for (const mapa of EJEMPLOS)
    for (const idioma of GRAMATICAS[mapa.gramatica_id]!.idiomas)
      it(`${mapa.sujeto_id} (${idioma}): mismos nodos, flujos y pasos`, () => {
        const g = GRAMATICAS[mapa.gramatica_id]!;
        const texto = toText(mapa, g, { language: idioma, textos: TEXTOS, id: "lectura" });
        const n2 = toSVG(disponer(mapa, "nivel-2"), { language: idioma });
        const n1 = toSVG(disponer(mapa, "nivel-1"), { language: idioma });
        const todos = new Set(mapa.nodos.map((n) => n.id));
        const flujos = new Set(mapa.flujos.filter((f) => f.origen !== f.destino).map((f) => f.id));
        expect(conjunto(n2, /data-nodo="([^"]+)"/g)).toEqual(todos);
        expect(conjunto(n1, /data-nodos="([^"]*)"/g)).toEqual(todos);
        expect(conjunto(texto, /<li data-nodo="([^"]+)"/g)).toEqual(todos);
        expect(conjunto(n2, /<g (?:id="[^"]+" )?class="dg-(?:flujo|ref)[^"]*"[^>]*data-dueno="([^"]+)"/g)).toEqual(flujos);
        expect(conjunto(texto, /data-flujo="([^"]+)"/g)).toEqual(flujos);
        const pasos = new Set(mapa.recorridos.flatMap((r) => r.pasos.map((p) => p.id)));
        expect(conjunto(texto, /data-paso="([^"]+)"/g)).toEqual(pasos);
        expect(texto).toContain(`lang="${idioma}"`);
      });

  it("las ramas del recorrido se leen anidadas: 5 → (6a → 7a | 6b)", () => {
    const mapa = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
    const t = toText(mapa, GRAMATICAS["plataformas-datos"]!, { language: "es", textos: TEXTOS });
    expect(t).toMatch(/<b>5\. [^<]+<\/b>[^<]*Se divide en ramas que ocurren a la vez:<ul><li><ol><li data-paso="p6"[^>]*><b>6a\. .*<li data-paso="p7"[^>]*><b>7a\. .*<\/ol><\/li><li><ol><li data-paso="p8"[^>]*><b>6b\. /);
  });
});

describe("leyenda generada de la gramática (§ 4.9)", () => {
  for (const [id, g] of Object.entries(GRAMATICAS))
    for (const idioma of g.idiomas)
      it(`${id} (${idioma}): todo tipo, modo y madurez, la regla de vigencia y la nota de marcas`, () => {
        const h = toLegend(g, { language: idioma, textos: TEXTOS });
        for (const t of g.tipos_de_nodo) {
          expect(h).toContain(t.nombre[idioma]!);
          expect(h).toContain(`dg-c-${t.token_color}`);
        }
        for (const m of g.modos_de_flujo) expect(h).toContain(m.descripcion[idioma]!);
        for (const m of g.escala_madurez) expect(h).toContain(m.nombre[idioma]!);
        expect(h).toContain(String(g.vigencia.umbral_vencido_dias));
        expect(h).toContain(TEXTOS[idioma]!.leyenda.notaMarcas);
      });
});

describe("CSS del recorrido (§ 4.3, G12)", () => {
  const mapa = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
  const css = toJourneyCSS(disponer(mapa, "recorrido"), ".rec");
  it("en el paso 6a quedan visitados 1–5 y se resalta el flujo que llega", () => {
    expect(css).toContain('.rec[data-paso="p6"] .dg-nodo:not([data-paso~="p6"]):not([data-paso~="p5"]):not([data-paso~="p4"]):not([data-paso~="p3"]):not([data-paso~="p2"]):not([data-paso~="p1"]) { opacity: 0.35; }');
    expect(css).toContain('.rec[data-paso="p6"] .dg-flujo[data-flujo="f-limpias-semantico"] .dg-linea { stroke: var(--tinta-1); stroke-width: 3; }');
  });
  it("la rama 6b no hereda los pasos de la rama 6a", () => {
    expect(css).toMatch(/\.rec\[data-paso="p8"\] \.dg-nodo:not\(\[data-paso~="p8"\]\):not\(\[data-paso~="p5"\]\)(?!:not\(\[data-paso~="p6"\]\))/);
  });
  it("«todos» atenúa lo que no es parte del recorrido", () => {
    expect(css).toContain('.rec[data-paso="todos"] .dg-nodo:not([data-paso]) { opacity: 0.35; }');
  });
});

describe("diff entre versiones (§ 4.7)", () => {
  const a = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
  const b: Mapa = structuredClone(a);
  const conector = b.nodos.find((n) => n.id === "conector-relacional")!;
  conector.id = "conector-bases";
  conector.nombres_anteriores = [a.nodos.find((n) => n.id === "conector-relacional")!.nombre];
  conector.nombre = { es: "Conector de bases", en: "Database connector" };
  b.nodos.find((n) => n.id === "agente-datos")!.madurez = "disponible-general";
  b.nodos = b.nodos.filter((n) => n.id !== "monitor-capacidad");
  b.nodos.push({ ...structuredClone(a.nodos[0]!), id: "busqueda-vectorial", banda_id: "ia" });
  b.flujos = b.flujos.filter((f) => f.id !== "f-motor-monitor");
  it("nuevos, retirados, renombrados (por nombres anteriores) y madurez cambiada", () => {
    const d = diff(a, b);
    expect(d.nodos.nuevos).toEqual(["busqueda-vectorial"]);
    expect(d.nodos.retirados).toEqual(["monitor-capacidad"]);
    expect(d.nodos.renombrados.map((r) => [r.id, r.idAnterior])).toEqual([["conector-bases", "conector-relacional"]]);
    expect(d.nodos.madurez).toEqual([{ id: "agente-datos", antes: "vista-previa-publica", ahora: "disponible-general" }]);
    expect(d.flujos.retirados).toEqual(["f-motor-monitor"]);
  });
  it("un mapa contra sí mismo no tiene diferencias", () => {
    const d = diff(a, structuredClone(a));
    expect([...d.nodos.nuevos, ...d.nodos.retirados, ...d.flujos.cambiados, ...d.pasos.cambiados]).toEqual([]);
  });
});
