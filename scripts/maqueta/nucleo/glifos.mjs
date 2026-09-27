// Glifos de la gramática visual de Big-D (propuesta para el CONTRATO v0.3.0).
// Todos en una caja de 16 × 16 centrada en (0, 0); pintan con `currentColor` (el color lo pone la
// clase del uso: tipo = var(--tipo-N); marcas = tinta). Coordenadas enteras o con un decimal.

function estrella(re, ri) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : re;
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    p.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${p.join(" L")} Z`;
}

/** Tipos de nodo (8). `relleno`: true = forma llena; false = solo trazo. */
export const TIPO_GLIFO = {
  triangulo: { d: "M0,-7.5 L7.5,6 L-7.5,6 Z", relleno: true },
  cuadrado: { d: "M-6.5,-6.5 H6.5 V6.5 H-6.5 Z", relleno: true },
  rombo: { d: "M0,-8 L8,0 L0,8 L-8,0 Z", relleno: true },
  escudo: { d: "M0,-7.5 L6.5,-5 V0 C6.5,4 3.5,6.3 0,7.8 C-3.5,6.3 -6.5,4 -6.5,0 V-5 Z", relleno: true },
  circulo: { d: "M0,-7 A7,7 0 1 1 0,7 A7,7 0 1 1 0,-7 Z", relleno: true },
  estrella: { d: estrella(8.2, 3.5), relleno: true },
  anillo: { d: "M0,-6 A6,6 0 1 1 0,6 A6,6 0 1 1 0,-6 Z", relleno: false, trazo: 2.6 },
  barras: { d: "M-7.5,2 H-4 V7.5 H-7.5 Z M-1.75,-2.5 H1.75 V7.5 H-1.75 Z M4,-7.5 H7.5 V7.5 H4 Z", relleno: true },
};

/** Marcadores de modo de flujo (4), tinta, caja 12 centrada. */
export const MODO_MARCA = {
  "por-lotes": { d: "M-5.5,-2.5 H-1.5 V1.5 H-5.5 Z M1.5,-2.5 H5.5 V1.5 H1.5 Z M-5.5,3.5 H5.5", relleno: "mixto" },
  continuo: { d: "M-6,0 C-4.5,-4.5 -1.5,-4.5 0,0 S4.5,4.5 6,0", relleno: false },
  "a-demanda": { d: "M-5.5,-2.5 H4 M1.5,-5 L4.5,-2.5 L1.5,0 M5.5,2.5 H-4 M-1.5,0 L-4.5,2.5 L-1.5,5", relleno: false },
  "sin-copia": {
    d: "M-1.2,-3 H-3.5 A3,3 0 0 0 -3.5,3 H-1.2 M1.2,-3 H3.5 A3,3 0 0 1 3.5,3 H1.2 M-2.5,0 H2.5",
    relleno: false,
  },
};

/** Marcas de estado (D19): se dibujan, jamás se escriben como carácter. Caja 12. */
export const MARCA = {
  vigente: "M-4.5,0.5 L-1.5,3.5 L4.5,-3.5",
  revisar: "M0,-5 V1.5 M0,4.2 V4.6",
  vencido: "M-3.8,-3.8 L3.8,3.8 M3.8,-3.8 L-3.8,3.8",
  hacia: "M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5",
  desde: "M5,0 H-4 M-1,-3.5 L-4.5,0 L-1,3.5",
};

/**
 * Medidor de madurez (D19): rectángulo 8 × 12 que se llena según el nivel (0 anunciado … 4
 * disponible); retirado = vacío y tachado; anunciado = contorno discontinuo.
 */
export function medidor(nivel, x, y, clase = "dg-madurez") {
  const alto = 11;
  const lleno = nivel >= 0 ? Math.round((alto * nivel) / 4) : 0;
  let s = `<g class="${clase}" transform="translate(${x},${y})">`;
  s += `<rect x="-3.5" y="-5.5" width="7" height="11" rx="1.5" class="dg-madurez-caja${nivel === 0 ? " dg-madurez-anunciado" : ""}"/>`;
  if (lleno > 0) s += `<rect x="-3.5" y="${(5.5 - lleno).toFixed(1)}" width="7" height="${lleno}" rx="1" class="dg-madurez-nivel"/>`;
  if (nivel < 0) s += `<path d="M-3.5,5.5 L3.5,-5.5" class="dg-madurez-tachado"/>`;
  return s + "</g>";
}
