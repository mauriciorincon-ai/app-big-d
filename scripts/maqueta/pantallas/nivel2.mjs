// Nivel 2 (componentes) y nivel 3 (recorrido) en la dirección B: nodos apilados por columna, flujos
// entre nodos con su modo, franjas con sus nodos y referencias. Misma cabecera y constantes que el
// nivel 1 (../calc2/dir3.mjs). Las franjas siguen por referencia (propuesta § 4.3 ampliada).
import { BANDA, MAPA, MADUREZ, MODO, NODO, TIPO, VARIANTE } from "../nucleo/datos.mjs";
import { LANGS, camino, conFlecha, esc, r1 } from "../nucleo/comun.mjs";
import { MODO_MARCA, TIPO_GLIFO, medidor } from "../nucleo/glifos.mjs";
import { conFuente, avisos } from "../atlas/metrica.mjs";
import { PASO_NUM, REC } from "./datos2.mjs";
export { avisos };

const P = { M: 8, colW: 152, gap: 50, hNum: 12, hNom: 17, hPre: 14, nH: 84, nG: 40, pad: 12, zona: 200 };
const PRE = "db";
const F = conFuente("space-grotesk");
const t = (lang, lineas, x, top, size, lh, clase, extra = "") => { const y0 = F.base(top, size, lh); return `<text lang="${lang}" class="${clase}"${extra}>${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`; };
const t1 = (lang, s, x, top, size, lh, clase, extra = "") => t(lang, [s], x, top, size, lh, clase, extra);

function defs() {
  let s = "<defs>";
  for (const [g, v] of Object.entries(TIPO_GLIFO)) s += v.relleno ? `<path id="${PRE}-g-${g}" d="${v.d}" fill="currentColor"/>` : `<path id="${PRE}-g-${g}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="${v.trazo}"/>`;
  for (const [m, v] of Object.entries(MODO_MARCA)) s += v.relleno === "mixto" ? `<path id="${PRE}-m-${m}" d="${v.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>` : `<path id="${PRE}-m-${m}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-arriba" d="M0,5 V-4 M-3.5,-1 L0,-4.5 L3.5,-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-abajo" d="M0,-5 V4 M-3.5,1 L0,4.5 L3.5,1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-doc" d="M-4,-5.5 H2 L4.5,-3 V5.5 H-4 Z M-1.5,-1 H2 M-1.5,2 H2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-rama" d="M-5,-3 H5 M-5,3 H5 M1.5,-6 L5,-3 L1.5,0 M1.5,0 L5,3 L1.5,6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s + "</defs>";
}

const nodosDe = (banda) => MAPA.nodos.filter((n) => n.banda_id === banda).sort((a, b) => a.orden - b.orden);
const nodoAria = (n, l) => `${NODO[n.id][l]}. ${TIPO[n.tipo_id][l][1]}. ${MADUREZ[n.madurez].largo[l]}.`;

/** @param {{recorrido?: boolean}} o */
export function svgNivel2(o = {}) {
  const { capas, franjas } = VARIANTE.transversal;
  const N = capas.length;
  const W = 2 * P.M + N * P.colW + (N - 1) * P.gap;
  const colX = (i) => P.M + i * (P.colW + P.gap);
  const lhN = 21, lhP = 19;
  let nomL = 1, preL = 1;
  for (const b of capas) for (const l of LANGS) { nomL = Math.max(nomL, F.partir(BANDA[b][l][0], P.hNom, 700, P.colW).length); preL = Math.max(preL, F.partir(BANDA[b][l][1], P.hPre, 400, P.colW).length); }
  const yNom = 4 + 16 + 6, yPre = yNom + nomL * lhN + 6, Hh = yPre + preL * lhP + 18;
  const filas = Math.max(...capas.map((b) => nodosDe(b).length));
  const yNodo = (r) => Hh + r * (P.nH + P.nG);
  const yb = yNodo(filas - 1) + P.nH;
  const t1y = yb + 24, t2y = yb + 46, carrilFin = t2y + 22, franjasY = carrilFin + 40;
  // Posición de cada nodo.
  const pos = {};
  capas.forEach((b, i) => nodosDe(b).forEach((n, r) => (pos[n.id] = { x: colX(i), y: yNodo(r), w: P.colW, h: P.nH, col: i, fila: r, banda: b })));
  // Franjas: nodos apilados en fichas compactas.
  const fH = {}, fY = {};
  let yF = franjasY;
  for (const b of franjas) { const k = nodosDe(b).length; fH[b] = Math.max(64, 10 + k * 44 + (k - 1) * 8 + 10); fY[b] = yF; yF += fH[b] + 10; }
  const H = yF - 10 + 8;
  const paso = {};
  if (o.recorrido) for (const p of REC.pasos) paso[p.nodo_id] = p;
  const aria = o.recorrido ? ["Recorrido de un registro de admisión sobre el mapa de componentes de la Plataforma Ejemplo.", "Journey of one admission record over the Example Platform component map."] : ["Mapa de componentes de la Plataforma Ejemplo: 14 componentes en seis capas y tres franjas.", "Example Platform component map: 14 components in six layers and three cross-cutting bands."];
  let s = `<svg class="dir-svg dir-b${o.recorrido ? " dg-rec" : ""}" data-dir="t" data-lienzo="${o.recorrido ? "recorrido" : "nivel-2"}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="${aria[0]}" data-aria-en="${aria[1]}">${defs()}`;
  for (let i = 1; i < N; i++) s += `<path class="${PRE}-guia" d="M${colX(i) - P.gap / 2},0 V${carrilFin}"/>`;
  capas.forEach((b, i) => {
    const x = colX(i);
    s += `<g data-dueno="banda-${b}"><text class="${PRE}-t-num" x="${x}" y="${r1(F.base(4, P.hNum, 16))}">${String(i + 1).padStart(2, "0")}</text>`;
    for (const l of LANGS) { s += t(l, F.partir(BANDA[b][l][0], P.hNom, 700, P.colW), x, yNom, P.hNom, lhN, `${PRE}-t-banda`); s += t(l, F.partir(BANDA[b][l][1], P.hPre, 400, P.colW), x, yPre, P.hPre, lhP, `${PRE}-t-pregunta`); }
    s += `</g>`;
  });
  // Nodo (tarjeta de nivel 2).
  const nodo = (n, x, y, w, h, compacto = false) => {
    const tp = TIPO[n.tipo_id], mad = MADUREZ[n.madurez], ga = n.madurez === "disponible-general";
    const p = paso[n.id];
    let o2 = `<g class="${PRE}-elem ${PRE}-nodo${compacto ? ` ${PRE}-elem-compacto` : ""}" role="graphics-symbol img" tabindex="0" data-dueno="${n.id}" data-nodo="${n.id}"${p ? ` data-paso="${p.id}"` : ""} data-aria-es="${esc(nodoAria(n, "es"))}" data-aria-en="${esc(nodoAria(n, "en"))}">`;
    o2 += `<rect data-caja="${n.id}" class="${PRE}-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    o2 += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
    const gx = x + P.pad + 8, nx = x + P.pad + 22, tw = w - (nx - x) - 8;
    if (compacto) {
      o2 += `<use href="#${PRE}-g-${tp.g}" x="${gx}" y="${y + h / 2}" class="${PRE}-c-${tp.t}"/>`;
      for (const l of LANGS) { const nm = F.partir(NODO[n.id][l], 13, 700, tw); if (nm.length > 2) avisos.push(`nivel2: ${n.id} (${l}) compacto ${nm.length} líneas`); o2 += t(l, nm, nx, y + (h - nm.length * 16) / 2, 13, 16, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
    } else {
      o2 += `<use href="#${PRE}-g-${tp.g}" x="${gx}" y="${r1(F.base(y + 10, 13, 16) - 4.5)}" class="${PRE}-c-${tp.t}"/>`;
      for (const l of LANGS) { const nm = F.partir(NODO[n.id][l], 13, 700, tw); if (nm.length > 3) avisos.push(`nivel2: ${n.id} (${l}) ${nm.length} líneas`); o2 += t(l, nm, nx, y + 10, 13, 16, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
      const yr = y + h - 8 - 16;
      if (!ga) { o2 += medidor(mad.nivel, x + P.pad + 4, yr + 8, `${PRE}-madurez`); for (const l of LANGS) o2 += t1(l, mad[l], x + P.pad + 12, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`); }
      const nf = n.fuentes.length;
      // Con madurez a la vista, las fuentes van como glifo + número para que la fila no se pise.
      const ft = ga ? { es: `${nf} fuente${nf > 1 ? "s" : ""}`, en: `${nf} source${nf > 1 ? "s" : ""}` } : { es: String(nf), en: String(nf) };
      const fw = Math.max(...LANGS.map((l) => F.medir(ft[l], 12, 400)));
      o2 += `<use href="#${PRE}-k-doc" x="${r1(x + w - 8 - fw - 10)}" y="${yr + 8}" class="${PRE}-marca-suave"/>`;
      for (const l of LANGS) o2 += t1(l, ft[l], x + w - 8 - fw, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
    }
    if (p) { const num = PASO_NUM[p.id]; const bw = num.length > 1 ? 30 : 24; o2 += `<g class="dg-paso-insignia"><rect x="${x - 6}" y="${y - 12}" width="${bw}" height="24" rx="12"/><text class="dg-t-paso" x="${x - 6 + bw / 2}" y="${y + 4.4}" text-anchor="middle">${num}</text></g>`; if (p.bifurca) o2 += `<use href="#${PRE}-k-rama" x="${x - 6 + bw + 10}" y="${y}" class="dg-rama"/>`; }
    return o2 + `</g>`;
  };
  for (const n of Object.keys(pos)) { const q = pos[n]; s += nodo(MAPA.nodos.find((x) => x.id === n), q.x, q.y, q.w, q.h); }
  // Flujos entre nodos de capas.
  const enCapas = MAPA.flujos.filter((f) => pos[f.origen] && pos[f.destino]);
  const puertos = {}; // `${nodo}:${borde}` → [{f, otroY}]
  const addPuerto = (n, borde, f, ref) => { const k = `${n}:${borde}`; (puertos[k] ??= []).push({ f, ref }); };
  const plan = [];
  for (const f of enCapas) {
    const a = pos[f.origen], b = pos[f.destino];
    if (a.col === b.col) { plan.push({ f, tipo: "intra" }); continue; }
    const ida = b.col > a.col;
    if (Math.abs(b.col - a.col) === 1) { plan.push({ f, tipo: "vecino", ida }); addPuerto(f.origen, ida ? "der" : "izq", f, b.y); addPuerto(f.destino, ida ? "izq" : "der", f, a.y); }
    else { plan.push({ f, tipo: "salto" }); addPuerto(f.origen, "abajo", f, b.x); addPuerto(f.destino, "izq", f, 99999); }
  }
  const puertoY = (n, borde, f) => { const k = `${n}:${borde}`; const lista = puertos[k].sort((u, v) => u.ref - v.ref); const i = lista.findIndex((u) => u.f === f); const q = pos[n]; return q.y + (q.h * (i + 1)) / (lista.length + 1); };
  const puertoX = (n, f) => { const lista = puertos[`${n}:abajo`].sort((u, v) => v.ref - u.ref); const i = lista.findIndex((u) => u.f === f); const q = pos[n]; return q.x + q.w * (0.5 + 0.22 * i); };
  const chip = (f, cx, cy) => `<g class="${PRE}-chip"><rect data-caja="chip-${f.id}" x="${r1(cx - 11)}" y="${r1(cy - 9)}" width="22" height="18" rx="9"/><use href="#${PRE}-m-${f.modo_id}" x="${r1(cx)}" y="${r1(cy)}" class="${PRE}-marca"/></g>`;
  const trazo = (f, pts) => { const { p, tri } = conFlecha(pts, 8); const d = camino(p, 10); let o2 = `<g class="${PRE}-flujo ${PRE}-modo-${f.modo_id}" data-flujo="${f.id}">`; o2 += f.modo_id === "sin-copia" ? `<path d="${d}" class="${PRE}-linea ${PRE}-doble-ext"/><path d="${d}" class="${PRE}-linea ${PRE}-doble-int"/>` : `<path d="${d}" class="${PRE}-linea"/>`; return o2 + `<path d="${tri}" class="${PRE}-punta"/></g>`; };
  let lineas = "", chips = "";
  // Pistas verticales por canal (entre col i e i+1), repartidas a 10 u.
  const pistas = {};
  const pista = (canal) => { pistas[canal] = (pistas[canal] ?? 0) + 1; return colX(canal) + P.colW + P.gap / 2 + (pistas[canal] - 1) * 10 - 5; };
  const saltos = plan.filter((q) => q.tipo === "salto").sort((u, v) => pos[v.f.destino].col - pos[u.f.destino].col);
  for (const q of plan.filter((q) => q.tipo === "vecino")) {
    const { f, ida } = q; const a = pos[f.origen], b = pos[f.destino];
    const y1 = puertoY(f.origen, ida ? "der" : "izq", f), y2 = puertoY(f.destino, ida ? "izq" : "der", f);
    const x1 = ida ? a.x + a.w : a.x, x2 = ida ? b.x : b.x + b.w;
    if (Math.abs(y1 - y2) < 0.5) { lineas += trazo(f, [[x1, y1], [x2, y1]]); chips += chip(f, (x1 + x2) / 2 + (ida ? -4 : 4), y1); }
    else { const xc = pista(Math.min(a.col, b.col)); lineas += trazo(f, [[x1, y1], [xc, y1], [xc, y2], [x2, y2]]); chips += chip(f, (x1 + xc) / 2, y1); }
  }
  for (const q of plan.filter((q) => q.tipo === "intra")) {
    const { f } = q; const a = pos[f.origen], b = pos[f.destino]; const abajo = b.fila > a.fila;
    const x = a.x + a.w * 0.5, y1 = abajo ? a.y + a.h : a.y, y2 = abajo ? b.y : b.y + b.h;
    lineas += trazo(f, [[x, y1], [x, y2]]); chips += chip(f, x + 24, (y1 + y2) / 2);
  }
  saltos.forEach((q, j) => {
    const { f } = q; const a = pos[f.origen], b = pos[f.destino];
    const xp = puertoX(f.origen, f), yt = j === 0 ? t2y : t1y;
    const xc = pista(b.col - 1), y2 = puertoY(f.destino, "izq", f);
    lineas += trazo(f, [[xp, a.y + a.h], [xp, yt], [xc, yt], [xc, y2], [b.x, y2]]);
    chips += chip(f, j === 0 ? (xp + xc) / 2 : xp + (xc - xp) * 0.5, yt);
  });
  s += lineas + chips;
  // Franjas.
  for (const l of LANGS) s += t1(l, l === "es" ? "TRANSVERSALES · ABARCAN TODAS LAS CAPAS" : "CROSS-CUTTING · SPAN EVERY LAYER", P.M, franjasY - 26, 12, 16, `${PRE}-t-num`);
  for (const b of franjas) {
    const y = fY[b], h = fH[b], x0 = P.M, x1 = W - P.M, ns = nodosDe(b);
    s += `<g data-dueno="franja-${b}"><path class="${PRE}-franja-filete" d="M${x0},${y} H${x1}"/>`;
    for (const l of LANGS) { const nm = F.partir(BANDA[b][l][0], 15, 700, P.zona), pr = F.partir(BANDA[b][l][1], 13, 400, P.zona); const alto = nm.length * 19 + 4 + pr.length * 17; s += t(l, nm, x0 + 14, y + (h - alto) / 2, 15, 19, `${PRE}-t-banda ${PRE}-t-banda-franja`); s += t(l, pr, x0 + 14, y + (h - alto) / 2 + nm.length * 19 + 4, 13, 17, `${PRE}-t-pregunta ${PRE}-t-pregunta-franja`); }
    s += `</g>`;
    const ex = x0 + 14 + P.zona + 8, ew = 168;
    ns.forEach((n, k) => (s += nodo(n, ex, y + 10 + k * 52, ew, 44, true)));
    // Referencias bajo la columna del nodo de capa con el que conecta cada nodo de la franja.
    for (const n of ns) for (const f of MAPA.flujos.filter((f) => f.origen === n.id || f.destino === n.id)) {
      const otro = f.origen === n.id ? f.destino : f.origen; const sube = f.origen === n.id; const q = pos[otro];
      const cx = q.x + q.w / 2, cy = y + 10 + ns.indexOf(n) * 52 + 22;
      const tw = Math.max(...LANGS.map((l) => F.medir(NODO[otro][l], 13, 700))); const w = 28 + 14 + 4 + tw + 12, rh = 30; let rx = Math.max(cx - w / 2, ex + ew + 8);
      if (rx + w > x1 - 4) rx = x1 - 4 - w;
      const a2 = (l) => `${sube ? (l === "es" ? "Conecta con" : "Connects to") : l === "es" ? "Recibe de" : "Receives from"} ${NODO[otro][l]}, ${MODO[f.modo_id][l][0].toLowerCase()}`;
      s += `<g class="${PRE}-ref" data-dueno="ref-${f.id}" role="graphics-symbol img" data-aria-es="${esc(a2("es"))}" data-aria-en="${esc(a2("en"))}"><rect data-caja="ref-${f.id}" x="${r1(rx)}" y="${r1(cy - rh / 2)}" width="${r1(w)}" height="${rh}" rx="15"/><use href="#${PRE}-k-${sube ? "arriba" : "abajo"}" x="${r1(rx + 16)}" y="${r1(cy)}" class="${PRE}-marca"/><use href="#${PRE}-m-${f.modo_id}" x="${r1(rx + 35)}" y="${r1(cy)}" class="${PRE}-marca"/>`;
      for (const l of LANGS) s += `<text lang="${l}" class="${PRE}-t-ref" x="${r1(rx + 28 + 14 + 4)}" y="${r1(cy + 4.6)}">${esc(NODO[otro][l])}</text>`;
      s += `</g>`;
    }
  }
  return { svg: s + `</svg>`, W, H, cols: capas.map((b, i) => ({ id: b, x: colX(i) })), pos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const rec of [false, true]) { const r = svgNivel2({ recorrido: rec }); console.log(rec ? "recorrido" : "nivel 2", r.W, "×", r.H, `${(r.svg.length / 1024).toFixed(1)} KB`); }
  console.log(avisos.length ? avisos.join("\n") : "sin avisos");
}
