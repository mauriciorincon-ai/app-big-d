// El caso en el build (src/lib/caso/casos.ts) y las rutas de sus pestañas: el borrador del repo se mira contra la base
// viva y no puntúa (dice qué falta); la base sembrada se evalúa contra su instantánea y trae su robustez del build.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { conocimiento, congeladaDe, evaluacionDe, idsDeCasos } from "@/lib/caso/casos";
import { pestanasCaso, pestanasConocimiento, rutaBase, rutaCaso, rutaComparacion } from "@/lib/caso/rutas";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { textos } from "@/lib/i18n";
import { armarBaseSabana } from "../lib/base-sabana";

const dir = mkdtempSync(join(tmpdir(), "bigd-casos-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("el caso del repo (borrador)", () => {
  it("la base del build se carga una vez por proceso", () => {
    expect(conocimiento()).toBe(conocimiento());
  });

  it("los ids de los casos salen del nombre de sus archivos, sin validar la base", () => {
    expect(idsDeCasos()).toContain("hospital-sabana");
    expect(idsDeCasos(join(dir, "no-existe"))).toEqual([]);
  });

  it("un borrador sin instantánea se mira contra la base viva y no puntúa: dice que es borrador y qué evidencia falta", () => {
    const k = conocimiento();
    const caso = k.casos.find((c) => c.id === "hospital-sabana")!;
    expect(caso.estado_aprobacion).toBe("borrador");
    expect(congeladaDe(k, caso).version).toBe("base-viva");
    const e = evaluacionDe(k, caso);
    expect(e.simulacion).toBeNull();
    if (e.resultado.tipo !== "no-evaluable") throw new Error("el borrador no debía evaluarse");
    expect(e.resultado.motivos.map((m) => m.motivo)).toEqual(["perfil-en-borrador", "falta-evidencia"]);
    const falta = e.resultado.motivos.find((m) => m.motivo === "falta-evidencia");
    // Ejemplo sale por su restricción: quedan las reales, cada una sin sus criterios.
    const reales = k.plataformas.filter((p) => !p.ficticia).length;
    expect(falta && "faltantes" in falta ? falta.faltantes.length : 0).toBe(reales * caso.criterios.length);
  });

  it("un caso que cita una instantánea que no está en la base es un error, no la base viva", () => {
    const k = conocimiento();
    const caso = { ...k.casos[0]!, instantanea: "2099-01-01.1" };
    expect(() => congeladaDe(k, caso)).toThrow(/2099-01-01\.1/);
  });
});

describe("el caso de la base sembrada (aprobado)", () => {
  it("se evalúa contra su instantánea y trae la robustez con los pesos del perfil", () => {
    const version = armarBaseSabana(dir);
    const k = cargarConocimiento(dir);
    const e = evaluacionDe(k, k.casos[0]!);
    expect(e.congelada.version).toBe(version);
    expect(e.resultado.tipo).toBe("evaluado");
    expect(e.simulacion?.ganadora).toBe("norte");
    expect(e.simulacion?.clase).toBe("robusta");
  });
});

describe("rutas y pestañas de las secciones Conocimiento y Caso", () => {
  const t = textos("es").secciones;
  it("las rutas", () => {
    expect([rutaBase("es"), rutaCaso("en", "x"), rutaComparacion("es", "x")]).toEqual(["/es/base", "/en/casos/x", "/es/casos/x/comparacion"]);
  });
  it("05–06 con la actual marcada; 07–10 con 09 y 10 pendientes (sin ruta)", () => {
    expect(pestanasConocimiento(t, "es", "/es/investigador/fabric", "base").map((p) => [p.n, p.ruta, !!p.actual])).toEqual([
      ["05", "/es/investigador/fabric", false],
      ["06", "/es/base", true],
    ]);
    expect(pestanasCaso(t, "es", "x", "comparacion").map((p) => [p.n, p.ruta ?? null, !!p.actual])).toEqual([
      ["07", "/es/casos/x", false],
      ["08", "/es/casos/x/comparacion", true],
      ["09", null, false],
      ["10", null, false],
    ]);
  });
});
