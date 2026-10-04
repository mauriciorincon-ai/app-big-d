// Serializador propio (D8, G1): orden de atributos FIJO por tipo de elemento (un atributo fuera de la tabla
// es un error del motor, no se escribe en otro orden), números desde enteros en décimas con `fmt`, texto
// escapado, UTF-8 sin BOM, LF y un salto final. Sin SVGO ni formateadores: borran ids y roles.
import { fmt } from "../util/numeros";
import type { Elemento, ValorAtributo } from "../layout/tipos";

const ORDEN: Record<string, readonly string[]> = {
  svg: ["xmlns", "id", "class", "lang", "viewBox", "width", "height", "role", "aria-labelledby", "aria-describedby", "aria-details", "data-vista"],
  title: ["id"],
  desc: ["id"],
  g: ["id", "class", "role", "tabindex", "aria-label", "aria-describedby", "aria-hidden", "data-dueno", "data-mapa", "data-nodo", "data-nodos", "data-paso", "data-flujo", "data-marca"],
  rect: ["class", "data-caja", "x", "y", "width", "height", "rx"],
  path: ["id", "class", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  use: ["class", "href", "x", "y"],
  text: ["class", "text-anchor"],
  tspan: ["x", "y"],
};

export const escapar = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface Serializacion {
  idioma: string;
  prefijo: string;
  /** Atributos que el serializador agrega a todo grupo activable (con `tabindex`): p. ej. la pista A-29. */
  activable?: Record<string, string>;
}

function valor(v: ValorAtributo, s: Serializacion, nombre: string): string {
  if (typeof v === "number") return fmt(v);
  if (typeof v === "string") {
    if (nombre === "id") return `${s.prefijo}-${v}`;
    if (nombre === "href" && v.startsWith("#")) return `#${s.prefijo}-${v.slice(1)}`;
    return v;
  }
  const t = v[s.idioma];
  if (t === undefined) throw new Error(`serializar: el atributo «${nombre}» no tiene texto en «${s.idioma}»`);
  return t;
}

export function atributos(el: string, attrs: Record<string, ValorAtributo>, s: Serializacion): string {
  const orden = ORDEN[el];
  if (!orden) throw new Error(`serializar: elemento sin orden de atributos: <${el}>`);
  for (const k of Object.keys(attrs)) if (!orden.includes(k)) throw new Error(`serializar: atributo «${k}» fuera del orden fijo de <${el}>`);
  let out = "";
  for (const k of orden) {
    const v = attrs[k];
    if (v === undefined) continue;
    out += ` ${k}="${escapar(valor(v, s, k))}"`;
  }
  return out;
}

export function elemento(e: Elemento, s: Serializacion): string {
  const attrs = e.el === "g" && s.activable && e.attrs.tabindex !== undefined ? { ...e.attrs, ...s.activable } : e.attrs;
  if (e.el === "text") {
    const lineas = e.texto?.lineas[s.idioma];
    if (!e.texto || lineas === undefined) throw new Error(`serializar: texto sin líneas en «${s.idioma}»`);
    if (lineas.length === 0) return "";
    const tspans = lineas
      .map((l, i) => `<tspan${atributos("tspan", { x: e.texto!.x, y: e.texto!.y + i * e.texto!.lh }, s)}>${escapar(l)}</tspan>`)
      .join("");
    return `<text${atributos("text", attrs, s)}>${tspans}</text>`;
  }
  const hijos = (e.hijos ?? []).map((h) => elemento(h, s)).join("");
  return hijos || e.el === "g" ? `<${e.el}${atributos(e.el, attrs, s)}>${hijos}</${e.el}>` : `<${e.el}${atributos(e.el, attrs, s)}/>`;
}
