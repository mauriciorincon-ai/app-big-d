// G7 y V14: todo mapa de idioma y todo diccionario trae EXACTAMENTE los idiomas declarados por la gramática.
import type { Documento, Entrada } from "./informe";
import type { DiccionarioUbicado, TextoUbicado } from "./textos";

export function idiomasExactos(
  doc: Documento,
  regla: "G7" | "V14",
  idiomas: readonly string[],
  textos: readonly (TextoUbicado | DiccionarioUbicado)[],
): Entrada[] {
  const salida: Entrada[] = [];
  for (const t of textos) {
    const claves = Object.keys(t.valor);
    for (const idioma of idiomas)
      if (!claves.includes(idioma))
        salida.push({ doc, fase: 2, regla, ruta: `${t.ruta}/${idioma}`, id: t.id, idioma, mensaje: `falta el texto en «${idioma}»` });
    for (const clave of claves)
      if (!idiomas.includes(clave))
        salida.push({ doc, fase: 2, regla, ruta: `${t.ruta}/${clave}`, id: t.id, idioma: clave, mensaje: `idioma no declarado por la gramática: «${clave}»` });
  }
  return salida;
}
