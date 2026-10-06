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
import { armarBaseFuturo } from "../lib/base-futuro";

const dir = mkdtempSync(join(tmpdir(), "bigd-casos-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("el caso del repo (borrador)", () => {
  it("la base del build se carga una vez por proceso", () => {
    expect(conocimiento()).toBe(conocimiento());
  });

  it("los ids de los casos salen del nombre de sus archivos, sin validar la base", () => {
    expect(idsDeCasos()).toContain("hospital-futuro");
    expect(idsDeCasos(join(dir, "no-existe"))).toEqual([]);
  });

  it("un borrador se mira contra su instantánea (o la base viva si aún no tiene) y no puntúa: dice que es borrador y, si falta, qué evidencia", () => {
    const k = conocimiento();
    const caso = k.casos.find((c) => c.id === "hospital-futuro")!;
    expect(caso.estado_aprobacion).toBe("borrador");
    const congelada = congeladaDe(k, caso);
    expect(congelada.version).toBe(caso.instantanea ?? "base-viva");
    const e = evaluacionDe(k, caso);
    expect(e.simulacion).toBeNull();
    if (e.resultado.tipo !== "no-evaluable") throw new Error("el borrador no debía evaluarse");
    // Ejemplo sale por su restricción: quedan las reales, y de cada una los criterios del caso sin una evidencia
    // aprobada. Se cuenta aquí desde el dato (no con el motor), para que la prueba siga a cada aprobación.
    const criterioDe = (e: (typeof k.evidencias)[number]) => e.criterio_id ?? k.criterios.find((c) => c.capacidad_id === e.capacidad_id)?.id;
    const cubiertas = new Set(congelada.contenido.evidencias.filter((e) => e.estado_aprobacion === "aprobada").map((e) => `${e.plataforma_id} ${criterioDe(e)}`));
    const esperadas = k.plataformas
      .filter((p) => !p.ficticia)
      .flatMap((p) => caso.criterios.filter((c) => !cubiertas.has(`${p.id} ${c.criterio_id}`)).map((c) => `${p.id} ${c.criterio_id}`));
    // Con las 33 evidencias reales aprobadas (S3, P1–P3) y congeladas no falta ninguna: el único motivo es el borrador.
    expect(e.resultado.motivos.map((m) => m.motivo)).toEqual(["perfil-en-borrador", ...(esperadas.length ? ["falta-evidencia"] : [])]);
    const falta = e.resultado.motivos.find((m) => m.motivo === "falta-evidencia");
    const faltantes = falta && "faltantes" in falta ? falta.faltantes.map((f) => `${f.plataforma_id} ${f.criterio_id}`) : [];
    expect(faltantes.toSorted()).toEqual(esperadas.toSorted());
  });

  it("un caso que cita una instantánea que no está en la base es un error, no la base viva", () => {
    const k = conocimiento();
    const caso = { ...k.casos[0]!, instantanea: "2099-01-01.1" };
    expect(() => congeladaDe(k, caso)).toThrow(/2099-01-01\.1/);
  });
});

describe("el caso de la base sembrada (aprobado)", () => {
  it("se evalúa contra su instantánea y trae la robustez con los pesos del perfil", () => {
    const version = armarBaseFuturo(dir);
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
