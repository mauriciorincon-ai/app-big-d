// @vitest-environment node
// El modo EVIDENCIAS del investigador (D-S3-10), en sus piezas puras: la propuesta se valida contra la base de
// conocimiento (ids, criterios, madurez, dominios de la ficticia, vocabulario, celdas sin esencial) y la aprobación solo
// procede con una decisión por evidencia, la verificación de ESTOS bytes y ninguna cita «no encontrada» aprobada. Lo
// aprobado sale como evidencia de la base, con su verificación por fuente, y la revisión guarda su huella.
import { rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { esquemaEvidencia } from "@/lib/datos/conocimiento";
import { aprobarEvidencias, componentesDeMapas, contextoDe, ErrorDeAprobacion, huella, resultadoDe, validarPropuestaEvidencias, type PropuestaEvidencias } from "@/lib/investigador";
import { PLATAFORMA } from "./lib/muestra";
import { CARPETA_EV, propuestaEvidenciasNorte, raizDeEvidencias, verificacionDe } from "./lib/muestra-evidencias";

const { raiz } = raizDeEvidencias();
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const ctx = contextoDe(cargarConocimiento(join(raiz, "data")), componentesDeMapas(join(raiz, "data")));
const SHA = "b".repeat(64);
const con = (cambio: (p: PropuestaEvidencias) => void) => {
  const p = propuestaEvidenciasNorte();
  cambio(p);
  return p;
};
const fallasDe = (p: unknown) => validarPropuestaEvidencias(p, ctx).fallas.join("\n");

describe("validar una propuesta de evidencias", () => {
  it("la muestra (una evidencia por criterio de la base) pasa", () => {
    const r = validarPropuestaEvidencias(propuestaEvidenciasNorte(), ctx);
    expect(r.fallas).toEqual([]);
    expect(r.propuesta?.evidencias).toHaveLength(11);
  });
  it.each<[string, (p: PropuestaEvidencias) => void, RegExp]>([
    ["capacidad y criterio a la vez", (p) => void (p.evidencias[0]!.evidencia.criterio_id = "crit-costo"), /exactamente uno de los dos/],
    ["un puntaje fuera de la escala", (p) => void (p.evidencias[0]!.evidencia.puntaje = 5), /a lo sumo 4/],
    ["una cita de menos de 40 caracteres", (p) => void (p.evidencias[0]!.evidencia.fuentes[0]!.cita = "corta"), /al menos 40/],
    ["una propuesta sin evidencias", (p) => void (p.evidencias = []), /al menos una evidencia/],
    ["otra plataforma en una evidencia", (p) => void (p.evidencias[1]!.evidencia.plataforma_id = "fabric"), /no es la investigada/],
    ["un id sin el prefijo de la plataforma", (p) => void (p.evidencias[1]!.evidencia.id = "evi-otra-cosa"), /empieza por «evi-plataforma-norte-»/],
    ["una capacidad que no existe", (p) => void (p.evidencias[1]!.evidencia.capacidad_id = "cap-teletransporte"), /no es una capacidad de la base/],
    ["un criterio de capacidad por criterio_id", (p) => {
      const e = p.evidencias.find((x) => x.evidencia.capacidad_id)!.evidencia;
      delete e.capacidad_id;
      e.criterio_id = "crit-gobierno";
    }, /es de tipo capacidad/],
    ["un componente que no está en el mapa aprobado", (p) => void (p.evidencias[2]!.evidencia.componentes = ["catalogo-central", "teletransportador"]), /componente «teletransportador» no está en el mapa aprobado de plataforma-norte/],
    ["un nombre de componente en vez de su id", (p) => void (p.evidencias[2]!.evidencia.componentes = ["Catálogo central"]), /componentes/],
    ["una madurez que no existe", (p) => void (p.evidencias[2]!.evidencia.madurez = "rumor"), /madurez «rumor»/],
    ["una ficticia que cita un dominio real", (p) => void (p.evidencias[3]!.evidencia.fuentes[0]!.url = "https://learn.microsoft.com/x"), /dominios reservados/],
    ["un calco vetado", (p) => void (p.evidencias[3]!.evidencia.afirmacion.es = "Guarda todo en un lago de datos."), /vocabulario/],
    ["un A-n repetido", (p) => void (p.evidencias[4]!.id = "A-1"), /A-1 repetida/],
    ["una evidencia repetida", (p) => void (p.evidencias[5]!.evidencia.id = p.evidencias[4]!.evidencia.id), /aparece dos veces/],
    ["dos en una celda y ninguna esencial", (p) => {
      const a = p.evidencias[6]!.evidencia;
      p.evidencias.push({ id: "A-99", evidencia: { ...a, id: `${a.id}-2`, esencial: false } });
      a.esencial = false;
    }, /ninguna esencial/],
  ])("rechaza %s", (_, cambio, motivo) => {
    expect(fallasDe(con(cambio))).toMatch(motivo);
  });
  it("una plataforma sin mapa aprobado: sus evidencias no tienen componentes que nombrar", () => {
    const sinMapa = { ...ctx, componentes: {} };
    expect(validarPropuestaEvidencias(propuestaEvidenciasNorte(), sinMapa).fallas.join("\n")).toMatch(/no tiene mapa aprobado/);
  });
  it("una plataforma que no está en la base", () => {
    expect(fallasDe(con((p) => void (p.plataforma = "plataforma-oeste")))).toMatch(/no está en data\/plataformas/);
  });
});

describe("el resultado de una evidencia es el peor de sus fuentes", () => {
  const r = (resultado: "verificada" | "no-encontrada" | "no-verificable") => ({ afirmacion: "A-1", url: "x", resultado, http: 200, sha256: null });
  it.each([
    [[r("verificada"), r("verificada")], "verificada"],
    [[r("verificada"), r("no-verificable")], "no-verificable"],
    [[r("no-verificable"), r("no-encontrada")], "no-encontrada"],
    [[r("verificada"), undefined], null],
  ] as const)("%j → %s", (rs, esperado) => {
    expect(resultadoDe(rs)).toBe(esperado);
  });
});

describe("aprobar una propuesta de evidencias", () => {
  const p = propuestaEvidenciasNorte();
  const ids = p.evidencias.map((x) => x.id);
  const base = { carpeta: CARPETA_EV, propuesta: p, propuestaSha256: SHA, verificacion: verificacionDe(p, SHA, { "A-11": "no-encontrada", "A-10": "no-verificable" }), retiradas: [], contexto: ctx, fecha: "2026-10-06" };
  const decidir = (aprobadas: string[], rechazadas: string[], extra: Partial<Parameters<typeof aprobarEvidencias>[0]> = {}) => aprobarEvidencias({ ...base, aprobadas, rechazadas, ...extra });
  const fallas = (f: () => unknown) => {
    try {
      f();
    } catch (e) {
      if (e instanceof ErrorDeAprobacion) return e.fallas.join("\n");
      throw e;
    }
    return "";
  };

  it("lo aprobado sale como evidencia de la base: aprobada, con su verificación por fuente, quién y cuándo", () => {
    const { evidencias, revision } = decidir(ids.slice(0, 10), ["A-11"]);
    expect(evidencias).toHaveLength(10);
    for (const e of evidencias) expect(esquemaEvidencia.safeParse(e).success).toBe(true);
    const primera = evidencias[0]!;
    expect(primera).toMatchObject({ estado_aprobacion: "aprobada", aprobada_por: "autor", fecha_aprobacion: "2026-10-06", fecha_verificacion: "2026-10-05", origen: "agente-investigador", plataforma_id: PLATAFORMA });
    expect(primera.fuentes[0]!.verificacion).toEqual({ resultado: "verificada", fecha: "2026-10-05", http: 200, sha256: "a".repeat(64) });
    expect(revision).toMatchObject({ fecha: "2026-10-06", propuesta: CARPETA_EV, rechazadas: ["A-11"] });
    expect(revision.evidencias).toEqual(evidencias.map((e) => ({ id: e.id, huella: huella(e) })));
  });
  it("una «no verificable» entra solo si la persona la aprueba, y conserva que no se pudo verificar", () => {
    const { evidencias } = decidir(ids.slice(0, 10), ["A-11"]);
    const decima = p.evidencias[9]!.evidencia.id;
    expect(evidencias.find((e) => e.id === decima)!.fuentes[0]!.verificacion.resultado).toBe("no-verificable");
  });
  it.each<[string, () => unknown, RegExp]>([
    ["una evidencia sin decisión", () => decidir(ids.slice(0, 9), ["A-11"]), /A-10 no tiene decisión/],
    ["una con dos decisiones", () => decidir(ids.slice(0, 10), ["A-11", "A-1"]), /A-1 tiene más de una decisión/],
    ["un id que no es de la propuesta", () => decidir([...ids.slice(0, 10), "A-12"], ["A-11"]), /A-12 no es una evidencia de esta propuesta/],
    ["aprobar una cita no encontrada", () => decidir(ids, []), /A-11: una de sus citas no aparece en la fuente/],
    ["una verificación de otros bytes", () => decidir(ids.slice(0, 10), ["A-11"], { propuestaSha256: "c".repeat(64) }), /otra versión de la propuesta/],
    ["retirar algo", () => decidir(ids.slice(0, 10), ["A-11"], { retiradas: ["algo"] }), /no retira nada/],
    ["volver a una propuesta ya cerrada", () => decidir(ids.slice(0, 10), ["A-11"], { ultimaPropuesta: CARPETA_EV }), /no es posterior/],
    ["una fuente sin verificar", () => decidir(ids.slice(0, 10), ["A-11"], { verificacion: { ...base.verificacion, resultados: base.verificacion.resultados.slice(1) } }), /A-1: la fuente 1 no fue verificada/],
    ["una verificación de otra URL", () => decidir(ids.slice(0, 10), ["A-11"], { verificacion: { ...base.verificacion, resultados: base.verificacion.resultados.map((r, i) => (i === 0 ? { ...r, url: "https://ejemplo.invalid/otra" } : r)) } }), /es de otra URL/],
  ])("no procede con %s", (_, f, motivo) => {
    expect(fallas(f)).toMatch(motivo);
  });
});
