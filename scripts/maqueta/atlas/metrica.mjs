// Medición de texto por fuente (G15): ancho por suma de avances del peso, normalizado por em.
import fs from "node:fs";
import { METRICAS } from "../rutas.mjs";
const MET = JSON.parse(fs.readFileSync(METRICAS, "utf8")).fuentes;
export const avisos = [];
export function conFuente(slug) {
  const F = MET[slug];
  if (!F) throw new Error(`sin métricas: ${slug}`);
  const upem = F.unidades_por_em;
  const asc = F.ascendente / upem, desc = -F.descendente / upem;
  function medir(t, size, peso = 400) {
    let s = 0;
    for (const ch of t) {
      const a = F.pesos[String(peso)][String(ch.codePointAt(0))];
      if (a === undefined) throw new Error(`carácter fuera de ${slug}: «${ch}» en «${t}»`);
      s += a;
    }
    return (s * size * 1.03) / upem;
  }
  function partir(t, size, peso, max) {
    const lineas = []; let cur = "";
    for (const p of t.split(" ")) {
      const c = cur ? `${cur} ${p}` : p;
      if (medir(c, size, peso) <= max) cur = c;
      else { if (cur) lineas.push(cur); cur = p; if (medir(p, size, peso) > max) avisos.push(`${slug}: palabra más ancha que su caja: «${p}» (${medir(p, size, peso).toFixed(1)} > ${max})`); }
    }
    if (cur) lineas.push(cur);
    return lineas;
  }
  /** Línea base para una caja de línea `lh` con letra `size`: centra el bloque asc+desc. */
  const base = (top, size, lh) => top + (lh - (asc + desc) * size) / 2 + asc * size;
  return { slug, medir, partir, base, asc, desc };
}
