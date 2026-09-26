// Genera los tokens de color de Big-D desde su declaración OKLCH (fuente de verdad: este archivo,
// documentado en design-system.md § 3 y docs/diseno/diagramador-tokens.md § 4).
// Salidas DERIVADAS (no se editan a mano; el gate `paleta-diagramador` detecta deriva):
//   docs/diseno/assets/tokens.json  — hex por tema, para el gate y el futuro renderizador
//   docs/diseno/assets/tokens.css   — variables CSS por tema ([data-theme] + prefers-color-scheme)
// Uso: `pnpm tokens` (escribe) · importado por el test (compara sin escribir).
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { oklchAHex } from "./color.mjs";

/** Claridad de cada nivel por tema (D8). Nivel 0 = hondo, 1 = claro. */
export const NIVELES = { oscuro: [0.7, 0.86], claro: [0.44, 0.62] };
export const CROMA = 0.13;

/**
 * Los 8 tipos de la gramática `plataformas-datos`, en su orden. Cuatro familias de matiz × dos
 * niveles; los matices salen de `pnpm paleta:buscar` (CROMA=0.13, niveles de arriba).
 */
export const TIPOS = [
  { token: "tipo-1", id: "cap-ingesta", familia: "azul", matiz: 265, nivel: 1 },
  {
    token: "tipo-2",
    id: "cap-almacenamiento",
    familia: "azul",
    matiz: 275,
    nivel: 0,
  },
  {
    token: "tipo-3",
    id: "cap-transformacion",
    familia: "verde-azulado",
    matiz: 190,
    nivel: 0,
  },
  { token: "tipo-4", id: "cap-gobierno", familia: "rosa", matiz: 10, nivel: 0 },
  { token: "tipo-5", id: "cap-consumo", familia: "ocre", matiz: 100, nivel: 1 },
  {
    token: "tipo-6",
    id: "cap-ia",
    familia: "verde-azulado",
    matiz: 180,
    nivel: 1,
  },
  { token: "tipo-7", id: "tipo-externo", familia: "ocre", matiz: 95, nivel: 0 },
  {
    token: "tipo-8",
    id: "tipo-operacion",
    familia: "rosa",
    matiz: 30,
    nivel: 1,
  },
];

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

/** Relleno tintado del nodo (D7): croma bajo del mismo matiz. */
export const TINTE = {
  oscuro: { L: 0.27, C: 0.035 },
  claro: { L: 0.955, C: 0.03 },
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
    "tinta-3": [0.56, 0.012, 255], // VETADA como texto (decorativa: rejillas, guías)
  },
  claro: {
    fondo: [0.95, 0.01, 85],
    "sup-1": [0.975, 0.008, 85],
    "sup-2": [0.995, 0.004, 85],
    linea: [0.84, 0.012, 85],
    "tinta-1": [0.22, 0.014, 255],
    "tinta-2": [0.38, 0.014, 255],
    "tinta-3": [0.64, 0.012, 255], // VETADA como texto
  },
};

/** Tokens de tinta prohibidos como color de TEXTO (regla de desarrollo 5-b). */
export const TINTAS_VETADAS = ["tinta-3", "linea"];

export function construir() {
  /** @type {Record<string, Record<string, string>>} */
  const temas = {};
  for (const tema of /** @type {const} */ (["oscuro", "claro"])) {
    /** @type {Record<string, string>} */
    const t = {};
    for (const [k, [L, C, h]] of Object.entries(NEUTROS[tema]))
      t[k] = oklchAHex(L, C, h);
    for (const tp of TIPOS) {
      t[tp.token] = oklchAHex(NIVELES[tema][tp.nivel], CROMA, tp.matiz);
      t[`${tp.token}-tinte`] = oklchAHex(
        TINTE[tema].L,
        TINTE[tema].C,
        tp.matiz,
      );
    }
    temas[tema] = t;
  }
  return {
    _generado: "scripts/paleta/generar-tokens.mjs — no editar a mano",
    tipos: TIPOS.map(({ token, id, familia, nivel }) => ({
      token,
      id,
      familia,
      nivel,
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
:root[data-theme="claro"] {
  color-scheme: light;
${bloque(t.temas.claro)}
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
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
  console.log("tokens: docs/diseno/assets/tokens.{json,css}");
}
