/**
 * El escape de texto y de valores de atributo HTML (S5-B-1): una sola definición para las vistas que arman HTML y SVG como
 * cadena (el atlas, la ficha de decisiones y el diagrama de ondas). Escapa también las comillas dobles, porque el mismo texto
 * puede ir dentro de `"…"` de un atributo.
 */
export const esc = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
