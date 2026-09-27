// `toLegend(grammar, { language, textos })` (§ 4.9): la leyenda generada de la gramática, con los MISMOS
// paths del diagrama: tipos (glifo + etiqueta + nombre), modos (trazo + marcador + nombre + descripción),
// madurez (medidor + nombre) y vigencia (marca + regla de días), más la nota de marcas (D7). HTML con
// SVG en línea; los colores entran por las mismas clases del diagrama (G13).
import type { Gramatica } from "../tipos";
import { plantilla } from "../layout/escena";
import type { TextosMotor } from "../layout/tipos";
import { ordenarPor } from "../util/orden";
import { MARCADORES, MARCAS } from "./glifos";
import { glifoSVG, medidorSVG } from "./simbolos";
import { escapar } from "./serializar";

const svg = (caja: string, w: number, h: number, cuerpo: string) => `<svg class="dg-svg" viewBox="${caja}" width="${w}" height="${h}" aria-hidden="true">${cuerpo}</svg>`;
const DASH: Record<string, string> = { discontinua: ' stroke-dasharray="8 5"', continua: "", punteada: ' stroke-dasharray="0.1 5.5" stroke-linecap="round"', doble: "" };


export function toLegend(grammar: Gramatica, opciones: { language: string; textos: Record<string, TextosMotor> }): string {
  const l = opciones.language;
  const t = opciones.textos[l];
  if (!t) throw new Error(`toLegend: faltan las cadenas de interfaz en «${l}»`);
  const e = escapar;
  const tipos = grammar.tipos_de_nodo
    .map((tp) => {
      return `<li>${glifoSVG(tp.glifo, tp.token_color)}<span class="dg-leyenda-cod">${e(tp.etiqueta_corta[l]!)}</span><span>${e(tp.nombre[l]!)}</span></li>`;
    })
    .join("");
  const modos = grammar.modos_de_flujo
    .map((m) => {
      const linea =
        m.estilo_linea === "doble"
          ? `<path d="M2,7 H38" stroke="currentColor" stroke-width="6.5"/><path class="dg-doble-int" d="M2,7 H38"/>`
          : `<path d="M2,7 H38" stroke="currentColor" stroke-width="${m.estilo_linea === "punteada" ? "2.8" : "2"}"${DASH[m.estilo_linea]}/>`;
      const mk = m.marcador === "ninguno" ? undefined : MARCADORES[m.marcador];
      const marca = !mk
        ? ""
        : mk.mixto
          ? `<path d="${mk.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2" transform="translate(52,7)"/>`
          : `<path d="${mk.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(52,7)"/>`;
      return `<li>${svg("0 0 62 14", 62, 14, `<g class="dg-marca" fill="none">${linea}${marca}</g>`)}<span><b>${e(m.nombre[l]!)}</b> — ${e(m.descripcion[l]!)}</span></li>`;
    })
    .join("");
  const madurez = ordenarPor(grammar.escala_madurez, (m) => -m.nivel)
    .map((m) => `<li>${medidorSVG(m.nivel)}<span>${e(m.nombre[l]!)}</span></li>`)
    .join("");
  const marca = (k: string) => `<path d="${MARCAS[k]!.d}" fill="none" stroke="currentColor" stroke-width="${MARCAS[k]!.trazo}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const vigencia = [
    `<li>${svg("-7 -7 14 14", 14, 14, `<g class="dg-marca">${marca("vigente")}</g>`)}<span>${e(t.leyenda.vigente)}</span></li>`,
    `<li>${svg("-7 -7 14 14", 14, 14, `<g class="dg-marca">${marca("revisar")}</g>`)}<span>${e(t.leyenda.porRevisar)}</span></li>`,
    `<li>${svg("-7 -7 14 14", 14, 14, `<g class="dg-marca">${marca("vencido")}</g>`)}<span>${e(t.leyenda.vencido)}</span></li>`,
  ].join("");
  const regla = plantilla(t.leyenda.reglaVigencia, { revisar: grammar.vigencia.umbral_revisar_dias, vencido: grammar.vigencia.umbral_vencido_dias });
  return (
    `<div class="dg-leyenda" lang="${e(l)}">` +
    `<section><h2>${e(t.leyenda.tipos)}</h2><ul class="dg-leyenda-lista">${tipos}</ul></section>` +
    `<section><h2>${e(t.leyenda.modos)}</h2><ul class="dg-leyenda-lista">${modos}</ul></section>` +
    `<section><h2>${e(t.leyenda.madurez)}</h2><ul class="dg-leyenda-lista">${madurez}</ul></section>` +
    `<section><h2>${e(t.leyenda.vigencia)}</h2><ul class="dg-leyenda-lista">${vigencia}</ul><p>${e(regla)}</p></section>` +
    `<p class="dg-leyenda-nota">${e(t.leyenda.notaMarcas)}</p>` +
    `</div>\n`
  );
}
