// Las entradas del gate de reproducibilidad del núcleo entre motores (D-S3-15, regla dura 1): los casos de referencia,
// el caso de la maqueta en cuatro variantes y veinte bases pseudoaleatorias fijas. Node (tests/unit/nucleo/huellas)
// y los tres navegadores (nucleo.spec.ts) evalúan las mismas y comparan la huella SHA-256 del texto canónico con
// tests/determinismo/NUCLEO.SHA256SUMS. Sin fast-check: el generador es un xorshift entero propio, el mismo en todos.
// La simulación entra también: la del caso de la maqueta entera (4 semillas × 10 000) y la de cinco bases aleatorias.
// El plan del caso (S5: ondas, prioridad de acción, residual, recomendación y alertas) entra con seis variantes.
// S6: la hoja de ruta de cada variante del plan, la medida de lectura del E-13 en español y en inglés (sílabas, palabras y
// términos con expresiones regulares Unicode) y el modelo del informe de cinco variantes, con perfil y plan aprobados o no.
import { CASOS_DE_REFERENCIA, canonicoEstricto, comparacionDe, entradaSimulacion, evaluar, hojaDeRuta, medirLectura, modeloInforme, planDe, simular, type Entrada, type EntradaPlan, type EntradaRuta, type ResultadoPlan } from "../../src/engine";
import { futuro } from "../unit/nucleo/lib/futuro";
import { planCon, VARIANTES_PLAN } from "../unit/nucleo/lib/plan";

/** La entrada de la hoja de ruta de un plan de las pruebas: una categoría para todos y los momentos de las mitigaciones por turno. */
function entradaRuta(e: EntradaPlan, plan: ResultadoPlan): EntradaRuta {
  const momentos = ["antes", "durante", "despues"] as const;
  return {
    decisiones: e.decisiones.map((d) => ({ id: d.id, reversibilidad: d.reversibilidad, estado: d.estado, categoria: "datos" })),
    modos_de_falla: e.modos_de_falla.map((m) => ({ id: m.id, decision_id: m.decision_id, ocurrencia: m.ocurrencia, deteccion: m.deteccion, mitigaciones: m.mitigaciones.map((t, i) => ({ momento: momentos[i % 3]!, efecto: t.efecto })) })),
    supuestos: e.supuestos,
    plan,
  };
}

/** Frases de referencia de la medida de lectura: con tildes, diptongos, hiatos, siglas, números y un término a explicar. */
const FRASES_LECTURA = {
  es: ["Norte y Ejemplo quedan en empate técnico: 3,0 puntos de diferencia, menos del margen de 5.", "Antes de decidir: 2 supuestos por probar, 3 decisiones sin vuelta atrás y 1 riesgo de prioridad alta.", "El país creía que el catálogo, la identidad y el CDC se resolvían solos; leíamos «SQL» sin guion.", "Muy bien, hoy hay quien oiga el agua y la guerra del pingüino."],
  en: ["North and Example are in a technical tie: 3.0 points apart, under the 5-point margin.", "Before deciding: 2 assumptions left to test, 3 decisions with no way back and 1 high-priority risk.", "The people wanted the table, the evidence and the SQL planned; they needed it, yes, and you knew.", "Because makes, places, boxes and wanted: the happy system."],
} as const;

function xorshift(semilla: number) {
  let x = semilla >>> 0 || 1;
  return (n: number) => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x % n;
  };
}

/** Una base aleatoria fija: de 2 a 5 plataformas, de 2 a 7 criterios, con topes, esenciales y una restricción. */
function aleatoria(semilla: number): Entrada {
  const r = xorshift(semilla);
  const n = 2 + r(4);
  const k = 2 + r(6);
  const cortes = Array.from({ length: k - 1 }, () => r(10_001)).sort((a, b) => a - b);
  const pesos = [0, ...cortes, 10_000].slice(1).map((x, i, xs) => x - (i ? xs[i - 1]! : 0));
  const P = Array.from({ length: n }, (_, i) => `plat-${String.fromCharCode(97 + i)}`);
  const C = Array.from({ length: k }, (_, j) => `crit-${String.fromCharCode(97 + j)}`);
  const e = futuro();
  return {
    caso: { ...e.caso, id: `aleatoria-${semilla}`, acepta_vista_previa: r(2) === 1, pesos: C.map((criterio_id, j) => ({ criterio_id, peso: pesos[j]!, esencial: r(3) === 0, rango_pct: 10 * r(5) })), restricciones: n > 2 && r(2) ? [{ id: "res-x", elimina: [P[r(n)]!] }] : [] },
    base: {
      ...e.base,
      plataformas: P.map((id) => ({ id })),
      criterios: C.map((id) => ({ id, tipo: "transversal" as const })),
      evidencias: P.flatMap((p) => C.flatMap((c) => Array.from({ length: 1 + (r(4) === 0 ? 1 : 0) }, (_, m) => ({ id: `evi-${p}-${c}-${m}`, plataforma_id: p, criterio_id: c, puntaje: r(5), madurez: ["disponible-general", "beta", "anunciado"][r(3)]!, esencial: m === 0 || r(2) === 1, estado: "aprobada" as const, fecha_verificacion: `2026-0${1 + r(9)}-1${r(10)}` })))),
    },
  };
}

export function casosNucleo(): { caso: string; texto: string }[] {
  const out: { caso: string; texto: string }[] = CASOS_DE_REFERENCIA.map((c) => ({ caso: `referencia-${c.id}`, texto: canonicoEstricto(evaluar(c.entrada)) }));
  const variantes: [string, (e: Entrada) => void][] = [
    ["futuro", () => {}],
    ["futuro-acepta-vista-previa", (e) => void (e.caso.acepta_vista_previa = true)],
    ["futuro-tarde", (e) => void (e.caso.fecha_evaluacion = "2026-12-31")],
    // Justo 60 días después de las verificaciones (2026-09-20): el borde entre «por revisar» y «vencida».
    ["futuro-dia-60", (e) => void (e.caso.fecha_evaluacion = "2026-11-19")],
    ["futuro-gobierno-cero", (e) => {
      const g = e.caso.pesos.find((p) => p.criterio_id === "crit-gobierno")!;
      e.caso.pesos.find((p) => p.criterio_id === "crit-ingesta")!.peso += g.peso;
      g.peso = 0;
    }],
  ];
  for (const [nombre, cambio] of variantes) {
    const e = futuro();
    cambio(e);
    out.push({ caso: nombre, texto: canonicoEstricto(evaluar(e)) });
  }
  for (let s = 1; s <= 20; s++) out.push({ caso: `aleatoria-${s}`, texto: canonicoEstricto(evaluar(aleatoria(s * 7_919))) });
  const simulada = (nombre: string, e: Entrada, aceptadas?: number) => {
    const r = evaluar(e);
    const es = r.tipo === "evaluado" ? entradaSimulacion(e, r) : null;
    if (!es) throw new Error(`${nombre}: sin simulación`);
    out.push({ caso: nombre, texto: canonicoEstricto(simular(aceptadas ? { ...es, aceptadas } : es)) });
  };
  simulada("simulacion-futuro", futuro());
  for (const s of [2, 4, 6, 10, 17]) simulada(`simulacion-aleatoria-${s}`, aleatoria(s * 7_919), 2_000);
  for (const [nombre, cambio] of VARIANTES_PLAN) out.push({ caso: nombre, texto: canonicoEstricto(planDe(planCon(cambio))) });

  // S6: la hoja de ruta de cada variante del plan.
  // Solo las variantes que cambian la estructura: la comparación y la fecha no mueven la hoja de ruta.
  for (const [nombre, cambio] of VARIANTES_PLAN.filter(([n]) => ["plan-empate", "plan-ciclo", "plan-alta-sin-mitigacion"].includes(n))) {
    const e = planCon(cambio);
    const plan = planDe(e);
    out.push({ caso: nombre.replace("plan-", "hoja-de-ruta-"), texto: canonicoEstricto(hojaDeRuta(entradaRuta(e, plan))) });
  }

  // S6: la medida de lectura del E-13, por idioma, sobre frases de referencia.
  const presupuesto = { palabras_max: 50, silabas_max: 95, terminos_max: 1 };
  const terminos = [{ id: "empate", formas: ["empate técnico", "technical tie"] }, { id: "catalogo", formas: ["catálogo"] }, { id: "cdc", formas: ["cdc"] }, { id: "sql", formas: ["sql"] }];
  for (const idioma of ["es", "en"] as const) out.push({ caso: `legibilidad-${idioma}`, texto: canonicoEstricto(FRASES_LECTURA[idioma].map((t) => ({ t, lectura: medirLectura(t, idioma, presupuesto, terminos) }))) });

  // S6: el modelo del informe (las 14 secciones sin texto) con la hoja de ruta, de cinco variantes.
  const base = futuro();
  const resultado = evaluar(base);
  const esSim = resultado.tipo === "evaluado" ? entradaSimulacion(base, resultado) : null;
  const simulacion = esSim ? simular(esSim) : null;
  const informe = (nombre: string, fecha: string, cambio: Parameters<typeof planCon>[0], perfil: boolean, aprobado: boolean) => {
    const e = planCon((x) => {
      cambio(x);
      x.fecha_evaluacion = fecha;
      x.comparacion = comparacionDe(resultado);
    });
    const plan = planDe(e);
    const ruta = entradaRuta(e, plan);
    const hoja = hojaDeRuta(ruta);
    const topes = base.base.escala.topes;
    const modelo = modeloInforme({
      perfil_aprobado: perfil,
      plan_aprobado: aprobado,
      resultado: evaluar({ ...base, caso: { ...base.caso, fecha_evaluacion: fecha } }),
      simulacion,
      plan,
      hoja,
      escala_max: base.base.escala.max,
      fecha_evaluacion: fecha,
      evidencias: base.base.evidencias.filter((x) => x.estado === "aprobada").map((x, i) => ({ id: x.id, plataforma_id: x.plataforma_id, fecha_verificacion: x.fecha_verificacion, madurez: x.madurez, fuente_oficial: i % 3 !== 0 })),
      vigencia: base.base.convenciones.vigencia,
      madurez_disponible: Object.fromEntries(topes.map((t) => [t.madurez, t.disponible])),
      ficha: { instantanea: base.base.instantanea.version, version_app: "0.0.0-fixture", semilla: base.base.convenciones.simulacion.semilla, semillas_estabilidad: base.base.convenciones.simulacion.semillas_estabilidad, aceptadas: base.base.convenciones.simulacion.aceptadas, umbrales: { empate_centesimas: base.base.convenciones.umbral_empate_centesimas, robusta_pct: base.base.convenciones.robustez.robusta_pct, fragil_pct: base.base.convenciones.robustez.fragil_pct, revisar_dias: base.base.convenciones.vigencia.revisar_dias, vencido_dias: base.base.convenciones.vigencia.vencido_dias } },
    });
    out.push({ caso: nombre, texto: canonicoEstricto({ modelo, hoja }) });
  };
  informe("informe-borrador", "2026-10-06", () => {}, false, false);
  informe("informe-tarde", "2026-12-31", () => {}, true, false);
  informe("informe-ciclo", "2026-10-06", (e) => void (e.decisiones[0] = { ...e.decisiones[0]!, depende_de: ["dec-f"] }), true, true);
  informe("informe-alta-sin-mitigacion", "2026-10-06", (e) => void (e.modos_de_falla[0] = { ...e.modos_de_falla[0]!, mitigaciones: [] }), true, true);
  informe("informe-aprobado", "2026-10-06", (e) => void (e.modos_de_falla = e.modos_de_falla.map((m) => ({ ...m, mitigaciones: m.mitigaciones.length ? m.mitigaciones : [{ efecto: { ocurrencia: 1 } }] }))), true, true);
  return out;
}
