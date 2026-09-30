// El idioma pedido a una salida de texto: tiene que estar en la gramática (sus textos son mapas de idioma) y
// en las cadenas de interfaz. B-39 de la auditoría del S1: con un idioma que la gramática no declara, las
// salidas de texto terminaban en un `TypeError` sin decir por qué; ahora dicen qué falta, como `toSVG`.
import type { TextosMotor } from "../layout/tipos";
import type { Gramatica } from "../tipos";

export function idiomaPedido(quien: string, grammar: Gramatica, language: string, textos: Record<string, TextosMotor>): TextosMotor {
  if (!grammar.idiomas.includes(language)) throw new Error(`${quien}: la gramática no declara el idioma «${language}»`);
  const t = textos[language];
  if (!t) throw new Error(`${quien}: faltan las cadenas de interfaz en «${language}»`);
  return t;
}
