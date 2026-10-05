// Generador pseudoaleatorio con semilla (RF-04.6, técnica-núcleo § 1.3 y anexo A): sfc32, 128 bits de estado, solo
// `+`, `^`, desplazamientos y `| 0`, idéntico en todo motor. Se siembra como en la sonda del anexo A (tres constantes y
// la semilla en el cuarto registro, quince salidas descartadas) y devuelve enteros de 32 bits: el núcleo nunca pasa
// por `[0, 1)`. Los enteros acotados salen por rechazo, sin sesgo de módulo.

export interface Sfc32 {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** El siguiente entero sin signo de 32 bits (avanza el estado). */
export function siguiente(r: Sfc32): number {
  r.a >>>= 0;
  r.b >>>= 0;
  r.c >>>= 0;
  r.d >>>= 0;
  let t = (r.a + r.b) | 0;
  r.a = r.b ^ (r.b >>> 9);
  r.b = (r.c + (r.c << 3)) | 0;
  r.c = (r.c << 21) | (r.c >>> 11);
  r.d = (r.d + 1) | 0;
  t = (t + r.d) | 0;
  r.c = (r.c + t) | 0;
  return t >>> 0;
}

/** El generador sembrado con un entero de 32 bits, como `sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, semilla)` del anexo A. */
export function sfc32(semilla: number): Sfc32 {
  const r = { a: 0x9e3779b9, b: 0x243f6a88, c: 0xb7e15162, d: semilla >>> 0 };
  for (let i = 0; i < 15; i++) siguiente(r);
  return r;
}

const DOS_32 = 4_294_967_296;

/** Un entero uniforme en [0, n), 1 ≤ n ≤ 2^32, por rechazo (sin el sesgo de `x % n`). */
export function enteroMenorQue(r: Sfc32, n: number): number {
  const limite = DOS_32 - (DOS_32 % n);
  for (;;) {
    const x = siguiente(r);
    if (x < limite) return x % n;
  }
}
