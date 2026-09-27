// `validate(map, grammar, { mode, coverage? })` y `validateGrammar(grammar)` (CONTRATO § 7, § 8).
// Dos fases: la forma (esquema) y las reglas en código; la fase 2 solo corre si pasa la fase 1, y las
// reglas del mapa solo corren sobre una gramática sana.
import type { Gramatica, Mapa } from "../tipos";
import { esquemaGramatica, esquemaMapa } from "./esquema";
import { informe, type Informe } from "./informe";
import { reglasGramatica } from "./reglas-gramatica";
import { reglasMapa, type Cobertura, type Modo } from "./reglas-mapa";

export type { Cobertura, Modo };
export type { Entrada, Informe } from "./informe";

export function validateGrammar(grammar: unknown): Informe {
  const fase1 = esquemaGramatica(grammar);
  if (fase1.length) return informe(fase1);
  return informe(reglasGramatica(grammar as Gramatica));
}

export function validate(map: unknown, grammar: unknown, options: { mode: Modo; coverage?: Cobertura }): Informe {
  const gramatica = esquemaGramatica(grammar);
  const mapa = esquemaMapa(map);
  if (gramatica.length || mapa.length) return informe([...gramatica, ...mapa]);
  const g2 = reglasGramatica(grammar as Gramatica);
  if (g2.length) return informe(g2);
  const { errores, alertas, avisos } = reglasMapa(map as Mapa, grammar as Gramatica, options);
  return informe(errores, alertas, avisos);
}
