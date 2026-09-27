// Lectura en texto (G10) y leyenda generada (§ 4.9), en HTML, para la página del atlas.
import { BANDA, BLOQUE, MADUREZ, MODO, MODOS, NODO, TIPO } from "./datos.mjs";
import { esc, etiquetaElem, modelo } from "./comun.mjs";
import { MARCA, MODO_MARCA, TIPO_GLIFO, medidor } from "./glifos.mjs";

const par = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;
const lista = (xs, l) => (xs.length === 1 ? xs[0] : l === "es" ? `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}` : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const modosTxt = (ms, l) => lista(ms.map((m) => MODO[m][l][0].toLowerCase()), l);

export function lectura(variante) {
  const mod = modelo(variante, "chip");
  let h = `<ol class="lectura" data-si="p9:${variante}">`;
  for (const b of mod.bandas) {
    const [nes, qes] = BANDA[b.id].es, [nen, qen] = BANDA[b.id].en;
    const clase = b.clase === "franja" ? par(" · franja transversal", " · cross-cutting band") : "";
    h += `<li><p class="lectura-banda"><strong>${par(esc(nes), esc(nen))}</strong>${clase} — ${par(esc(qes), esc(qen))}</p><ul>`;
    for (const e of mod.elems.filter((x) => x.banda.id === b.id)) {
      const comps = (l) => e.nodos.map((n) => `${NODO[n.id][l]} (${TIPO[n.tipo_id][l][0]}${n.madurez !== "disponible-general" ? `, ${MADUREZ[n.madurez].largo[l].toLowerCase()}` : ""})`);
      const cab = e.fantasma
        ? par(`Sin bloque. ${esc(lista(comps("es"), "es"))}.`, `No block. ${esc(lista(comps("en"), "en"))}.`)
        : par(`<strong>${esc(BLOQUE[e.id].es[0])}</strong>: ${esc(BLOQUE[e.id].es[1])} Componentes: ${esc(lista(comps("es"), "es"))}.`, `<strong>${esc(BLOQUE[e.id].en[0])}</strong>: ${esc(BLOQUE[e.id].en[1])} Components: ${esc(lista(comps("en"), "en"))}.`);
      h += `<li data-elem="${e.id}">${cab}`;
      const sal = mod.flujos.filter((f) => f.o === e.id);
      if (sal.length) {
        h += `<ul class="lectura-flujos">`;
        for (const f of sal) {
          const d = mod.porId[f.d];
          const n = f.n;
          h += `<li>${par(`Envía a ${esc(etiquetaElem(d, "es"))}: ${modosTxt(f.modos, "es")}; ${n} flujo${n > 1 ? "s" : ""}.`, `Sends to ${esc(etiquetaElem(d, "en"))}: ${modosTxt(f.modos, "en")}; ${n} flow${n > 1 ? "s" : ""}.`)}</li>`;
        }
        h += `</ul>`;
      }
      h += `</li>`;
    }
    h += `</ul></li>`;
  }
  return h + `</ol>`;
}

const svgG = (d, relleno, trazo, clase, caja = 16) =>
  `<svg class="lg-g ${clase}" viewBox="${-caja / 2} ${-caja / 2} ${caja} ${caja}" width="${caja}" height="${caja}" aria-hidden="true"><path d="${d}" ${relleno ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${trazo}" stroke-linecap="round" stroke-linejoin="round"`}/></svg>`;

export function leyenda() {
  let h = `<div class="leyenda-grupo"><h3>${par("Tipos de componente", "Component types")}</h3><ul class="leyenda-lista">`;
  for (const t of Object.values(TIPO)) {
    const g = TIPO_GLIFO[t.g];
    h += `<li class="dg-c-${t.t}">${svgG(g.d, g.relleno, g.trazo ?? 1.5, "")}<span class="lg-cod">${par(t.es[0], t.en[0])}</span><span class="lg-txt">${par(esc(t.es[1]), esc(t.en[1]))}</span></li>`;
  }
  h += `</ul><p class="leyenda-nota">${par("En la visión general, cada bloque muestra un glifo por componente: el color acompaña a la forma, nunca va solo.", "In the overview, each block shows one glyph per component: color goes with the shape, never on its own.")}</p></div>`;
  h += `<div class="leyenda-grupo"><h3>${par("Cómo viaja el dato", "How the data travels")}</h3><ul class="leyenda-lista leyenda-modos">`;
  for (const m of MODOS) {
    const mm = MODO_MARCA[m];
    const linea =
      m === "sin-copia"
        ? `<path d="M2,8 H46" class="dg-linea dg-doble-ext"/><path d="M2,8 H46" class="dg-linea dg-doble-int"/>`
        : `<path d="M2,8 H46" class="dg-linea"/>`;
    h += `<li><svg class="lg-linea dg-modo-${m}" viewBox="0 0 48 16" width="48" height="16" aria-hidden="true">${linea}</svg>${svgG(mm.d, mm.relleno === "mixto", 1.5, "lg-marca", 12)}<span class="lg-cod">${par(MODO[m].es[0], MODO[m].en[0])}</span><span class="lg-txt">${par(MODO[m].es[1], MODO[m].en[1])}</span></li>`;
  }
  h += `<li><svg class="lg-linea dg-modo-haz" viewBox="0 0 48 16" width="48" height="16" aria-hidden="true"><path d="M2,8 H46" class="dg-linea"/></svg><span class="lg-hueco"></span><span class="lg-cod">${par("Varios modos", "Several modes")}</span><span class="lg-txt">${par("Línea gruesa: la etiqueta dice cuáles, en orden.", "Thick line: the tag lists which ones, in order.")}</span></li>`;
  h += `</ul></div>`;
  h += `<div class="leyenda-grupo"><h3>${par("Madurez", "Maturity")}</h3><ul class="leyenda-lista">`;
  for (const [id, m] of Object.entries(MADUREZ)) {
    h += `<li><svg class="lg-g" viewBox="-6 -8 12 16" width="12" height="16" aria-hidden="true">${medidor(m.nivel, 0, 0)}</svg><span class="lg-txt">${par(m.largo.es, m.largo.en)}${id === "disponible-general" ? par(" — no se marca", " — not marked") : ""}</span></li>`;
  }
  h += `</ul></div>`;
  h += `<div class="leyenda-grupo"><h3>${par("Vigencia de lo verificado", "How recent the check is")}</h3><ul class="leyenda-lista">`;
  const v = [
    ["vigente", "vigente · menos de 30 días — no se marca", "current · under 30 days — not marked"],
    ["revisar", "por revisar · de 30 a 59 días", "review due · 30 to 59 days"],
    ["vencido", "vencido · 60 días o más", "expired · 60 days or more"],
  ];
  for (const [k, es, en] of v) h += `<li><span class="pildora pildora-${k}">${svgG(MARCA[k], false, 2, "", 12)}</span><span class="lg-txt">${par(es, en)}</span></li>`;
  h += `</ul></div>`;
  return h;
}
