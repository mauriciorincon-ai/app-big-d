// Lado a lado (nivel 1 comparado): N mapas de la misma gramática alineados por banda (G5). En ancho,
// las 9 bandas son columnas y cada plataforma una fila; tres plataformas a la vez (constante de
// vista) y paginación. Diff entre versiones de un mapa: marcas glifo + texto sobre los bloques.
import { BANDA, MADUREZ, TIPO } from "../nucleo/datos.mjs";
import { LANGS, esc, r1 } from "../nucleo/comun.mjs";
import { TIPO_GLIFO, medidor } from "../nucleo/glifos.mjs";
import { conFuente, avisos } from "../atlas/metrica.mjs";
import { COMPONENTES, DIFF, LADO, PLATAFORMAS } from "./datos2.mjs";
export { avisos };
const F = conFuente("space-grotesk");
const BANDAS = ["fuentes", "ingesta", "almacenamiento", "procesamiento", "consumo", "ia", "gobierno", "operacion", "orquestacion"];
const P = { M: 8, colW: 118, gap: 14, bH: 64, rowGap: 14, labelH: 26 };
const PRE = "db";
const t = (lang, lineas, x, top, size, lh, clase, extra = "") => { const y0 = F.base(top, size, lh); return `<text lang="${lang}" class="${clase}"${extra}>${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`; };
const t1 = (lang, s, x, top, size, lh, clase, extra = "") => t(lang, [s], x, top, size, lh, clase, extra);
function defs() {
  let s = "<defs>";
  for (const [g, v] of Object.entries(TIPO_GLIFO)) s += v.relleno ? `<path id="${PRE}-g-${g}" d="${v.d}" fill="currentColor"/>` : `<path id="${PRE}-g-${g}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="${v.trazo}"/>`;
  s += `<path id="${PRE}-d-nuevo" d="M0,-4.5 V4.5 M-4.5,0 H4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  s += `<path id="${PRE}-d-retirado" d="M-4.5,0 H4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  s += `<path id="${PRE}-d-renombrado" d="M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-doc" d="M-4,-5.5 H2 L4.5,-3 V5.5 H-4 Z M-1.5,-1 H2 M-1.5,2 H2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-d-madurez" d="M-3.5,4.5 V-1 M0,4.5 V-4.5 M3.5,4.5 V1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  return s + "</defs>";
}
const DIFF_TXT = { nuevo: ["nuevo", "new"], retirado: ["retirado", "removed"], renombrado: ["renombrado", "renamed"], madurez: ["madurez", "maturity"] };

function bloque(pl, b, x, y, w, h, diff, o = {}) {
  const d = LADO[pl.id][b];
  const fichaId = `${o.fichaDe ?? pl.id}-${b}`;
  let s = d ? `<g class="${PRE}-elem ${PRE}-nodo" role="graphics-symbol img" tabindex="0" data-dueno="${pl.id}-${b}" data-nodo="${fichaId}"` : `<g class="${PRE}-elem" role="graphics-symbol img" tabindex="0" data-dueno="${pl.id}-${b}"`;
  if (!d) {
    s += ` data-aria-es="${esc(BANDA[b].es[0])}: sin componentes" data-aria-en="${esc(BANDA[b].en[0])}: no components"><rect data-caja="${pl.id}-${b}" class="${PRE}-card ${PRE}-fantasma" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    for (const l of LANGS) s += t1(l, l === "es" ? "sin componentes" : "no components", x + 10, y + (h - 16) / 2, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
    return s + `</g>`;
  }
  const [es, en, n, tipo, mad] = d, tp = TIPO[tipo], m = MADUREZ[mad], ga = mad === "disponible-general";
  s += ` data-aria-es="${esc(es)}: ${n} ${n === 1 ? "componente" : "componentes"}, ${m.largo.es}. Ábrelo para ver cuáles son." data-aria-en="${esc(en)}: ${n} ${n === 1 ? "component" : "components"}, ${m.largo.en}. Open it to see which ones."><rect data-caja="${pl.id}-${b}" class="${PRE}-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  s += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
  s += `<use href="#${PRE}-g-${tp.g}" x="${x + 16}" y="${r1(F.base(y + 8, 12, 15) - 4)}" class="${PRE}-c-${tp.t}"/>`;
  for (const l of LANGS) { const nm = F.partir(l === "es" ? es : en, 12, 700, w - 28 - 6); if (nm.length > 2) avisos.push(`lado: ${pl.id}/${b} (${l}) ${nm.length} líneas`); s += t(l, nm, x + 28, y + 8, 12, 15, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
  const yr = y + h - 8 - 14;
  // Fila inferior: cuenta y, si no es «disponible», la madurez; si las dos no caben, manda la madurez.
  const madW = ga ? 0 : Math.max(...LANGS.map((l) => F.medir(m[l], 11, 400)));
  const caben = ga || 52 + 8 + madW <= w - 8;
  if (caben) for (const l of LANGS) s += t1(l, `${n} comp.`, x + 10, yr, 11, 14, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
  if (!ga) { const mx = caben ? x + 52 : x + 14; s += medidor(m.nivel, mx, yr + 7, `${PRE}-madurez`); for (const l of LANGS) s += t1(l, m[l], mx + 8, yr, 11, 14, `${PRE}-t-meta ${PRE}-t-meta-compacta`); }
  if (diff) { const tw = Math.max(...LANGS.map((l, i) => F.medir(DIFF_TXT[diff.tipo][i], 11, 700))); const bw = 22 + tw + 8, bx = x + w - bw + 4, by = y + h + 1; s += `<g class="${PRE}-diff ${PRE}-diff-${diff.tipo}"><rect x="${r1(bx)}" y="${by - 9}" width="${r1(bw)}" height="18" rx="9"/><use href="#${PRE}-d-${diff.tipo}" x="${r1(bx + 11)}" y="${by}" class="${PRE}-diff-marca"/>`; for (const l of LANGS) s += `<text lang="${l}" class="${PRE}-t-diff" x="${r1(bx + 20)}" y="${by + 4}">${DIFF_TXT[diff.tipo][l === "es" ? 0 : 1]}</text>`; s += `</g>`; }
  return s + `</g>`;
}

export function svgLado(filas, o = {}) {
  const N = BANDAS.length, W = 2 * P.M + N * P.colW + (N - 1) * P.gap;
  const colX = (i) => P.M + i * (P.colW + P.gap);
  const lhN = 16; let nomL = 1;
  for (const b of BANDAS) for (const l of LANGS) nomL = Math.max(nomL, F.partir(BANDA[b][l][0], 13, 700, P.colW).length);
  const Hh = 4 + 14 + 4 + nomL * lhN + 14;
  const rowH = P.labelH + P.bH;
  const H = Hh + filas.length * rowH + (filas.length - 1) * P.rowGap + 8;
  let s = `<svg class="dir-svg dir-b" data-dir="t" data-lienzo="lado-${o.id ?? "x"}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="${esc(o.aria?.[0] ?? "Lado a lado: plataformas alineadas por banda.")}" data-aria-en="${esc(o.aria?.[1] ?? "Side by side: platforms aligned by band.")}">${defs()}`;
  BANDAS.forEach((b, i) => { const x = colX(i); s += `<g data-dueno="banda-${b}"><text class="${PRE}-t-num" x="${x}" y="${r1(F.base(4, 11, 14))}">${String(i + 1).padStart(2, "0")}${i >= 6 ? " ·" : ""}</text>`; for (const l of LANGS) s += t(l, F.partir(BANDA[b][l][0], 13, 700, P.colW), x, 4 + 14 + 4, 13, lhN, `${PRE}-t-banda ${PRE}-t-banda-lado`); s += `</g>`; });
  s += `<path class="${PRE}-guia" d="M${colX(6) - P.gap / 2},0 V${H - 8}"/>`;
  filas.forEach((fila, r) => {
    const y = Hh + r * (rowH + P.rowGap);
    s += `<path class="${PRE}-franja-filete" d="M${P.M},${y} H${W - P.M}"/>`;
    for (const l of LANGS) s += t1(l, fila.etiqueta[l], P.M, y + 4, 13, 18, `${PRE}-t-banda ${PRE}-t-fila-lado`);
    for (const l of LANGS) s += t1(l, fila.meta[l], P.M + 4 + Math.max(...LANGS.map((k) => F.medir(fila.etiqueta[k], 13, 700))) + 10, y + 5, 11, 16, `${PRE}-t-num`);
    BANDAS.forEach((b, i) => (s += bloque(fila.pl, b, colX(i), y + P.labelH, P.colW, P.bH, fila.diff?.[b], { fichaDe: fila.fichaDe })));
  });
  return { svg: s + `</svg>`, W, H, cols: BANDAS.map((b, i) => ({ id: b, x: colX(i) })) };
}
export const filaDe = (pl) => ({ pl, etiqueta: pl.nombre, meta: { es: `v${pl.version} · verificado hace ${pl.verificado} días`, en: `v${pl.version} · verified ${pl.verificado} days ago` } });
/** Constante DECLARADA de la vista: tres plataformas a la vez en ancho; con más, se pagina. */
export const POR_PAGINA = 3;
export const PAGINAS_PL = Array.from({ length: Math.ceil(PLATAFORMAS.length / POR_PAGINA) }, (_, i) => PLATAFORMAS.slice(i * POR_PAGINA, (i + 1) * POR_PAGINA));
const lista = (xs, y) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} ${y} ${xs[xs.length - 1]}`);
const ariaPag = ([es, en], pls, k) => [`${es}, página ${k} de ${PAGINAS_PL.length}: ${lista(pls.map((p) => p.nombre.es.replace(" (ficticia)", "")), "y")}.`, `${en}, page ${k} of ${PAGINAS_PL.length}: ${lista(pls.map((p) => p.nombre.en.replace(" (fictional)", "")), "and")}.`];
export function paginas() {
  const pags = PAGINAS_PL.map((pls, i) => svgLado(pls.map(filaDe), { id: `pag-${i + 1}`, aria: ariaPag(["Lado a lado", "Side by side"], pls, i + 1) }));
  const [p1, p2] = pags;
  const ej = PLATAFORMAS[0];
  const diffPorBanda = Object.fromEntries(DIFF.map((d) => [d.banda, d]));
  const v2 = { ...ej, version: "0.2.0", verificado: 1 };
  const dif = svgLado([{ pl: ej, etiqueta: { es: "Plataforma Ejemplo · v0.1.0", en: "Example Platform · v0.1.0" }, meta: { es: "mapa anterior", en: "previous map" } }, { pl: v2, etiqueta: { es: "Plataforma Ejemplo · v0.2.0", en: "Example Platform · v0.2.0" }, meta: { es: "mapa nuevo · 4 diferencias", en: "new map · 4 differences" }, diff: diffPorBanda, fichaDe: "ejemplo" }], { id: "diff", aria: ["Diferencias entre dos versiones del mapa de la Plataforma Ejemplo.", "Differences between two versions of the Example Platform map."] });
  return { p1, p2, dif };
}
if (import.meta.url === `file://${process.argv[1]}`) { const r = paginas(); for (const k of Object.keys(r)) console.log(k, r[k].W, "×", r[k].H, `${(r[k].svg.length / 1024).toFixed(1)} KB`); console.log(avisos.length ? avisos.join("\n") : "sin avisos"); }


/**
 * Lado a lado con los componentes DESPLEGADOS (ajuste de la mirada 3: «que se desplegaran los
 * componentes visualmente»). Mismas 9 columnas alineadas por banda (G5), a 152 u como el nivel 2;
 * cada celda = cabecera del bloque (nombre, hasta 2 líneas) y su pila de nodos (152 × 88 a 8 u).
 * La fila mide lo que su celda más alta; las columnas no se mueven.
 */
const C = { M: 8, colW: 152, gap: 14, labelH: 26, cabH: 22, nH: 88, nG: 8, rowGap: 22, pad: 12 }; // nH 88: 6 u entre la 3.ª línea del nombre y la fila de fuentes
function nodoComp(c, id, x, y) {
  const w = C.colW, h = C.nH, tp = TIPO[c.tipo], m = MADUREZ[c.mad], ga = c.mad === "disponible-general";
  let s = `<g class="${PRE}-elem ${PRE}-comp" role="graphics-symbol img" tabindex="0" data-dueno="${id}" data-aria-es="${esc(c.es)}. ${esc(tp.es[1])}. ${m.largo.es}. ${c.fuentes} ${c.fuentes === 1 ? "fuente" : "fuentes"}." data-aria-en="${esc(c.en)}. ${esc(tp.en[1])}. ${m.largo.en}. ${c.fuentes} ${c.fuentes === 1 ? "source" : "sources"}.">`;
  s += `<rect data-caja="${id}" class="${PRE}-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  s += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
  // Glifo 3 u más cerca del filete que en el nivel 2: «enmascaramiento» (116 u a 13/700) cabe en 117.
  const gx = x + 17, nx = x + 29, tw = w - (nx - x) - 6;
  s += `<use href="#${PRE}-g-${tp.g}" x="${gx}" y="${r1(F.base(y + 10, 13, 16) - 4.5)}" class="${PRE}-c-${tp.t}"/>`;
  for (const l of LANGS) { const nm = F.partir(c[l], 13, 700, tw); if (nm.length > 3) avisos.push(`lado-comp: ${id} (${l}) ${nm.length} líneas`); s += t(l, nm, nx, y + 10, 13, 16, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
  const yr = y + h - 8 - 16;
  if (!ga) { s += medidor(m.nivel, x + C.pad + 4, yr + 8, `${PRE}-madurez`); for (const l of LANGS) s += t1(l, m[l], x + C.pad + 12, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`); }
  const nf = c.fuentes;
  const ft = ga ? { es: `${nf} fuente${nf > 1 ? "s" : ""}`, en: `${nf} source${nf > 1 ? "s" : ""}` } : { es: String(nf), en: String(nf) };
  const fw = Math.max(...LANGS.map((l) => F.medir(ft[l], 12, 400)));
  s += `<use href="#${PRE}-k-doc" x="${r1(x + w - 8 - fw - 10)}" y="${yr + 8}" class="${PRE}-marca-suave"/>`;
  for (const l of LANGS) s += t1(l, ft[l], x + w - 8 - fw, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
  return s + `</g>`;
}
export function svgLadoComp(pls, o = {}) {
  const N = BANDAS.length, W = 2 * C.M + N * C.colW + (N - 1) * C.gap;
  const colX = (i) => C.M + i * (C.colW + C.gap);
  const lhN = 16; let nomL = 1;
  for (const b of BANDAS) for (const l of LANGS) nomL = Math.max(nomL, F.partir(BANDA[b][l][0], 13, 700, C.colW).length);
  const Hh = 4 + 14 + 4 + nomL * lhN + 14;
  const alto = (pl) => Math.max(...BANDAS.map((b) => { const k = COMPONENTES[pl.id][b].length; return k ? k * C.nH + (k - 1) * C.nG : C.nH; }));
  const cabL = (pl) => Math.max(1, ...BANDAS.flatMap((b) => { const d = LADO[pl.id][b]; return d ? LANGS.map((l) => F.partir(l === "es" ? d[0] : d[1], 12, 700, C.colW).length) : [1]; }));
  const filas = pls.map((pl) => { const cab = cabL(pl) * 16 + 6; return { pl, cab, h: C.labelH + cab + alto(pl) }; });
  const H = Hh + filas.reduce((a, f) => a + f.h, 0) + (filas.length - 1) * C.rowGap + 8;
  let s = `<svg class="dir-svg dir-b" data-dir="t" data-lienzo="lado-${o.id ?? "comp"}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="${esc(o.aria?.[0] ?? "Lado a lado con los componentes desplegados.")}" data-aria-en="${esc(o.aria?.[1] ?? "Side by side with the components expanded.")}">${defs()}`;
  BANDAS.forEach((b, i) => { const x = colX(i); s += `<g data-dueno="banda-${b}"><text class="${PRE}-t-num" x="${x}" y="${r1(F.base(4, 11, 14))}">${String(i + 1).padStart(2, "0")}${i >= 6 ? " ·" : ""}</text>`; for (const l of LANGS) s += t(l, F.partir(BANDA[b][l][0], 13, 700, C.colW), x, 4 + 14 + 4, 13, lhN, `${PRE}-t-banda ${PRE}-t-banda-lado`); s += `</g>`; });
  s += `<path class="${PRE}-guia" d="M${colX(6) - C.gap / 2},0 V${H - 8}"/>`;
  let y = Hh;
  for (const { pl, h, cab } of filas) {
    s += `<path class="${PRE}-franja-filete" d="M${C.M},${y} H${W - C.M}"/>`;
    const meta = { es: `v${pl.version} · verificado hace ${pl.verificado} días`, en: `v${pl.version} · verified ${pl.verificado} days ago` };
    for (const l of LANGS) s += t1(l, pl.nombre[l], C.M, y + 4, 13, 18, `${PRE}-t-banda ${PRE}-t-fila-lado`);
    for (const l of LANGS) s += t1(l, meta[l], C.M + 4 + Math.max(...LANGS.map((k) => F.medir(pl.nombre[k], 13, 700))) + 10, y + 5, 11, 16, `${PRE}-t-num`);
    BANDAS.forEach((b, i) => {
      const x = colX(i), d = LADO[pl.id][b], lista = COMPONENTES[pl.id][b];
      const yc = y + C.labelH;
      if (!d) {
        for (const l of LANGS) s += t1(l, l === "es" ? "sin bloque" : "no block", x, yc, 12, 16, `${PRE}-t-meta`);
        s += `<g class="${PRE}-elem" role="graphics-symbol img" tabindex="0" data-dueno="${pl.id}-${b}" data-aria-es="${esc(BANDA[b].es[0])}: sin componentes" data-aria-en="${esc(BANDA[b].en[0])}: no components"><rect data-caja="${pl.id}-${b}" class="${PRE}-card ${PRE}-fantasma" x="${x}" y="${yc + cab}" width="${C.colW}" height="${C.nH}" rx="6"/>`;
        for (const l of LANGS) s += t1(l, l === "es" ? "sin componentes" : "no components", x + 12, yc + cab + (C.nH - 16) / 2, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
        s += `</g>`;
        return;
      }
      // Cabecera del bloque (el nombre del nivel 1, hasta 2 líneas); la cuenta la dice la pila.
      for (const l of LANGS) s += t(l, F.partir(l === "es" ? d[0] : d[1], 12, 700, C.colW), x, yc, 12, 16, `${PRE}-t-meta ${PRE}-t-cab-bloque`);
      lista.forEach((c, k) => { s += nodoComp(c, `${pl.id}-${b}-${k}`, x, yc + cab + k * (C.nH + C.nG)); });
    });
    y += h + C.rowGap;
  }
  return { svg: s + `</svg>`, W, H, cols: BANDAS.map((b, i) => ({ id: b, x: colX(i) })) };
}
export function paginasComp() {
  const [c1, c2] = PAGINAS_PL.map((pls, i) => svgLadoComp(pls, { id: `comp-${i + 1}`, aria: ariaPag(["Componentes desplegados", "Expanded components"], pls, i + 1) }));
  return { c1, c2 };
}
