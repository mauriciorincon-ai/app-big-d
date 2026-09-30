// Un «grupo» es un elemento activable del nivel 1: un bloque (su id) o los nodos de una banda que no tienen
// bloque («_<banda>», el `data-dueno` que el nivel 1 les da). Lo usan la vista «bloque» y `toBlockCards`.
import type { Gramatica, Mapa, Nodo } from "../tipos";
import { ordenarPor } from "./orden";

/** Sus nodos, en el orden de su banda (`orden`, después id). Falla con el id si el grupo no existe. */
export function nodosDelGrupo(map: Mapa, grammar: Gramatica, grupo: string): Nodo[] {
  const deBanda = (banda: string) => ordenarPor(map.nodos.filter((n) => n.banda_id === banda), (n) => n.orden ?? Number.MAX_SAFE_INTEGER, (n) => n.id);
  if (grupo.startsWith("_")) {
    const banda = grupo.slice(1);
    if (!grammar.bandas.some((b) => b.id === banda)) throw new Error(`grupo: la gramática no tiene la banda «${banda}»`);
    const bloques = new Set(map.bloques.map((b) => b.id));
    return deBanda(banda).filter((n) => !n.bloque_id || !bloques.has(n.bloque_id));
  }
  const bloque = map.bloques.find((b) => b.id === grupo);
  if (!bloque) throw new Error(`grupo: el mapa no tiene el bloque «${grupo}»`);
  return deBanda(bloque.banda_id).filter((n) => n.bloque_id === grupo);
}

/** Su nombre por idioma: el del bloque, o el de la banda para los nodos sin bloque. */
export function nombreDelGrupo(map: Mapa, grammar: Gramatica, grupo: string): Record<string, string> {
  if (grupo.startsWith("_")) return grammar.bandas.find((b) => b.id === grupo.slice(1))!.nombre;
  return map.bloques.find((b) => b.id === grupo)!.nombre;
}
