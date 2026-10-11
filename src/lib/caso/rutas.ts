import type { Textos } from "@/lib/i18n";

// Rutas de las secciones Conocimiento y Caso, y sus pestañas (D-S3-16: el mismo componente que los niveles del atlas,
// numeradas 05–10 como en la maqueta). Una pestaña sin ruta es una pantalla que todavía no existe en el producto: se
// muestra pendiente, sin enlace (jamás un control que no hace nada).

export const rutaBase = (idioma: string) => `/${idioma}/base`;
export const rutaInstrumento = (idioma: string) => `/${idioma}/instrumento`;
export const rutaCaso = (idioma: string, caso: string) => `/${idioma}/casos/${caso}`;
export const rutaComparacion = (idioma: string, caso: string) => `${rutaCaso(idioma, caso)}/comparacion`;
export const rutaDecisiones = (idioma: string, caso: string) => `${rutaCaso(idioma, caso)}/decisiones`;

export interface Pestana {
  n: string;
  texto: string;
  ruta?: string;
  actual?: boolean;
}

export function pestanasConocimiento(t: Textos["secciones"], idioma: string, investigador: string, actual: "investigador" | "base"): Pestana[] {
  return [
    { n: "05", texto: t.investigador, ruta: investigador, actual: actual === "investigador" },
    { n: "06", texto: t.base, ruta: rutaBase(idioma), actual: actual === "base" },
  ];
}

export function pestanasCaso(t: Textos["secciones"], idioma: string, caso: string, actual: "perfil" | "comparacion" | "decisiones", conDecisiones = true): Pestana[] {
  return [
    { n: "07", texto: t.perfil, ruta: rutaCaso(idioma, caso), actual: actual === "perfil" },
    { n: "08", texto: t.comparacion, ruta: rutaComparacion(idioma, caso), actual: actual === "comparacion" },
    // Un caso sin plan (data/casos/<caso>/plan/) no tiene la pantalla 09: la pestaña queda pendiente, sin enlace.
    { n: "09", texto: t.decisiones, ...(conDecisiones ? { ruta: rutaDecisiones(idioma, caso), actual: actual === "decisiones" } : {}) },
    { n: "10", texto: t.informe },
  ];
}
