// El contrato Worker ↔ UI de la simulación (D-S3-08, regla 19). `atender` es una función PURA que el Worker
// (src/workers/simulacion.worker.ts) recorre paso a paso y que el script del fixture
// (scripts/nucleo/fixture-simulacion.mjs) recorre de una vez: los dos emiten exactamente los mismos mensajes. La UI los
// lee con estos tipos y una guarda estructural (sin Zod en el navegador); Vitest valida el fixture con Zod.

import { avanzar, iniciar, resultadoDe, type EntradaSimulacion, type ResultadoSimulacion } from "./simulacion";

export type Peticion = { tipo: "simular"; id: number; entrada: EntradaSimulacion; paso: number } | { tipo: "cancelar"; id: number };

export type Respuesta =
  | { tipo: "progreso"; id: number; semilla: number; indice: number; semillas: number; aceptadas: number; objetivo: number; intentos: number }
  | { tipo: "resultado"; id: number; resultado: ResultadoSimulacion }
  | { tipo: "error"; id: number; mensaje: string };

/** Los mensajes que responde una petición de simulación: el progreso tras cada paso y, al final, el resultado. */
export function* atender(p: Extract<Peticion, { tipo: "simular" }>): Generator<Respuesta> {
  let s;
  try {
    s = iniciar(p.entrada);
  } catch (e) {
    yield { tipo: "error", id: p.id, mensaje: (e as Error).message };
    return;
  }
  while (!s.fin) {
    avanzar(s, p.paso);
    if (!s.fin) yield { tipo: "progreso", id: p.id, semilla: p.entrada.semillas[s.indice]!, indice: s.indice, semillas: p.entrada.semillas.length, aceptadas: s.aceptadas, objetivo: p.entrada.aceptadas, intentos: s.intentos };
  }
  yield { tipo: "resultado", id: p.id, resultado: resultadoDe(s) };
}
