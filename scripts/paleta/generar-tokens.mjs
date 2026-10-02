// Genera los tokens de color de Big-D desde su declaración OKLCH (fuente de verdad: este archivo,
// documentado en design-system.md § 3 y docs/diseno/diagramador-tokens.md § 4).
// Salidas DERIVADAS (no se editan a mano; el gate `paleta-diagramador` detecta deriva):
//   docs/diseno/assets/tokens.json  — hex por tema, para el gate y el futuro renderizador
//   docs/diseno/assets/tokens.css   — variables CSS por tema ([data-theme] + prefers-color-scheme)
//   src/styles/tokens.css           — la misma hoja, para el producto
// Uso: `pnpm tokens` (escribe) · importado por el test (compara sin escribir).
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { oklchAHex } from "./color.mjs";

/**
 * Los 8 tipos de la gramática `plataformas-datos`, en su orden (ronda 2 de la mirada 1, D30).
 * UN MATIZ PROPIO POR TIPO, elegido por significado y repartido en la rueda (la ronda 1 usaba cuatro
 * familias × dos claridades: dos azules, dos turquesas, mostaza y oliva — el usuario la vio apagada
 * y repetida). La claridad por tema sale de `pnpm paleta:buscar` (búsqueda determinista dentro de
 * RANGOS: el naranja jamás baja a marrón, el amarillo no existe) y el croma es el máximo que cabe
 * en sRGB hasta `croma`. «Externo» es casi neutro a propósito: está FUERA de la plataforma.
 */
export const TIPOS = [
  {
    token: "tipo-1",
    id: "cap-ingesta",
    familia: "azul",
    matiz: 250,
    croma: 0.15,
    L: { oscuro: 0.82, claro: 0.48 },
  },
  {
    token: "tipo-2",
    id: "cap-almacenamiento",
    familia: "violeta",
    matiz: 295,
    croma: 0.15,
    L: { oscuro: 0.72, claro: 0.58 },
  },
  {
    token: "tipo-3",
    id: "cap-transformacion",
    familia: "naranja",
    matiz: 62,
    croma: 0.15,
    L: { oscuro: 0.75, claro: 0.66 },
  },
  {
    token: "tipo-4",
    id: "cap-gobierno",
    familia: "rojo",
    matiz: 22,
    croma: 0.16,
    L: { oscuro: 0.66, claro: 0.58 },
  },
  {
    token: "tipo-5",
    id: "cap-consumo",
    familia: "verde",
    matiz: 148,
    croma: 0.15,
    L: { oscuro: 0.77, claro: 0.52 },
  },
  {
    token: "tipo-6",
    id: "cap-ia",
    familia: "magenta",
    matiz: 345,
    croma: 0.16,
    L: { oscuro: 0.77, claro: 0.5 },
  },
  {
    token: "tipo-7",
    id: "tipo-externo",
    familia: "pizarra",
    matiz: 250,
    croma: 0.035,
    L: { oscuro: 0.63, claro: 0.4 },
  },
  {
    token: "tipo-8",
    id: "tipo-operacion",
    familia: "cian",
    matiz: 205,
    croma: 0.12,
    L: { oscuro: 0.73, claro: 0.62 },
  },
];

/** Rangos de claridad por tipo y tema donde busca `pnpm paleta:buscar` (mismo orden que TIPOS). */
export const RANGOS = {
  oscuro: [
    [0.66, 0.84],
    [0.66, 0.86],
    [0.72, 0.84],
    [0.66, 0.8],
    [0.68, 0.86],
    [0.7, 0.88],
    [0.62, 0.8],
    [0.68, 0.86],
  ],
  claro: [
    [0.44, 0.6],
    [0.44, 0.6],
    [0.56, 0.66],
    [0.46, 0.58],
    [0.5, 0.64],
    [0.5, 0.62],
    [0.4, 0.56],
    [0.52, 0.64],
  ],
};

/**
 * UMBRALES DECLARADOS de distancia de color (ΔE en OKLab, peor par de los 8 tipos, por tema).
 * Convención de Big-D, no evidencia publicada (el contrato v0.2.0 lo deja abierto en Gaps):
 * 0,10 en visión normal ≈ 4–5 diferencias apenas perceptibles; 0,06 en la severidad del usuario
 * (0,6); 0,03 en dicromacia (1,0) — ahí la distinción la cargan el glifo y la etiqueta (G7).
 * Acromatopsia (grises) NO se exige por pares: la información sobrevive por glifo + etiqueta.
 */
export const UMBRALES = {
  normal: 0.1,
  "protan-0.6": 0.06,
  "deutan-0.6": 0.06,
  "tritan-0.6": 0.06,
  "protan-1.0": 0.03,
  "deutan-1.0": 0.03,
  "tritan-1.0": 0.03,
};

/** Neutros de la interfaz (D6: la UI es monocroma). [L, C, h] */
export const NEUTROS = {
  oscuro: {
    fondo: [0.165, 0.012, 255],
    "sup-1": [0.2, 0.014, 255], // lienzo del diagrama, tarjetas
    "sup-2": [0.245, 0.016, 255], // controles, hoja, panel elevado
    linea: [0.36, 0.014, 255], // bordes finos (no texto)
    "tinta-1": [0.94, 0.008, 255],
    "tinta-2": [0.8, 0.012, 255],
  },
  claro: {
    // Ronda 2: papel frío casi blanco (el crema de la ronda 1 se leía viejo).
    fondo: [0.965, 0.004, 255],
    "sup-1": [0.985, 0.003, 255],
    "sup-2": [1, 0, 0],
    linea: [0.87, 0.008, 255],
    "tinta-1": [0.22, 0.014, 255],
    "tinta-2": [0.38, 0.014, 255],
  },
};

/** Tokens de tinta prohibidos como color de TEXTO (regla de desarrollo 5-b). */
export const TINTAS_VETADAS = ["linea"];

export function construir() {
  /** @type {Record<string, Record<string, string>>} */
  const temas = {};
  for (const tema of /** @type {const} */ (["oscuro", "claro"])) {
    /** @type {Record<string, string>} */
    const t = {};
    for (const [k, [L, C, h]] of Object.entries(NEUTROS[tema]))
      t[k] = oklchAHex(L, C, h);
    for (const tp of TIPOS) t[tp.token] = oklchAHex(tp.L[tema], tp.croma, tp.matiz);
    temas[tema] = t;
  }
  return {
    _generado: "scripts/paleta/generar-tokens.mjs — no editar a mano",
    tipos: TIPOS.map(({ token, id, familia, matiz }) => ({
      token,
      id,
      familia,
      matiz,
    })),
    tintas_vetadas_como_texto: TINTAS_VETADAS,
    temas,
  };
}

/** @param {ReturnType<typeof construir>} t */
export function css(t) {
  const bloque = (/** @type {Record<string, string>} */ v) =>
    Object.entries(v)
      .map(([k, x]) => `  --${k}: ${x};`)
      .join("\n");
  return `/* GENERADO por scripts/paleta/generar-tokens.mjs — no editar a mano (el gate detecta deriva). */
/* Oscuro es el primario: sin preferencia ni elección, manda oscuro. */
:root,
:root[data-theme="oscuro"] {
  color-scheme: dark;
${bloque(t.temas.oscuro)}
}
:root[data-theme="claro"],
.tema-claro {
  color-scheme: light;
${bloque(t.temas.claro)}
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    color-scheme: light;
${bloque(t.temas.claro).replace(/^/gm, "  ")}
  }
}
/* El papel es siempre claro: la vista de impresión (.tema-claro) y la impresión real. */
@media print {
  :root,
  :root[data-theme="oscuro"] {
    color-scheme: light;
${bloque(t.temas.claro).replace(/^/gm, "  ")}
  }
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const t = construir();
  writeFileSync(
    join(raiz, "docs/diseno/assets/tokens.json"),
    JSON.stringify(t, null, 2) + "\n",
  );
  writeFileSync(join(raiz, "docs/diseno/assets/tokens.css"), css(t));
  // El producto consume la MISMA hoja (design-system.md § 9); el gate compara las dos con el generador.
  writeFileSync(join(raiz, "src/styles/tokens.css"), css(t));
  console.log("tokens: docs/diseno/assets/tokens.{json,css} · src/styles/tokens.css");
}
