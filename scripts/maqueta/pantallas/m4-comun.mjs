// Piezas comunes de la mirada 4: símbolos en tinta, secciones y el DIAGRAMA DE ONDAS de decisiones
// (columnas = ondas de Kahn; tarjetas = decisiones; líneas = «depende de»; ruteo ortogonal por huecos
// entre columnas y un carril inferior para saltos; cero cruces con tarjetas, contados).
import { MARCA } from "../nucleo/glifos.mjs";
import { LANGS, esc, r1, camino, conFlecha, tramoCruzaCaja } from "../nucleo/comun.mjs";
import { conFuente, avisos } from "../atlas/metrica.mjs";
import { ES } from "./comun3.mjs";
import { REV, ESTADO_DEC, SUP } from "./datos4.mjs";
export { avisos };
const F = conFuente("space-grotesk");

export const marca = (d, s = 14, w = 1.8) => `<svg viewBox="-8 -8 16 16" width="${s}" height="${s}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const X = (s = 14) => `<svg viewBox="-8 -8 16 16" width="${s}" height="${s}" aria-hidden="true"><circle r="7" fill="currentColor"/><path d="${MARCA.vencido}" fill="none" stroke="var(--fondo)" stroke-width="1.8" stroke-linecap="round"/></svg>`;
export const ALERTA = (s = 14) => `<svg viewBox="-8 -8 16 16" width="${s}" height="${s}" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="${MARCA.revisar}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
export const PEND = (s = 14) => `<svg viewBox="-8 -8 16 16" width="${s}" height="${s}" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2"/></svg>`;
export const sem = (v, txt) => `<span class="semaforo semaforo-${v}"><svg viewBox="-8 -8 16 16" width="16" height="16" aria-hidden="true">${v === "vencido" ? `<circle r="7" fill="currentColor"/><path d="${MARCA.vencido}" fill="none" stroke="var(--fondo)" stroke-width="1.8" stroke-linecap="round"/>` : `<circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="${MARCA[v]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`}</svg>${txt}</span>`;
export const sec = (es, en, nota, cuerpo, attrs = "") => `<section class="seccion"${attrs}><h2>${ES(es, en)}</h2>${nota ? `<p class="kit-nota">${nota}</p>` : ""}${cuerpo}</section>`;
export const SHA = (a, b) => `<span class="huella">sha256 <b>${a}</b>…${b}</span>`;
export const n1 = (x) => x.toFixed(1).replace(".", ",");
export const num = (x) => ES(n1(x), x.toFixed(1));

/** Glifos de reversibilidad (en tinta; jamás un matiz). */
export const REV_D = {
  una_via: "M-6.5,0 H3.5 M0.5,-3.5 L4,0 L0.5,3.5 M6.5,-5 V5",
  costosa: "M-6.5,-2.5 H5 M2,-5.5 L5.5,-2.5 L2,0.5 M5,3.5 H-1",
  dos_vias: "M-6,-2.5 H6 M3,-5.5 L6,-2.5 L3,0.5 M6,2.5 H-6 M-3,-0.5 L-6,2.5 L-3,5.5",
};
export const revIco = (r, s = 16) => `<svg class="rev-ico" viewBox="-8 -8 16 16" width="${s}" height="${s}" aria-hidden="true"><path d="${REV_D[r]}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const revTxt = (r) => `<span class="rev rev-${r}">${revIco(r)}${ES(REV[r].es, REV[r].en)}</span>`;
export const IMPL_D = "M0,-5 V1.5 M0,4.2 V4.6";

const t = (lang, lineas, x, top, size, lh, clase, extra = "") => { const y0 = F.base(top, size, lh); return `<text lang="${lang}" class="${clase}"${extra}>${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`; };
const t1 = (lang, s, x, top, size, lh, clase, extra = "") => t(lang, [s], x, top, size, lh, clase, extra);

const G = { M: 8, colW: 224, gap: 72, cabH: 50, cH: 112, vG: 32, pad: 12, lane: 22 };
/**
 * Diagrama de ondas. `cols` = [{titulo:{es,en}, sub:{es,en}, ids:[...]}]; `decs` con sus `dep`;
 * `ciclo` = ids del ciclo (se marcan) o null. Devuelve {svg, W, H, cruces}.
 */
export function svgOndas(cols, decs, o = {}) {
  const W = 2 * G.M + cols.length * G.colW + (cols.length - 1) * G.gap;
  const colX = (i) => G.M + i * (G.colW + G.gap);
  const pos = {};
  cols.forEach((c, i) => c.ids.forEach((id, k) => (pos[id] = { col: i, row: k, x: colX(i), w: G.colW, h: G.cH })));
  const enCiclo = new Set(o.ciclo ?? []);
  // Aristas u → v («v depende de u»: se dibuja de la anterior a la que depende).
  const aristas = [];
  for (const d of decs) for (const u of d.dep) if (pos[u] && pos[d.id]) aristas.push({ u, v: d.id, ciclo: enCiclo.has(u) && enCiclo.has(d.id) });
  // Saltos de columna: entre dos tarjetas de la primera fila van por un carril SUPERIOR (bajo los títulos);
  // los demás, por el carril inferior. Así ningún salto corta las dependencias de las filas de abajo.
  let arriba = 0;
  for (const a of aristas) { const pu = pos[a.u], pv = pos[a.v]; if (pv.col > pu.col + 1 && pu.row === 0 && pv.row === 0) a.arriba = arriba++; }
  const cabH = G.cabH + (arriba ? 6 + arriba * G.lane : 0);
  for (const id in pos) pos[id].y = cabH + pos[id].row * (G.cH + G.vG);
  const filas = Math.max(...cols.map((c) => c.ids.length));
  const baseCards = cabH + filas * (G.cH + G.vG) - G.vG;
  // Puertos: salidas por la derecha, entradas por la izquierda, repartidos y ordenados por la y del otro extremo.
  const sal = {}, ent = {};
  for (const a of aristas) { const pu = pos[a.u], pv = pos[a.v]; if (pu.col === pv.col) continue; (sal[a.u] ??= []).push(a); (ent[a.v] ??= []).push(a); }
  for (const k in sal) sal[k].sort((a, b) => pos[a.v].y - pos[b.v].y);
  for (const k in ent) ent[k].sort((a, b) => (pos[a.u].col === pos[b.u].col ? pos[a.u].y - pos[b.u].y : pos[b.u].col - pos[a.u].col));
  const py = (id, lista, a) => { const p = pos[id]; const i = lista.indexOf(a); return p.y + (p.h * (i + 1)) / (lista.length + 1); };
  // Pistas por hueco (hueco g = entre la columna g y la g+1).
  const pistas = {};
  const pedir = (g, a) => (pistas[g] ??= []).push(a);
  let carriles = 0;
  for (const a of aristas) { const cu = pos[a.u].col, cv = pos[a.v].col; if (cu === cv) continue; if (cv === cu + 1) pedir(cu, a); else { pedir(cu, { ...a, tramo: "baja" }); pedir(cv - 1, { ...a, tramo: "sube" }); if (a.arriba === undefined) a.carril = carriles++; } }
  const pistaX = (g, a, tramo) => { const l = pistas[g]; const i = l.findIndex((q) => q.u === a.u && q.v === a.v && (q.tramo ?? null) === (tramo ?? null)); return colX(g) + G.colW + (G.gap * (i + 1)) / (l.length + 1); };
  const H = baseCards + (carriles ? 14 + carriles * G.lane : 0) + 16;
  let s = `<svg class="dir-svg dir-b" data-dir="t" data-lienzo="${o.id ?? "ondas"}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="${esc(o.aria?.[0] ?? "Decisiones por ondas.")}" data-aria-en="${esc(o.aria?.[1] ?? "Decisions by waves.")}">`;
  s += `<defs><path id="dd-impl" d="${IMPL_D}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>${Object.entries(REV_D).map(([k, d]) => `<path id="dd-rev-${k}" d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}<path id="dd-sup" d="M-5,-5.5 H5 V5.5 H-5 Z M-2.5,-2 H2.5 M-2.5,1 H1" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></defs>`;
  cols.forEach((c, i) => {
    const x = colX(i);
    s += `<g data-dueno="onda-${i}">`;
    for (const l of LANGS) { s += t1(l, c.titulo[l], x, 4, 12, 16, "db-t-num"); s += t1(l, c.sub[l], x, 22, 13, 18, "db-t-meta"); }
    s += `</g>`;
    if (i < cols.length - 1) s += `<path class="db-guia" d="M${x + G.colW + G.gap / 2},0 V${baseCards}"/>`;
  });
  // Líneas (debajo de las tarjetas).
  const tramos = [];
  const dibuja = (pts, a) => { tramos.push({ a, pts }); const { p, tri } = conFlecha(pts); return `<g class="dd-dep${a.ciclo ? " dd-dep-ciclo" : ""}" data-dep="${a.u}>${a.v}"><path d="${camino(p)}" class="db-linea"/><path d="${tri}" class="db-punta"/></g>`; };
  for (const a of aristas) {
    const pu = pos[a.u], pv = pos[a.v];
    if (pu.col === pv.col) {
      // Misma columna (solo en el ciclo): vertical entre tarjetas contiguas; ida a la izquierda del centro, vuelta a la derecha.
      const abajo = pv.row > pu.row; const dx = abajo ? -28 : 28; const cx = pu.x + pu.w / 2 + dx;
      s += dibuja(abajo ? [[cx, pu.y + pu.h], [cx, pv.y]] : [[cx, pu.y], [cx, pv.y + pv.h]], a);
      continue;
    }
    const y1 = py(a.u, sal[a.u], a), y2 = py(a.v, ent[a.v], a);
    const x1 = pu.x + pu.w, x2 = pv.x;
    if (pv.col === pu.col + 1) { const xt = pistaX(pu.col, a); s += dibuja(Math.abs(y1 - y2) < 0.5 ? [[x1, y1], [x2, y1]] : [[x1, y1], [xt, y1], [xt, y2], [x2, y2]], a); }
    else { const yl = a.arriba !== undefined ? G.cabH + 6 + a.arriba * G.lane + G.lane / 2 - 4 : baseCards + 14 + a.carril * G.lane + G.lane / 2; const xa = pistaX(pu.col, a, "baja"), xb = pistaX(pv.col - 1, a, "sube"); s += dibuja([[x1, y1], [xa, y1], [xa, yl], [xb, yl], [xb, y2], [x2, y2]], a); }
  }
  // Tarjetas.
  for (const id of Object.keys(pos)) {
    const d = decs.find((q) => q.id === id), p = pos[id], sup = d.sup.map((x) => SUP.find((q) => q.id === x)).filter((q) => q && q.estado === "sin_probar");
    const cic = enCiclo.has(id); const bloq = o.bloqueadas?.includes(id) && !cic;
    s += `<g class="db-elem db-nodo dd-dec dd-${d.rev}${cic ? " dd-en-ciclo" : ""}${bloq ? " dd-bloq" : ""}" role="graphics-symbol img" tabindex="0" data-dueno="${id}" data-nodo="${id}" data-aria-es="${esc(d.es)}. Decisión de ${REV[d.rev].es}. ${ESTADO_DEC[d.estado][0]}.${d.impl ? " Implícita." : ""}${cic ? " En un ciclo de dependencias." : ""}" data-aria-en="${esc(d.en)}. ${REV[d.rev].en} decision. ${ESTADO_DEC[d.estado][1]}.${d.impl ? " Implicit." : ""}${cic ? " In a dependency cycle." : ""}">`;
    s += `<rect data-caja="${id}" class="db-card dd-caja" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="6"/>`;
    s += `<use href="#dd-rev-${d.rev}" x="${p.x + G.pad + 7}" y="${p.y + 17}" class="db-marca"/>`;
    for (const l of LANGS) s += t1(l, REV[d.rev][l], p.x + G.pad + 20, p.y + 9, 12, 16, "db-t-num dd-t-rev");
    const est = cic ? ["en ciclo", "in cycle"] : bloq ? ["sin onda", "no wave"] : ESTADO_DEC[d.estado];
    for (const l of LANGS) { const tx = est[l === "es" ? 0 : 1]; s += t1(l, tx, p.x + p.w - G.pad - F.medir(tx, 12, 400) * 1.02, p.y + 9, 12, 16, "db-t-meta db-t-meta-compacta"); }
    for (const l of LANGS) { const nm = F.partir(l === "es" ? d.es : d.en, 14, 700, p.w - 2 * G.pad); if (nm.length > 3) avisos.push(`ondas: ${id} (${l}) ${nm.length} líneas`); s += t(l, nm, p.x + G.pad, p.y + 32, 14, 18, "db-t-nombre dd-t-nombre"); }
    const yb = p.y + p.h - 10 - 16;
    let xb = p.x + G.pad;
    if (d.impl) { s += `<use href="#dd-impl" x="${xb + 4}" y="${yb + 8}" class="db-marca"/>`; for (const l of LANGS) s += t1(l, l === "es" ? "implícita" : "implicit", xb + 12, yb, 12, 16, "db-t-meta db-t-meta-compacta"); xb += 12 + Math.max(F.medir("implícita", 12, 400), F.medir("implicit", 12, 400)) + 14; }
    if (sup.length) { s += `<use href="#dd-sup" x="${xb + 5}" y="${yb + 8}" class="db-marca"/>`; for (const l of LANGS) s += t1(l, l === "es" ? "supuesto sin probar" : "untested assumption", xb + 14, yb, 12, 16, "db-t-meta db-t-meta-compacta"); }
    s += `</g>`;
  }
  // D11: ningún tramo atraviesa una tarjeta ajena; cruces entre líneas contados.
  let cruces = 0;
  const cajas = Object.entries(pos).map(([id, p]) => ({ id, c: [p.x, p.y, p.w, p.h] }));
  for (const { a, pts } of tramos) for (let i = 0; i < pts.length - 1; i++) for (const { id, c } of cajas) if (id !== a.u && id !== a.v && tramoCruzaCaja(pts[i], pts[i + 1], c)) { cruces++; avisos.push(`ondas D11: ${a.u}>${a.v} atraviesa ${id}`); }
  let entre = 0;
  const seg = (p, q) => ({ h: p[1] === q[1], x1: Math.min(p[0], q[0]), x2: Math.max(p[0], q[0]), y1: Math.min(p[1], q[1]), y2: Math.max(p[1], q[1]) });
  for (let i = 0; i < tramos.length; i++) for (let j = i + 1; j < tramos.length; j++) {
    const A = tramos[i].pts, B = tramos[j].pts;
    for (let a = 0; a < A.length - 1; a++) for (let b = 0; b < B.length - 1; b++) { const s1 = seg(A[a], A[a + 1]), s2 = seg(B[b], B[b + 1]); if (s1.h === s2.h) continue; const hz = s1.h ? s1 : s2, vt = s1.h ? s2 : s1; if (vt.x1 > hz.x1 + 0.5 && vt.x1 < hz.x2 - 0.5 && hz.y1 > vt.y1 + 0.5 && hz.y1 < vt.y2 - 0.5) entre++; }
  }
  return { svg: s + `</svg>`, W, H, cruces, entre, cols: cols.map((c, i) => ({ id: `onda-${i}`, x: colX(i) })) };
}
