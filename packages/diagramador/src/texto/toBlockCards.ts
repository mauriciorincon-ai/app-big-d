// `toBlockCards(map, grammar, group, { language, textos, fechaConsulta? })` (enmienda del piloto, D-S1-53): las
// tarjetas de texto de los componentes de un grupo del nivel 1 (un bloque o «_<banda>»), en HTML, sobre un mapa
// YA VALIDADO. Una tarjeta por componente: su tipo (glifo + código + nombre), su nombre, su madurez (medidor +
// nombre, D6), su frase de líder, su vigencia si no está vigente (§ 4.8) y TODAS sus conexiones —las que salen
// y las que entran— cada una con el trazo y el marcador de su modo (el color nunca va solo). Acompaña a la
// vista «bloque», que dibuja solo lo de adentro.
import { plantilla } from "../layout/escena";
import type { TextosMotor } from "../layout/tipos";
import { escapar } from "../svg/serializar";
import { glifoSVG, medidorSVG, modoSVG } from "../svg/simbolos";
import type { Gramatica, Mapa } from "../tipos";
import { fraseVigencia } from "../util/vigencia";
import { idiomaPedido } from "../texto/idioma";
import { nodosDelGrupo } from "../util/grupo";
import { ordenarPor } from "../util/orden";

export interface OpcionesTarjetas {
  language: string;
  textos: Record<string, TextosMotor>;
  /** Fecha de consulta (AAAA-MM-DD): con ella, cada tarjeta por revisar o vencida dice sus días. */
  fechaConsulta?: string;
  /** Id del contenedor: el SVG de la vista «bloque» lo enlaza como su versión en texto (G10, `textId`). */
  id?: string;
}

export function toBlockCards(map: Mapa, grammar: Gramatica, group: string, opciones: OpcionesTarjetas): string {
  const l = opciones.language;
  const t = idiomaPedido("toBlockCards", grammar, l, opciones.textos);
  const e = escapar;
  const nodo = new Map(map.nodos.map((n) => [n.id, n]));
  const modo = new Map(grammar.modos_de_flujo.map((m) => [m.id, m]));
  const flujos = ordenarPor(map.flujos, (f) => f.id);
  const conexion = (id: string, plantillaTexto: string, otro: string, modoId: string, que: string) => {
    const m = modo.get(modoId)!;
    return `<li data-flujo="${e(id)}">${modoSVG(m)}<span>${e(plantilla(plantillaTexto, { nombre: nodo.get(otro)!.nombre[l]!, modo: m.nombre[l]!, que }))}</span></li>`;
  };
  const tarjetas = nodosDelGrupo(map, grammar, group).map((n) => {
    const tipo = grammar.tipos_de_nodo.find((x) => x.id === n.tipo_id)!;
    const madurez = grammar.escala_madurez.find((x) => x.id === n.madurez)!;
    const lineas = [
      ...flujos.filter((f) => f.origen === n.id).map((f) => conexion(f.id, t.hacia, f.destino, f.modo_id, f.que_viaja[l]!)),
      ...flujos.filter((f) => f.destino === n.id).map((f) => conexion(f.id, t.desde, f.origen, f.modo_id, f.que_viaja[l]!)),
    ];
    const frase = fraseVigencia(grammar, t, n.fecha_verificacion, opciones.fechaConsulta);
    const vigencia = frase ? `<p class="dg-tarjeta-vigencia"><b>${e(frase)}</b></p>` : "";
    return (
      `<article class="dg-tarjeta" data-nodo="${e(n.id)}">` +
      `<p class="dg-ficha-tipo">${glifoSVG(tipo.glifo, tipo.token_color, 16)}<span class="dg-ficha-cod">${e(tipo.etiqueta_corta[l]!)}</span><span>${e(tipo.nombre[l]!)}</span></p>` +
      `<h3>${e(n.nombre[l]!)}</h3>` +
      `<p class="dg-ficha-madurez">${medidorSVG(madurez.nivel)}<span>${e(madurez.nombre[l]!)}</span></p>` +
      `<p class="dg-tarjeta-lider">${e(n.lider[l]!)}</p>` +
      vigencia +
      (lineas.length ? `<ul class="dg-conexiones">${lineas.join("")}</ul>` : "") +
      `</article>`
    );
  });
  const id = opciones.id ? ` id="${e(opciones.id)}"` : "";
  return `<div class="dg-tarjetas"${id} lang="${e(l)}" data-grupo="${e(group)}">${tarjetas.join("")}</div>\n`;
}
