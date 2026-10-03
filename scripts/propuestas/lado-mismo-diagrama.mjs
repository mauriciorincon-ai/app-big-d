// Boceto de FORMA del S2 (mirada M1, D-S2-06): el lado a lado con los componentes desplegados «en el mismo
// diagrama». Primera vuelta: una banda a la vez. Segunda vuelta (la persona, 2026-10-02: «un solo botón
// despliega todo y contrae todo»): un botón que abre todas las bandas en todas las plataformas y las cierra.
// No es producto ni maqueta: es la propuesta que se mira antes de construir el nivel por banda.
// Toma los datos y las medidas de la maqueta (scripts/maqueta/, congelada tras G-Diseño) y copia, a
// 152 u, el dibujo del bloque y del nodo de `pantallas/lado.mjs` (que no los exporta).
//
// Uso: node scripts/propuestas/lado-mismo-diagrama.mjs
//   → docs/propuestas-de-diseno/lado-mismo-diagrama.html (+ .js), abrir con doble clic.
import fs from "node:fs";
import { resolve } from "node:path";
import { RAIZ } from "../maqueta/rutas.mjs";
import { BANDA, MADUREZ, TIPO } from "../maqueta/nucleo/datos.mjs";
import { LANGS, esc, r1 } from "../maqueta/nucleo/comun.mjs";
import { TIPO_GLIFO, medidor } from "../maqueta/nucleo/glifos.mjs";
import { conFuente } from "../maqueta/atlas/metrica.mjs";
import { COMPONENTES, LADO } from "../maqueta/pantallas/datos2.mjs";
import { PAGINAS_PL } from "../maqueta/pantallas/lado.mjs";
import { ES, barra, encabezado, head, niveles, pie } from "../maqueta/pantallas/comun3.mjs";

const F = conFuente("space-grotesk");
const PRE = "db";
const BANDAS = ["fuentes", "ingesta", "almacenamiento", "procesamiento", "consumo", "ia", "gobierno", "operacion", "orquestacion"];
// Rejilla de componentes del contrato (§ 5.3): 9 × 152 a 14 → viewBox 1496; bloque 152 × 64; nodo 152 × 88 a 8.
const C = { M: 8, colW: 152, gap: 14, labelH: 26, bH: 64, nH: 88, nG: 8, rowGap: 22, pad: 12 };
const N = BANDAS.length, W = 2 * C.M + N * C.colW + (N - 1) * C.gap;
const colX = (i) => C.M + i * (C.colW + C.gap);
const avisos = [];
const t = (lang, lineas, x, top, size, lh, clase, extra = "") => { const y0 = F.base(top, size, lh); return `<text lang="${lang}" class="${clase}"${extra}>${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`; };
const t1 = (lang, s, x, top, size, lh, clase, extra = "") => t(lang, [s], x, top, size, lh, clase, extra);
const ABAJO = "M-4,-1.5 L0,2.5 L4,-1.5", ARRIBA = "M-4,1.5 L0,-2.5 L4,1.5";

function defs() {
  let s = `<svg class="defs-comunes" width="0" height="0" aria-hidden="true"><defs>`;
  for (const [g, v] of Object.entries(TIPO_GLIFO)) s += v.relleno ? `<path id="${PRE}-g-${g}" d="${v.d}" fill="currentColor"/>` : `<path id="${PRE}-g-${g}" d="${v.d}" fill="none" stroke="currentColor" stroke-width="${v.trazo}"/>`;
  s += `<path id="${PRE}-k-doc" d="M-4,-5.5 H2 L4.5,-3 V5.5 H-4 Z M-1.5,-1 H2 M-1.5,2 H2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>`;
  return s + `</defs></svg>`;
}

/** Bloque contraído (el del lado a lado de la maqueta, a 152 u). */
function bloque(pl, b, x, y) {
  const w = C.colW, h = C.bH, d = LADO[pl.id][b];
  if (!d) {
    let s = `<g class="lado-bloque" role="img" data-aria-es="${esc(BANDA[b].es[0])}: sin componentes" data-aria-en="${esc(BANDA[b].en[0])}: no components"><rect data-caja="" class="${PRE}-card ${PRE}-fantasma" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    for (const l of LANGS) s += t1(l, l === "es" ? "sin componentes" : "no components", x + 10, y + (h - 16) / 2, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
    return s + `</g>`;
  }
  const [es, en, n, tipo, mad] = d, tp = TIPO[tipo], m = MADUREZ[mad], ga = mad === "disponible-general";
  let s = `<g class="lado-bloque" role="img" data-aria-es="${esc(es)}: ${n} ${n === 1 ? "componente" : "componentes"}, ${m.largo.es}." data-aria-en="${esc(en)}: ${n} ${n === 1 ? "component" : "components"}, ${m.largo.en}.">`;
  s += `<rect data-caja="" class="${PRE}-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  s += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
  s += `<use href="#${PRE}-g-${tp.g}" x="${x + 16}" y="${r1(F.base(y + 8, 12, 15) - 4)}" class="${PRE}-c-${tp.t}"/>`;
  for (const l of LANGS) { const nm = F.partir(l === "es" ? es : en, 12, 700, w - 28 - 6); if (nm.length > 2) avisos.push(`bloque ${pl.id}/${b} (${l}): ${nm.length} líneas`); s += t(l, nm, x + 28, y + 8, 12, 15, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
  const yr = y + h - 8 - 14;
  // Medidor tras la cuenta medida (la maqueta lo fijaba a 52 u y a 118 u rozaba «comp.»).
  const madW = ga ? 0 : Math.max(...LANGS.map((l) => F.medir(m[l], 11, 400)));
  const cw = Math.max(...LANGS.map(() => F.medir(`${n} comp.`, 11, 400)));
  const caben = ga || 10 + cw + 10 + 8 + madW <= w - 8;
  if (caben) for (const l of LANGS) s += t1(l, `${n} comp.`, x + 10, yr, 11, 14, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
  if (!ga) { const mx = caben ? r1(x + 10 + cw + 10) : x + 14; s += medidor(m.nivel, mx, yr + 7, `${PRE}-madurez`); for (const l of LANGS) s += t1(l, m[l], mx + 8, yr, 11, 14, `${PRE}-t-meta ${PRE}-t-meta-compacta`); }
  return s + `</g>`;
}

/** Nodo de la banda abierta: el del nivel 2 (152 × 88), como en «componentes desplegados» de la maqueta. */
function nodo(c, x, y) {
  const w = C.colW, h = C.nH, tp = TIPO[c.tipo], m = MADUREZ[c.mad], ga = c.mad === "disponible-general";
  let s = `<g class="lado-nodo" role="img" data-aria-es="${esc(c.es)}. ${esc(tp.es[1])}. ${m.largo.es}. ${c.fuentes} ${c.fuentes === 1 ? "fuente" : "fuentes"}." data-aria-en="${esc(c.en)}. ${esc(tp.en[1])}. ${m.largo.en}. ${c.fuentes} ${c.fuentes === 1 ? "source" : "sources"}.">`;
  s += `<rect class="${PRE}-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  s += `<path class="${PRE}-f-${tp.t}" d="M${x + 6},${y} H${x + 4} V${y + h} H${x + 6} A6,6 0 0 1 ${x},${y + h - 6} V${y + 6} A6,6 0 0 1 ${x + 6},${y} Z"/>`;
  const gx = x + 17, nx = x + 29, tw = w - (nx - x) - 6;
  s += `<use href="#${PRE}-g-${tp.g}" x="${gx}" y="${r1(F.base(y + 10, 13, 16) - 4.5)}" class="${PRE}-c-${tp.t}"/>`;
  for (const l of LANGS) { const nm = F.partir(c[l], 13, 700, tw); if (nm.length > 3) avisos.push(`nodo ${c[l]} (${l}): ${nm.length} líneas`); s += t(l, nm, nx, y + 10, 13, 16, `${PRE}-t-nombre ${PRE}-t-nombre-nodo`); }
  const yr = y + h - 8 - 16;
  if (!ga) { s += medidor(m.nivel, x + C.pad + 4, yr + 8, `${PRE}-madurez`); for (const l of LANGS) s += t1(l, m[l], x + C.pad + 12, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`); }
  const nf = c.fuentes;
  const ft = ga ? { es: `${nf} fuente${nf > 1 ? "s" : ""}`, en: `${nf} source${nf > 1 ? "s" : ""}` } : { es: String(nf), en: String(nf) };
  const fw = Math.max(...LANGS.map((l) => F.medir(ft[l], 12, 400)));
  s += `<use href="#${PRE}-k-doc" x="${r1(x + w - 8 - fw - 10)}" y="${yr + 8}" class="${PRE}-marca-suave"/>`;
  for (const l of LANGS) s += t1(l, ft[l], x + w - 8 - fw, yr, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
  return s + `</g>`;
}

/** Alto de la celda abierta: cabecera con el nombre del bloque (hasta 2 líneas) + la pila de nodos. */
function celdaAbierta(pl, b) {
  const d = LADO[pl.id][b], lista = COMPONENTES[pl.id][b];
  const cabL = d ? Math.max(...LANGS.map((l) => F.partir(l === "es" ? d[0] : d[1], 12, 700, C.colW).length)) : 1;
  const cab = cabL * 16 + 6;
  const k = lista.length;
  return { cab, h: cab + (k ? k * C.nH + (k - 1) * C.nG : C.nH) };
}

/** Un SVG del lado a lado, todo contraído o todo desplegado. Las columnas son las mismas en los dos. */
function svgLado(pls, desplegado) {
  let nomL = 1;
  for (const b of BANDAS) for (const l of LANGS) nomL = Math.max(nomL, F.partir(BANDA[b][l][0], 13, 700, C.colW).length);
  const Hh = 4 + 14 + 4 + nomL * 16 + 14;
  const filas = pls.map((pl) => ({ pl, h: C.labelH + (desplegado ? Math.max(...BANDAS.map((b) => celdaAbierta(pl, b).h)) : C.bH) }));
  const H = Hh + filas.reduce((a, f) => a + f.h, 0) + (filas.length - 1) * C.rowGap + 8;
  let s = `<svg class="dir-svg dir-b" data-dir="t" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" data-aria-es="Lado a lado, ${desplegado ? "componentes desplegados" : "bloques"}." data-aria-en="Side by side, ${desplegado ? "components expanded" : "blocks"}.">`;
  BANDAS.forEach((b, i) => {
    const x = colX(i);
    s += `<g data-dueno="banda-${b}"><text class="${PRE}-t-num" x="${x}" y="${r1(F.base(4, 11, 14))}">${String(i + 1).padStart(2, "0")}${i >= 6 ? " ·" : ""}</text>`;
    for (const l of LANGS) s += t(l, F.partir(BANDA[b][l][0], 13, 700, C.colW), x, 4 + 14 + 4, 13, 16, `${PRE}-t-banda ${PRE}-t-banda-lado`);
    s += `</g>`;
  });
  s += `<path class="${PRE}-guia" d="M${colX(6) - C.gap / 2},0 V${H - 8}"/>`;
  let y = Hh;
  for (const { pl, h } of filas) {
    s += `<path class="${PRE}-franja-filete" d="M${C.M},${y} H${W - C.M}"/>`;
    const meta = { es: `v${pl.version} · verificado hace ${pl.verificado} días`, en: `v${pl.version} · verified ${pl.verificado} days ago` };
    for (const l of LANGS) s += t1(l, pl.nombre[l], C.M, y + 4, 13, 18, `${PRE}-t-banda ${PRE}-t-fila-lado`);
    for (const l of LANGS) s += t1(l, meta[l], C.M + 4 + Math.max(...LANGS.map((k) => F.medir(pl.nombre[k], 13, 700))) + 10, y + 5, 11, 16, `${PRE}-t-num`);
    BANDAS.forEach((b, i) => {
      const x = colX(i), yc = y + C.labelH;
      if (!desplegado) { s += bloque(pl, b, x, yc); return; }
      const d = LADO[pl.id][b], lista = COMPONENTES[pl.id][b], { cab } = celdaAbierta(pl, b);
      if (!d) {
        for (const l of LANGS) s += t1(l, l === "es" ? "sin bloque" : "no block", x, yc, 12, 16, `${PRE}-t-meta`);
        s += `<g class="lado-nodo" role="img" data-aria-es="${esc(BANDA[b].es[0])}: sin componentes" data-aria-en="${esc(BANDA[b].en[0])}: no components"><rect class="${PRE}-card ${PRE}-fantasma" x="${x}" y="${yc + cab}" width="${C.colW}" height="${C.nH}" rx="6"/>`;
        for (const l of LANGS) s += t1(l, l === "es" ? "sin componentes" : "no components", x + 12, yc + cab + (C.nH - 16) / 2, 12, 16, `${PRE}-t-meta ${PRE}-t-meta-compacta`);
        s += `</g>`;
        return;
      }
      for (const l of LANGS) s += t(l, F.partir(l === "es" ? d[0] : d[1], 12, 700, C.colW), x, yc, 12, 16, `${PRE}-t-meta ${PRE}-t-cab-bloque`);
      lista.forEach((c, k) => { s += nodo(c, x, yc + cab + k * (C.nH + C.nG)); });
    });
    y += h + C.rowGap;
  }
  return s + `</svg>`;
}

const pls = PAGINAS_PL[0];
const estados = [false, true].map((d) => `      <div class="lienzo-dir" data-desplegado="${d}"${d ? " hidden" : ""}>${svgLado(pls, d)}</div>`).join("\n");
const ABRE = `<svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true"><path d="${ABAJO}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CIERRA = `<svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true"><path d="${ARRIBA}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const boton = `<button type="button" class="boton boton-sec" data-todo aria-expanded="false" aria-controls="lienzo-lado"><span data-todo-si="false">${ES("Desplegar todo", "Expand all")}${ABRE}</span><span data-todo-si="true" hidden>${ES("Contraer todo", "Collapse all")}${CIERRA}</span></button>`;
const cambiarRutas = (html) => html.replace(/(href|src)="(assets\/|index\.html|atlas-nivel-1\.html|atlas-nivel-2\.html|atlas-recorrido\.html|lado-a-lado\.html|investigador\.html|perfil\.html|instrumento\.html)/g, '$1="../diseno/$2');
const html = cambiarRutas(`${head({ es: "Propuesta · Lado a lado en el mismo diagrama", en: "Proposal · Side by side in the same diagram" }, `<style>
  [data-todo-si]:not([hidden]) { display: inline-flex; align-items: center; gap: 8px; }
  .defs-comunes { position: absolute; width: 0; height: 0; overflow: hidden; }
  .prop-notas { max-width: 72ch; color: var(--tinta-2); margin: 18px 0 0; padding-left: 1.2em; }
  .prop-notas li { margin: 6px 0; }
  .prop-notas b { color: var(--tinta-1); }
</style>
`)}
<body>
<a class="saltar" href="#contenido">${ES("Saltar al contenido", "Skip to content")}</a>
<div class="mq-bar" role="region" aria-label="Propuesta">
  <span class="mq-t">${ES("Propuesta, segunda vuelta: toca «Desplegar todo», justo encima del diagrama. El mismo botón dice luego «Contraer todo».", "Proposal, second round: tap “Expand all”, just above the diagram. The same button then reads “Collapse all”.")}</span>
</div>
${barra("lado")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Atlas · lado a lado · propuesta", en: "Atlas · side by side · proposal" }, { es: "Tres plataformas, el mismo mapa", en: "Three platforms, the same map" }, { es: "Un solo botón despliega los componentes de todas las bandas en todas las plataformas, dentro del mismo diagrama, y los vuelve a contraer.", en: "One button expands the components of every band on every platform, inside the same diagram, and collapses them again." }, `<p class="meta"><span>${ES("datos ficticios de la maqueta", "fictional data from the mockup")}</span><span class="punto">·</span><span>${ES("página 1 de 2", "page 1 of 2")}</span></p>`, false)}
  ${niveles("lado-a-lado.html")}
  <div class="fila-r2">${boton}</div>
  <p class="guia">${ES("<b>Se lee por columnas.</b> «Desplegar todo» abre cada bloque en sus componentes, en todas las bandas y todas las plataformas a la vez. Las columnas no se mueven; cada fila crece hasta su celda más alta. «Contraer todo» vuelve a los bloques.", "<b>Read it by columns.</b> “Expand all” opens every block into its components, in every band and every platform at once. Columns do not move; each row grows to its tallest cell. “Collapse all” goes back to the blocks.")}</p>
  <section class="mapa" aria-label="Lado a lado">
    <div class="lienzo-marco">
      <div class="lienzo" id="lienzo-lado" tabindex="0" role="region" data-aria-es="Comparación; se desplaza de lado" data-aria-en="Comparison; scrolls sideways">
${defs()}
${estados}
      </div>
    </div>
  </section>
  <ul class="prop-notas">
    <li>${ES("<b>Qué cambia frente a la maqueta:</b> el conmutador de dos opciones «Ver: bloques / componentes» pasa a ser un solo botón, y lo desplegado se dibuja en el mismo diagrama.", "<b>What changes from the mockup:</b> the two-option “View: blocks / components” switch becomes a single button, and what expands is drawn in the same diagram.")}</li>
    <li>${ES("<b>En el producto,</b> tocar un bloque abrirá su ficha, como en la maqueta, y tocar un componente, la suya. Este boceto no las dibuja.", "<b>In the product,</b> tapping a block will open its card, as in the mockup, and tapping a component, its own. This sketch does not draw them.")}</li>
    <li>${ES("<b>En el teléfono,</b> una banda a la vez con pestañas y todas las plataformas apiladas, como en la maqueta; el mismo botón despliega o contrae los componentes de la banda que ves.", "<b>On the phone,</b> one band at a time with tabs and every platform stacked, as in the mockup; the same button expands or collapses the components of the band in view.")}</li>
  </ul>
</main>
<script src="lado-mismo-diagrama.js" defer></script>
${pie}`);

const JS = `/* Boceto M1 (S2), segunda vuelta: un solo botón [data-todo] alterna entre el SVG contraído y el
   desplegado. Las columnas no se mueven, así que el desplazamiento lateral del lienzo se conserva. */
(function () {
  var boton = document.querySelector("[data-todo]");
  boton.addEventListener("click", function () {
    var abre = boton.getAttribute("aria-expanded") !== "true";
    boton.setAttribute("aria-expanded", String(abre));
    boton.querySelectorAll("[data-todo-si]").forEach(function (s) { s.hidden = s.getAttribute("data-todo-si") !== String(abre); });
    document.querySelectorAll("[data-desplegado]").forEach(function (d) { d.hidden = d.getAttribute("data-desplegado") !== String(abre); });
    if (window.mqAplicar) window.mqAplicar();
  });
})();
`;
const DIR = resolve(RAIZ, "docs/propuestas-de-diseno");
fs.writeFileSync(resolve(DIR, "lado-mismo-diagrama.html"), html);
fs.writeFileSync(resolve(DIR, "lado-mismo-diagrama.js"), JS);
console.log(`lado-mismo-diagrama: ${(html.length / 1024).toFixed(1)} KB · ${avisos.length ? avisos.join("; ") : "sin avisos"}`);
