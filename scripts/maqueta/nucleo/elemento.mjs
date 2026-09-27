// Cuerpo de un elemento de nivel 1 (bloque o «sin bloque»): caja, nombre, fila inferior con los
// glifos de tipo de sus componentes (uno por componente, hasta 4 y «+N»), la madurez más baja si no
// es «disponible» y la insignia de vigencia (se marca la excepción, no la norma).
import { BLOQUE, DIAS_BASE, MADUREZ, NODO, TIPO, UMBRAL_REVISAR, UMBRAL_VENCIDO, VIGENCIA } from "./datos.mjs";
import { LANGS, avisos, base, esc, medir, nombreElem, partir, r1, texto } from "./comun.mjs";
import { medidor } from "./glifos.mjs";

export function diasDe(e, estado) {
  return VIGENCIA[estado][e.id] ?? DIAS_BASE;
}
export function vigDe(d) {
  return d >= UMBRAL_VENCIDO ? "vencido" : d >= UMBRAL_REVISAR ? "revisar" : "vigente";
}

export function cuerpoElem(e, x, y, w, h, pre, o) {
  const pad = 8;
  const ch = o.chico ?? 13; // letra pequeña: 14 en ancho, 13 en angosto (piso 12 px renderizado)
  const st = ` style="font-size:${ch}px"`;
  const aria = (l) => {
    const tipos = e.nodos.map((n) => NODO[n.id][l]).join(", ");
    return e.fantasma
      ? (l === "es" ? `Sin bloque: ${tipos}` : `No block: ${tipos}`)
      : `${BLOQUE[e.id][l][0]}. ${BLOQUE[e.id][l][1]} ${l === "es" ? "Componentes" : "Components"}: ${tipos}.`;
  };
  let s = `<g class="dg-elem${e.fantasma ? " dg-elem-fantasma" : ""}" role="graphics-symbol img" tabindex="0" data-dueno="${e.id}" data-aria-es="${esc(aria("es"))}" data-aria-en="${esc(aria("en"))}">`;
  s += `<rect data-caja="${e.id}" class="${e.fantasma ? "dg-fantasma" : "dg-bloque"}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  const tw = w - 2 * pad;
  for (const l of LANGS) {
    const nm = partir(nombreElem(e, l), o.nombre, e.fantasma ? 400 : 700, tw);
    if (nm.length > 2) avisos.push(`nombre de ${e.id} (${l}) ocupa ${nm.length} líneas`);
    s += texto(l, nm, x + pad, base(y + 8, o.nombre, o.lhN), o.lhN, e.fantasma ? "dg-t-fantasma" : "dg-t-bloque");
  }
  // Fila inferior.
  const yc = y + h - o.abajo - 9;
  let cx = x + pad + 8;
  const vis = e.nodos.slice(0, 4);
  for (const n of vis) {
    const t = TIPO[n.tipo_id];
    s += `<use href="#${pre}-g-${t.g}" x="${r1(cx)}" y="${r1(yc)}" class="dg-c-${t.t}"/>`;
    cx += 18;
  }
  let fin = cx - 8;
  if (e.nodos.length > 4) {
    s += `<text class="dg-t-mas"${st} x="${r1(cx - 6)}" y="${r1(yc + 4.5)}">+${e.nodos.length - 4}</text>`;
    fin = cx - 6 + medir(`+${e.nodos.length - 4}`, ch, 400);
  }
  const peor = e.nodos.map((n) => n.madurez).sort((a, b) => MADUREZ[a].nivel - MADUREZ[b].nivel)[0];
  const finL = { es: fin, en: fin };
  if (peor !== "disponible-general") {
    const mx = fin + 10;
    s += medidor(MADUREZ[peor].nivel, mx, yc);
    for (const l of LANGS) {
      s += `<text lang="${l}" class="dg-t-madurez"${st} x="${r1(mx + 7)}" y="${r1(yc + 4.5)}">${esc(MADUREZ[peor][l])}</text>`;
      finL[l] = mx + 7 + medir(MADUREZ[peor][l], ch, 400);
    }
  }
  // Insignias de vigencia por estado de la maqueta (vigente = sin marca).
  for (const estado of ["revisar", "vencido"]) {
    const d = diasDe(e, estado);
    const v = vigDe(d);
    if (v === "vigente") continue;
    const t = `${d} d`;
    const bw = 6 + 10 + 4 + medir(t, ch, 700) + 7;
    const bx = x + w - pad - bw;
    // En ancho la insignia monta el borde superior (allí no hay puertos); en angosto va en la fila
    // inferior (arriba y abajo están los puertos).
    const by = o.insignia === "arriba" ? y : yc;
    if (o.insignia !== "arriba") for (const l of LANGS) if (finL[l] > bx - 4) avisos.push(`insignia de ${e.id} (${estado}) pisa la fila inferior en ${l}`);
    s += `<g class="dg-insignia dg-insignia-${v}" data-si="vig:${estado}">`;
    s += `<rect x="${r1(bx)}" y="${r1(by - 9)}" width="${r1(bw)}" height="18" rx="9"/>`;
    s += `<use href="#${pre}-k-${v}" x="${r1(bx + 6 + 5)}" y="${r1(by)}" class="dg-insignia-marca"/>`;
    s += `<text class="dg-t-insignia"${st} x="${r1(bx + 6 + 10 + 4)}" y="${r1(by + 4.5)}">${esc(t)}</text></g>`;
  }
  return s + `</g>`;
}
