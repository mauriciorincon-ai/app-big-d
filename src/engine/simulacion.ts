// Robustez por simulación (RF-04.6, RF-04.7; SMAA mínimo de la científica § 1.4–1.6; E-2, E-6, E-7, E-11).
//
// Muestreo. Los pesos se muestrean UNIFORMES sobre los puntos enteros del politopo {Σ w = 10 000, lo ≤ w ≤ hi}:
//   · cada rango es relativo a su peso (E-2) y se redondea HACIA DENTRO (lo = ⌈w·(100 − r)/100⌉, hi = ⌊w·(100 + r)/100⌋);
//   · los criterios con rango vacío quedan fijos y salen del muestreo;
//   · los mínimos se trasladan (w = lo + x) y queda un sobrante S = 10 000 − Σ lo que repartir con 0 ≤ x ≤ hi − lo;
//   · cada x libre sale uniforme en su caja (entero acotado por rechazo de sfc32), salvo el de mayor amplitud, que se
//     DESPEJA (S − Σ de los demás); la combinación se acepta si ese despeje cae en su caja, con un tope de intentos que
//     falla CERRADO. Cada punto factible corresponde a una sola tupla de los demás, todas igual de probables: el
//     muestreo es exactamente uniforme.
// Es el equivalente entero y declarado del método de la científica (los espaciados de uniformes ordenados con restos
// mayores no son exactamente uniformes en la rejilla). Se descartó «estrellas y barras» (composición uniforme del
// sobrante y rechazo de los máximos), igual de exacto pero que en el caso de la maqueta acepta el 0,47 % de los
// intentos: 2,1 millones por semilla, 10,9 s en Node. Nada de `log`/`exp` ni de normalizar uniformes independientes.
//
// Salidas, todas enteras. Cada combinación aceptada reparte L = mcm(1..N) unidades de crédito: un empate EXACTO de
// totales entre k plataformas da L/k a cada una en cada uno de esos puestos (E-11; sin leximin en la simulación), así
// que filas y columnas de la aceptabilidad suman K·L. El vector central promedia los pesos con que cada plataforma
// queda primera (restos mayores a 10 000; null si nunca lo queda). La zona gris compara el intervalo del 95 % con cada
// umbral sin raíces ni decimales (BigInt). Corre la semilla principal y luego las de estabilidad; si la clase cambia
// entre semillas o el intervalo cruza un umbral, el resultado es de «frontera» (no hay una cuarta clase).
//
// Corre por pasos: `iniciar` → `avanzar(estado, intentos)` → `resultadoDe`. El resultado no depende del tamaño de paso.

import { comparar, racional } from "./racional";
import { enteroMenorQue, sfc32, type Sfc32 } from "./sfc32";
import { TOTAL } from "./sensibilidad";
import type { Entrada, Resultado } from "./tipos";

/** Con L = mcm(1..N), Σ peso × L × 10 000 combinaciones cabe exacto en doble precisión hasta N = 18. */
export const N_MAX_SIMULACION = 18;

export type Clase = "robusta" | "moderada" | "fragil";

export interface EntradaSimulacion {
  /** Las plataformas evaluadas y los criterios, ordenados por id. */
  plataformas: string[];
  criterios: string[];
  /** [plataforma][criterio], en el orden de arriba. */
  puntajes: number[][];
  /** Centésimas que suman 10 000, y el rango relativo de cada una (por ciento entero). */
  pesos: number[];
  rangos_pct: number[];
  /** La banda del empate técnico en unidades (para «las dos primeras a menos de 5 puntos»). */
  banda: number;
  semillas: number[];
  aceptadas: number;
  tope_intentos: number;
  z_centesimas: number;
  robusta_pct: number;
  fragil_pct: number;
  /** La única plataforma en el primer puesto de la evaluación, o null si el primero es un empate exacto. */
  ganadora: string | null;
  /** RF-04.7: algún punto de inversión cae dentro del rango declarado de su criterio. */
  inversion_en_rango: boolean;
}

export interface ResultadoSemilla {
  semilla: number;
  estado: "completa" | "tope-de-intentos";
  aceptadas: number;
  intentos: number;
  /** [plataforma][puesto], en unidades de crédito (cada combinación reparte L). */
  aceptabilidad: number[][];
  /** Por plataforma: centésimas que suman 10 000, o null si nunca quedó primera. */
  central: (number[] | null)[];
  /** Combinaciones en que las dos primeras quedan a menos de la banda (E-7). */
  cerca: number;
  clase: Clase | null;
  /** El intervalo del 95 % de la ganadora cruza un umbral. */
  zona_gris: boolean;
  /** Media amplitud de ese intervalo, en centésimas de punto porcentual (piso). */
  semiamplitud_centesimas: number | null;
}

export interface ResultadoSimulacion {
  estado: "completa" | "tope-de-intentos";
  plataformas: string[];
  criterios: string[];
  L: number;
  objetivo: number;
  ganadora: string | null;
  /** La principal primero. */
  semillas: ResultadoSemilla[];
  clase: Clase | null;
  /** La misma clase en todas las semillas. */
  estable: boolean;
  /** Inestable entre semillas o con el intervalo sobre un umbral. */
  frontera: boolean;
}

const mcd = (a: number, b: number): number => (b ? mcd(b, a % b) : a);
const mcm = (n: number) => Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => (a / mcd(a, b)) * b, 1);

/** El rango entero, redondeado hacia dentro, de un peso con su incertidumbre relativa. */
export function rangoEntero(w: number, rpct: number): [number, number] {
  const lo = Math.ceil((w * (100 - rpct)) / 100);
  const hi = Math.min(TOTAL, Math.floor((w * (100 + rpct)) / 100));
  return [lo, hi];
}

export interface EstadoSimulacion {
  e: EntradaSimulacion;
  lo: number[];
  hi: number[];
  /** Los criterios libres que se sortean, y el que se despeja (el de mayor amplitud), o -1 si no hay libres. */
  sorteados: number[];
  despejado: number;
  sobrante: number;
  L: number;
  indice: number;
  r: Sfc32;
  aceptadas: number;
  intentos: number;
  acept: number[][];
  sumas: number[][];
  credito: number[];
  cerca: number;
  hechas: ResultadoSemilla[];
  fin: boolean;
}

function nuevaSemilla(s: EstadoSimulacion): void {
  const n = s.e.plataformas.length;
  s.r = sfc32(s.e.semillas[s.indice]!);
  s.aceptadas = 0;
  s.intentos = 0;
  s.acept = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  s.sumas = Array.from({ length: n }, () => new Array<number>(s.e.criterios.length).fill(0));
  s.credito = new Array<number>(n).fill(0);
  s.cerca = 0;
}

export function iniciar(e: EntradaSimulacion): EstadoSimulacion {
  const n = e.plataformas.length;
  if (n < 2) throw new Error("núcleo: la simulación compara al menos dos plataformas");
  if (n > N_MAX_SIMULACION) throw new Error(`núcleo: la simulación admite hasta ${N_MAX_SIMULACION} plataformas (el crédito L = mcm(1..N) dejaría de ser exacto)`);
  if (e.pesos.reduce((a, b) => a + b, 0) !== TOTAL) throw new Error("núcleo: los pesos de la simulación no suman 10 000");
  const rangos = e.pesos.map((w, k) => rangoEntero(w, e.rangos_pct[k]!));
  const lo = rangos.map((x) => x[0]);
  const hi = rangos.map((x) => x[1]);
  const libres = lo.map((l, k) => (l < hi[k]! ? k : -1)).filter((k) => k >= 0);
  // El de mayor amplitud se despeja: la ventana de aceptación es la más ancha posible (a igual amplitud, el primero).
  const despejado = libres.reduce((m, k) => (m < 0 || hi[k]! - lo[k]! > hi[m]! - lo[m]! ? k : m), -1);
  const s: EstadoSimulacion = {
    e,
    lo,
    hi,
    sorteados: libres.filter((k) => k !== despejado),
    despejado,
    sobrante: TOTAL - lo.reduce((a, b) => a + b, 0),
    L: mcm(n),
    indice: 0,
    r: sfc32(0),
    aceptadas: 0,
    intentos: 0,
    acept: [],
    sumas: [],
    credito: [],
    cerca: 0,
    hechas: [],
    fin: false,
  };
  nuevaSemilla(s);
  return s;
}

/** Un sorteo: el vector de pesos si cae en el politopo, o null si se rechaza. */
function sortear(s: EstadoSimulacion): number[] | null {
  const w = [...s.lo];
  let resto = s.sobrante;
  for (const k of s.sorteados) {
    const x = enteroMenorQue(s.r, s.hi[k]! - s.lo[k]! + 1);
    w[k]! += x;
    resto -= x;
  }
  if (s.despejado >= 0) {
    if (resto < 0 || resto > s.hi[s.despejado]! - s.lo[s.despejado]!) return null;
    w[s.despejado]! += resto;
  }
  return w;
}

/** Los primeros `cuantos` vectores aceptados con la semilla principal (para probar el muestreo y para el instrumento). */
export function muestras(e: EntradaSimulacion, cuantos: number): number[][] {
  const s = iniciar(e);
  const out: number[][] = [];
  while (out.length < cuantos) {
    const w = sortear(s);
    if (w) out.push(w);
  }
  return out;
}

/** Un intento: la combinación aceptada se cuenta; la rechazada solo suma al intento. */
function intento(s: EstadoSimulacion): void {
  s.intentos++;
  const w = sortear(s);
  if (!w) return;
  s.aceptadas++;
  const n = s.e.plataformas.length;
  const u = s.e.puntajes.map((ss) => ss.reduce((acc, si, k) => acc + w[k]! * si, 0));
  const orden = u.map((_, i) => i).sort((a, b) => u[b]! - u[a]! || a - b);
  for (let p = 0; p < n; ) {
    let k = 1;
    while (p + k < n && u[orden[p + k]!] === u[orden[p]!]) k++;
    const parte = s.L / k;
    for (let q = p; q < p + k; q++) {
      const i = orden[q]!;
      for (let z = p; z < p + k; z++) s.acept[i]![z]! += parte;
      if (p === 0) {
        s.credito[i]! += parte;
        for (let c = 0; c < w.length; c++) s.sumas[i]![c]! += w[c]! * parte;
      }
    }
    p += k;
  }
  if (u[orden[0]!]! - u[orden[1]!]! < s.e.banda) s.cerca++;
}

/** Restos mayores: centésimas que suman 10 000; a igual resto, el criterio de menor id. */
function central(sumas: number[], credito: number): number[] {
  const base = sumas.map((x) => Math.floor(x / credito));
  const restos = sumas.map((x, k) => [x - base[k]! * credito, k] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  let falta = TOTAL - base.reduce((a, b) => a + b, 0);
  for (const [, k] of restos) {
    if (falta <= 0) break;
    base[k]!++;
    falta--;
  }
  return base;
}

const B1 = BigInt(1);
const B2 = BigInt(2);
const B100 = BigInt(100);
const B10000 = BigInt(10_000);

function isqrt(n: bigint): bigint {
  if (n < B2) return n;
  let x = n;
  let y = (x + B1) / B2;
  while (y < x) {
    x = y;
    y = (x + n / x) / B2;
  }
  return x;
}

/**
 * ¿El intervalo del 95 % de la proporción c/D (K combinaciones, D = K·L) toca el umbral u %? Exacto, en enteros:
 * (c/D − u/100)² < (z/100)²·(c/D)(1 − c/D)/K  ⇔  K·(100c − u·D)² < z²·c·(D − c).
 */
export function enZonaGris(c: number, K: number, L: number, u: number, zCentesimas: number): boolean {
  const [bc, bK, D] = [BigInt(c), BigInt(K), BigInt(K) * BigInt(L)];
  const d = B100 * bc - BigInt(u) * D;
  return bK * d * d < BigInt(zCentesimas) * BigInt(zCentesimas) * bc * (D - bc);
}

/** La media amplitud del intervalo del 95 %, en centésimas de punto porcentual (piso): ⌊√(z²·10 000·c(D − c) / (K·D²))⌋. */
export function semiamplitud(c: number, K: number, L: number, zCentesimas: number): number {
  const [bc, bK, D, z] = [BigInt(c), BigInt(K), BigInt(K) * BigInt(L), BigInt(zCentesimas)];
  return Number(isqrt((z * z * B10000 * bc * (D - bc)) / (bK * D * D)));
}

function cerrarSemilla(s: EstadoSimulacion, estado: ResultadoSemilla["estado"]): void {
  const { e } = s;
  const g = e.ganadora === null ? -1 : e.plataformas.indexOf(e.ganadora);
  let clase: Clase | null = null;
  let zona_gris = false;
  let semi: number | null = null;
  if (estado === "completa" && g >= 0 && s.aceptadas > 0) {
    const c = s.acept[g]![0]!;
    const D = BigInt(s.aceptadas) * BigInt(s.L);
    zona_gris = enZonaGris(c, s.aceptadas, s.L, e.robusta_pct, e.z_centesimas) || enZonaGris(c, s.aceptadas, s.L, e.fragil_pct, e.z_centesimas);
    semi = semiamplitud(c, s.aceptadas, s.L, e.z_centesimas);
    const pct100 = B100 * BigInt(c);
    clase = pct100 < BigInt(e.fragil_pct) * D ? "fragil" : pct100 >= BigInt(e.robusta_pct) * D && !e.inversion_en_rango ? "robusta" : "moderada";
  }
  s.hechas.push({
    semilla: e.semillas[s.indice]!,
    estado,
    aceptadas: s.aceptadas,
    intentos: s.intentos,
    aceptabilidad: s.acept,
    central: s.credito.map((cr, i) => (cr ? central(s.sumas[i]!, cr) : null)),
    cerca: s.cerca,
    clase,
    zona_gris,
    semiamplitud_centesimas: semi,
  });
}

/**
 * Avanza a lo sumo `intentos` intentos. Una semilla que llega a su objetivo (o a su tope) se cierra en el acto, sin
 * gastar un intento: por eso el resultado no depende del tamaño de paso.
 */
export function avanzar(s: EstadoSimulacion, intentos: number): EstadoSimulacion {
  let quedan = intentos;
  while (!s.fin) {
    if (s.aceptadas >= s.e.aceptadas || s.intentos >= s.e.tope_intentos) {
      const agotada = s.aceptadas < s.e.aceptadas;
      cerrarSemilla(s, agotada ? "tope-de-intentos" : "completa");
      // Una semilla que agota el tope cierra todo: falla cerrado, sin clase.
      if (agotada || ++s.indice >= s.e.semillas.length) s.fin = true;
      else nuevaSemilla(s);
      continue;
    }
    if (quedan <= 0) break;
    intento(s);
    quedan--;
  }
  return s;
}

export function resultadoDe(s: EstadoSimulacion): ResultadoSimulacion {
  if (!s.fin) throw new Error("núcleo: la simulación no ha terminado");
  const agotada = s.hechas.some((h) => h.estado === "tope-de-intentos");
  const clases = s.hechas.map((h) => h.clase);
  const estable = !agotada && clases.every((c) => c === clases[0]);
  return {
    estado: agotada ? "tope-de-intentos" : "completa",
    plataformas: s.e.plataformas,
    criterios: s.e.criterios,
    L: s.L,
    objetivo: s.e.aceptadas,
    ganadora: s.e.ganadora,
    semillas: s.hechas,
    clase: agotada ? null : s.hechas[0]!.clase,
    estable,
    frontera: !agotada && (!estable || s.hechas[0]!.zona_gris),
  };
}

/** La simulación entera, de una vez. */
export function simular(e: EntradaSimulacion): ResultadoSimulacion {
  const s = iniciar(e);
  while (!s.fin) avanzar(s, 1_000_000);
  return resultadoDe(s);
}

/**
 * La entrada de la simulación de un caso evaluado (al menos dos plataformas): los puntajes de sus celdas, sus pesos y
 * rangos, las convenciones del método, la ganadora única y si alguna inversión cae dentro del rango declarado.
 */
export function entradaSimulacion(entrada: Entrada, r: Extract<Resultado, { tipo: "evaluado" }>): EntradaSimulacion | null {
  if (r.evaluadas.length < 2) return null;
  const { caso, base } = entrada;
  const pesos = [...caso.pesos].sort((a, b) => (a.criterio_id < b.criterio_id ? -1 : a.criterio_id > b.criterio_id ? 1 : 0));
  const conv = base.convenciones;
  const primeras = r.orden.filter((p) => p.posicion === 1);
  const inversion_en_rango = r.sensibilidad.some((s) => {
    if (s.estado !== "calculada") return false;
    const [lo, hi] = rangoEntero(s.peso, pesos.find((p) => p.criterio_id === s.criterio_id)!.rango_pct);
    return [s.inversion_abajo, s.inversion_arriba].some((ev) => ev !== null && comparar(ev.t, racional(lo)) >= 0 && comparar(ev.t, racional(hi)) <= 0);
  });
  return {
    plataformas: r.evaluadas,
    criterios: pesos.map((p) => p.criterio_id),
    puntajes: r.evaluadas.map((pl) => pesos.map((p) => r.celdas.find((c) => c.plataforma_id === pl && c.criterio_id === p.criterio_id)!.puntaje)),
    pesos: pesos.map((p) => p.peso),
    rangos_pct: pesos.map((p) => p.rango_pct),
    banda: conv.umbral_empate_centesimas * base.escala.max,
    semillas: [conv.simulacion.semilla, ...conv.simulacion.semillas_estabilidad],
    aceptadas: conv.simulacion.aceptadas,
    tope_intentos: conv.simulacion.tope_intentos,
    z_centesimas: conv.simulacion.z_centesimas,
    robusta_pct: conv.robustez.robusta_pct,
    fragil_pct: conv.robustez.fragil_pct,
    ganadora: primeras.length === 1 ? primeras[0]!.plataforma_id : null,
    inversion_en_rango,
  };
}
