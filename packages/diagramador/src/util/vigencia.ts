// Vigencia (§ 4.8) en un solo lugar: el estado a N días de la verificación, con los umbrales de la gramática,
// y la frase de la lectura. El dibujo, la lectura, la ficha y las tarjetas de la ventana la comparten (B-40 de
// la auditoría del S1: el mismo par de umbrales estaba escrito cuatro veces).
import { plantilla } from "../layout/escena";
import type { TextosMotor, Vigencia } from "../layout/tipos";
import type { Gramatica } from "../tipos";
import { diasEntre } from "./fechas";

export function estadoVigencia(grammar: Gramatica, dias: number): Vigencia {
  const v = grammar.vigencia;
  return dias >= v.umbral_vencido_dias ? "vencido" : dias >= v.umbral_revisar_dias ? "revisar" : "vigente";
}

/** «Por revisar: verificado hace N días.» o «Vencido: …»; vacía si está vigente o si no hay fecha de consulta. */
export function fraseVigencia(grammar: Gramatica, t: TextosMotor, verificada: string, consulta: string | undefined): string {
  if (!consulta) return "";
  const dias = diasEntre(verificada, consulta);
  const estado = estadoVigencia(grammar, dias);
  return estado === "vigente" ? "" : plantilla(estado === "vencido" ? t.vencido : t.porRevisar, { n: dias });
}
