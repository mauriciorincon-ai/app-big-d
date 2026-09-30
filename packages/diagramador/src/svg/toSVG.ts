// `toSVG(geometry, { language, … })` (CONTRATO § 8): el SVG de un idioma. La geometría es la misma en
// todos; cambian el texto, `lang`, `<title>` y `<desc>`. Un SVG por idioma, con espacio de nombres propio
// para sus ids (D8, D12) y sin sellos de versión (las versiones van en el manifiesto).
import type { Geometria } from "../layout/tipos";
import { fmt } from "../util/numeros";
import { GLIFOS, MARCADORES, MARCAS } from "./glifos";
import { atributos, elemento, escapar, type Serializacion } from "./serializar";

const CORTA = { "nivel-1": "n1", "nivel-2": "n2", recorrido: "rec", bloque: "bl" } as const;

export interface OpcionesSVG {
  language: string;
  /** Espacio de nombres de los ids (por defecto `sujeto-vista-idioma`). */
  prefix?: string;
  /** Id del elemento con la versión en texto (G10): la raíz lo enlaza con `aria-details`. */
  textId?: string;
  /** Id de la pista «Enter abre la ficha» que describen los activables (A-29, D-S1-07). */
  hintId?: string;
}

function defs(s: Serializacion): string {
  let out = "<defs>";
  for (const [nombre, gl] of Object.entries(GLIFOS))
    out += gl.trazo
      ? `<path${atributos("path", { id: `g-${nombre}`, d: gl.d, fill: "none", stroke: "currentColor", "stroke-width": gl.trazo }, s)}/>`
      : `<path${atributos("path", { id: `g-${nombre}`, d: gl.d, fill: "currentColor" }, s)}/>`;
  for (const [nombre, m] of Object.entries(MARCADORES))
    out += m.mixto
      ? `<path${atributos("path", { id: `m-${nombre}`, d: m.d, fill: "currentColor", stroke: "currentColor", "stroke-width": "1.2" }, s)}/>`
      : `<path${atributos("path", { id: `m-${nombre}`, d: m.d, fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }, s)}/>`;
  for (const [nombre, k] of Object.entries(MARCAS))
    out += `<path${atributos("path", { id: `k-${nombre}`, d: k.d, fill: "none", stroke: "currentColor", "stroke-width": k.trazo, "stroke-linecap": "round", "stroke-linejoin": "round" }, s)}/>`;
  return `${out}</defs>`;
}

export function toSVG(geo: Geometria, opciones: OpcionesSVG): string {
  const idioma = opciones.language;
  if (!geo.idiomas.includes(idioma)) throw new Error(`toSVG: la gramática no declara el idioma «${idioma}»`);
  const s: Serializacion = {
    idioma,
    prefijo: opciones.prefix ?? `${geo.sujeto}-${CORTA[geo.vista]}-${idioma}`,
    activable: opciones.hintId ? { "aria-describedby": opciones.hintId } : undefined,
  };
  const raiz = atributos(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      id: "lienzo",
      class: `dg-svg dg-${geo.vista}`,
      lang: idioma,
      viewBox: `0 0 ${fmt(geo.ancho)} ${fmt(geo.alto)}`,
      width: geo.ancho,
      height: geo.alto,
      role: "graphics-document document",
      "aria-labelledby": `${s.prefijo}-titulo`,
      "aria-describedby": `${s.prefijo}-desc`,
      ...(opciones.textId ? { "aria-details": opciones.textId } : {}),
      "data-vista": geo.vista,
    },
    s,
  );
  const lineas = [
    `<svg${raiz}>`,
    `<title${atributos("title", { id: "titulo" }, s)}>${escapar(geo.titulo[idioma]!)}</title>`,
    `<desc${atributos("desc", { id: "desc" }, s)}>${escapar(geo.descripcion[idioma]!)}</desc>`,
    defs(s),
    ...geo.escena.map((e) => elemento(e, s)).filter(Boolean),
    "</svg>",
  ];
  return `${lineas.join("\n")}\n`;
}
