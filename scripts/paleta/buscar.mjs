// Búsqueda DETERMINISTA de la paleta de los 8 tipos de nodo (Etapa de Diseño, D8).
// Sin azar: arranques en rejilla fija, descenso por coordenadas sobre una rejilla de matices de 5°.
// Uso: `pnpm paleta:buscar` → imprime la mejor paleta y su tabla; no escribe archivos.
//
// Modelo: cada tipo tiene UN matiz estable en los dos temas; la claridad (OKLCH L) depende del
// tema y del NIVEL del tipo. El croma es el máximo que cabe en sRGB hasta CROMA_MAX.
// Objetivo: maximizar el mínimo, sobre temas × vistas, de (peor ΔE_OK del par) / (umbral de la vista).
import { contraste, oklchAHex, peorPar } from "./color.mjs";
import { UMBRALES } from "./generar-tokens.mjs";

export const SUPERFICIE = {
  oscuro: oklchAHex(0.2, 0.014, 255),
  claro: oklchAHex(0.975, 0.008, 85),
};
export const NIVELES = {
  // Claridad por nivel. Oscuro: trazo claro sobre lienzo oscuro; claro: trazo oscuro sobre papel.
  oscuro: (process.env.NIV_OSC ?? "0.7,0.86").split(",").map(Number),
  claro: (process.env.NIV_CLA ?? "0.44,0.62").split(",").map(Number),
};
const CROMA_MAX = Number(process.env.CROMA ?? 0.16);
export const UMBRAL = UMBRALES;
const VISTAS = Object.keys(UMBRAL);

/** @param {number[]} matices @param {number[]} nivel */
export function paleta(matices, nivel) {
  /** @type {Record<string, {id: string, hex: string}[]>} */
  const r = {};
  for (const tema of /** @type {const} */ (["oscuro", "claro"]))
    r[tema] = matices.map((h, i) => ({
      id: `tipo-${i + 1}`,
      hex: oklchAHex(NIVELES[tema][nivel[i]], CROMA_MAX, h),
    }));
  return r;
}

/** @param {number[]} matices @param {number[]} nivel */
export function puntaje(matices, nivel) {
  const p = paleta(matices, nivel);
  let peor = Infinity;
  for (const tema of /** @type {const} */ (["oscuro", "claro"])) {
    for (const c of p[tema]) {
      const k = contraste(c.hex, SUPERFICIE[tema]);
      if (k < 3) peor = Math.min(peor, k / 3 - 1); // penaliza por debajo de 3:1
    }
    for (const v of VISTAS)
      peor = Math.min(peor, peorPar(p[tema], v).min / UMBRAL[v]);
  }
  return peor;
}

function buscar(/** @type {number[]} */ nivel) {
  const rejilla = Array.from({ length: 72 }, (_, i) => i * 5);
  let mejor = { m: [0], s: -Infinity };
  for (let desfase = 0; desfase < 45; desfase += 5) {
    let m = Array.from({ length: 8 }, (_, i) => (desfase + i * 45) % 360);
    let s = puntaje(m, nivel);
    for (let vuelta = 0, mejoro = true; mejoro && vuelta < 20; vuelta++) {
      mejoro = false;
      for (let i = 0; i < 8; i++)
        for (const h of rejilla) {
          const prueba = m.slice();
          prueba[i] = h;
          const sp = puntaje(prueba, nivel);
          if (sp > s + 1e-9) {
            s = sp;
            m = prueba;
            mejoro = true;
          }
        }
    }
    if (s > mejor.s) mejor = { m, s };
  }
  return mejor;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Niveles alternados por orden de gramática: tipo-1 bajo, tipo-2 alto, …
  const nivel = [0, 1, 0, 1, 0, 1, 0, 1];
  const { m, s } = buscar(nivel);
  console.log("superficies", SUPERFICIE);
  console.log("matices", m.join(" "), "puntaje", s.toFixed(3));
  const p = paleta(m, nivel);
  for (const tema of /** @type {const} */ (["oscuro", "claro"])) {
    console.log(
      `\n${tema}:`,
      p[tema]
        .map(
          (c) =>
            `${c.id}=${c.hex} (${contraste(c.hex, SUPERFICIE[tema]).toFixed(2)}:1)`,
        )
        .join("  "),
    );
    for (const v of [...VISTAS, "grises"]) {
      const { min, par } = peorPar(p[tema], v);
      console.log(`  ${v.padEnd(11)} peor ${min.toFixed(3)}  ${par.join("~")}`);
    }
  }
}
