import fs from "node:fs";
import { BANDA, BLOQUE, MAPA, MODOS, VARIANTE } from "./datos.mjs";
import { MARCA, MODO_MARCA, TIPO_GLIFO } from "./glifos.mjs";
import { METRICAS } from "../rutas.mjs";

const MET = JSON.parse(
  fs.readFileSync(METRICAS, "utf8"),
).fuentes["atkinson-hyperlegible-next"];
export const LANGS = ["es", "en"];
export const avisos = [];

/** Ancho de un texto en unidades, con 3 % de margen (sin kerning: cota superior). */
export function medir(t, size, peso = 400) {
  let s = 0;
  for (const ch of t) {
    const a = MET.pesos[String(peso)][String(ch.codePointAt(0))];
    if (a === undefined) throw new Error(`carácter fuera de la fuente: «${ch}» en «${t}»`);
    s += a;
  }
  return (s * size * 1.03) / 1000;
}
export function partir(t, size, peso, max) {
  const lineas = [];
  let cur = "";
  for (const p of t.split(" ")) {
    const c = cur ? `${cur} ${p}` : p;
    if (medir(c, size, peso) <= max) cur = c;
    else {
      if (cur) lineas.push(cur);
      cur = p;
      if (medir(p, size, peso) > max) avisos.push(`palabra más ancha que su caja: «${p}» (${medir(p, size, peso).toFixed(1)} > ${max})`);
    }
  }
  if (cur) lineas.push(cur);
  return lineas;
}
export const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const r1 = (n) => Math.round(n * 10) / 10;

/** Texto multilínea en un idioma. */
export function texto(lang, lineas, x, y, lh, clase, extra = "") {
  const ts = lineas.map((l, i) => `<tspan x="${r1(x)}" y="${r1(y + i * lh)}">${esc(l)}</tspan>`).join("");
  return `<text lang="${lang}" class="${clase}"${extra}>${ts}</text>`;
}
/** Línea base para una caja de línea `lh` con letra `size` (ascendente 0,984, descendente 0,316). */
export const base = (top, size, lh) => top + (lh - 1.3 * size) / 2 + 0.984 * size;

/** Defs de un lienzo: glifos de tipo, marcadores y marcas, con prefijo (D12). */
export function defs(pre) {
  let s = "<defs>";
  for (const [g, v] of Object.entries(TIPO_GLIFO))
    s += v.relleno
      ? `<path id="${pre}-g-${g}" d="${v.d}" fill="currentColor"/>`
      : `<path id="${pre}-g-${g}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="${v.trazo}"/>`;
  for (const [m, v] of Object.entries(MODO_MARCA))
    s +=
      v.relleno === "mixto"
        ? `<path id="${pre}-m-${m}" d="${v.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>`
        : `<path id="${pre}-m-${m}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (const [m, d] of Object.entries(MARCA))
    s += `<path id="${pre}-k-${m}" d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s + "</defs>";
}

/** Modelo de nivel 1: elementos (bloques o «sin bloque») por banda y flujos agregados. */
export function modelo(variante, p4) {
  const { capas, franjas } = VARIANTE[variante];
  const bandas = [
    ...capas.map((id, i) => ({ id, clase: "capa", i })),
    ...franjas.map((id, j) => ({ id, clase: "franja", j })),
  ];
  const elems = [];
  const dueno = {};
  for (const b of bandas) {
    const nodos = MAPA.nodos.filter((n) => n.banda_id === b.id).sort((a, c) => a.orden - c.orden || (a.id < c.id ? -1 : 1));
    const bloques = MAPA.bloques.filter((x) => x.banda_id === b.id).sort((a, c) => (a.id < c.id ? -1 : 1));
    if (bloques.length)
      bloques.forEach((bl, k) => {
        const ns = nodos.filter((n) => n.bloque_id === bl.id);
        elems.push({ id: bl.id, banda: b, k, fantasma: false, nodos: ns });
        ns.forEach((n) => (dueno[n.id] = bl.id));
      });
    else if (nodos.length) {
      const id = `sin-bloque-${b.id}`;
      elems.push({ id, banda: b, k: 0, fantasma: true, nodos });
      nodos.forEach((n) => (dueno[n.id] = id));
    }
  }
  const porId = Object.fromEntries(elems.map((e, i) => [e.id, { ...e, idx: i }]));
  elems.forEach((e, i) => (e.idx = i));
  const ag = new Map();
  for (const f of MAPA.flujos) {
    const o = dueno[f.origen];
    const d = dueno[f.destino];
    if (o === d) continue;
    const clave = p4 === "lineas" ? `${o}>${d}>${f.modo_id}` : `${o}>${d}`;
    if (!ag.has(clave)) ag.set(clave, { id: clave.replace(/>/g, "--"), o, d, modos: new Set(), n: 0 });
    ag.get(clave).modos.add(f.modo_id);
    ag.get(clave).n++;
  }
  const flujos = [...ag.values()]
    .map((f) => ({ ...f, modos: MODOS.filter((m) => f.modos.has(m)) }))
    .sort((a, b) => porId[a.o].idx - porId[b.o].idx || porId[a.d].idx - porId[b.d].idx || MODOS.indexOf(a.modos[0]) - MODOS.indexOf(b.modos[0]));
  return { bandas, elems, porId, flujos, capas, franjas };
}

export function nombreElem(e, lang) {
  if (!e.fantasma) return BLOQUE[e.id][lang][0];
  const n = e.nodos.length;
  return lang === "es" ? `${n} componente${n === 1 ? "" : "s"}` : `${n} component${n === 1 ? "" : "s"}`;
}
/** Nombre para referencias y lectura en texto: un «sin bloque» se nombra por su banda. */
export function etiquetaElem(e, lang) {
  return e.fantasma ? `${BANDA[e.banda.id][lang][0]} (${nombreElem(e, lang)})` : BLOQUE[e.id][lang][0];
}

/** Camino ortogonal con esquinas redondeadas (radio ≤ 6, ≤ media del tramo más corto). */
export function camino(pts, r = 6) {
  const p = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]);
  let d = `M${r1(p[0][0])},${r1(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [a, b, c] = [p[i - 1], p[i], p[i + 1]];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const u1 = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1];
    const u2 = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
    d += ` L${r1(b[0] - u1[0] * rr)},${r1(b[1] - u1[1] * rr)} Q${r1(b[0])},${r1(b[1])} ${r1(b[0] + u2[0] * rr)},${r1(b[1] + u2[1] * rr)}`;
  }
  const z = p[p.length - 1];
  return d + ` L${r1(z[0])},${r1(z[1])}`;
}
/** Acorta el último tramo `k` unidades (para la punta de flecha) y devuelve la punta. */
export function conFlecha(pts, k = 7) {
  const p = pts.map((q) => [...q]);
  const z = p[p.length - 1];
  const y = p[p.length - 2];
  const L = Math.hypot(z[0] - y[0], z[1] - y[1]);
  const u = [(z[0] - y[0]) / L, (z[1] - y[1]) / L];
  const punta = [...z];
  p[p.length - 1] = [z[0] - u[0] * k, z[1] - u[1] * k];
  const b = [punta[0] - u[0] * 9, punta[1] - u[1] * 9];
  const n = [-u[1] * 4.5, u[0] * 4.5];
  const tri = `M${r1(punta[0])},${r1(punta[1])} L${r1(b[0] + n[0])},${r1(b[1] + n[1])} L${r1(b[0] - n[0])},${r1(b[1] - n[1])} Z`;
  return { p, tri };
}

/** Trazo de un flujo según sus modos (P4 «chip»: varios modos = haz grueso sólido). */
export function trazo(f) {
  const { p, tri } = conFlecha(f.pts);
  const d = camino(p);
  const m = f.modos.length === 1 ? f.modos[0] : "haz";
  let s = `<g class="dg-flujo dg-modo-${m}" data-flujo="${f.id}">`;
  if (m === "sin-copia") s += `<path d="${d}" class="dg-linea dg-doble-ext"/><path d="${d}" class="dg-linea dg-doble-int"/>`;
  else s += `<path d="${d}" class="dg-linea"/>`;
  return s + `<path d="${tri}" class="dg-punta"/></g>`;
}
/** Chip de modos: glifos en orden de gramática; horizontal (h) o apilado (v). */
export function chip(f, pre, cx, cy, orient = "h") {
  const k = f.modos.length;
  const largo = 6 + 16 * k;
  const w = orient === "h" ? largo : 18;
  const h = orient === "h" ? 18 : largo;
  let s = `<g class="dg-chip" data-chip="${f.id}"><rect data-caja="chip-${f.id}" x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${w}" height="${h}" rx="9"/>`;
  f.modos.forEach((m, i) => {
    const off = -largo / 2 + 3 + 8 + 16 * i;
    const [gx, gy] = orient === "h" ? [cx + off, cy] : [cx, cy + off];
    s += `<use href="#${pre}-m-${m}" x="${r1(gx)}" y="${r1(gy)}" class="dg-marca"/>`;
  });
  return { svg: s + "</g>", caja: [cx - w / 2, cy - h / 2, w, h] };
}

export const cruza = (a, b, m = 0) => a[0] < b[0] + b[2] + m && a[0] + a[2] + m > b[0] && a[1] < b[1] + b[3] + m && a[1] + a[3] + m > b[1];
/** ¿El tramo (ortogonal) atraviesa la caja? */
export function tramoCruzaCaja(a, b, c) {
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return x1 < c[0] + c[2] - 0.5 && x2 > c[0] + 0.5 && y1 < c[1] + c[3] - 0.5 && y2 > c[1] + 0.5;
}
