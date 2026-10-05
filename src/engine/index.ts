// El núcleo determinista de Big-D (regla dura 1): puro, entero, sin reloj ni azar, sin Zod y sin `node:crypto`. Corre
// igual en Node (el build, las pruebas) y en el navegador (la pantalla de comparación, el Worker de la simulación).
export { alertasDe } from "./alertas";
export { canonicoEstricto } from "./canonico";
export { evaluar } from "./evaluar";
export { prosContras } from "./pros-contras";
export { celda, descartes, limitantes, ordenar, topeDe, veredicto } from "./puntaje";
export { comparar, racional, type Racional } from "./racional";
export { PUESTOS_VIGILADOS, sensibilidadDe, TOTAL, totalesCon } from "./sensibilidad";
export type * from "./tipos";
export { diasEntre, estadoVigencia, type EstadoVigencia } from "./vigencia";
export { CASOS_DE_REFERENCIA, correrReferencia, resumen, type CasoDeReferencia, type Resumen } from "./referencia";
