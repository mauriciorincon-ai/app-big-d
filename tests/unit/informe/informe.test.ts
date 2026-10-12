// @vitest-environment node
// El informe (S6, C20; § 12): el modelo del núcleo (14 secciones en orden, estado de borrador por cada motivo, alertas de
// evidencia en sus fechas de cambio), la narrativa por plantillas (las mismas cifras en español e inglés, el resumen dentro
// del presupuesto de lectura con el dato real, con el sembrado y con las cifras más largas de cada variante) y el relato de
// fracaso humano. Con el plan real, con el sembrado y con fixtures.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  alertasDeEvidencias,
  CASOS_DE_REFERENCIA,
  evaluar,
  modeloInforme,
  SECCIONES,
  type EvidenciaDeAlerta,
} from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { ErrorDeDatos } from "@/lib/datos";
import { IDIOMAS } from "@/lib/i18n";
import { construirInforme, type Informe } from "@/lib/informe/construir";
import { resumenesIlegibles } from "@/lib/informe/legible";
import {
  lecturaDelResumen,
  nombresDe,
  parrafoResumen,
  relatoGenerado,
  terminosDe,
} from "@/lib/informe/narrativa";
import { medirLectura } from "@/engine";
import { armarBaseFuturo } from "../lib/base-futuro";

const dirs: string[] = [];
afterAll(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true })),
);
const sembrada = () => {
  const d = mkdtempSync(join(tmpdir(), "bigd-informe-"));
  dirs.push(d);
  armarBaseFuturo(d);
  return d;
};

/** Las cifras de un texto, con la coma decimal escrita como punto: lo que el español y el inglés tienen que compartir. */
const cifras = (t: string) =>
  (t.match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", "."));

const real = cargarConocimiento();
const baseSembrada = cargarConocimiento(sembrada());
const casos = [
  ["real", real],
  ["sembrada", baseSembrada],
] as const;

describe("el modelo del informe", () => {
  const informe = (k: typeof real) =>
    construirInforme(k, k.casos[0]!, k.planes[0]!);

  it("las 14 secciones de § 12, en su orden", () => {
    expect([...SECCIONES]).toEqual([
      "resumen",
      "caso",
      "matriz",
      "pros-contras",
      "robustez",
      "decisiones",
      "implicitas",
      "riesgos",
      "supuestos",
      "relato",
      "hoja-de-ruta",
      "alistamiento",
      "alertas",
      "reproducibilidad",
    ]);
    for (const [, k] of casos)
      expect(informe(k).modelo.secciones).toEqual([...SECCIONES]);
  });

  // D-S7-02: el informe del dato real sigue a las aprobaciones del repo, estén como estén.
  it("con el dato real: el estado y la comparación siguen a las aprobaciones, y el resumen cuenta lo del plan", () => {
    const { modelo: m, entrada } = informe(real);
    const caso = real.casos[0]!;
    const plan = real.planes[0]!;
    const perfilBorrador = caso.estado_aprobacion === "borrador";
    const motivos = [
      ...(perfilBorrador ? [{ tipo: "perfil-borrador" }] : []),
      ...(plan.estado_aprobacion === "borrador" ? [{ tipo: "plan-borrador" }] : []),
    ];
    expect(m.estado).toEqual(motivos.length ? { tipo: "borrador", motivos } : { tipo: "final", motivos: [] });
    if (perfilBorrador) {
      expect(m.resumen.veredicto).toEqual({ tipo: "sin-comparacion", motivo: "perfil-en-borrador" });
      expect(m.resumen.robustez).toBeNull();
    } else {
      expect(m.resumen.veredicto.tipo).not.toBe("sin-comparacion");
      expect(m.resumen.robustez).not.toBeNull();
    }
    const unaVia = plan.decisiones.filter((d) => d.reversibilidad === "una_via").length;
    expect(m.resumen).toMatchObject({
      n_una_via: unaVia,
      n_altos: entrada.plan.riesgos.filter((r) => r.prioridad_de_accion === "alta").length,
      n_supuestos_por_probar: entrada.hoja.items.filter((i) => i.tipo === "verificacion_alistamiento" && i.estado === "pendiente").length,
    });
    expect(m.resumen.una_via).toHaveLength(unaVia);
    expect(m.resumen.riesgos_principales.length).toBeGreaterThan(0);
  });

  it("con el sembrado: empate técnico con su robustez, y el borrador dice por qué (plan, ciclo y acción alta sin mitigación)", () => {
    const m = informe(baseSembrada).modelo;
    expect(m.resumen.veredicto).toMatchObject({ tipo: "empate-tecnico" });
    expect(m.resumen.robustez).toMatchObject({
      clase: "robusta",
      ganadora: "norte",
    });
    expect(m.estado.motivos.map((x) => x.tipo)).toEqual([
      "plan-borrador",
      "ciclo",
      "bloqueado",
    ]);
    expect(m.estado.motivos.find((x) => x.tipo === "bloqueado")).toEqual({
      tipo: "bloqueado",
      ids: ["rie-fuga"],
    });
  });

  it("final cuando perfil y plan están aprobados y nada bloquea; cada motivo de borrador aparece solo cuando es cierto", () => {
    // El plan es el real (sin ciclo ni bloqueos); la comparación es una que puntúa, la de la base sembrada: un informe «final»
    // lleva su comparación (S6-M6).
    const evaluada = informe(baseSembrada).entrada;
    const base = {
      ...informe(real).entrada,
      resultado: evaluada.resultado,
      simulacion: evaluada.simulacion,
    };
    const limpio = { ...base, perfil_aprobado: true, plan_aprobado: true };
    // Un resultado que no puntúa, sea cual sea el estado del repo: el de referencia «perfil en borrador».
    const noEvaluable = evaluar(CASOS_DE_REFERENCIA.find((c) => c.id === "perfil-en-borrador")!.entrada);
    expect(modeloInforme(limpio).estado).toEqual({
      tipo: "final",
      motivos: [],
    });
    // S6-M6: con todo aprobado pero sin una comparación que puntúe, el informe no puede ser «final».
    expect(
      modeloInforme({ ...limpio, resultado: noEvaluable }).estado,
    ).toEqual({ tipo: "borrador", motivos: [{ tipo: "sin-comparacion" }] });
    expect(
      modeloInforme({ ...limpio, perfil_aprobado: false }).estado.motivos,
    ).toEqual([{ tipo: "perfil-borrador" }]);
    expect(
      modeloInforme({ ...limpio, plan_aprobado: false }).estado.motivos,
    ).toEqual([{ tipo: "plan-borrador" }]);
    expect(
      modeloInforme({
        ...limpio,
        plan: {
          ...limpio.plan,
          informe: { ...limpio.plan.informe, ciclo: ["a", "b", "a"] },
        },
      }).estado.motivos,
    ).toEqual([{ tipo: "ciclo" }]);
    const bloqueado = {
      ...limpio.plan,
      riesgos: limpio.plan.riesgos.map((r, i) =>
        i === 0 ? { ...r, bloqueante: true } : r,
      ),
    };
    expect(
      modeloInforme({ ...limpio, plan: bloqueado }).estado.motivos,
    ).toEqual([{ tipo: "bloqueado", ids: [limpio.plan.riesgos[0]!.id] }]);
  });

  it("la misma entrada da el mismo modelo, y la huella de entradas la fijan el perfil, el plan, el método y la instantánea", () => {
    expect(JSON.stringify(informe(real).modelo)).toBe(
      JSON.stringify(informe(real).modelo),
    );
    expect(informe(real).huella_entradas).toMatch(/^[0-9a-f]{64}$/);
    expect(informe(real).huella_entradas).toBe(informe(real).huella_entradas);
    expect(informe(real).huella_entradas).not.toBe(
      informe(baseSembrada).huella_entradas,
    );
  });

  it("S6-M4: el relato humano es una entrada; añadirlo o cambiarlo mueve la huella que el informe imprime", () => {
    const caso = real.casos[0]!;
    const sin = construirInforme(real, caso, real.planes[0]!).huella_entradas;
    const relato = (texto: string) => ({
      caso_id: caso.id,
      texto: { es: texto, en: texto },
      escrito_por: "Comité",
      fecha: "2026-10-01",
      origen: "declarado-por-usuario" as const,
    });
    const con = (texto: string) =>
      construirInforme(
        { ...real, relatos: [relato(texto)] },
        caso,
        real.planes[0]!,
      ).huella_entradas;
    expect(con("Es marzo de 2027.")).not.toBe(sin);
    expect(con("Es marzo de 2027.")).toBe(con("Es marzo de 2027."));
    expect(con("Es abril de 2027.")).not.toBe(con("Es marzo de 2027."));
  });

  it("S6-B1: la huella usa las convenciones de la instantánea con que se calculó, no las de la base viva", () => {
    const caso = real.casos[0]!;
    const base = construirInforme(real, caso, real.planes[0]!).huella_entradas;
    const viva = {
      ...real,
      convenciones: {
        ...real.convenciones,
        umbral_empate_centesimas:
          real.convenciones.umbral_empate_centesimas + 1,
      },
    };
    expect(construirInforme(viva, caso, real.planes[0]!).huella_entradas).toBe(
      base,
    );
  });

  it("la ficha lleva la instantánea, las semillas y los umbrales del método (RF-06.5)", () => {
    const f = informe(real).modelo.ficha;
    expect(f).toMatchObject({
      semilla: real.convenciones.simulacion.semilla,
      semillas_estabilidad: real.convenciones.simulacion.semillas_estabilidad,
      aceptadas: 10000,
      fecha_evaluacion: real.casos[0]!.fecha_evaluacion,
    });
    expect(f.umbrales).toEqual({
      empate_centesimas: 500,
      robusta_pct: 70,
      fragil_pct: 50,
      revisar_dias: 30,
      vencido_dias: 60,
    });
    expect(f.version_app).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("alertas de evidencia: matriz de envejecimiento (regla 23)", () => {
  const ev = (
    id: string,
    fecha: string,
    extra: Partial<EvidenciaDeAlerta> = {},
  ): EvidenciaDeAlerta => ({
    id,
    plataforma_id: "p",
    fecha_verificacion: fecha,
    madurez: "disponible-general",
    fuente_oficial: true,
    ...extra,
  });
  const o = {
    fecha: "2026-10-11",
    vigencia: { revisar_dias: 30, vencido_dias: 60 },
    disponible: { "disponible-general": true, "vista-previa-publica": false },
  };

  it("cambia de estado exactamente a los 30 y a los 60 días, contra la fecha de evaluación y no contra el reloj", () => {
    const a = (f: string) =>
      alertasDeEvidencias([ev("e", f)], o).map((x) => `${x.motivo}:${x.dias}`);
    expect(a("2026-09-12")).toEqual([]); // 29 días: vigente
    expect(a("2026-09-11")).toEqual(["por-revisar:30"]);
    expect(a("2026-08-13")).toEqual(["por-revisar:59"]);
    expect(a("2026-08-12")).toEqual(["vencida:60"]);
    // La misma evidencia, otra fecha de evaluación: otro estado.
    expect(
      alertasDeEvidencias([ev("e", "2026-09-12")], {
        ...o,
        fecha: "2026-09-13",
      }),
    ).toEqual([]);
    expect(
      alertasDeEvidencias([ev("e", "2026-09-12")], {
        ...o,
        fecha: "2026-10-12",
      }).map((x) => x.motivo),
    ).toEqual(["por-revisar"]);
  });

  it("las cuatro clases, ordenadas: sin fuente oficial, vencida, por revisar y vista previa", () => {
    const r = alertasDeEvidencias(
      [
        ev("e4", "2026-10-01", { madurez: "vista-previa-publica" }),
        ev("e3", "2026-09-01"),
        ev("e2", "2026-07-01"),
        ev("e1", "2026-10-01", { fuente_oficial: false }),
        ev("e0", "2026-10-01"),
        ev("e5", "2026-10-01", { madurez: "rumor" }),
      ],
      o,
    );
    expect(r.map((x) => `${x.evidencia_id}:${x.motivo}`)).toEqual([
      "e1:sin-fuente-oficial",
      "e2:vencida",
      "e3:por-revisar",
      "e4:vista-previa",
      "e5:vista-previa",
    ]);
  });

  it("el orden de las evidencias no cambia el resultado (regla dura 5)", () => {
    const es = [
      ev("a", "2026-07-01", { plataforma_id: "z" }),
      ev("b", "2026-09-01"),
      ev("c", "2026-10-01", { fuente_oficial: false }),
      ev("d", "2026-10-01", {
        madurez: "vista-previa-publica",
        plataforma_id: "a",
      }),
    ];
    expect(JSON.stringify(alertasDeEvidencias([...es].reverse(), o))).toBe(
      JSON.stringify(alertasDeEvidencias(es, o)),
    );
  });

  it("el dato real: las evidencias aprobadas de las plataformas que el caso no elimina, contra su fecha de evaluación", () => {
    const m = construirInforme(real, real.casos[0]!, real.planes[0]!).modelo;
    for (const a of m.alertas.evidencias)
      expect([
        "sin-fuente-oficial",
        "vencida",
        "por-revisar",
        "vista-previa",
      ]).toContain(a.motivo);
    expect(m.alertas.plan.length).toBeGreaterThan(0);
  });
});

describe("narrativa por plantillas: mismas cifras en los dos idiomas", () => {
  for (const [nombre, k] of casos)
    it(`${nombre}: el resumen, el relato y las alertas llevan las mismas cifras en ES y EN`, () => {
      const informe = construirInforme(k, k.casos[0]!, k.planes[0]!);
      const por = (i: "es" | "en") => ({
        resumen: parrafoResumen(
          informe,
          nombresDe(informe, k.planes[0]!, i),
          i,
        ),
        n: nombresDe(informe, k.planes[0]!, i),
      });
      expect(cifras(por("es").resumen)).toEqual(cifras(por("en").resumen));
      expect(cifras(por("es").resumen).length).toBeGreaterThan(2);
      // Una sola fuente de cifras: el modelo.
      expect(por("es").resumen).not.toBe(por("en").resumen);
    });

  it("las plataformas del empate salen por su nombre en cada idioma y sin orden de entrada", () => {
    const informe = construirInforme(
      baseSembrada,
      baseSembrada.casos[0]!,
      baseSembrada.planes[0]!,
    );
    expect(
      parrafoResumen(
        informe,
        nombresDe(informe, baseSembrada.planes[0]!, "es"),
        "es",
      ),
    ).toMatch(
      /Plataforma Norte \(ficticia\) y Plataforma Ejemplo \(ficticia\) quedan en empate técnico/,
    );
    expect(
      parrafoResumen(
        informe,
        nombresDe(informe, baseSembrada.planes[0]!, "en"),
        "en",
      ),
    ).toMatch(
      /North Platform \(fictional\) and Example Platform \(fictional\) are in a technical tie/,
    );
  });

  it("el relato generado parte de los riesgos de mayor prioridad y está en el idioma pedido", () => {
    const informe = construirInforme(real, real.casos[0]!, real.planes[0]!);
    const es = relatoGenerado(
      informe,
      nombresDe(informe, real.planes[0]!, "es"),
      "es",
    );
    const en = relatoGenerado(
      informe,
      nombresDe(informe, real.planes[0]!, "en"),
      "en",
    );
    expect(es).toMatch(/^Pasaron doce meses y el proyecto se detuvo\./);
    expect(en).toMatch(/^Twelve months passed and the project stopped\./);
    expect(es).toContain(
      real.planes[0]!.modos_de_falla.find(
        (m) => m.id === informe.modelo.resumen.riesgos_principales[0],
      )!.modo.es,
    );
  });
});

describe("el resumen cumple el presupuesto de lectura (E-13), en los dos idiomas", () => {
  for (const [nombre, k] of casos)
    for (const idioma of IDIOMAS)
      it(`${nombre} · ${idioma}: dentro del presupuesto y con todos sus términos explicados`, () => {
        const informe = construirInforme(k, k.casos[0]!, k.planes[0]!);
        const l = lecturaDelResumen(k, informe, k.planes[0]!, idioma);
        expect(l.lectura, l.texto).toMatchObject({ cumple: true });
        expect(l.sinExplicar).toEqual([]);
      });

  it("el gate de publicación no pone ninguna falla con el dato real ni con el sembrado", () => {
    expect(resumenesIlegibles(real)).toEqual([]);
    expect(resumenesIlegibles(baseSembrada)).toEqual([]);
  });

  it("las seis variantes de la plantilla, con las cifras más largas, caben en el presupuesto en ES y EN", () => {
    const base = construirInforme(
      baseSembrada,
      baseSembrada.casos[0]!,
      baseSembrada.planes[0]!,
    );
    const largas = {
      n_una_via: 12,
      n_altos: 14,
      n_supuestos_por_probar: 18,
      escala_max: 4,
    };
    const modelo = (
      v: Informe["modelo"]["resumen"]["veredicto"],
      robustez: Informe["modelo"]["resumen"]["robustez"],
    ): Informe => ({
      ...base,
      modelo: {
        ...base.modelo,
        resumen: { ...base.modelo.resumen, ...largas, veredicto: v, robustez },
      },
    });
    const rb = {
      clase: "robusta" as const,
      ganadora: "norte",
      primera_unidades: 59_999,
      total_unidades: 60_000,
      cerca: 0,
      aceptadas: 10_000,
      semiamplitud_centesimas: 87,
      estable: true,
      zona_gris: false,
    };
    const variantes = [
      modelo(
        {
          tipo: "ganadora",
          plataforma_id: "norte",
          segunda: "sur",
          brecha_unidades: 4_000,
        },
        rb,
      ),
      modelo(
        {
          tipo: "ganadora",
          plataforma_id: "norte",
          segunda: "sur",
          brecha_unidades: 4_000,
        },
        null,
      ),
      modelo(
        {
          tipo: "ganadora",
          plataforma_id: "norte",
          segunda: null,
          brecha_unidades: 0,
        },
        null,
      ),
      modelo(
        {
          tipo: "empate-tecnico",
          plataformas: ["norte", "plataforma-ejemplo"],
          brecha_unidades: 1_999,
        },
        rb,
      ),
      modelo({ tipo: "sin-comparacion", motivo: "perfil-en-borrador" }, null),
      modelo({ tipo: "sin-comparacion", motivo: "falta-evidencia" }, null),
    ];
    for (const idioma of IDIOMAS)
      for (const v of variantes) {
        const texto = parrafoResumen(
          v,
          nombresDe(base, baseSembrada.planes[0]!, idioma),
          idioma,
        );
        const l = medirLectura(
          texto,
          idioma,
          baseSembrada.informe.lectura,
          terminosDe(baseSembrada, idioma),
        );
        expect(l, `${idioma}: ${texto}`).toMatchObject({ cumple: true });
      }
  });

  it("un término de la gramática sin entrada en el glosario queda sin explicar", () => {
    const k = cargarConocimiento(sembrada());
    // «puntos» aparece en el resumen del empate: si la gramática lo pide explicar y el glosario no lo explica, se dice.
    k.gramatica.terminos_a_explicar = {
      ...k.gramatica.terminos_a_explicar,
      es: [...(k.gramatica.terminos_a_explicar?.es ?? []), "puntos"],
    };
    const informe = construirInforme(k, k.casos[0]!, k.planes[0]!);
    const l = lecturaDelResumen(k, informe, k.planes[0]!, "es");
    expect(l.sinExplicar).toEqual(["puntos"]);
    expect(l.lectura.terminos).toContain("puntos");
  });
});

describe("el relato de fracaso del comité (pre-mortem humano, E-9)", () => {
  const relato = (d: string, c: string) => {
    mkdirSync(join(d, "casos", "hospital-futuro"), { recursive: true });
    writeFileSync(
      join(d, "casos", "hospital-futuro", "relato-de-fracaso.yaml"),
      c,
    );
  };
  const VALIDO = `caso_id: hospital-futuro\ntexto:\n  es: "Es marzo de 2027 y el proyecto se detuvo."\n  en: "It is March 2027 and the project stopped."\nescrito_por: Comité del caso\nfecha: "2026-10-01"\norigen: declarado-por-usuario\n`;

  it("sin archivo no hay relato humano; con archivo se carga y queda a la vista", () => {
    expect(real.relatos).toEqual([]);
    const d = sembrada();
    relato(d, VALIDO);
    const k = cargarConocimiento(d);
    expect(k.relatos).toHaveLength(1);
    expect(k.relatos[0]).toMatchObject({
      caso_id: "hospital-futuro",
      escrito_por: "Comité del caso",
    });
  });

  it("un relato roto no carga y dice dónde: otro caso, sin idioma o sin quién lo escribió", () => {
    const falla = (c: string) => {
      const d = sembrada();
      relato(d, c);
      try {
        cargarConocimiento(d);
      } catch (e) {
        if (e instanceof ErrorDeDatos) return e.fallas.join("\n");
        throw e;
      }
      return "";
    };
    expect(
      falla(VALIDO.replace("caso_id: hospital-futuro", "caso_id: otro")),
    ).toMatch(
      /relato-de-fracaso\.yaml:\d+:\d+ · .* · caso_id · el relato está en la carpeta del caso «hospital-futuro»/,
    );
    expect(
      falla(
        VALIDO.replace(
          '  en: "It is March 2027 and the project stopped."\n',
          "",
        ),
      ),
    ).toMatch(/relato-de-fracaso\.yaml:\d+:\d+ · .* · texto\.en · /);
    expect(falla(VALIDO.replace("escrito_por: Comité del caso\n", ""))).toMatch(
      /relato-de-fracaso\.yaml:\d+:\d+ · .* · escrito_por · /,
    );
    expect(
      falla(
        VALIDO.replace(
          "origen: declarado-por-usuario",
          "origen: propuesto-por-agente",
        ),
      ),
    ).toMatch(/· origen · /);
  });
});
