// Búsqueda DETERMINISTA de la claridad de los 8 tipos de nodo (Etapa de Diseño, D8 → D30).
// Sin azar: tres arranques fijos (centro de cada rango, y claridades alternadas bajo/alto y
// alto/bajo), descenso por coordenadas con pasos fijos; gana el mejor puntaje.
// Uso: `pnpm paleta:buscar` → imprime la claridad propuesta por tipo y tema, y su tabla de peores
// pares; no escribe archivos (el resultado se copia a TIPOS[].L en generar-tokens.mjs).
//
// Modelo (ronda 2): cada tipo tiene UN matiz propio y un croma tope (TIPOS, elegidos por
// significado); lo que se busca es la claridad OKLCH por tema dentro de RANGOS.
// Objetivo: maximizar el mínimo de (peor ΔE_OK del par) / (umbral de la vista) sobre las vistas
// declaradas, con penalización si un trazo baja de 3:1 sobre sup-1 (lienzo) o sup-2 (tarjeta del nodo).
import { contraste, oklchAHex, peorPar } from "./color.mjs";
import {
  NEUTROS,
  RANGOS,
  TIPOS,
  UMBRALES,
} from "./generar-tokens.mjs";

const VISTAS = Object.keys(UMBRALES);
const PASOS = [-0.04, -0.02, -0.01, 0.01, 0.02, 0.04];

/** @param {"oscuro" | "claro"} tema @param {number[]} L */
function colores(tema, L) {
  return TIPOS.map((tp, i) => ({
    id: tp.token,
    hex: oklchAHex(L[i], tp.croma, tp.matiz),
  }));
}

/** @param {"oscuro" | "claro"} tema @param {number[]} L */
export function puntaje(tema, L) {
  const c = colores(tema, L);
  const [s1, s2] = ["sup-1", "sup-2"].map((k) => {
    const [l, cr, h] = NEUTROS[tema][k];
    return oklchAHex(l, cr, h);
  });
  let peor = Infinity;
  c.forEach((x) => {
    const k = Math.min(contraste(x.hex, s1), contraste(x.hex, s2));
    if (k < 3) peor = Math.min(peor, k / 3 - 1);
  });
  for (const v of VISTAS)
    peor = Math.min(peor, peorPar(c, v).min / UMBRALES[v]);
  return peor;
}

/** @param {"oscuro" | "claro"} tema */
export function buscar(tema) {
  const R = RANGOS[tema];
  const r2 = (/** @type {number} */ x) => Math.round(x * 100) / 100;
  const arranques = [
    R.map(([a, b]) => r2((a + b) / 2)),
    R.map(([a, b], i) => r2(i % 2 ? b - 0.02 : a + 0.02)),
    R.map(([a, b], i) => r2(i % 2 ? a + 0.02 : b - 0.02)),
  ];
  let mejor = { L: arranques[0], s: -Infinity };
  for (const L0 of arranques) {
    const r = descender(tema, L0);
    if (r.s > mejor.s + 1e-9) mejor = r;
  }
  return mejor;
}

/** @param {"oscuro" | "claro"} tema @param {number[]} L0 */
function descender(tema, L0) {
  const R = RANGOS[tema];
  let L = L0;
  let s = puntaje(tema, L);
  for (let vuelta = 0, mejoro = true; mejoro && vuelta < 60; vuelta++) {
    mejoro = false;
    for (let i = 0; i < L.length; i++)
      for (const d of PASOS) {
        const L2 = [...L];
        L2[i] =
          Math.round(Math.min(R[i][1], Math.max(R[i][0], L2[i] + d)) * 100) /
          100;
        const s2 = puntaje(tema, L2);
        if (s2 > s + 1e-9) {
          s = s2;
          L = L2;
          mejoro = true;
        }
      }
  }
  return { L, s };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const tema of /** @type {const} */ (["oscuro", "claro"])) {
    const { L, s } = buscar(tema);
    console.log(
      `\n${tema}: puntaje ${s.toFixed(3)} (≥ 1 = todas las vistas en su umbral)`,
    );
    TIPOS.forEach((tp, i) =>
      console.log(
        `  ${tp.token} ${tp.id.padEnd(20)} L ${L[i].toFixed(2)}  ${oklchAHex(L[i], tp.croma, tp.matiz)}`,
      ),
    );
    const c = colores(tema, L);
    for (const v of VISTAS) {
      const { min, par } = peorPar(c, v);
      console.log(
        `  ${v.padEnd(11)} ${min.toFixed(3)} (umbral ${UMBRALES[v]}) ${par.join("~")}`,
      );
    }
  }
}
