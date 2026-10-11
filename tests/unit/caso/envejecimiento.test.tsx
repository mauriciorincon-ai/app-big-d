// Matriz de envejecimiento de la base y de la comparación (regla 23, S4). Una evidencia pasa a «por revisar» a los 30 días y a
// «vencida» a los 60, y la fecha es una ENTRADA (de consulta en /base, de evaluación en la comparación; nunca el reloj). Esta prueba
// construye /base (la página real, en los dos idiomas) y la comparación en cada fecha en que alguna evidencia aprobada de la base
// cambia de estado —la fecha de verificación, el día antes y el día de cada umbral, 100 días— y exige que los totales NO cambien y
// que las etiquetas SÍ: las cuentas salen de la fecha por aritmética de calendario, no del motor. Las fechas se calculan desde el
// dato real (hoy todas las evidencias se verificaron el mismo día); no se inventan casos.
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import Base from "@/app/[idioma]/base/page";
import { alertasDe } from "@/engine";
import { conocimiento, evaluacionDe } from "@/lib/caso/casos";
import { sumarDias } from "@/lib/datos";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/base", notFound: () => { throw new Error("notFound"); } }));

const k = conocimiento();
const { revisar_dias: R, vencido_dias: V } = k.convenciones.vigencia;
const aprobadas = k.evidencias.filter((e) => e.estado_aprobacion === "aprobada");
const verificadas = [...new Set(aprobadas.map((e) => e.fecha_verificacion))].sort();
const FECHAS = [...new Set(verificadas.flatMap((f) => [0, R - 1, R, V - 1, V, 100].map((n) => sumarDias(f, n))))].sort();

/** Días civiles entre dos fechas AAAA-MM-DD, por aritmética de calendario (la segunda opinión: no usa el motor). */
const dias = (desde: string, hasta: string) => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
const estado = (n: number) => (n >= V ? "vencido" : n >= R ? "revisar" : "vigente");
const cuentaDe = (evidencias: readonly { fecha_verificacion: string }[], fecha: string) => {
  const c = { vigente: 0, revisar: 0, vencido: 0 };
  for (const e of evidencias) c[estado(dias(e.fecha_verificacion, fecha))]++;
  return c;
};

afterEach(() => {
  cleanup();
  delete process.env.BIGD_FECHA_CONSULTA;
});
beforeAll(() => {
  expect(R).toBe(30);
  expect(V).toBe(60);
});

describe("la matriz sale del dato real", () => {
  it("hay fechas, incluye los umbrales de cada verificación y cubre los tres estados", () => {
    expect(verificadas.length).toBeGreaterThan(0);
    expect(FECHAS.length).toBeGreaterThanOrEqual(6);
    const estados = new Set(FECHAS.flatMap((f) => Object.entries(cuentaDe(aprobadas, f)).filter(([, n]) => n > 0).map(([e]) => e)));
    expect(estados).toEqual(new Set(["vigente", "revisar", "vencido"]));
  });
});

describe("/base en cada fecha de consulta: las etiquetas cambian con la fecha", () => {
  it.each(FECHAS)("%s", async (fecha) => {
    process.env.BIGD_FECHA_CONSULTA = fecha;
    for (const idioma of ["es", "en"] as const) {
      const { container, unmount } = render(await Base({ params: Promise.resolve({ idioma }), searchParams: Promise.resolve({}) }));
      const esperado = cuentaDe(aprobadas, fecha);
      const visto = {
        vigente: container.querySelectorAll("article.evidencia .semaforo-vigente").length,
        revisar: container.querySelectorAll("article.evidencia .semaforo-revisar").length,
        vencido: container.querySelectorAll("article.evidencia .semaforo-vencido").length,
      };
      expect(visto, `${idioma} ${fecha}`).toEqual(esperado);
      unmount();
    }
  });
});

describe("la comparación en cada fecha de evaluación: los totales no cambian y las alertas sí", () => {
  const caso = k.casos[0]!;
  const evaluar = (fecha: string) => evaluacionDe(k, { ...caso, estado_aprobacion: "aprobado", fecha_evaluacion: fecha });
  const base = evaluar(FECHAS[0]!);
  const referencia = base.resultado.tipo === "evaluado" ? JSON.stringify(base.resultado.orden) : null;

  it("el perfil se evalúa (no es un borrador vacío) y tiene totales", () => {
    expect(base.resultado.tipo).toBe("evaluado");
    expect(referencia).not.toBeNull();
  });
  it.each(FECHAS)("%s", (fecha) => {
    const r = evaluar(fecha).resultado;
    expect(r.tipo).toBe("evaluado");
    if (r.tipo !== "evaluado") return;
    expect(JSON.stringify(r.orden), "los totales no dependen de la fecha").toBe(referencia);
    const sustento = new Set(r.celdas.flatMap((c) => c.sustento));
    const evidencias = aprobadas.filter((e) => sustento.has(e.id));
    const esperado = cuentaDe(evidencias, fecha);
    const alertas = alertasDe(r.celdas, evaluar(fecha).entrada.base, fecha);
    expect({ revisar: alertas.filter((a) => a.motivo === "por-revisar").length, vencido: alertas.filter((a) => a.motivo === "vencida").length }, fecha).toEqual({ revisar: esperado.revisar, vencido: esperado.vencido });
  });
});
