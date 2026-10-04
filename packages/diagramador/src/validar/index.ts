// `validate(map, grammar, { mode, coverage?, texts?, queryDate? })` y `validateGrammar(grammar)` (CONTRATO § 7, § 8).
// Dos fases: la forma (esquema) y las reglas en código; la fase 2 solo corre si pasa la fase 1, y las
// reglas del mapa solo corren sobre una gramática sana.
import type { TextosMotor } from "../layout/tipos";
import type { Gramatica, Mapa } from "../tipos";
import { esquemaGramatica, esquemaMapa } from "./esquema";
import { informe, type Entrada, type Informe } from "./informe";
import { reglasGramatica } from "./reglas-gramatica";
import { reglasMapa, type Cobertura, type Modo } from "./reglas-mapa";
import { avisosV16 } from "./v16";

export type { Cobertura, Modo };
export type { Entrada, Informe } from "./informe";

export function validateGrammar(grammar: unknown): Informe {
  const fase1 = esquemaGramatica(grammar);
  if (fase1.length) return informe(fase1);
  return informe(reglasGramatica(grammar as Gramatica));
}

export interface OpcionesValidar {
  mode: Modo;
  /** Cobertura de la tabla de métricas (V15). Sin ella, V15 no corre y el informe lo declara. */
  coverage?: Cobertura;
  /** Cadenas de interfaz para dibujar (V16). Sin ellas, V16 no corre y el informe lo declara. */
  texts?: Record<string, TextosMotor>;
  /** «Hoy» de las cuatro edades de V16 (AAAA-MM-DD); si falta, la verificación más reciente del mapa. */
  queryDate?: string;
}

export function validate(map: unknown, grammar: unknown, options: OpcionesValidar): Informe {
  const gramatica = esquemaGramatica(grammar);
  const mapa = esquemaMapa(map);
  if (gramatica.length || mapa.length) return informe([...gramatica, ...mapa]);
  const g2 = reglasGramatica(grammar as Gramatica);
  if (g2.length) return informe(g2);
  const { errores, alertas, avisos } = reglasMapa(map as Mapa, grammar as Gramatica, options);
  // V16 (0.4.0): solo sobre un mapa sin errores (dibujar uno roto no dice nada nuevo). En publicación, todo aviso
  // de geometría es error; en privado se informa sin rechazar.
  if (!errores.length) {
    const m = map as Mapa;
    const v16 = (mensaje: string): Entrada => ({ doc: "mapa", fase: 2, regla: "V16", ruta: "", id: m.sujeto_id, mensaje });
    // Sin las cadenas de interfaz no se puede dibujar: en publicación eso rechaza (§ 7: el validador dibuja); en
    // privado se informa.
    if (!options.texts) (options.mode === "publicacion" ? errores : avisos).push(v16("V16 no corrió: no se entregaron las cadenas de interfaz para dibujar (texts)"));
    else {
      const dibujo = avisosV16(m, grammar as Gramatica, { texts: options.texts, queryDate: options.queryDate });
      (options.mode === "publicacion" ? errores : avisos).push(...dibujo.map(v16));
    }
  }
  return informe(errores, alertas, avisos);
}
