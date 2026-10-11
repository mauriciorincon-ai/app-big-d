// Punto de entrada del investigador para los scripts (empaquetado con esbuild) y la app.
export { aprobar, ErrorDeAprobacion, type Entrada } from "./aprobar";
export { comandoAprobar, leerDecisiones } from "./comando";
export { aplicarDecisiones, sinAfirmacion } from "./decisiones";
export * from "./esquema";
export { APROBADA_POR, aprobarEvidencias, citasDe, claveCita, componentesDeMapas, contextoDe, esPropuestaDeEvidencias, esquemaPropuestaEvidencias, esquemaRevisionEvidencias, resultadoDe, validarPropuestaEvidencias, type ContextoEvidencias, type PropuestaEvidencias, type RevisionEvidencias } from "./evidencias";
export { canonico, huella, sha256 } from "./huella";
export { argumentosDeRetiro, retirosDe, type Argumento } from "./retiros";
export { htmlATexto, normalizar, TEXTO_MINIMO, verificarCita } from "./texto";
export { validarPropuesta } from "./validar";
