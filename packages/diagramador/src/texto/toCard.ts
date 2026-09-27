// `toCard(map, grammar, nodeId, { language, textos, fechaConsulta? })` (§ 4.5): la ficha de un nodo en HTML,
// sobre un mapa YA VALIDADO. Qué es (tipo con su glifo), qué hace (registro de experto), por qué importa,
// términos (los del nodo y los del glosario del mapa que aparecen en sus textos, marcados como tales),
// madurez (medidor + nombre completo, D6), fuentes con fecha y tipo, y fechas de verificación y consulta
// con el semáforo de vigencia cuando no está vigente (§ 4.8). El motor entrega el contenido; el panel
// (hoja o región lateral, foco, cierre) es de la app.
import { plantilla } from "../layout/escena";
import type { TextosMotor } from "../layout/tipos";
import { escapar } from "../svg/serializar";
import { glifoSVG, medidorSVG } from "../svg/simbolos";
import type { Gramatica, Mapa } from "../tipos";
import { diasEntre } from "../util/fechas";
import { compararCodigo } from "../util/orden";

export interface OpcionesFicha {
  language: string;
  textos: Record<string, TextosMotor>;
  /** Fecha de consulta (AAAA-MM-DD): con ella la ficha la dice y marca lo por revisar o vencido. */
  fechaConsulta?: string;
}

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** El término aparece como palabra entera (letras y números Unicode alrededor no cuentan). */
const aparece = (termino: string, texto: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${escaparRegex(termino)}($|[^\\p{L}\\p{N}])`, "iu").test(texto);

export function toCard(map: Mapa, grammar: Gramatica, nodeId: string, opciones: OpcionesFicha): string {
  const l = opciones.language;
  const t = opciones.textos[l];
  if (!t) throw new Error(`toCard: faltan las cadenas de interfaz en «${l}»`);
  const n = map.nodos.find((x) => x.id === nodeId);
  if (!n) throw new Error(`toCard: el mapa no tiene el nodo «${nodeId}»`);
  const e = escapar;
  const f = t.ficha;
  const tipo = grammar.tipos_de_nodo.find((x) => x.id === n.tipo_id)!;
  const madurez = grammar.escala_madurez.find((x) => x.id === n.madurez)!;

  // Términos: los propios del nodo y los del glosario que aparecen en sus textos, sin repetir.
  const textos = [n.nombre[l], n.lider[l], n.experto[l], n.por_que_importa[l]].join(" ");
  const propios = Object.entries(n.terminos?.[l] ?? {}).sort(([a], [b]) => compararCodigo(a, b));
  const delGlosario = Object.entries(map.glosario?.[l] ?? {})
    .filter(([termino]) => !propios.some(([p]) => p.toLowerCase() === termino.toLowerCase()) && aparece(termino, textos))
    .sort(([a], [b]) => compararCodigo(a, b));
  const terminos = [
    ...propios.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`),
    ...delGlosario.map(([k, v]) => `<div class="dg-del-glosario"><dt>${e(k)} <span class="dg-ficha-cod">${e(f.glosario)}</span></dt><dd>${e(v)}</dd></div>`),
  ];

  const fuentes = n.fuentes.map(
    (s) => `<li><a href="${e(s.url)}">${e(s.titulo[l]!)}</a><span class="dg-ficha-fecha">${e(s.fecha)} · ${e(f.tipoFuente[s.tipo])}</span></li>`,
  );

  const meta = [`<span>${e(plantilla(f.verificado, { fecha: n.fecha_verificacion }))}</span>`];
  if (opciones.fechaConsulta) {
    meta.push(`<span>${e(plantilla(f.consultado, { fecha: opciones.fechaConsulta }))}</span>`);
    const dias = diasEntre(n.fecha_verificacion, opciones.fechaConsulta);
    const v = grammar.vigencia;
    if (dias >= v.umbral_revisar_dias) meta.push(`<b>${e(plantilla(dias >= v.umbral_vencido_dias ? t.vencido : t.porRevisar, { n: dias }))}</b>`);
  }

  return (
    `<article class="dg-ficha" lang="${e(l)}" data-ficha="${e(n.id)}">` +
    `<p class="dg-ficha-tipo">${glifoSVG(tipo.glifo, tipo.token_color, 16)}<span class="dg-ficha-cod">${e(tipo.etiqueta_corta[l]!)}</span><span>${e(tipo.nombre[l]!)}</span></p>` +
    `<h2>${e(n.nombre[l]!)}</h2>` +
    `<p class="dg-ficha-lider">${e(n.lider[l]!)}</p>` +
    `<h3>${e(f.queHace)}</h3><p>${e(n.experto[l]!)}</p>` +
    `<h3>${e(f.porQueImporta)}</h3><p>${e(n.por_que_importa[l]!)}</p>` +
    (terminos.length ? `<h3>${e(f.terminos)}</h3><dl class="dg-terminos">${terminos.join("")}</dl>` : "") +
    `<h3>${e(f.madurez)}</h3><p class="dg-ficha-madurez">${medidorSVG(madurez.nivel)}<span>${e(madurez.nombre[l]!)}</span></p>` +
    `<h3>${e(f.fuentes)}</h3><ul class="dg-fuentes">${fuentes.join("")}</ul>` +
    `<p class="dg-ficha-meta">${meta.join(" · ")}</p>` +
    `</article>\n`
  );
}
