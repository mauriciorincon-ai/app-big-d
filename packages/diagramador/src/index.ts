// Diagramador — API pública (CONTRATO v0.3.0 § 8). Funciones puras: sin I/O, sin reloj, sin red.
export { CONTRATO_VERSION } from "./version";
export { validate, validateGrammar } from "./validar";
export type { Cobertura, Entrada, Informe, Modo } from "./validar";
export { layout } from "./layout";
export type { Caja, CajaPropia, Geometria, OpcionesLayout, PasoGeo, Punto, TextosMotor, Trazado, Vigencia, Vista } from "./layout/tipos";
export { toSVG, type OpcionesSVG } from "./svg/toSVG";
export { toJourneyCSS } from "./svg/recorridoCSS";
export { toLegend } from "./svg/leyenda";
export { toText, type OpcionesTexto } from "./texto/toText";
export { toCard, type OpcionesFicha } from "./texto/toCard";
export { diff, type Diferencias } from "./diff";
export { crossings, type Cruce } from "./layout/d11";
export { coberturaDeRangos } from "./texto/cobertura";
export { METRICAS_PILOTO, type TablaMetricas } from "./texto/metricas";
export type * from "./tipos";
