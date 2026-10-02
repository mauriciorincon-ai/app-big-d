// `toLegend(grammar, { language, texts })` (§ 4.9): la leyenda generada de la gramática, con los MISMOS
// paths del diagrama: tipos (glifo + etiqueta + nombre), modos (trazo + marcador + nombre + descripción),
// madurez (medidor + nombre) y vigencia (marca + regla de días), más la nota de marcas (D7). HTML con
// SVG en línea; los colores entran por las mismas clases del diagrama (G13).
import type { Gramatica } from "../tipos";
import { plantilla } from "../layout/escena";
import type { TextosMotor } from "../layout/tipos";
import { ordenarPor } from "../util/orden";
import { MARCAS } from "./glifos";
import { glifoSVG, medidorSVG, modoSVG } from "./simbolos";
import { escapar } from "./serializar";
import { idiomaPedido } from "../texto/idioma";

const svg = (caja: string, w: number, h: number, cuerpo: string) => `<svg class="dg-svg" viewBox="${caja}" width="${w}" height="${h}" aria-hidden="true">${cuerpo}</svg>`;


export function toLegend(grammar: Gramatica, opciones: { language: string; texts: Record<string, TextosMotor> }): string {
  const l = opciones.language;
  const t = idiomaPedido("toLegend", grammar, l, opciones.texts);
  const e = escapar;
  const tipos = grammar.tipos_de_nodo
    .map((tp) => {
      return `<li>${glifoSVG(tp.glifo, tp.token_color)}<span class="dg-leyenda-cod">${e(tp.etiqueta_corta[l]!)}</span><span>${e(tp.nombre[l]!)}</span></li>`;
    })
    .join("");
  const modos = grammar.modos_de_flujo.map((m) => `<li>${modoSVG(m)}<span><b>${e(m.nombre[l]!)}</b> — ${e(m.descripcion[l]!)}</span></li>`).join("");
  const madurez = ordenarPor(grammar.escala_madurez, (m) => -m.nivel)
    .map((m) => `<li>${medidorSVG(m.nivel)}<span>${e(m.nombre[l]!)}</span></li>`)
    .join("");
  const marca = (k: string) => `<path d="${MARCAS[k]!.d}" fill="none" stroke="currentColor" stroke-width="${MARCAS[k]!.trazo}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Caja de 16: el triángulo de «por revisar» mide 14 × 13 u con su trazo; las tres marcas, a la misma escala.
  const vigencia = [
    `<li>${svg("-8 -8 16 16", 16, 16, `<g class="dg-marca">${marca("vigente")}</g>`)}<span>${e(t.leyenda.vigente)}</span></li>`,
    `<li>${svg("-8 -8 16 16", 16, 16, `<g class="dg-marca">${marca("revisar")}</g>`)}<span>${e(t.leyenda.porRevisar)}</span></li>`,
    `<li>${svg("-8 -8 16 16", 16, 16, `<g class="dg-marca">${marca("vencido")}</g>`)}<span>${e(t.leyenda.vencido)}</span></li>`,
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
