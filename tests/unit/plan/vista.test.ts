// @vitest-environment node
// La vista del plan (S5): el diagrama de ondas (cero cruces con tarjetas, D11, en los dos idiomas), las fichas con lo que
// dice la base aprobada de cada plataforma y los estados que el dato real no publica pero la pantalla debe mostrar: el
// ciclo con su camino y las decisiones «sin onda», la acción alta sin mitigación y la recomendación con el perfil aprobado.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { huellaPlan } from "@/lib/datos/instantanea";
import { comandoAprobarPlan } from "@/lib/investigador/comando-plan";
import { aprobacionDelPlan, vistaDecisiones } from "@/lib/plan/vista";
import { armarBaseFuturo } from "../lib/base-futuro";

const real = cargarConocimiento();
const planReal = real.planes[0]!;
const casoReal = real.casos.find((c) => c.id === planReal.caso_id)!;

const sembrada = mkdtempSync(join(tmpdir(), "bigd-plan-vista-"));
armarBaseFuturo(sembrada);
const k2 = cargarConocimiento(sembrada);
afterAll(() => rmSync(sembrada, { recursive: true, force: true }));

const veces = (texto: string, re: RegExp) => texto.match(re)?.length ?? 0;

describe("el plan real, dibujado", () => {
  for (const idioma of ["es", "en"] as const) {
    const v = vistaDecisiones(real, casoReal, planReal, idioma);

    it(`${idioma} · una tarjeta por decisión, las de una vía con borde grueso, cero líneas sobre una tarjeta ajena y accesible por teclado`, () => {
      expect(veces(v.ondas.svg, /data-decision="/g)).toBe(planReal.decisiones.length);
      expect(veces(v.ondas.svg, /class="db-elem db-nodo dd-dec dd-una_via/g)).toBe(planReal.decisiones.filter((d) => d.reversibilidad === "una_via").length);
      expect(v.ondas.cruces).toBe(0);
      expect(veces(v.ondas.svg, /tabindex="0"/g)).toBe(planReal.decisiones.length);
      expect(v.ondas.svg).toMatch(/role="graphics-document document" aria-label="/);
      expect(v.ondas.svg).not.toMatch(/style=/); // sin estilos en línea (CSP)
      expect(v.ondas.svg).toContain(`lang="${idioma}"`);
    });
    it(`${idioma} · la reversibilidad va en glifo, palabra y borde, nunca solo en color`, () => {
      for (const r of ["una_via", "costosa", "dos_vias"]) expect(v.ondas.svg).toContain(`href="#dd-rev-${r}"`);
      expect(v.ondas.svg).toMatch(/dd-t-rev/);
    });
    it(`${idioma} · una ficha por decisión, con la opción de cada plataforma citando su evidencia aprobada`, () => {
      expect(Object.keys(v.fichas).sort()).toEqual(planReal.decisiones.map((d) => d.id).sort());
      const f = v.fichas["dec-catalogo"]!;
      for (const plat of ["Databricks", "Microsoft Fabric", "Snowflake"]) expect(f).toContain(plat);
      for (const e of ["evi-databricks-gobierno", "evi-fabric-gobierno", "evi-snowflake-gobierno"]) expect(f).toContain(e);
      // La ficticia que el caso descarta aparece tachada, con la razón de la restricción.
      expect(f).toContain("opcion-fuera");
    });
    // D-S7-02: la ficha sigue al estado del perfil del repo, sea el que sea.
    it(`${idioma} · la ficha sigue al perfil: en borrador no recomienda nada y lo dice; aprobado, planifica lo que puntúa`, () => {
      const ficha = v.fichas["dec-catalogo"]!;
      if (casoReal.estado_aprobacion === "borrador") {
        expect(v.resultado.comparacion.tipo).toBe("sin-comparacion");
        expect(ficha).not.toContain("<ul class=\"pros\"><li><b>");
        expect(ficha).toMatch(idioma === "es" ? /Todavía sin comparación/ : /No comparison yet/);
      } else {
        expect(v.resultado.comparacion.tipo).not.toBe("sin-comparacion");
        expect(ficha).not.toMatch(idioma === "es" ? /Todavía sin comparación/ : /No comparison yet/);
        expect(ficha).toMatch(idioma === "es" ? /Para .+(la ganadora de la comparación|Hay empate técnico)/ : /For .+(the winner of the comparison|There is a technical tie)/);
      }
    });
    it(`${idioma} · la lectura en texto lista cada decisión con su onda`, () => {
      expect(v.lectura.flatMap((f) => f.items)).toHaveLength(planReal.decisiones.length);
      expect(v.lectura[0]!.etiqueta).toBe(idioma === "es" ? "Onda 1" : "Wave 1");
    });
    it(`${idioma} · las fichas escapan el HTML: ningún texto del plan inyecta marcado`, () => {
      for (const f of Object.values(v.fichas)) expect(f).not.toMatch(/<script|onerror=|<img/i);
    });
  }
});

describe("la base sembrada: los estados que el plan real no tiene", () => {
  const caso = k2.casos.find((c) => c.id === "hospital-futuro")!;
  const plan = k2.planes[0]!;
  const v = vistaDecisiones(k2, caso, plan, "es");
  const en = vistaDecisiones(k2, caso, plan, "en");

  it("un ciclo se dibuja con sus flechas discontinuas y las decisiones que bloquea quedan «sin onda»", () => {
    expect(v.resultado.informe.ciclo).not.toBeNull();
    expect(v.cicloNombres!.length).toBeGreaterThan(1);
    expect(v.ondas.svg).toContain("dd-dep-ciclo");
    expect(v.ondas.svg).toContain("dd-en-ciclo");
    expect(v.ondas.svg).toContain("dd-bloq");
    expect(v.sinOnda).toContain("dec-consumo");
    expect(v.ondas.columnas.at(-1)!.titulo).toBe("SIN ONDA");
    expect(v.lectura.at(-1)!.items.at(-1)).toMatch(/^ciclo: /);
    for (const x of [v, en]) expect(x.ondas.cruces, "D11: ninguna línea atraviesa una tarjeta ajena").toBe(0);
  });
  it("una acción alta sin mitigación bloquea la aprobación y lo dice con su id", () => {
    expect(v.resultado.aprobable).toBe(false);
    expect(v.resultado.riesgos.filter((r) => r.bloqueante).map((r) => r.id)).toEqual(["rie-fuga"]);
    expect(v.resultado.informe.bloqueantes.map((b) => b.tipo).sort()).toEqual(["ciclo", "prioridad_alta_sin_mitigacion"]);
  });
  it("los supuestos críticos sin probar son alertas, y el que venció contra la fecha de evaluación lo dice", () => {
    expect(v.resultado.alertas.filter((a) => a.tipo === "supuesto-critico-sin-probar").map((a) => a.id)).toEqual(["sup-directorio", "sup-origen"]);
    expect(v.resultado.alertas.filter((a) => a.tipo === "supuesto-vencido").map((a) => a.id)).toEqual(["sup-origen"]);
  });
  it("con el perfil aprobado, la ficha recomienda la opción de las plataformas empatadas o la de la ganadora", () => {
    expect(v.resultado.comparacion.tipo).not.toBe("sin-comparacion");
    const planificadas = v.resultado.decisiones.find((d) => d.id === "dec-identidad")!.planificadas;
    expect(planificadas.length).toBeGreaterThan(0);
    expect(v.fichas["dec-identidad"]).toContain('<ul class="pros"><li><b>');
    expect(v.fichas["dec-identidad"]).toMatch(/Hay empate técnico|la ganadora de la comparación/);
  });
});

describe("S5-M-4: el apartado «Aprobar el plan» (lo que la página pinta)", () => {
  const rReal = vistaDecisiones(real, casoReal, planReal, "es").resultado;
  // El plan real, en el estado de borrador, con independencia de si ya lo aprobó una persona.
  const borrador = { ...planReal, estado_aprobacion: "borrador" as const, aprobacion: undefined };

  it("camino feliz: un plan aprobable y en borrador trae el comando que arma `comandoAprobarPlan` con la huella del borrador, y ningún bloqueo", () => {
    const a = aprobacionDelPlan(borrador, rReal, "es");
    expect(rReal.aprobable).toBe(true);
    expect(a.bloqueos).toEqual([]);
    expect(a.comando).toBe(comandoAprobarPlan(borrador.caso_id, huellaPlan(borrador)));
    expect(a.comando).toMatch(/--plan hospital-futuro --desde [0-9a-f]{64}$/);
  });
  it("un plan ya aprobado no trae comando: no se vuelve a aprobar", () => {
    expect(aprobacionDelPlan({ ...planReal, estado_aprobacion: "aprobado" as const }, rReal, "es").comando).toBeNull();
  });
  it("con un ciclo y una alta sin mitigación hay bloqueos, ninguno repite una decisión del ciclo, y no hay comando", () => {
    const caso = k2.casos.find((c) => c.id === "hospital-futuro")!;
    const plan = k2.planes[0]!;
    const r = vistaDecisiones(k2, caso, plan, "es").resultado;
    const a = aprobacionDelPlan(plan, r, "es");
    expect(a.comando).toBeNull();
    expect(a.bloqueos).toHaveLength(2);
    const delCiclo = r.informe.bloqueantes.find((b) => b.tipo === "ciclo")!;
    const ids = [...new Set(delCiclo.ids)];
    expect(delCiclo.ids.length).toBeGreaterThan(ids.length); // el camino cierra en su primer nodo: a → b → a
    const texto = a.bloqueos.find((b) => /ciclo/.test(b))!;
    for (const id of ids) expect(texto.split(id).length - 1, `${id} se nombra una vez`).toBe(1);
  });
});
