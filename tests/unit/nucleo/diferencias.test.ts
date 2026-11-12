// @vitest-environment node
// D2 (S8): las diferencias entre instantáneas en el núcleo. Propiedad: una instantánea frente a ella misma no tiene
// diferencias (y el orden del archivo no importa). La clasificación coincide con los `cambios` que guarda la instantánea
// (cambiosEntre, la de la carga): dos definiciones que no pueden separarse. Con la base sembrada de dos instantáneas, la
// página de la base dice qué evidencia cambió, en qué campos, y qué pasa con el caso.
import fc from "fast-check";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  diferenciasEvidencias,
  impactoEnCaso,
  resumenResultado,
  type Resultado,
} from "@/engine";
import { diferenciasDeLaBase } from "@/lib/caso/diferencias";
import {
  cargarConocimiento,
  type Conocimiento,
} from "@/lib/datos/cargar-conocimiento";
import { cambiosEntre } from "@/lib/datos/instantanea";
import { armarBaseFuturo, EVIDENCIA_CAMBIADA } from "../lib/base-futuro";

const evidencia = fc.record({
  id: fc.stringMatching(/^evi-[a-e]{1,3}$/),
  puntaje: fc.integer({ min: 0, max: 4 }),
  madurez: fc.constantFrom("beta", "disponible-general"),
  fuentes: fc.array(
    fc.record({
      url: fc.constant("https://example.org/x"),
      titulo: fc.string(),
    }),
    { maxLength: 2 },
  ),
});
const lista = fc.uniqueArray(evidencia, {
  selector: (e) => e.id,
  maxLength: 12,
});

describe("diferenciasEvidencias", () => {
  it("una instantánea frente a ella misma: ninguna diferencia, en cualquier orden y con las claves en cualquier orden", () => {
    fc.assert(
      fc.property(lista, (xs) => {
        const reordenada = [...xs]
          .reverse()
          .map(
            (e) => Object.fromEntries(Object.entries(e).reverse()) as typeof e,
          );
        expect(diferenciasEvidencias(xs, reordenada)).toEqual({
          nuevas: [],
          modificadas: [],
          retiradas: [],
        });
      }),
      { seed: 20261114, numRuns: 200 },
    );
  });

  it("clasifica igual que los `cambios` que guarda la instantánea, en orden total por id", () => {
    fc.assert(
      fc.property(lista, lista, (a, b) => {
        const d = diferenciasEvidencias(a, b);
        const como = [
          ...d.nuevas.map((id) => ({ evidencia_id: id, tipo: "nueva" })),
          ...d.modificadas.map((m) => ({
            evidencia_id: m.id,
            tipo: "modificada",
          })),
          ...d.retiradas.map((id) => ({ evidencia_id: id, tipo: "retirada" })),
        ].sort((x, y) => (x.evidencia_id < y.evidencia_id ? -1 : 1));
        const contenido = (evidencias: unknown[]) =>
          ({ evidencias }) as unknown as Parameters<typeof cambiosEntre>[1];
        expect(como).toEqual(cambiosEntre(contenido(a), contenido(b)));
        for (const m of d.modificadas)
          expect(m.campos).toEqual([...m.campos].sort());
      }),
      { seed: 20261115, numRuns: 200 },
    );
  });

  it("nombra los campos que cambiaron, también uno que aparece o desaparece", () => {
    const a = [
      { id: "evi-a", puntaje: 3, nota: "x" },
      { id: "evi-b", puntaje: 1 },
    ];
    const b = [
      { id: "evi-a", puntaje: 2, extra: true },
      { id: "evi-c", puntaje: 4 },
    ];
    expect(diferenciasEvidencias(a, b)).toEqual({
      nuevas: ["evi-c"],
      modificadas: [{ id: "evi-a", campos: ["extra", "nota", "puntaje"] }],
      retiradas: ["evi-b"],
    });
  });

  it("un id repetido en un lado es un error, no una diferencia", () => {
    expect(() =>
      diferenciasEvidencias([{ id: "evi-a" }, { id: "evi-a" }], []),
    ).toThrow(/«evi-a» aparece dos veces en la primera/);
  });
});

describe("impactoEnCaso", () => {
  const comun = {
    caso_id: "c",
    instantanea: { version: "2026-01-01.1", huella: "0".repeat(64) },
    fecha_evaluacion: "2026-01-01",
    descartadas: [],
  };
  const evaluado = (veredicto: unknown, descartadas: string[] = []) =>
    ({
      ...comun,
      descartadas: descartadas.map((plataforma_id) => ({
        plataforma_id,
        restricciones: ["res-x"],
      })),
      tipo: "evaluado",
      veredicto,
    }) as unknown as Resultado;
  const borrador = {
    ...comun,
    tipo: "no-evaluable",
    motivos: [{ motivo: "perfil-en-borrador" }],
  } as Resultado;

  it("cambia la ganadora, el empate o el bloqueo, cada uno por su lado", () => {
    const a = evaluado({
      tipo: "ganadora-clara",
      plataforma_id: "norte",
      brecha_unidades: 900,
    });
    expect(impactoEnCaso(a, a)).toMatchObject({
      cambia_ganadora: false,
      cambia_empate: false,
      cambia_bloqueo: false,
    });
    expect(
      impactoEnCaso(a, evaluado({ tipo: "unica", plataforma_id: "sur" })),
    ).toMatchObject({
      cambia_ganadora: true,
      cambia_empate: false,
      cambia_bloqueo: false,
    });
    const empate = evaluado({
      tipo: "empate-tecnico",
      plataformas: ["sur", "norte"],
      brecha_unidades: 10,
    });
    expect(resumenResultado(empate)).toEqual({
      evaluable: true,
      ganadora: null,
      empate: ["norte", "sur"],
      descartadas: [],
      motivos: [],
    });
    expect(impactoEnCaso(a, empate)).toMatchObject({
      cambia_ganadora: true,
      cambia_empate: true,
      cambia_bloqueo: false,
    });
    expect(
      impactoEnCaso(
        a,
        evaluado(
          {
            tipo: "ganadora-clara",
            plataforma_id: "norte",
            brecha_unidades: 900,
          },
          ["este"],
        ),
      ),
    ).toMatchObject({ cambia_ganadora: false, cambia_bloqueo: true });
  });

  it("un borrador no se evalúa con ninguna: sin cambio, y el resumen dice por qué", () => {
    expect(impactoEnCaso(borrador, borrador)).toMatchObject({
      antes: { evaluable: false, motivos: ["perfil-en-borrador"] },
      cambia_ganadora: false,
      cambia_empate: false,
      cambia_bloqueo: false,
    });
  });
});

describe("diferenciasDeLaBase (la base sembrada con dos instantáneas)", () => {
  let dir: string;
  let k: Conocimiento;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "bigd-d2-"));
    armarBaseFuturo(dir, { segunda: true });
    k = cargarConocimiento(dir);
  }, 60_000);
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("la segunda frente a la primera: una evidencia modificada en su puntaje y su justificación, y el caso evaluado con las dos", () => {
    expect(k.instantaneas.map((i) => i.version)).toEqual([
      "2026-09-26.1",
      "2026-09-26.2",
    ]);
    const [par] = diferenciasDeLaBase(k);
    expect(par).toMatchObject({
      antes: "2026-09-26.1",
      ahora: "2026-09-26.2",
      evidencias: {
        nuevas: [],
        retiradas: [],
        modificadas: [
          {
            id: EVIDENCIA_CAMBIADA,
            campos: ["justificacion_puntaje", "puntaje"],
          },
        ],
      },
    });
    expect(par!.casos.map((c) => c.caso_id)).toEqual(["hospital-futuro"]);
    expect(
      par!.casos[0]!.antes.evaluable && par!.casos[0]!.ahora.evaluable,
    ).toBe(true);
    expect(k.instantaneas[1]!.cambios).toEqual([
      { evidencia_id: EVIDENCIA_CAMBIADA, tipo: "modificada" },
    ]);
  });

  it("con una sola instantánea no hay nada que comparar", () => {
    expect(
      diferenciasDeLaBase({
        instantaneas: k.instantaneas.slice(0, 1),
        casos: k.casos,
      }),
    ).toEqual([]);
  });
});
