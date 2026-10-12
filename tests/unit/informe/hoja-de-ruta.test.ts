// @vitest-environment node
// La hoja de ruta y el alistamiento (S6, C19; RF-06.2–06.3, E-10, regla dura 9): las fases salen del orden de dependencias del
// plan, las pruebas baratas de lo que sostiene una decisión de una vía van antes de cualquier decisión y ningún ítem existe
// sin su origen. Con el plan real y con el sembrado (que trae un ciclo), más propiedades sobre planes sin ciclo generados.
import fc from "fast-check";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  hojaDeRuta,
  origenesHuerfanos,
  planDe,
  type DecisionDelPlan,
  type EntradaRuta,
  type HojaDeRuta,
  type ItemDeRuta,
  type ModoDelPlan,
  type SupuestoDelPlan,
} from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { hojaDeRutaDe, resultadoDelPlan } from "@/lib/informe/entrada";
import { armarBaseFuturo } from "../lib/base-futuro";

const dirs: string[] = [];
afterAll(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true })),
);

const item = (
  h: HojaDeRuta,
  tipo: string,
  id: string,
  indice?: number,
): ItemDeRuta => {
  const x = h.items.find(
    (i) =>
      i.origen.tipo === tipo &&
      i.origen.id === id &&
      (indice === undefined ||
        ("indice" in i.origen && i.origen.indice === indice)),
  );
  if (!x) throw new Error(`no hay ítem de ${tipo} ${id}`);
  return x;
};

describe("el plan real del caso hospitalario", () => {
  const k = cargarConocimiento();
  const caso = k.casos[0]!;
  const plan = k.planes[0]!;
  const r = resultadoDelPlan(plan, caso, {
    tipo: "sin-comparacion",
    motivo: "perfil-en-borrador",
  });
  const { entrada, hoja } = hojaDeRutaDe(plan, k.informe.categorias, r);

  it("cinco fases (de la 0 a la 4) y diecinueve ítems: una tarea por decisión y por mitigación, una verificación por supuesto", () => {
    expect(hoja.fases.map((f) => [f.fase, f.tipo])).toEqual([
      [0, "pruebas"],
      [1, "onda"],
      [2, "onda"],
      [3, "onda"],
      [4, "seguimiento"],
    ]);
    expect(hoja.items).toHaveLength(
      plan.decisiones.length +
        plan.modos_de_falla.reduce((n, m) => n + m.mitigaciones.length, 0) +
        plan.supuestos.length,
    );
    expect(hoja.items).toHaveLength(19);
    expect(hoja.items.filter((i) => i.tipo === "tarea")).toHaveLength(14);
    expect(
      hoja.items.filter((i) => i.tipo === "verificacion_alistamiento"),
    ).toHaveLength(5);
    expect(hoja.sin_fase).toEqual([]);
    expect(hoja.ciclo).toBeNull();
  });

  it("ningún ítem sin origen: cada uno nace de una decisión, una mitigación o un supuesto que existe", () => {
    expect(origenesHuerfanos(hoja, entrada)).toEqual([]);
    for (const i of hoja.items)
      expect(["decision", "mitigacion", "supuesto"]).toContain(i.origen.tipo);
  });

  it("E-10: la prueba barata del directorio (sostiene una decisión de una vía) va en la fase 0, antes de decidirla", () => {
    expect(item(hoja, "supuesto", "sup-directorio-compatible")).toMatchObject({
      fase: 0,
      tipo: "verificacion_alistamiento",
      estado: "pendiente",
    });
    expect(item(hoja, "decision", "dec-identidad").fase).toBeGreaterThan(0);
    // Todas las decisiones de una vía vienen después de TODAS las pruebas baratas de lo que las sostiene.
    for (const s of plan.supuestos)
      for (const dId of s.decisiones)
        if (
          plan.decisiones.find((d) => d.id === dId)!.reversibilidad ===
          "una_via"
        )
          expect(item(hoja, "supuesto", s.id).fase!).toBeLessThan(
            item(hoja, "decision", dId).fase!,
          );
  });

  it("la mitigación «antes» va en la fase de su decisión; la que va «durante» o «despues», en la siguiente", () => {
    for (const m of plan.modos_de_falla)
      m.mitigaciones.forEach((t, i) => {
        const dec = item(hoja, "decision", m.decision_id).fase!;
        expect(item(hoja, "mitigacion", m.id, i).fase, `${m.id}#${i}`).toBe(
          t.momento === "antes" ? dec : dec + 1,
        );
      });
    // rie-fuga-datos-clinicos tiene una «durante» sobre una decisión de la última onda: abre la fase de seguimiento.
    expect(hoja.fases.at(-1)).toMatchObject({ fase: 4, tipo: "seguimiento" });
  });

  it("cada ítem trae la categoría de su decisión y las siete categorías son las de § 6.11", () => {
    for (const i of hoja.items)
      expect([
        "identidad_y_acceso",
        "red_y_seguridad",
        "gobierno",
        "datos",
        "habilidades",
        "presupuesto_y_contratos",
        "operacion",
      ]).toContain(i.categoria);
    expect(item(hoja, "decision", "dec-identidad").categoria).toBe(
      "identidad_y_acceso",
    );
    expect(item(hoja, "decision", "dec-catalogo").categoria).toBe("gobierno");
  });

  it("el criterio de cumplido de una mitigación lleva sus cifras de antes y después; el de lo demás, solo su clave", () => {
    const fuga0 = item(
      hoja,
      "mitigacion",
      "rie-fuga-datos-clinicos",
      0,
    ).criterio_de_cumplido;
    const m = plan.modos_de_falla.find(
      (x) => x.id === "rie-fuga-datos-clinicos",
    )!;
    expect(fuga0).toEqual({
      clave: "mitigacion",
      ocurrencia:
        m.mitigaciones[0]!.efecto.ocurrencia === undefined
          ? null
          : [m.ocurrencia, m.mitigaciones[0]!.efecto.ocurrencia],
      deteccion:
        m.mitigaciones[0]!.efecto.deteccion === undefined
          ? null
          : [m.deteccion, m.mitigaciones[0]!.efecto.deteccion],
    });
    expect(item(hoja, "decision", "dec-catalogo").criterio_de_cumplido).toEqual(
      { clave: "decision" },
    );
    expect(
      item(hoja, "supuesto", "sup-equipo-opera").criterio_de_cumplido,
    ).toEqual({ clave: "supuesto" });
  });

  it("los ids son T-nn y V-nn en el orden de la hoja, sin repetirse", () => {
    expect(hoja.items.map((i) => i.id)).toHaveLength(
      new Set(hoja.items.map((i) => i.id)).size,
    );
    expect(
      hoja.items.filter((i) => i.tipo === "tarea").map((i) => i.id),
    ).toEqual(
      Array.from(
        { length: 14 },
        (_, n) => `T-${String(n + 1).padStart(2, "0")}`,
      ),
    );
    expect(
      hoja.items.filter((i) => i.tipo !== "tarea").map((i) => i.id),
    ).toEqual(["V-01", "V-02", "V-03", "V-04", "V-05"]);
  });
});

describe("el plan sembrado, con un ciclo y una alta sin mitigación", () => {
  const dir = mkdtempSync(join(tmpdir(), "bigd-ruta-"));
  dirs.push(dir);
  armarBaseFuturo(dir);
  const k = cargarConocimiento(dir);
  const plan = k.planes[0]!;
  const r = resultadoDelPlan(plan, k.casos[0]!, {
    tipo: "sin-comparacion",
    motivo: "perfil-en-borrador",
  });
  const { entrada, hoja } = hojaDeRutaDe(plan, k.informe.categorias, r);

  it("un ciclo deja SIN fase y bloqueada a toda decisión (el paquete no ordena nada con un ciclo), con el camino a la vista; nada desaparece", () => {
    expect(hoja.ciclo).not.toBeNull();
    for (const d of plan.decisiones)
      expect(item(hoja, "decision", d.id), d.id).toMatchObject({
        fase: null,
        estado: "bloqueado",
        bloqueo: { tipo: "ciclo" },
      });
    expect(hoja.sin_fase.length).toBeGreaterThan(0);
    expect(hoja.items).toHaveLength(
      plan.decisiones.length +
        plan.modos_de_falla.reduce((n, m) => n + m.mitigaciones.length, 0) +
        plan.supuestos.length,
    );
    expect(origenesHuerfanos(hoja, entrada)).toEqual([]);
  });

  it("aun con el ciclo, la prueba barata de lo que sostiene una decisión de una vía va en la fase 0", () => {
    expect(item(hoja, "supuesto", "sup-directorio")).toMatchObject({ fase: 0 });
    expect(hoja.fases[0]).toMatchObject({ fase: 0, tipo: "pruebas" });
  });

  it("una decisión sin ciclo y con una alta sin mitigación queda bloqueada por ese riesgo; una decidida cuenta como hecha", () => {
    const sin = {
      ...entrada,
      plan: {
        ...r,
        decisiones: r.decisiones.map((d) => ({
          ...d,
          en_ciclo: false,
          onda: 1,
        })),
      },
    };
    expect(
      hojaDeRuta(sin).items.find((i) => i.origen.id === "dec-proteccion"),
    ).toMatchObject({
      estado: "bloqueado",
      bloqueo: { tipo: "riesgo", id: "rie-fuga" },
    });
    const decidida = {
      ...sin,
      decisiones: sin.decisiones.map((d) =>
        d.id === "dec-proteccion" ? { ...d, estado: "decidida" as const } : d,
      ),
    };
    expect(
      hojaDeRuta(decidida).items.find((i) => i.origen.id === "dec-proteccion"),
    ).toMatchObject({ estado: "hecho", bloqueo: null });
  });
});

// --- propiedades sobre planes sin ciclo generados -------------------------------------------------------------------
const REV = ["una_via", "costosa", "dos_vias"] as const;
const ESTADOS = ["pendiente", "esperando-prueba", "decidida"] as const;
const MOMENTOS = ["antes", "durante", "despues"] as const;
const dec = (i: number) => `dec-${String(i).padStart(2, "0")}`;

const arbEspecificacion = fc.integer({ min: 2, max: 7 }).chain((n) =>
  fc.record({
    n: fc.constant(n),
    rev: fc.array(fc.constantFrom(...REV), { minLength: n, maxLength: n }),
    estado: fc.array(fc.constantFrom(...ESTADOS), {
      minLength: n,
      maxLength: n,
    }),
    // bits[i][j] = ¿la decisión i depende de la j < i? Solo hacia atrás: sin ciclo.
    bits: fc.array(fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }), {
      minLength: n,
      maxLength: n,
    }),
    modos: fc.array(
      fc.record({
        dec: fc.integer({ min: 0, max: n - 1 }),
        s: fc.integer({ min: 1, max: 10 }),
        o: fc.integer({ min: 1, max: 10 }),
        d: fc.integer({ min: 1, max: 10 }),
        mit: fc.array(
          fc.record({
            momento: fc.constantFrom(...MOMENTOS),
            o: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
            d: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
          }),
          { maxLength: 3 },
        ),
      }),
      { maxLength: 6 },
    ),
    sups: fc.array(
      fc.record({
        decs: fc.uniqueArray(fc.integer({ min: 0, max: n - 1 }), {
          minLength: 1,
          maxLength: 3,
        }),
        estado: fc.constantFrom(
          "sin_probar",
          "confirmado",
          "refutado",
        ) as fc.Arbitrary<SupuestoDelPlan["estado"]>,
      }),
      { maxLength: 6 },
    ),
  }),
);
function construir(
  e: {
    n: number;
    rev: readonly (typeof REV)[number][];
    estado: readonly (typeof ESTADOS)[number][];
    bits: readonly (readonly boolean[])[];
    modos: readonly {
      dec: number;
      s: number;
      o: number;
      d: number;
      mit: readonly {
        momento: (typeof MOMENTOS)[number];
        o?: number | undefined;
        d?: number | undefined;
      }[];
    }[];
    sups: readonly {
      decs: readonly number[];
      estado: SupuestoDelPlan["estado"];
    }[];
  },
  ciclo = false,
) {
  const decisiones: DecisionDelPlan[] = Array.from({ length: e.n }, (_, i) => ({
    id: dec(i),
    reversibilidad: e.rev[i]!,
    implicita: false,
    estado: e.estado[i]!,
    opciones_por_plataforma: [],
    depende_de: [
      ...Array.from({ length: i }, (_, j) => j)
        .filter((j) => e.bits[i]![j])
        .map(dec),
      ...(ciclo && i === 0 ? [dec(e.n - 1)] : []),
    ],
  }));
  const modos: ModoDelPlan[] = e.modos.map((m, k) => ({
    id: `rie-${String(k).padStart(2, "0")}`,
    decision_id: dec(m.dec),
    severidad: m.s,
    ocurrencia: m.o,
    deteccion: m.d,
    mitigaciones: m.mit.map((t) => ({
      efecto: {
        ...(t.o === undefined ? {} : { ocurrencia: Math.min(t.o, m.o) }),
        ...(t.d === undefined ? {} : { deteccion: Math.min(t.d, m.d) }),
      },
    })),
  }));
  const supuestos: SupuestoDelPlan[] = e.sups.map((s, k) => ({
    id: `sup-${String(k).padStart(2, "0")}`,
    criticidad: "media",
    prueba_barata: { es: "x", en: "x" },
    estado: s.estado,
    decisiones: s.decs.map(dec),
  }));
  const plan = planDe({
    decisiones,
    modos_de_falla: modos,
    supuestos,
    fecha_evaluacion: "2026-10-11",
    comparacion: { tipo: "sin-comparacion", motivo: "x" },
  });
  const entrada: EntradaRuta = {
    decisiones: decisiones.map((d) => ({
      id: d.id,
      reversibilidad: d.reversibilidad,
      estado: d.estado,
      categoria: "datos",
    })),
    modos_de_falla: modos.map((m, k) => ({
      id: m.id,
      decision_id: m.decision_id,
      ocurrencia: m.ocurrencia,
      deteccion: m.deteccion,
      mitigaciones: e.modos[k]!.mit.map((t, i) => ({
        momento: t.momento,
        efecto: m.mitigaciones[i]!.efecto,
      })),
    })),
    supuestos,
    plan,
  };
  return { entrada, hoja: hojaDeRuta(entrada), plan };
}

const config = { seed: 20261011, numRuns: 300 };

describe("propiedades sobre planes sin ciclo (fast-check, semilla y corridas fijas)", () => {
  it("todo ítem tiene un origen que existe, y cada decisión, mitigación y supuesto aparece una vez", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        const { entrada, hoja } = construir(e);
        const esperados =
          e.n + e.modos.reduce((n, m) => n + m.mit.length, 0) + e.sups.length;
        return (
          origenesHuerfanos(hoja, entrada).length === 0 &&
          hoja.items.length === esperados &&
          new Set(
            hoja.items.map(
              (i) =>
                `${i.origen.tipo}:${i.origen.id}:${"indice" in i.origen ? i.origen.indice : ""}`,
            ),
          ).size === esperados
        );
      }),
      config,
    );
  });

  it("E-10: lo que sostiene una decisión de una vía se prueba en la fase 0, antes de ella y de cualquier otra decisión", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        const { hoja } = construir(e);
        const fase = (tipo: string, id: string) =>
          hoja.items.find((i) => i.origen.tipo === tipo && i.origen.id === id)!
            .fase!;
        const sup = (k: number) => fase("supuesto", `sup-${String(k).padStart(2, "0")}`);
        return e.sups.every((s, k) =>
          s.decs.every((d) => e.rev[d] !== "una_via" || (sup(k) === 0 && sup(k) < fase("decision", dec(d)))),
        );
      }),
      config,
    );
  });

  it("las fases son contiguas y, sin ciclo, ningún ítem queda sin fase", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        const { hoja } = construir(e);
        const fs = hoja.fases.map((f) => f.fase);
        return (
          hoja.sin_fase.length === 0 &&
          fs.every((f, i) => i === 0 || f === fs[i - 1]! + 1) &&
          fs.every((f) => f >= 0) &&
          hoja.fases.flatMap((f) => f.items).length === hoja.items.length
        );
      }),
      config,
    );
  });

  it("una mitigación «antes» comparte la fase de su decisión; las demás van una después", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        const { hoja } = construir(e);
        return e.modos.every((m, k) =>
          m.mit.every((t, i) => {
            const mi = hoja.items.find(
              (x) =>
                x.origen.tipo === "mitigacion" &&
                x.origen.id === `rie-${String(k).padStart(2, "0")}` &&
                "indice" in x.origen &&
                x.origen.indice === i,
            )!;
            const d = hoja.items.find(
              (x) => x.origen.tipo === "decision" && x.origen.id === dec(m.dec),
            )!;
            return mi.fase === (t.momento === "antes" ? d.fase : d.fase! + 1);
          }),
        );
      }),
      config,
    );
  });

  it("el orden de las entradas no cambia la hoja de ruta (regla dura 5)", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        const { entrada, hoja } = construir(e);
        const alReves: EntradaRuta = {
          ...entrada,
          decisiones: [...entrada.decisiones].reverse(),
          modos_de_falla: [...entrada.modos_de_falla].reverse(),
          supuestos: [...entrada.supuestos].reverse(),
        };
        return JSON.stringify(hojaDeRuta(alReves)) === JSON.stringify(hoja);
      }),
      config,
    );
  });

  it("con un ciclo, lo que toca queda sin fase y bloqueado, y nada se pierde", () => {
    fc.assert(
      fc.property(arbEspecificacion, (e) => {
        // Si la primera decisión depende ya de la última, o viceversa por la cadena, el ciclo cierra; si no se forma, se salta el caso.
        const { entrada, hoja, plan } = construir(e, true);
        if (!plan.informe.ciclo) return true;
        const esperados =
          e.n + e.modos.reduce((n, m) => n + m.mit.length, 0) + e.sups.length;
        const sinOnda = new Set(
          plan.decisiones.filter((d) => d.onda === null).map((d) => d.id),
        );
        return (
          hoja.items.length === esperados &&
          origenesHuerfanos(hoja, entrada).length === 0 &&
          hoja.items
            .filter(
              (i) => i.origen.tipo === "decision" && sinOnda.has(i.origen.id),
            )
            .every(
              (i) =>
                i.fase === null &&
                (i.estado === "bloqueado" || i.estado === "hecho"),
            )
        );
      }),
      config,
    );
  });
});
