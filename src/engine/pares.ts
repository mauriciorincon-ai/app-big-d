// D7 (S8): pesos por comparación de pares (proceso analítico jerárquico, Saaty) en aritmética ENTERA (regla dura 1). La
// persona juzga cada par de criterios en la escala 1–9 (1 = igual de importantes; k = uno es k veces más importante; el
// otro, 1/k). El vector de pesos es la media geométrica de cada fila de la matriz recíproca, normalizada; la consistencia
// es la razón CR = IC / IA con IC = (λ − n) / (n − 1) y λ estimada con ese vector. Todo en BigInt con punto fijo: la raíz
// n-ésima es la entera exacta por búsqueda binaria (sin `**`, sin Math.pow, sin flotantes), y el reparto a 10 000
// centésimas usa el resto mayor con desempate por id del criterio, nunca por posición: reordenar los criterios no cambia
// ningún byte (regla dura 5). El método y su cota de error: decisions/pairwise-integer-weights.md.

/** Un juicio: `mayor` es `intensidad` veces más importante que `menor` (con 1, igual de importantes; el orden da igual). */
export interface Juicio {
  mayor: string;
  menor: string;
  intensidad: number;
}

/** La convención del dato (data/convenciones/pares.yaml): la escala, el umbral de la razón y el índice aleatorio por n. */
export interface ConvencionPares {
  escala_max: number;
  umbral_razon_milesimas: number;
  indice_aleatorio: readonly { n: number; milesimas: number }[];
}

export type ResultadoPares =
  | { tipo: "incompleta"; faltan: number; total: number }
  | {
      tipo: "completa";
      /** Por id de criterio (orden de unidades de código), en centésimas que suman 10 000. */
      pesos: { criterio_id: string; peso_centesimas: number }[];
      /** λ estimada, en milésimas. */
      lambda_milesimas: number;
      /** CR en milésimas (100 = 0,10); null con dos criterios o menos, donde toda matriz es consistente. */
      razon_milesimas: number | null;
      consistente: boolean;
    };

const B0 = BigInt(0);
const B1 = BigInt(1);
const B2 = BigInt(2);
/** El punto fijo de las medias geométricas (10^12) y el de λ (10^9). */
const ESCALA = BigInt(1_000_000_000_000);
const F = BigInt(1_000_000_000);
const MIL = BigInt(1_000);

const potencia = (b: bigint, e: number): bigint => {
  let r = B1;
  for (let i = 0; i < e; i++) r *= b;
  return r;
};

/** ⌊x^(1/n)⌋ exacta para x ≥ 0 y n ≥ 1, por búsqueda binaria (a lo más ~bits(x) iteraciones). */
export function raizEntera(x: bigint, n: number): bigint {
  if (x < B0 || n < 1) throw new Error("raizEntera: x ≥ 0 y n ≥ 1");
  if (x < B2 || n === 1) return x;
  let lo = B0;
  let hi = B1;
  while (potencia(hi, n) <= x) hi *= B2;
  while (hi - lo > B1) {
    const m = (lo + hi) / B2;
    if (potencia(m, n) <= x) lo = m;
    else hi = m;
  }
  return lo;
}

const clave = (a: string, b: string) =>
  a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
const porUnidades = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Cuántos pares tiene una matriz de n criterios: n (n − 1) / 2. */
export const paresDe = (n: number) => (n * (n - 1)) / 2;

/** Los pares en su orden canónico (por id): el orden en que la pantalla los ofrece y la URL los guarda. */
export function paresCanonicos(ids: readonly string[]): [string, string][] {
  const xs = [...ids].sort(porUnidades);
  const out: [string, string][] = [];
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++) out.push([xs[i]!, xs[j]!]);
  return out;
}

/**
 * Los pesos que proponen los juicios. Con algún par sin juzgar devuelve `incompleta` (nada se inventa). Lanza ante un
 * juicio sobre un criterio ajeno, un par repetido, una intensidad fuera de la escala o un n sin índice aleatorio en el dato.
 */
export function pesosPorPares(
  ids: readonly string[],
  juicios: readonly Juicio[],
  conv: ConvencionPares,
): ResultadoPares {
  const xs = [...ids].sort(porUnidades);
  const n = xs.length;
  if (n < 1) throw new Error("pares: al menos un criterio");
  if (new Set(xs).size !== n)
    throw new Error("pares: un criterio aparece dos veces");
  const pos = new Map(xs.map((id, i) => [id, i]));
  // num[i][j] / den[i][j] = a_ij.
  const num = xs.map(() => xs.map(() => B1));
  const den = xs.map(() => xs.map(() => B1));
  const vistos = new Set<string>();
  for (const j of juicios) {
    const i = pos.get(j.mayor);
    const k = pos.get(j.menor);
    if (i === undefined || k === undefined || i === k)
      throw new Error(
        `pares: «${j.mayor}» frente a «${j.menor}» no es un par de criterios del caso`,
      );
    if (
      !Number.isInteger(j.intensidad) ||
      j.intensidad < 1 ||
      j.intensidad > conv.escala_max
    )
      throw new Error(
        `pares: intensidad ${j.intensidad} fuera de 1–${conv.escala_max}`,
      );
    const c = clave(j.mayor, j.menor);
    if (vistos.has(c))
      throw new Error(
        `pares: el par «${j.mayor}»–«${j.menor}» se juzga dos veces`,
      );
    vistos.add(c);
    const v = BigInt(j.intensidad);
    num[i]![k] = v;
    den[k]![i] = v;
  }
  const total = paresDe(n);
  if (vistos.size < total)
    return { tipo: "incompleta", faltan: total - vistos.size, total };

  // Media geométrica de cada fila en punto fijo: G_i = ⌊(Π_j a_ij · ESCALA^n)^(1/n)⌋.
  const escalaN = potencia(ESCALA, n);
  const G = xs.map((_, i) => {
    let p = B1;
    let q = B1;
    for (let k = 0; k < n; k++) {
      p *= num[i]![k]!;
      q *= den[i]![k]!;
    }
    return raizEntera((p * escalaN) / q, n);
  });
  const suma = G.reduce((s, g) => s + g, B0);

  // Reparto a 10 000 centésimas por el resto mayor; empates de resto por id (orden de unidades de código).
  const DIEZ_MIL = BigInt(10_000);
  const base = G.map((g) => (g * DIEZ_MIL) / suma);
  const resto = G.map((g) => (g * DIEZ_MIL) % suma);
  let falta = Number(DIEZ_MIL - base.reduce((s, b) => s + b, B0));
  const orden = xs
    .map((_, i) => i)
    .sort((a, b) =>
      resto[a]! > resto[b]!
        ? -1
        : resto[a]! < resto[b]!
          ? 1
          : porUnidades(xs[a]!, xs[b]!),
    );
  const extra = xs.map(() => 0);
  for (const i of orden) {
    if (falta <= 0) break;
    extra[i] = 1;
    falta--;
  }
  const pesos = xs.map((criterio_id, i) => ({
    criterio_id,
    peso_centesimas: Number(base[i]!) + extra[i]!,
  }));

  // λ ≈ (1/n) Σ_i (A·G)_i / G_i, cada término con ⌊·⌋ en punto fijo F (error < n² / F: despreciable en milésimas).
  let acumulado = B0;
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++)
      acumulado += (num[i]![k]! * G[k]! * F) / (den[i]![k]! * G[i]!);
  const lambdaF = acumulado / BigInt(n);
  const lambda_milesimas = Number((lambdaF * MIL) / F);
  if (n <= 2)
    return {
      tipo: "completa",
      pesos,
      lambda_milesimas,
      razon_milesimas: null,
      consistente: true,
    };

  const ia = conv.indice_aleatorio.find((x) => x.n === n);
  if (!ia || ia.milesimas <= 0)
    throw new Error(`pares: el dato no trae el índice aleatorio para n = ${n}`);
  const exceso = lambdaF > BigInt(n) * F ? lambdaF - BigInt(n) * F : B0;
  // CR = (exceso / F) / (n − 1) / (IA / 1000); en milésimas: exceso · 10^6 / (F · (n − 1) · IA).
  const razon_milesimas = Number(
    (exceso * MIL * MIL) / (F * BigInt(n - 1) * BigInt(ia.milesimas)),
  );
  return {
    tipo: "completa",
    pesos,
    lambda_milesimas,
    razon_milesimas,
    consistente: razon_milesimas <= conv.umbral_razon_milesimas,
  };
}
