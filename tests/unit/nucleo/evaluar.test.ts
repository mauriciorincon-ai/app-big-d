// @vitest-environment node
// El núcleo sobre el caso de la maqueta (Hospital Ficticio de la Sabana) y sobre los casos de referencia (RF-09.1).
import { describe, expect, it } from "vitest";
import { CASOS_DE_REFERENCIA, correrReferencia, evaluar, type Resultado, type Sensibilidad } from "@/engine";
import { sabana } from "./lib/sabana";

type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
const evaluado = (r: Resultado): Evaluado => {
  if (r.tipo !== "evaluado") throw new Error(`no se evaluó: ${JSON.stringify(r.motivos)}`);
  return r;
};

describe("el caso de la maqueta", () => {
  const r = evaluado(evaluar(sabana()));

  it("Este sale por la residencia de datos antes de puntuar", () => {
    expect(r.descartadas).toEqual([{ plataforma_id: "este", restricciones: ["res-residencia"] }]);
    expect(r.evaluadas).toEqual(["norte", "plataforma-ejemplo", "sur"]);
  });

  it("los totales en unidades son los de la maqueta (78,75 · 75,75 · 63,75 puntos)", () => {
    expect(r.orden.map((p) => [p.plataforma_id, p.posicion, p.unidades])).toEqual([
      ["norte", 1, 31_500],
      ["plataforma-ejemplo", 2, 30_300],
      ["sur", 3, 25_500],
    ]);
  });

  it("Norte y Ejemplo quedan a 3 puntos: empate técnico declarado, no una ganadora", () => {
    expect(r.veredicto).toEqual({ tipo: "empate-tecnico", plataformas: ["norte", "plataforma-ejemplo"], brecha_unidades: 1_200 });
  });

  it("la evidencia limitante es la del esencial más bajo; a igual puntaje, la del criterio de más peso", () => {
    expect(r.limitantes).toEqual([
      { plataforma_id: "norte", criterio_id: "crit-almacenamiento", evidencia_id: "evi-norte-almacenamiento", puntaje: 3 },
      { plataforma_id: "plataforma-ejemplo", criterio_id: "crit-gobierno", evidencia_id: "evi-plataforma-ejemplo-gobierno", puntaje: 3 },
      { plataforma_id: "sur", criterio_id: "crit-gobierno", evidencia_id: "evi-sur-gobierno", puntaje: 2 },
    ]);
    expect(r.orden.find((p) => p.plataforma_id === "norte")!.leximin).toEqual([3, 3, 4]);
  });

  it("cada puntaje se remonta a su evidencia (regla 9)", () => {
    expect(r.celdas).toHaveLength(33);
    for (const c of r.celdas) expect(c.sustento).toContain(c.limitante);
  });

  describe("sensibilidad del gobierno (25 puntos, de 0 a 50)", () => {
    const s = r.sensibilidad.find((x) => x.criterio_id === "crit-gobierno") as Extract<Sensibilidad, { estado: "calculada" }>;

    it("la inversión es exacta (16 250/11 centésimas = 14,77 puntos) y se ve desde 14,7 al bajar el peso", () => {
      expect(s.estado).toBe("calculada");
      expect(s.hasta).toBe(5_000);
      expect(s.inversion_arriba).toBeNull();
      expect(s.inversion_abajo).toMatchObject({ tipo: "lider", t: { n: 16_250, d: 11 }, antes: ["plataforma-ejemplo"], despues: ["norte"], rejilla: 1_470 });
    });

    it("el empate técnico sale en 31,82 puntos y la rejilla lo muestra en 31,9 (no en 31,8)", () => {
      const sale = s.eventos.find((e) => e.tipo === "empate-sale")!;
      expect(sale.t).toEqual({ n: 35_000, d: 11 });
      expect(sale.rejilla).toBe(3_190);
    });
  });

  it("con una sola plataforma no hay empate ni sensibilidad: no hay a quién invertir", () => {
    const e = sabana();
    e.caso.restricciones = [{ id: "res-solo-norte", elimina: ["este", "plataforma-ejemplo", "sur"] }];
    const u = evaluado(evaluar(e));
    expect(u.veredicto).toEqual({ tipo: "unica", plataforma_id: "norte" });
    expect(u.sensibilidad).toEqual([]);
  });

  it("los pros y contras van contra el ancla y la mejor: Ejemplo destaca en almacenamiento (4/4, la única) y se queda corta en IA por el tope", () => {
    const ej = r.pros_contras.find((p) => p.plataforma_id === "plataforma-ejemplo")!;
    expect(ej.destaca.map((x) => [x.criterio_id, x.puntaje, x.la_mejor])).toEqual([
      ["crit-almacenamiento", 4, true],
      ["crit-dependencia", 4, true],
    ]);
    // Pesan lo mismo (5 puntos): a igual peso, por id.
    expect(ej.corta.map((x) => [x.criterio_id, x.puntaje, x.madurez])).toEqual([
      ["crit-habilidades", 2, "disponible-general"],
      ["crit-ia", 2, "vista-previa-publica"],
    ]);
  });

  it("alerta por la madurez de la IA de Ejemplo y por las evidencias que pasan de 30 días a la fecha de evaluación", () => {
    expect(r.alertas.filter((a) => a.motivo === "madurez").map((a) => a.evidencia_id)).toEqual(["evi-plataforma-ejemplo-ia"]);
    const e = sabana();
    e.caso.fecha_evaluacion = "2026-11-19";
    const tarde = evaluado(evaluar(e));
    expect(new Set(tarde.alertas.map((a) => a.motivo))).toEqual(new Set(["vencida", "madurez"]));
    expect(tarde.alertas.find((a) => a.motivo === "vencida")!.dias).toBe(60);
  });
});

describe("lo que no se evalúa (RF-03.5, RF-02.3)", () => {
  it("un perfil en borrador y una celda sin evidencia aprobada se dicen juntos, con lo que falta", () => {
    const e = sabana();
    e.caso.estado = "borrador";
    e.base.evidencias = e.base.evidencias.filter((x) => x.id !== "evi-sur-costo");
    const r = evaluar(e);
    expect(r.tipo).toBe("no-evaluable");
    expect(r.tipo === "no-evaluable" && r.motivos).toEqual([{ motivo: "perfil-en-borrador" }, { motivo: "falta-evidencia", faltantes: [{ plataforma_id: "sur", criterio_id: "crit-costo" }] }]);
  });

  it("la falta de evidencia de una plataforma descartada no bloquea", () => {
    const e = sabana();
    e.base.evidencias = e.base.evidencias.filter((x) => x.plataforma_id !== "este");
    expect(evaluar(e).tipo).toBe("evaluado");
  });

  it.each([
    ["los pesos no suman 10 000", (e: ReturnType<typeof sabana>) => void (e.caso.pesos[0]!.peso += 1), "suman 10001"],
    ["el caso no pesa los criterios de la base", (e: ReturnType<typeof sabana>) => void e.caso.pesos.pop(), "el caso pesa"],
    ["una restricción nombra una plataforma que no existe", (e: ReturnType<typeof sabana>) => void e.caso.restricciones.push({ id: "res-x", elimina: ["oeste"] }), "«oeste»"],
    ["un puntaje fuera de la escala", (e: ReturnType<typeof sabana>) => void (e.base.evidencias[0]!.puntaje = 5), "entre 0 y 4"],
    ["una celda con varias evidencias y ninguna esencial", (e: ReturnType<typeof sabana>) => {
      e.base.evidencias[0]!.esencial = false;
      e.base.evidencias.push({ ...e.base.evidencias[0]!, id: "evi-norte-ingesta-2" });
    }, "ninguna esencial"],
    ["una madurez sin tope", (e: ReturnType<typeof sabana>) => void (e.base.evidencias[0]!.madurez = "rumor"), "«rumor»"],
  ])("si %s, el núcleo lanza en vez de calcular", (_que, romper, mensaje) => {
    const e = sabana();
    romper(e);
    expect(() => evaluar(e)).toThrow(mensaje);
  });
});

describe("casos de referencia (RF-09.1)", () => {
  it.each(CASOS_DE_REFERENCIA.map((c) => [c.id, c] as const))("%s da lo esperado", (_id, c) => {
    const { obtenido, ok } = correrReferencia(c);
    expect(obtenido).toEqual(c.esperado);
    expect(ok).toBe(true);
  });

  it("los ids no se repiten y cada uno trae su descripción en los dos idiomas", () => {
    expect(new Set(CASOS_DE_REFERENCIA.map((c) => c.id)).size).toBe(CASOS_DE_REFERENCIA.length);
    for (const c of CASOS_DE_REFERENCIA) expect(c.descripcion.es && c.descripcion.en).toBeTruthy();
  });
});
