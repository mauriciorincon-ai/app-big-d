// Punto de entrada del investigador para los scripts (empaquetado con esbuild) y la app.
export { aprobar, ErrorDeAprobacion, type Entrada } from "./aprobar";
export {
  aprobarCaso,
  ErrorDeAprobacionDeCaso,
  esquemaRevisionCaso,
  type RevisionCaso,
} from "./aprobar-caso";
export { comandoAprobar, leerDecisiones } from "./comando";
export {
  aprobarPlan,
  ErrorDeAprobacionDePlan,
  esquemaRevisionPlan,
  type RevisionPlan,
} from "./aprobar-plan";
export {
  comandoAprobarCaso,
  leerAprobacionCaso,
  problemasDelPerfil,
} from "./comando-caso";
export { comandoAprobarPlan, leerAprobacionPlan } from "./comando-plan";
export { aplicarDecisiones, sinAfirmacion } from "./decisiones";
export * from "./esquema";
export {
  APROBADA_POR,
  aprobarEvidencias,
  citasDe,
  claveCita,
  componentesDeMapas,
  contextoDe,
  esPropuestaDeEvidencias,
  esquemaPropuestaEvidencias,
  esquemaRevisionEvidencias,
  resultadoDe,
  validarPropuestaEvidencias,
  type ContextoEvidencias,
  type PropuestaEvidencias,
  type RevisionEvidencias,
} from "./evidencias";
export { canonico, huella, sha256 } from "./huella";
export { argumentosDeRetiro, retirosDe, type Argumento } from "./retiros";
export { htmlATexto, normalizar, TEXTO_MINIMO, verificarCita } from "./texto";
export { validarPropuesta } from "./validar";
