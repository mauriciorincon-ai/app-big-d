// El núcleo determinista de Big-D (regla dura 1): puro, entero, sin reloj ni azar, sin Zod y sin `node:crypto`. Corre
// igual en Node (el build, las pruebas) y en el navegador (la pantalla de comparación, el Worker de la simulación).
export { alertasDe } from "./alertas";
export { canonicoEstricto } from "./canonico";
export { evaluar } from "./evaluar";
export { prosContras } from "./pros-contras";
export { celda, descartes, limitantes, ordenar, topeDe, veredicto } from "./puntaje";
export { comparar, racional, type Racional } from "./racional";
export { comparacionDe, planDe, type AlertaDelPlan, type Comparacion, type DecisionCalculada, type DecisionDelPlan, type EntradaPlan, type ModoDelPlan, type ResultadoPlan, type RiesgoCalculado, type RiesgoResidual, type SupuestoDelPlan, type TipoAlerta } from "./plan";
export { PUESTOS_VIGILADOS, sensibilidadDe, TOTAL, totalesCon } from "./sensibilidad";
export type * from "./tipos";
export { diasEntre, estadoVigencia, type EstadoVigencia } from "./vigencia";
export { contar, falladas, publicable, sembradosDetectados, type Bilingue, type Conteo, type FilaValidacion, type Validacion } from "./instrumento";
export { CASOS_DE_REFERENCIA, correrReferencia, resumen, type CasoDeReferencia, type Resumen } from "./referencia";
export { enteroMenorQue, sfc32, siguiente, type Sfc32 } from "./sfc32";
export { avanzar, entradaSimulacion, enZonaGris, iniciar, muestras, N_MAX_SIMULACION, rangoEntero, resultadoDe, semiamplitud, simular, type Clase, type EntradaSimulacion, type EstadoSimulacion, type ResultadoSemilla, type ResultadoSimulacion } from "./simulacion";
export { atender, type Peticion, type Respuesta } from "./protocolo";
