// Librería de color de la Etapa de Diseño — Node puro, sin dependencias, sin Intl ni azar.
// La usan el gate `tests/unit/paleta-diagramador.test.ts` y la búsqueda `scripts/paleta/buscar.mjs`.
//
// Cadena: hex → sRGB → lineal → (simulación Machado 2009 en RGB lineal) → OKLab (Ottosson 2020)
// → ΔE_OK euclidiana. Contraste: luminancia relativa WCAG 2.x sobre el mismo RGB lineal.

/** @param {string} hex "#rrggbb" @returns {[number, number, number]} sRGB 0..1 */
export function hexARgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`hex inválido: ${hex}`);
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** @param {[number, number, number]} rgb sRGB 0..1 @returns {string} */
export function rgbAHex(rgb) {
  return (
    "#" +
    rgb
      .map((c) =>
        Math.round(Math.min(1, Math.max(0, c)) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** @param {number} c */
export const aLineal = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
/** @param {number} c */
export const aGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/** @param {[number, number, number]} rgb sRGB @returns {[number, number, number]} */
export const lineal = (rgb) =>
  /** @type {[number, number, number]} */ (rgb.map(aLineal));

/**
 * Matrices de Machado, Oliveira y Fernandes (IEEE TVCG 2009), tabla de severidades, aplicadas
 * sobre RGB LINEAL. Severidad 0,6 ≈ anomalía leve-moderada (el caso del usuario); 1,0 = dicromacia.
 */
export const MACHADO = {
  protan: {
    0.6: [
      [0.38545, 0.769005, -0.154455],
      [0.100526, 0.829802, 0.069673],
      [-0.007442, -0.02219, 1.029632],
    ],
    "1.0": [
      [0.152286, 1.052583, -0.204868],
      [0.114503, 0.786281, 0.099216],
      [-0.003882, -0.048116, 1.051998],
    ],
  },
  deutan: {
    0.6: [
      [0.547494, 0.607765, -0.155259],
      [0.181692, 0.781742, 0.036566],
      [-0.01041, 0.027275, 0.983136],
    ],
    "1.0": [
      [0.367322, 0.860646, -0.227968],
      [0.280085, 0.672501, 0.047413],
      [-0.01182, 0.04294, 0.968881],
    ],
  },
  tritan: {
    0.6: [
      [1.104996, -0.046633, -0.058363],
      [-0.032137, 0.971635, 0.060503],
      [0.001336, 0.317922, 0.680742],
    ],
    "1.0": [
      [1.255528, -0.076749, -0.178779],
      [-0.078411, 0.930809, 0.147602],
      [0.004733, 0.691367, 0.3039],
    ],
  },
};

/** Vistas que el gate evalúa. `grises` = acromatopsia (solo luminancia). */
export const VISTAS = [
  "normal",
  "protan-0.6",
  "deutan-0.6",
  "tritan-0.6",
  "protan-1.0",
  "deutan-1.0",
  "tritan-1.0",
  "grises",
];

/** Luminancia relativa WCAG de RGB lineal. @param {[number, number, number]} l */
export const luminanciaLineal = (l) =>
  0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];

/**
 * Simula una vista sobre un color. Devuelve RGB LINEAL recortado a [0, 1].
 * @param {string} hex @param {string} vista @returns {[number, number, number]}
 */
export function simular(hex, vista) {
  const l = lineal(hexARgb(hex));
  if (vista === "normal") return l;
  if (vista === "grises") {
    const y = luminanciaLineal(l);
    return [y, y, y];
  }
  const [tipo, sev] = vista.split("-");
  const tabla = /** @type {Record<string, Record<string, number[][]>>} */ (
    MACHADO
  );
  const mat = tabla[tipo]?.[sev];
  if (!mat) throw new Error(`vista desconocida: ${vista}`);
  return /** @type {[number, number, number]} */ (
    mat.map((f) =>
      Math.min(1, Math.max(0, f[0] * l[0] + f[1] * l[1] + f[2] * l[2])),
    )
  );
}

/** OKLab desde RGB lineal (Ottosson 2020). @param {[number, number, number]} c */
export function oklab(c) {
  const l = 0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2];
  const m = 0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2];
  const s = 0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2];
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** RGB lineal desde OKLab. @param {number[]} lab @returns {[number, number, number]} */
export function oklabALineal([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** ¿Está el color lineal dentro de sRGB? @param {number[]} c */
export const enGamut = (c) => c.every((x) => x >= -1e-6 && x <= 1 + 1e-6);

/**
 * OKLCH → hex; si no cabe en sRGB, reduce el croma (búsqueda binaria determinista, 24 pasos).
 * @param {number} L @param {number} C @param {number} h grados
 */
export function oklchAHex(L, C, h) {
  const rad = (h * Math.PI) / 180;
  const prueba = (/** @type {number} */ c) =>
    oklabALineal([L, c * Math.cos(rad), c * Math.sin(rad)]);
  let c = C;
  if (!enGamut(prueba(c))) {
    let lo = 0,
      hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (enGamut(prueba(mid))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  return rgbAHex(
    /** @type {[number, number, number]} */ (
      prueba(c).map((x) => aGamma(Math.min(1, Math.max(0, x))))
    ),
  );
}

/** ΔE en OKLab entre dos colores bajo una vista. @param {string} a @param {string} b @param {string} vista */
export function deltaE(a, b, vista = "normal") {
  const p = oklab(simular(a, vista));
  const q = oklab(simular(b, vista));
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** Diferencia de claridad OKLab bajo acromatopsia. @param {string} a @param {string} b */
export function deltaLGrises(a, b) {
  return Math.abs(
    oklab(simular(a, "grises"))[0] - oklab(simular(b, "grises"))[0],
  );
}

/** Razón de contraste WCAG 2.x. @param {string} a @param {string} b */
export function contraste(a, b) {
  const ya = luminanciaLineal(lineal(hexARgb(a)));
  const yb = luminanciaLineal(lineal(hexARgb(b)));
  const [hi, lo] = ya > yb ? [ya, yb] : [yb, ya];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Peor par de una lista bajo una vista.
 * @param {Array<{id: string, hex: string}>} colores @param {string} vista
 */
export function peorPar(colores, vista) {
  let min = Infinity;
  /** @type {[string, string]} */
  let par = ["", ""];
  for (let i = 0; i < colores.length; i++)
    for (let j = i + 1; j < colores.length; j++) {
      const d =
        vista === "grises"
          ? deltaLGrises(colores[i].hex, colores[j].hex)
          : deltaE(colores[i].hex, colores[j].hex, vista);
      if (d < min) {
        min = d;
        par = [colores[i].id, colores[j].id];
      }
    }
  return { min, par };
}
