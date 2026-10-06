// Las entradas del gate de reproducibilidad del núcleo entre motores (D-S3-15, regla dura 1): los casos de referencia,
// el caso de la maqueta en cuatro variantes y veinte bases pseudoaleatorias fijas. Node (tests/unit/nucleo/huellas)
// y los tres navegadores (nucleo.spec.ts) evalúan las mismas y comparan la huella SHA-256 del texto canónico con
// tests/determinismo/NUCLEO.SHA256SUMS. Sin fast-check: el generador es un xorshift entero propio, el mismo en todos.
// La simulación entra también: la del caso de la maqueta entera (4 semillas × 10 000) y la de cinco bases aleatorias.
import { CASOS_DE_REFERENCIA, canonicoEstricto, entradaSimulacion, evaluar, simular, type Entrada } from "../../src/engine";
import { futuro } from "../unit/nucleo/lib/futuro";

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
  return out;
}
