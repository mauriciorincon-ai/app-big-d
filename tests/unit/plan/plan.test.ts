// @vitest-environment node
// El núcleo del plan (S5, C16–C18): ondas, prioridad de acción con el residual por la MISMA tabla, la opción que se
// planifica según el veredicto de la comparación, y las alertas. Puro y entero: la misma entrada da los mismos bytes y el
// orden de las entradas no cambia el resultado (regla dura 5).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CASOS_DE_REFERENCIA, canonicoEstricto, comparacionDe, evaluar, planDe } from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { planCon, planEjemplo } from "./../nucleo/lib/plan";

const referencia = (id: string) => CASOS_DE_REFERENCIA.find((c) => c.id === id)!;

describe("ondas y decisiones de una vía", () => {
  const r = planDe(planEjemplo());

  it("ordena por ondas de Kahn: lo que no depende de nada, primero, con las de una vía al frente de su onda", () => {
    expect(r.informe.ondas).toEqual([["dec-a", "dec-e"], ["dec-b", "dec-d"], ["dec-f", "dec-c"]]);
    expect(r.decisiones.map((d) => [d.id, d.onda])).toEqual([["dec-a", 1], ["dec-e", 1], ["dec-b", 2], ["dec-d", 2], ["dec-f", 3], ["dec-c", 3]]);
    expect(r.decisiones.filter((d) => d.una_via).map((d) => d.id).sort()).toEqual(["dec-a", "dec-b", "dec-f"]);
  });

  it("un ciclo se MUESTRA con su camino y deja sin onda a lo que toca; no se aprueba", () => {
    const c = planDe(planCon((e) => void (e.decisiones[0] = { ...e.decisiones[0]!, depende_de: ["dec-f"] })));
    expect(c.informe.ciclo).not.toBeNull();
    expect(c.informe.ciclo!.length).toBeGreaterThan(1);
    expect(c.aprobable).toBe(false);
    expect(c.informe.bloqueantes.map((b) => b.tipo)).toContain("ciclo");
    const sinOnda = c.decisiones.filter((d) => d.onda === null);
    expect(sinOnda.length).toBeGreaterThan(0);
    expect(c.decisiones.filter((d) => d.en_ciclo).map((d) => d.id).sort()).toEqual([...c.informe.ciclo!].filter((x, i, a) => a.indexOf(x) === i).sort());
    expect(c.decisiones).toHaveLength(6); // ninguna decisión desaparece: las bloqueadas van al final
  });
});

describe("riesgos: prioridad de acción por la tabla, severidad primero", () => {
  const r = planDe(planEjemplo());
  const por = (id: string) => r.riesgos.find((x) => x.id === id)!;

  it("C03 y C03-bis: el mismo RPN (96) da alta con S8·O6·D2 y baja con S8·O3·D4", () => {
    expect(por("rie-3")).toMatchObject({ rpn: 96, prioridad_de_accion: "alta" });
    expect(por("rie-2")).toMatchObject({ rpn: 96, prioridad_de_accion: "baja" });
  });

  it("el orden es prioridad → severidad → RPN: un RPN de 288 de severidad 6 no pasa a uno de 175 de severidad 7", () => {
    expect(por("rie-5")).toMatchObject({ rpn: 288, prioridad_de_accion: "media" });
    expect(por("rie-4")).toMatchObject({ rpn: 175, prioridad_de_accion: "media" });
    expect(r.riesgos.map((x) => x.id)).toEqual(["rie-1", "rie-3", "rie-4", "rie-5", "rie-2"]);
    const rank = { alta: 0, media: 1, baja: 2 };
    for (const [a, b] of r.riesgos.slice(1).map((x, i) => [r.riesgos[i]!, x] as const)) expect(rank[a.prioridad_de_accion]).toBeLessThanOrEqual(rank[b.prioridad_de_accion]);
  });

  it("el residual sale de la MISMA tabla con lo que prometen las mitigaciones, y no inventa lo que no prometen", () => {
    expect(por("rie-3").residual).toMatchObject({ ocurrencia: 3, deteccion: 2, rpn: 48, prioridad_de_tabla: "baja", baja_de_categoria: true });
    // Dos mitigaciones se acumulan: la ocurrencia de una y la detección de la otra.
    expect(por("rie-1").residual).toMatchObject({ ocurrencia: 2, deteccion: 3, prioridad_de_tabla: "baja" });
    expect(por("rie-2").residual).toBeNull();
  });

  it("control legal (G8): la prioridad efectiva sigue alta aunque la tabla baje tras mitigar, y la de tabla se ve al lado", () => {
    expect(por("rie-1")).toMatchObject({ control_legal: true, prioridad_de_accion: "alta", prioridad_de_tabla: "alta" });
    expect(por("rie-1").residual).toMatchObject({ prioridad_de_accion: "alta", prioridad_de_tabla: "baja", baja_de_categoria: true });
  });

  it("una alta sin mitigación es bloqueante y el plan no se puede aprobar; con mitigación, sí", () => {
    expect(r.aprobable).toBe(true);
    const sin = planDe(planCon((e) => void (e.modos_de_falla[0] = { ...e.modos_de_falla[0]!, mitigaciones: [] })));
    expect(sin.aprobable).toBe(false);
    expect(sin.riesgos.filter((x) => x.bloqueante).map((x) => x.id)).toEqual(["rie-1"]);
    expect(sin.informe.bloqueantes.map((b) => b.tipo)).toEqual(["prioridad_alta_sin_mitigacion"]);
  });
});

describe("la opción que se planifica sigue al veredicto de la comparación", () => {
  const casos = {
    empate: planDe(planEjemplo()),
    ganadora: planDe(planCon((e) => void (e.comparacion = { tipo: "ganadora", plataformas: ["plat-c"] }))),
    sin: planDe(planCon((e) => void (e.comparacion = { tipo: "sin-comparacion", motivo: "perfil-en-borrador" }))),
  };

  it("en empate técnico se planifican TODAS las empatadas, ordenadas por id, y se dice", () => {
    expect(casos.empate.comparacion).toEqual({ tipo: "empate-tecnico", plataformas: ["plat-a", "plat-b"] });
    for (const d of casos.empate.decisiones) expect(d.planificadas).toEqual(["plat-a", "plat-b"]);
  });
  it("con ganadora se planifica solo la suya", () => {
    for (const d of casos.ganadora.decisiones) expect(d.planificadas).toEqual(["plat-c"]);
  });
  it("sin comparación (perfil en borrador) no se recomienda nada y el motivo viaja", () => {
    expect(casos.sin.comparacion).toEqual({ tipo: "sin-comparacion", motivo: "perfil-en-borrador" });
    for (const d of casos.sin.decisiones) expect(d.planificadas).toEqual([]);
  });
  it("comparacionDe lee el veredicto del núcleo: empate con todas las empatadas, y no-evaluable con su motivo", () => {
    expect(comparacionDe(evaluar(referencia("empate-exacto").entrada))).toMatchObject({ tipo: "empate-tecnico" });
    expect(comparacionDe(evaluar(referencia("perfil-en-borrador").entrada))).toEqual({ tipo: "sin-comparacion", motivo: "perfil-en-borrador" });
    const gana = CASOS_DE_REFERENCIA.map((c) => comparacionDe(evaluar(c.entrada))).find((c) => c.tipo === "ganadora");
    expect(gana).toBeDefined();
    expect(gana!.tipo === "ganadora" && gana!.plataformas).toHaveLength(1);
  });
});

describe("alertas", () => {
  const por = (e = planEjemplo()) => planDe(e).alertas.map((a) => `${a.tipo}:${a.id}`);

  it("supuesto crítico sin probar, decisión implícita y opción sin fuente", () => {
    expect(por()).toEqual(["supuesto-critico-sin-probar:sup-1", "decision-implicita:dec-a", "decision-implicita:dec-d", "opcion-sin-fuente:dec-c/plat-c"]);
  });
  it("un supuesto sin probar VENCE contra la fecha de evaluación, nunca contra el reloj", () => {
    expect(por()).not.toContain("supuesto-vencido:sup-1");
    expect(por(planCon((e) => void (e.fecha_evaluacion = "2026-11-02")))).toContain("supuesto-vencido:sup-1");
    const tarde = por(planCon((e) => void (e.fecha_evaluacion = "2026-12-31")));
    expect(tarde).toContain("supuesto-vencido:sup-3");
  });
  it("un supuesto refutado reabre sus decisiones", () => {
    const e = planCon((x) => void (x.supuestos[0]!.estado = "refutado"));
    const a = planDe(e).alertas.find((x) => x.tipo === "supuesto-refutado");
    expect(a).toEqual({ tipo: "supuesto-refutado", id: "sup-1", decisiones: ["dec-a"] });
  });
  it("una decisión ya tomada deja de ser alerta de implícita", () => {
    const e = planCon((x) => void (x.decisiones[0] = { ...x.decisiones[0]!, estado: "decidida" }));
    expect(por(e)).not.toContain("decision-implicita:dec-a");
  });
  it("un supuesto crítico sin prueba barata bloquea (C05)", () => {
    const e = planCon((x) => void (x.supuestos[0]!.prueba_barata = { es: "", en: "" }));
    expect(planDe(e).aprobable).toBe(false);
  });
});

describe("determinismo y neutralidad", () => {
  it("la misma entrada da los mismos bytes, cien veces", () => {
    const una = canonicoEstricto(planDe(planEjemplo()));
    for (let i = 0; i < 100; i++) expect(canonicoEstricto(planDe(planEjemplo()))).toBe(una);
  });

  it("reordenar decisiones, riesgos, supuestos, plataformas o citas NO cambia el resultado (propiedad)", () => {
    const base = canonicoEstricto(planDe(planEjemplo()));
    // Una permutación cualquiera de `xs`, dirigida por números que genera fast-check (estable si no hay números).
    const permutar = <T,>(xs: readonly T[], orden: number[]): T[] =>
      xs
        .map((x, i) => [x, (orden.length ? orden[i % orden.length]! : 0) * 1_000 + i] as const)
        .sort((a, b) => a[1] - b[1])
        .map(([x]) => x);
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 8 }), fc.array(fc.nat(), { maxLength: 8 }), fc.array(fc.nat(), { maxLength: 8 }), fc.array(fc.nat(), { maxLength: 4 }), (a, b, c, d) => {
        const e = planEjemplo();
        const reordenado = {
          ...e,
          decisiones: permutar(e.decisiones, a).map((x) => ({ ...x, opciones_por_plataforma: permutar(x.opciones_por_plataforma, d), depende_de: permutar(x.depende_de, d) })),
          modos_de_falla: permutar(e.modos_de_falla, b),
          supuestos: permutar(e.supuestos, c),
          comparacion: { ...e.comparacion, plataformas: permutar((e.comparacion as { plataformas: readonly string[] }).plataformas, d) },
        };
        expect(canonicoEstricto(planDe(reordenado as typeof e))).toBe(base);
      }),
      { seed: 20_261_005, numRuns: 200 },
    );
  });

  it("no hay una plataforma «especial»: cambiar los ids de las plataformas no cambia la forma del resultado", () => {
    const e = planEjemplo();
    const renombrado = JSON.parse(JSON.stringify(e).replaceAll("plat-a", "zeta").replaceAll("plat-b", "alfa").replaceAll("plat-c", "mu")) as typeof e;
    const a = planDe(e);
    const b = planDe(renombrado);
    expect(b.riesgos).toEqual(a.riesgos);
    expect(b.decisiones.map((d) => [d.id, d.onda, d.planificadas.length, d.sin_fuente.length])).toEqual(a.decisiones.map((d) => [d.id, d.onda, d.planificadas.length, d.sin_fuente.length]));
  });
});

describe("el plan real del caso, a través del núcleo", () => {
  const k = cargarConocimiento();
  const plan = k.planes[0]!;
  const caso = k.casos.find((c) => c.id === plan.caso_id)!;
  const real = planDe({ decisiones: plan.decisiones, modos_de_falla: plan.modos_de_falla, supuestos: plan.supuestos, fecha_evaluacion: caso.fecha_evaluacion, comparacion: { tipo: "sin-comparacion", motivo: "perfil-en-borrador" } });

  it("es aprobable: sin ciclo, sin alta sin mitigar, sin supuesto crítico sin prueba barata", () => {
    expect(real.aprobable).toBe(true);
    expect(real.informe.ciclo).toBeNull();
    expect(real.riesgos.filter((r) => r.bloqueante)).toEqual([]);
  });
  it("las tres de una vía se deciden antes que lo que dependa de ellas", () => {
    const onda = (id: string) => real.decisiones.find((d) => d.id === id)!.onda!;
    expect(onda("dec-identidad")).toBeLessThan(onda("dec-catalogo"));
    expect(onda("dec-catalogo")).toBeLessThan(onda("dec-proteccion-clinica"));
    expect(onda("dec-formato-ubicacion")).toBeLessThan(onda("dec-ingesta-cambios"));
    expect(real.decisiones.filter((d) => d.una_via)).toHaveLength(3);
  });
  it("cada riesgo tiene residual, y el de la fuga de datos clínicos sigue alto por control legal aunque la tabla baje", () => {
    expect(real.riesgos.every((r) => r.residual !== null)).toBe(true);
    const fuga = real.riesgos.find((r) => r.id === "rie-fuga-datos-clinicos")!;
    expect(fuga.prioridad_de_accion).toBe("alta");
    expect(fuga.residual).toMatchObject({ prioridad_de_accion: "alta", prioridad_de_tabla: "baja" });
  });
  it("los cuatro supuestos críticos sin probar son alertas; ninguno vence todavía contra la fecha de evaluación", () => {
    expect(real.alertas.filter((a) => a.tipo === "supuesto-critico-sin-probar")).toHaveLength(4);
    expect(real.alertas.filter((a) => a.tipo === "supuesto-vencido")).toEqual([]);
    expect(real.alertas.filter((a) => a.tipo === "opcion-sin-fuente")).toEqual([]);
  });
});
