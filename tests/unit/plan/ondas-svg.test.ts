// @vitest-environment node
// El diagrama de ondas (maqueta `decisiones.html`, D11): ninguna línea atraviesa una tarjeta ajena, tampoco con un ciclo de
// tres o más ni con una pregunta de cuatro líneas, y la geometría es la misma una y otra vez (se genera en el build).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { planDe } from "@/engine";
import { svgOndas, type EntradaOndas, type NodoOndas } from "@/lib/plan/ondas-svg";
import { planCon, VARIANTES_PLAN } from "../nucleo/lib/plan";

const ETIQUETAS = { reversibilidad: { una_via: "Una vía", costosa: "Costosa", dos_vias: "Dos vías" }, implicita: "implícita", sinProbar: "supuesto sin probar", enCiclo: "en ciclo", sinOnda: "sin onda" };

/** El diagrama de un plan de ejemplo con el cambio dado, con preguntas largas para forzar tarjetas de varias líneas. */
function entradaDe(cambio: (e: ReturnType<typeof planCon>) => void, largo = false): EntradaOndas {
  const e = planCon(cambio);
  const r = planDe(e);
  const sinOnda = r.decisiones.filter((d) => d.onda === null).map((d) => d.id);
  const nodos: Record<string, NodoOndas> = Object.fromEntries(
    e.decisiones.map((d) => [d.id, { id: d.id, nombre: largo ? `¿Cómo se resuelve ${d.id} de punta a punta, con todos los controles, las pruebas y los responsables que haga falta definir?` : `¿Cómo se resuelve ${d.id}?`, reversibilidad: d.reversibilidad, implicita: d.implicita, estado: d.estado, sinProbar: false, aria: d.id }]),
  );
  return {
    id: "ondas",
    idioma: "es",
    columnas: [...r.informe.ondas.map((ids, i) => ({ titulo: `ONDA ${i + 1}`, sub: "sub", ids })), ...(sinOnda.length ? [{ titulo: "SIN ONDA", sub: "bloqueadas", ids: sinOnda }] : [])],
    nodos,
    depende_de: Object.fromEntries(e.decisiones.map((d) => [d.id, d.depende_de])),
    ciclo: r.informe.ciclo ?? [],
    bloqueadas: sinOnda,
    etiquetas: ETIQUETAS,
    aria: "diagrama",
  };
}

describe("cero cruces (D11)", () => {
  for (const [nombre, cambio] of VARIANTES_PLAN)
    it(`${nombre}: ninguna línea atraviesa una tarjeta ajena`, () => {
      expect(svgOndas(entradaDe(cambio)).cruces).toBe(0);
    });

  it("un ciclo de tres decisiones (a → f → d → a) usa un carril para la flecha que salta una tarjeta, y sigue sin cruzar", () => {
    const ciclo = VARIANTES_PLAN.find(([n]) => n === "plan-ciclo")![1];
    const s = svgOndas(entradaDe(ciclo));
    expect(s.cruces).toBe(0);
    expect((s.svg.match(/dd-dep-ciclo/g) ?? []).length).toBe(3);
    expect(s.columnas.at(-1)!.titulo).toBe("SIN ONDA");
  });

  it("las preguntas de cuatro líneas o más agrandan todas las tarjetas: ninguna pisa su pie", () => {
    const corto = svgOndas(entradaDe(() => {}));
    const largo = svgOndas(entradaDe(() => {}, true));
    expect(largo.alto).toBeGreaterThan(corto.alto);
    expect(largo.cruces).toBe(0);
    const alturas = new Set([...largo.svg.matchAll(/class="db-card dd-caja"[^>]*height="([\d.]+)"/g)].map((m) => m[1]));
    expect(alturas.size).toBe(1);
  });
});

describe("determinismo y accesibilidad", () => {
  it("el mismo plan da el mismo SVG, byte a byte", () => {
    expect(svgOndas(entradaDe(() => {})).svg).toBe(svgOndas(entradaDe(() => {})).svg);
  });
  it("cada tarjeta es una imagen enfocable con su descripción, y el SVG no lleva estilos en línea", () => {
    const { svg } = svgOndas(entradaDe(() => {}));
    expect((svg.match(/role="graphics-symbol img" tabindex="0"/g) ?? []).length).toBe(6);
    expect(svg).not.toMatch(/\sstyle=/);
    expect(svg).toContain('role="graphics-document document" aria-label="diagrama"');
  });
  it("un carácter fuera de la tabla de métricas falla en el build, no en el navegador (G15)", () => {
    const e = entradaDe(() => {});
    e.nodos["dec-a"]!.nombre = "¿Cómo se resuelve 🙂?";
    expect(() => svgOndas(e)).toThrow(/no está en la tabla de métricas/);
  });
});

describe("S5-B-1: los ids que van a un atributo se escapan (defensa en profundidad; el esquema ya los limita)", () => {
  it("un id con comillas y etiquetas no escapa del atributo ni abre un elemento", () => {
    const base = entradaDe(() => {});
    const malo = 'dec-a"><script>x';
    const ren = (x: string) => (x === base.columnas[0]!.ids[0] ? malo : x);
    const e2: EntradaOndas = {
      ...base,
      id: 'o"k',
      columnas: base.columnas.map((c) => ({ ...c, ids: c.ids.map(ren) })),
      nodos: Object.fromEntries(Object.entries(base.nodos).map(([k, v]) => [ren(k), { ...v, id: ren(k) }])),
      depende_de: Object.fromEntries(Object.entries(base.depende_de).map(([k, v]) => [ren(k), v.map(ren)])),
    };
    const { svg } = svgOndas(e2);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain('data-lienzo="o&quot;k"');
    expect(svg).toContain("dec-a&quot;&gt;&lt;script&gt;x");
  });
});

// S5-B-11: el SVG de cada variante del plan queda fijado byte a byte; un cambio de geometría se ve en el diff y se acepta con
// ACTUALIZAR_GOLDEN=1 (como los golden files del diagramador).
describe("S5-B-11: golden files del diagrama de ondas", () => {
  for (const [nombre, cambio] of VARIANTES_PLAN) {
    it(`${nombre}: el SVG es el del golden file`, () => {
      const ruta = `tests/golden/plan/ondas-${nombre}.svg`;
      const svg = svgOndas(entradaDe(cambio)).svg;
      if (process.env.ACTUALIZAR_GOLDEN === "1" || !existsSync(ruta)) {
        mkdirSync(dirname(ruta), { recursive: true });
        writeFileSync(ruta, svg);
      }
      expect(svg).toBe(readFileSync(ruta, "utf8"));
    });
  }
});
