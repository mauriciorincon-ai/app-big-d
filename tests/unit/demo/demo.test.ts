// @vitest-environment node
// S10 (F2): la demo pública (anexo E4) — la entrada de exploración, la neutralidad, el contrato del Worker (regla 19), la vista
// compartida entre el build y el navegador, los textos (paridad, jerga, ninguna recomendación presentada como aprobada) y la
// página armada en el build.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { canonicoEstricto, detectarJerga, evaluar } from "@/engine";
import { pesosExplorados } from "@/lib/caso/explorar";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { esquemaRespuestaDemo } from "@/lib/demo/contrato";
import { conPesos, entradaDeExploracion, reordenada } from "@/lib/demo/entrada";
import { entradaDemo, paqueteDemo } from "@/lib/demo/pagina";
import { atenderDemo, esRespuesta, type RespuestaDemo } from "@/lib/demo/protocolo";
import { TEXTOS_DEMO } from "@/lib/i18n/demo";
import { vistaDe } from "@/lib/demo/vista";

const sha = async (t: string) => createHash("sha256").update(t, "utf8").digest("hex");
const huellaDe = (e: Parameters<typeof evaluar>[0]) => createHash("sha256").update(canonicoEstricto(evaluar(e)), "utf8").digest("hex");
const e = entradaDemo();

describe("la entrada de la demo", () => {
  it("lleva solo las plataformas reales publicadas: ni la ficticia ni sus evidencias, y ninguna restricción la nombra", () => {
    const ids = e.base.plataformas.map((p) => p.id);
    expect(ids).toEqual(["databricks", "fabric", "snowflake"]);
    expect(new Set(e.base.evidencias.map((x) => x.plataforma_id))).toEqual(new Set(ids));
    for (const r of e.caso.restricciones) for (const x of r.elimina) expect(ids).toContain(x);
    expect(JSON.stringify(e)).not.toContain("plataforma-ejemplo");
  });

  it("parte de los pesos del perfil del hospital (centésimas que suman 10 000), con el estado de una exploración", () => {
    const k = cargarConocimiento();
    const caso = k.casos.find((c) => c.id === "hospital-futuro")!;
    // En el repo el perfil sigue en borrador; la suite también corre sobre la copia aprobada del ensayo (BIGD_DATOS).
    if (!process.env.BIGD_DATOS) expect(caso.estado_aprobacion).toBe("borrador");
    expect(e.caso.pesos.map((p) => p.peso)).toEqual(caso.criterios.map((c) => c.peso_centesimas));
    expect(e.caso.pesos.reduce((s, p) => s + p.peso, 0)).toBe(10_000);
    expect(e.caso.estado).toBe("aprobado");
  });

  it("entradaDeExploracion no toca lo que no quita", () => {
    const x = entradaDeExploracion(e, new Set());
    expect(x.base).toEqual(e.base);
    expect(x.caso.pesos).toEqual(e.caso.pesos);
    const sinFabric = entradaDeExploracion(e, new Set(["fabric"]));
    expect(sinFabric.base.plataformas.map((p) => p.id)).toEqual(["databricks", "snowflake"]);
    expect(sinFabric.base.evidencias.some((x) => x.plataforma_id === "fabric")).toBe(false);
  });

  it("conPesos exige un peso por criterio", () => {
    expect(() => conPesos(e, [10_000])).toThrow(/1 pesos para 11 criterios/);
    expect(conPesos(e, e.caso.pesos.map((p) => p.peso))).toEqual(e);
  });
});

describe("probar la neutralidad (regla dura 5)", () => {
  it("cada vuelta entrega otro orden de plataformas y la huella del resultado no cambia", () => {
    const base = huellaDe(e);
    const ordenes = new Set<string>();
    for (let k = 0; k < 6; k++) {
      const r = reordenada(e, k);
      ordenes.add(r.base.plataformas.map((p) => p.id).join(","));
      expect(new Set(r.base.evidencias)).toEqual(new Set(e.base.evidencias));
      expect(huellaDe(r)).toBe(base);
    }
    expect(ordenes.size).toBe(6);
  });

  it("con cualquier peso explorado y cualquier vuelta, la huella es la misma (propiedad)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: e.caso.pesos.length - 1 }), fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 11 }), (i, t, k) => {
        const pesos = pesosExplorados(e.caso.pesos, e.caso.pesos[i]!.criterio_id, t * 100).map((p) => p.peso);
        const x = conPesos(e, pesos);
        expect(huellaDe(reordenada(x, k))).toBe(huellaDe(x));
      }),
      { numRuns: 40 },
    );
  });
});

describe("el contrato Worker ↔ página (regla 19)", () => {
  const fixture = JSON.parse(readFileSync("tests/fixtures/demo-worker.json", "utf8")) as unknown[];

  it("el fixture del emisor real pasa el esquema Zod y la guarda de la página", () => {
    expect(fixture.map((m) => (m as { tipo: string }).tipo)).toEqual(["evaluado", "evaluado", "evaluado", "no-evaluable", "error"]);
    for (const m of fixture) {
      expect(esquemaRespuestaDemo.safeParse(m).success, JSON.stringify(m).slice(0, 80)).toBe(true);
      expect(esRespuesta(m)).toBe(true);
    }
  });

  // Sobre la copia aprobada del ensayo (BIGD_DATOS) la base es otra instantánea: el fixture es el del dato del repo.
  it.skipIf(!!process.env.BIGD_DATOS)("el fixture está al día: el emisor de hoy da los mismos mensajes", async () => {
    const { mensajes } = await import("../../../scripts/demo/emitir-worker");
    expect(JSON.parse(JSON.stringify(await mensajes()))).toEqual(fixture);
  });

  it("la guarda rechaza lo que no tiene la forma del contrato", () => {
    const bueno = fixture[0] as Record<string, unknown>;
    for (const malo of [null, 3, {}, { ...bueno, id: 1.5 }, { ...bueno, huella: "x" }, { ...bueno, filas: [{ plataforma_id: 1 }] }, { ...bueno, veredicto: { tipo: "aprobada" } }, { tipo: "error", id: 1 }, { tipo: "no-evaluable", id: 1, motivos: [1] }, { tipo: "otro", id: 1 }])
      expect(esRespuesta(malo)).toBe(false);
  });

  it("un fallo del núcleo sale como mensaje de error, no como excepción", async () => {
    const r = await atenderDemo({ tipo: "evaluar", id: 9, entrada: conPesos(e, e.caso.pesos.map(() => 0)) }, sha);
    expect(r).toMatchObject({ tipo: "error", id: 9 });
    const raro = await atenderDemo({ tipo: "evaluar", id: 10, entrada: null as never }, sha);
    expect(raro.tipo).toBe("error");
  });
});

describe("la vista (la misma en el build y en el navegador)", () => {
  const ctx = (idioma: "es" | "en") => ({ idioma, t: TEXTOS_DEMO[idioma], nombres: { a: "Alfa", b: "Beta" }, umbralCentesimas: 500 });
  const base = {
    tipo: "evaluado" as const,
    id: 1,
    huella: "0".repeat(64),
    recibido: ["a", "b"],
    max: 4,
    filas: [
      { plataforma_id: "a", posicion: 1, unidades: 30_000 },
      { plataforma_id: "b", posicion: 2, unidades: 26_000 },
    ],
  };

  it("escribe la ventaja, el empate y la única sin decir «recomendada» ni «aprobada»", () => {
    const clara = vistaDe({ ...base, veredicto: { tipo: "ganadora-clara", plataforma_id: "a", brecha_unidades: 4000 } }, ctx("es"));
    expect(clara.veredicto).toBe("Con estos pesos, Alfa queda arriba por 10,0 puntos.");
    expect(clara.filas.map((f) => [f.puesto, f.total, f.decimas])).toEqual([["1.er", "75,0 de 100", 750], ["2.º", "65,0 de 100", 650]]);
    expect(vistaDe({ ...base, veredicto: { tipo: "empate-tecnico", plataformas: ["a", "b"], brecha_unidades: 100 } }, ctx("en")).veredicto).toBe(
      "Technical tie: Alfa and Beta are less than 5 points apart; with these weights none of them pulls ahead.",
    );
    expect(vistaDe({ ...base, veredicto: { tipo: "unica", plataforma_id: "b" } }, ctx("en")).veredicto).toBe("Only Beta passes the restrictions of the case.");
    expect(vistaDe({ tipo: "no-evaluable", id: 1, motivos: ["x"] }, ctx("es"))).toEqual({ filas: [], veredicto: "Con estos pesos no hay resultado." });
    expect(vistaDe({ tipo: "error", id: 1, mensaje: "m" }, ctx("en")).veredicto).toBe("The calculation failed: m");
  });
});

describe("los textos de la demo", () => {
  const planos = (t: unknown): string[] => (typeof t === "string" ? [t] : Object.values(t as object).flatMap(planos));
  const claves = (t: unknown, p = ""): string[] => (typeof t === "string" ? [p] : Object.entries(t as object).flatMap(([k, v]) => claves(v, `${p}.${k}`)));

  it("tienen las mismas claves en los dos idiomas y ninguno queda vacío", () => {
    expect(claves(TEXTOS_DEMO.en)).toEqual(claves(TEXTOS_DEMO.es));
    for (const i of ["es", "en"] as const) for (const s of planos(TEXTOS_DEMO[i])) expect(s.trim()).not.toBe("");
  });

  it("ningún texto del resultado lo presenta como recomendado, aprobado o ganador (el rótulo lo niega en palabras)", () => {
    for (const i of ["es", "en"] as const) {
      const t = TEXTOS_DEMO[i];
      for (const s of [t.resultadoTitulo, t.deCien, ...Object.values(t.veredicto), t.neutralidadIgual, t.neutralidadDistinta, t.huellaAyuda])
        expect(s).not.toMatch(/recomend|recommend|aprobad|approv|ganador|winner|gana\b|wins\b/i);
      expect(t.rotuloDetalle).toMatch(i === "es" ? /nadie los aprobó.*no una recomendación/ : /nobody has approved them.*not a recommendation/);
    }
  });

  it("pasan el detector de jerga en los dos idiomas (regla dura 11)", () => {
    const k = cargarConocimiento();
    for (const i of ["es", "en"] as const) {
      const tabla = { largo_minimo: k.jerga.largo_minimo, umbral_cubo: k.jerga.umbral_cubo, cubos: k.jerga.cubos[i] };
      // La prosa, sin los rótulos (título, ojo, el enlace al otro idioma, que está en ESE idioma) ni los marcadores {nombre}.
      // «Big-D» y «Fabric» son nombres propios; «empate técnico» es término del glosario (E-7); «borrador» y «próximamente» son
      // los rótulos que fija el G-Plan, y su propia frase los explica.
      const { titulo, ojo, otroIdioma, atlasTitulo, proximamenteTitulo, ...prosa } = TEXTOS_DEMO[i];
      void [titulo, ojo, otroIdioma, atlasTitulo, proximamenteTitulo];
      const texto = planos(prosa).join(" ").replace(/\{[a-z]+\}/g, " ");
      const explicadas = i === "es" ? ["borrador", "próximamente", "empate técnico"] : ["technical tie"];
      expect(detectarJerga(texto, tabla, [...k.jerga.permitidas[i], "big", "fabric"], explicadas)).toEqual([]);
    }
  });
});

describe("la página armada en el build", () => {
  it("lleva el rótulo del borrador, la declaración del autor, BigQuery «próximamente» sin puntos y la huella de Node", async () => {
    const p = await paqueteDemo();
    expect(p.huellaInicial).toBe(huellaDe(e));
    for (const i of ["es", "en"] as const) {
      const html = p.paginas[i];
      expect(html).toContain(`<html lang="${i}">`);
      expect(html).toContain(TEXTOS_DEMO[i].rotulo);
      expect(html).toContain(TEXTOS_DEMO[i].declaracion);
      expect(html).toContain(`data-huella-node="${p.huellaInicial}"`);
      expect(html).toMatch(/data-proxima="bigquery"/);
      expect(html).not.toMatch(/data-plataforma="bigquery"/);
      expect((html.match(/class="demo-fila"/g) ?? []).length).toBe(3);
      expect((html.match(/<input type="range"/g) ?? []).length).toBe(e.caso.pesos.length);
      expect(p.datos[i].inicial).toEqual(JSON.parse(JSON.stringify(p.datos[i].inicial)) as RespuestaDemo);
    }
  });
});
