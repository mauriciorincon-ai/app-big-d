// Ronda 3 de la mirada 1 — dirección B «plano» afinada, un SVG por tipografía candidata (las
// métricas de cada fuente deciden cortes y anchos: G15). Siempre horizontal (P5 del usuario).
import { BANDA, BLOQUE, DIAS_BASE, MADUREZ, MODO, NODO, TIPO, UMBRAL_REVISAR, UMBRAL_VENCIDO, VIGENCIA } from "../nucleo/datos.mjs";
import { LANGS, camino, conFlecha, esc, modelo, r1 } from "../nucleo/comun.mjs";
import { MARCA, MODO_MARCA, TIPO_GLIFO, medidor } from "../nucleo/glifos.mjs";
import { conFuente, avisos } from "./metrica.mjs";
export { avisos };

const vigDe = (d) => (d >= UMBRAL_VENCIDO ? "vencido" : d >= UMBRAL_REVISAR ? "revisar" : "vigente");
const tiposDe = (e) => [...new Set(e.nodos.map((n) => n.tipo_id))].map((t) => TIPO[t]);
const cuenta = (e, l) => { const n = e.nodos.length; return l === "es" ? `${n} componente${n === 1 ? "" : "s"}` : `${n} component${n === 1 ? "" : "s"}`; };
const peorMadurez = (e) => e.nodos.map((n) => n.madurez).sort((a, b) => MADUREZ[a].nivel - MADUREZ[b].nivel)[0];
const nombre = (e, l) => (e.fantasma ? (e.nodos.length === 1 ? NODO[e.nodos[0].id][l] : cuenta(e, l)) : BLOQUE[e.id][l][0]);
const aria = (e, l) => { const c = e.nodos.map((n) => NODO[n.id][l]).join(", "); return e.fantasma ? `${BANDA[e.banda.id][l][0]}: ${c}.` : `${BLOQUE[e.id][l][0]}. ${BLOQUE[e.id][l][1]} ${l === "es" ? "Componentes" : "Components"}: ${c}.`; };

// Constantes de la dirección B (unidades = px a escala 1).
const P = { M: 8, colW: 152, gap: 50, pad: 14, hNum: 12, hNom: 17, hPre: 14, cNom: 16, cMeta: 13, Hc: 104, franjaH: 80, zona: 200 };
const PRE = "db";

function defs() {
  let s = "<defs>";
  for (const [g, v] of Object.entries(TIPO_GLIFO)) s += v.relleno ? `<path id="${PRE}-g-${g}" d="${v.d}" fill="currentColor"/>` : `<path id="${PRE}-g-${g}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="${v.trazo}"/>`;
  for (const [m, v] of Object.entries(MODO_MARCA)) s += v.relleno === "mixto" ? `<path id="${PRE}-m-${m}" d="${v.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>` : `<path id="${PRE}-m-${m}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-arriba" d="M0,5 V-4 M-3.5,-1 L0,-4.5 L3.5,-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (const k of ["revisar", "vencido"]) s += `<path id="${PRE}-k-${k}" d="${MARCA[k]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path id="${PRE}-k-abajo" d="M0,-5 V4 M-3.5,1 L0,4.5 L3.5,1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s + "</defs>";
}

export function svg(fuente, variante = "transversal", p4 = "chip") {
  const M = modelo(variante, p4);
  const CAPAS = M.bandas.filter((b) => b.clase === "capa");
  const FRANJAS = M.bandas.filter((b) => b.clase === "franja");
  const N = CAPAS.length;
  const elemDe = (id) => M.elems.filter((e) => e.banda.id === id);
  const F = conFuente(fuente);
  const t = (lang, lineas, x, top, size, lh, clase, extra = "") => { const y0 = F.base(top, size, lh); return `<text lang="${lang}" class="${clase}"${extra}>${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`; };
  const t1 = (lang, s, x, top, size, lh, clase, extra = "") => t(lang, [s], x, top, size, lh, clase, extra);
  const W = 2 * P.M + N * P.colW + (N - 1) * P.gap;
  const colX = (i) => P.M + i * (P.colW + P.gap);
  const lhN = 21, lhP = 19;
  let nomL = 1, preL = 1;
  for (const b of CAPAS) for (const l of LANGS) { nomL = Math.max(nomL, F.partir(BANDA[b.id][l][0], P.hNom, 700, P.colW).length); preL = Math.max(preL, F.partir(BANDA[b.id][l][1], P.hPre, 400, P.colW).length); }
  const yNom = 4 + 16 + 6, yPre = yNom + nomL * lhN + 6, Hh = yPre + preL * lhP + 18;
  const cardY = Hh, ymid = cardY + P.Hc / 2, yb = cardY + P.Hc;
  const t1y = yb + 24, t2y = yb + 46, carrilFin = t2y + 22;
  const franjasY = carrilFin + 40;
  const H = franjasY + FRANJAS.length * P.franjaH + (FRANJAS.length - 1) * 10 + 8;
  const dir = variante === "capa" ? "c" : "t";
  let s = `<svg class="dir-svg dir-b" data-dir="${dir}" data-si="p9:${variante} p4:${p4}" data-fuente="${fuente}" data-lienzo="b-${variante}-${p4}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="Mapa de la Plataforma Ejemplo: ${N} capas de izquierda a derecha y ${FRANJAS.length} franjas transversales abajo." data-aria-en="Example Platform map: ${N} layers from left to right and ${FRANJAS.length} cross-cutting bands below.">${defs()}`;
  // Guías y cabeceras.
  for (let i = 1; i < N; i++) s += `<path class="${PRE}-guia" d="M${colX(i) - P.gap / 2},0 V${carrilFin}"/>`;
  CAPAS.forEach((b, i) => {
    const x = colX(i);
    s += `<g data-dueno="banda-${b.id}">`;
    s += `<text class="${PRE}-t-num" x="${x}" y="${r1(F.base(4, P.hNum, 16))}">${String(i + 1).padStart(2, "0")}</text>`;
    for (const l of LANGS) { s += t(l, F.partir(BANDA[b.id][l][0], P.hNom, 700, P.colW), x, yNom, P.hNom, lhN, `${PRE}-t-banda`); s += t(l, F.partir(BANDA[b.id][l][1], P.hPre, 400, P.colW), x, yPre, P.hPre, lhP, `${PRE}-t-pregunta`); }
    s += `</g>`;
  });
  // Tarjetas.
  const tarjeta = (e, x, y, w, h) => {
    const tipos = tiposDe(e), peor = peorMadurez(e), conMad = peor !== "disponible-general";
    let o = `<g class="${PRE}-elem" role="graphics-symbol img" tabindex="0" data-dueno="${e.id}" data-aria-es="${esc(aria(e, "es"))}" data-aria-en="${esc(aria(e, "en"))}">`;
    o += `<rect data-caja="${e.id}" class="${PRE}-card${e.fantasma ? ` ${PRE}-fantasma` : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    o += `<path class="${PRE}-f-${tipos[0].t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
    const nx = x + P.pad + 24;
    // Insignias de vigencia por estado de la maqueta: se marca la excepción (D11 § 11).
    for (const estado of ["revisar", "vencido"]) {
      const d = VIGENCIA[estado][e.id] ?? DIAS_BASE, v = vigDe(d);
      if (v === "vigente") continue;
      const txt = `${d} d`, bw = 10 + 12 + 4 + F.medir(txt, 12, 700) + 10, bx = x + w - 10 - bw, by = y;
      o += `<g class="${PRE}-insignia ${PRE}-insignia-${v}" data-si="vig:${estado}"><rect x="${r1(bx)}" y="${r1(by - 10)}" width="${r1(bw)}" height="20" rx="10"/>`;
      o += `<use href="#${PRE}-k-${v}" x="${r1(bx + 10 + 6)}" y="${r1(by)}" class="${PRE}-insignia-marca"/>`;
      o += `<text class="${PRE}-t-insignia" x="${r1(bx + 10 + 12 + 4)}" y="${r1(by + 4.3)}">${esc(txt)}</text></g>`;
    }
    o += `<use href="#${PRE}-g-${tipos[0].g}" x="${x + P.pad + 9}" y="${r1(F.base(y + 13, P.cNom, 20) - 0.35 * P.cNom)}" class="${PRE}-c-${tipos[0].t}"/>`;
    for (const l of LANGS) { const nm = F.partir(nombre(e, l), P.cNom, 700, w - (nx - x) - 10); if (nm.length > 2) avisos.push(`${fuente}: nombre de ${e.id} (${l}) en ${nm.length} líneas`); o += t(l, nm, nx, y + 13, P.cNom, 20, `${PRE}-t-nombre`); }
    const fila = 18, yc = y + h - P.pad - fila - (conMad ? fila : 0);
    for (const l of LANGS) o += t1(l, cuenta(e, l), x + P.pad + 4, yc, P.cMeta, fila, `${PRE}-t-meta`);
    if (conMad) { const ym = y + h - P.pad - fila; o += medidor(MADUREZ[peor].nivel, x + P.pad + 8, ym + fila / 2, `${PRE}-madurez`); for (const l of LANGS) o += t1(l, MADUREZ[peor][l], x + P.pad + 18, ym, P.cMeta, fila, `${PRE}-t-meta`); }
    return o + `</g>`;
  };
  CAPAS.forEach((b, i) => elemDe(b.id).forEach((e) => (s += tarjeta(e, colX(i), cardY, P.colW, P.Hc))));
  // Flujos entre capas.
  const colDe = (id) => CAPAS.findIndex((b) => b.id === M.porId[id].banda.id);
  const enCapas = M.flujos.filter((f) => M.porId[f.o].banda.clase === "capa" && M.porId[f.d].banda.clase === "capa");
  const chip = (f, cx, cy) => { const n = f.modos.length, w = 6 + 16 * n, h = 18; let o = `<g class="${PRE}-chip"><rect data-caja="chip-${f.id}" x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${w}" height="${h}" rx="9"/>`; f.modos.forEach((m, i) => (o += `<use href="#${PRE}-m-${m}" x="${r1(cx - w / 2 + 11 + 16 * i)}" y="${r1(cy)}" class="${PRE}-marca"/>`)); return o + `</g>`; };
  const trazo = (f, pts) => { const { p, tri } = conFlecha(pts, 8); const d = camino(p, 10); const m = f.modos.length === 1 ? f.modos[0] : "haz"; let o = `<g class="${PRE}-flujo ${PRE}-modo-${m}">`; o += m === "sin-copia" ? `<path d="${d}" class="${PRE}-linea ${PRE}-doble-ext"/><path d="${d}" class="${PRE}-linea ${PRE}-doble-int"/>` : `<path d="${d}" class="${PRE}-linea"/>`; return o + `<path d="${tri}" class="${PRE}-punta"/></g>`; };
  let lineas = "", chips = "";
  // Vecinas: todas las líneas del par (ida primero, vuelta después) repartidas alrededor del centro.
  const porPar = new Map();
  for (const f of enCapas) { const a = colDe(f.o), b = colDe(f.d); if (Math.abs(b - a) !== 1) continue; const k = a < b ? `${a}-${b}` : `${b}-${a}`; if (!porPar.has(k)) porPar.set(k, []); porPar.get(k).push(f); }
  for (const fs of porPar.values()) {
    fs.sort((f, g) => (colDe(f.d) > colDe(f.o) ? 0 : 1) - (colDe(g.d) > colDe(g.o) ? 0 : 1));
    const n = fs.length, paso = 22;
    fs.forEach((f, i) => { const a = colDe(f.o), b = colDe(f.d), ida = b > a; const y = ymid + (i - (n - 1) / 2) * paso; const x1 = ida ? colX(a) + P.colW : colX(a), x2 = ida ? colX(b) : colX(b) + P.colW; lineas += trazo(f, [[x1, y], [x2, y]]); chips += chip(f, (x1 + x2) / 2 + (ida ? -4 : 4), y); });
  }
  const saltos = enCapas.filter((f) => Math.abs(colDe(f.d) - colDe(f.o)) > 1).sort((a, b) => colDe(b.d) - colDe(a.d));
  const puertos = {};
  saltos.forEach((f, j) => { const a = colDe(f.o), b = colDe(f.d); const xport = colX(a) + P.colW * (j === 0 ? 0.56 : 0.8), xd = colX(b) + P.colW * 0.3, yt = j === 0 ? t2y : t1y; lineas += trazo(f, [[xport, yb], [xport, yt], [xd, yt], [xd, yb]]); puertos[f.id] = { xport, xd, yt }; });
  [...saltos].reverse().forEach((f, j, arr) => { const q = puertos[f.id]; const cx = j === 0 ? (q.xport + q.xd) / 2 : (puertos[arr[j - 1].id].xd + q.xd) / 2; chips += chip(f, cx, q.yt); });
  s += lineas + chips;
  // Franjas transversales.
  for (const l of LANGS) s += t1(l, l === "es" ? "TRANSVERSALES · ABARCAN TODAS LAS CAPAS" : "CROSS-CUTTING · SPAN EVERY LAYER", P.M, franjasY - 26, 12, 16, `${PRE}-t-num`);
  const ficha = (e, x, y, w, h) => { const tp = tiposDe(e)[0]; let o = `<g class="${PRE}-elem ${PRE}-elem-compacto" role="graphics-symbol img" tabindex="0" data-dueno="${e.id}" data-aria-es="${esc(aria(e, "es"))}" data-aria-en="${esc(aria(e, "en"))}">`; o += `<rect data-caja="${e.id}" class="${PRE}-card${e.fantasma ? ` ${PRE}-fantasma` : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`; o += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`; o += `<use href="#${PRE}-g-${tp.g}" x="${x + 14 + 8}" y="${y + h / 2}" class="${PRE}-c-${tp.t}"/>`; for (const l of LANGS) { const nm = F.partir(nombre(e, l), 14, 700, w - 40 - 10); const sub = e.fantasma ? (l === "es" ? "sin bloque" : "no block") : cuenta(e, l); const top = y + (h - (nm.length * 17 + 16)) / 2; if (nm.length > 2) avisos.push(`${fuente}: ficha ${e.id} (${l}) ${nm.length} líneas`); o += t(l, nm, x + 40, top, 14, 17, `${PRE}-t-nombre ${PRE}-t-nombre-compacto`); o += t1(l, sub, x + 40, top + nm.length * 17, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`); } return o + `</g>`; };
  const ref = (f, otro, sube, cx, cy, minX) => { const id = `ref-${f.id}`; const tw = Math.max(...LANGS.map((l) => F.medir(nombre(otro, l), 13, 700))); const w = 28 + 14 * f.modos.length + 4 + tw + 12, h = 30; let x = Math.max(cx - w / 2, minX + 8); const a = (l) => { const n = nombre(otro, l), md = f.modos.map((m) => MODO[m][l][0].toLowerCase()).join(l === "es" ? " y " : " and "); return sube ? (l === "es" ? `Conecta con ${n}, ${md}` : `Connects to ${n}, ${md}`) : (l === "es" ? `Recibe de ${n}, ${md}` : `Receives from ${n}, ${md}`); }; let o = `<g class="${PRE}-ref" data-dueno="${id}" role="graphics-symbol img" data-aria-es="${esc(a("es"))}" data-aria-en="${esc(a("en"))}"><rect data-caja="${id}" x="${r1(x)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${h}" rx="15"/>`; o += `<use href="#${PRE}-k-${sube ? "arriba" : "abajo"}" x="${r1(x + 16)}" y="${r1(cy)}" class="${PRE}-marca"/>`; f.modos.forEach((m, i) => (o += `<use href="#${PRE}-m-${m}" x="${r1(x + 28 + 7 + 14 * i)}" y="${r1(cy)}" class="${PRE}-marca"/>`)); const tx = x + 28 + 14 * f.modos.length + 4; for (const l of LANGS) o += `<text lang="${l}" class="${PRE}-t-ref" x="${r1(tx)}" y="${r1(cy + 4.6)}">${esc(nombre(otro, l))}</text>`; return o + `</g>`; };
  FRANJAS.forEach((b, j) => {
    const y = franjasY + j * (P.franjaH + 10), x0 = P.M, x1 = W - P.M, e = elemDe(b.id)[0];
    s += `<g data-dueno="franja-${b.id}"><path class="${PRE}-franja-filete" d="M${x0},${y} H${x1}"/>`;
    for (const l of LANGS) { const nm = F.partir(BANDA[b.id][l][0], 15, 700, P.zona), pr = F.partir(BANDA[b.id][l][1], 13, 400, P.zona); const alto = nm.length * 19 + 4 + pr.length * 17, top = y + (P.franjaH - alto) / 2; if (alto > P.franjaH - 12) avisos.push(`${fuente}: cabecera ${b.id} (${l}) ${alto}`); s += t(l, nm, x0 + 14, top, 15, 19, `${PRE}-t-banda ${PRE}-t-banda-franja`); s += t(l, pr, x0 + 14, top + nm.length * 19 + 4, 13, 17, `${PRE}-t-pregunta ${PRE}-t-pregunta-franja`); }
    s += `</g>`;
    const ew = 180, eh = 60, ex = x0 + 14 + P.zona + 8, ey = y + (P.franjaH - eh) / 2;
    s += ficha(e, ex, ey, ew, eh);
    for (const f of M.flujos.filter((f) => f.o === e.id || f.d === e.id)) { const otro = M.porId[f.o === e.id ? f.d : f.o]; const col = CAPAS.findIndex((c) => c.id === otro.banda.id); s += ref(f, otro, f.o === e.id, colX(col) + P.colW / 2, y + P.franjaH / 2, ex + ew); }
  });
  return { svg: s + `</svg>`, W, H, cols: CAPAS.map((b, i) => ({ id: b.id, x: colX(i) })) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [v, p] of [["transversal", "chip"], ["transversal", "lineas"], ["capa", "chip"]]) { const r = svg("space-grotesk", v, p); console.log(v, p, r.W, "×", r.H, `${(r.svg.length / 1024).toFixed(1)} KB`); }
  console.log(avisos.length ? avisos.join("\n") : "sin avisos");
}
