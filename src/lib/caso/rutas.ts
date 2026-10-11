import type { Textos } from "@/lib/i18n";

// Rutas de las secciones Conocimiento y Caso, y sus pestañas (D-S3-16: el mismo componente que los niveles del atlas,
// numeradas 05–10 como en la maqueta). Una pestaña sin ruta es una pantalla que todavía no existe en el producto: se
// muestra pendiente, sin enlace (jamás un control que no hace nada).

export const rutaBase = (idioma: string) => `/${idioma}/base`;
export const rutaCaso = (idioma: string, caso: string) => `/${idioma}/casos/${caso}`;
export const rutaComparacion = (idioma: string, caso: string) => `${rutaCaso(idioma, caso)}/comparacion`;

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

export function pestanasCaso(t: Textos["secciones"], idioma: string, caso: string, actual: "perfil" | "comparacion"): Pestana[] {
  return [
    { n: "07", texto: t.perfil, ruta: rutaCaso(idioma, caso), actual: actual === "perfil" },
    { n: "08", texto: t.comparacion, ruta: rutaComparacion(idioma, caso), actual: actual === "comparacion" },
    { n: "09", texto: t.decisiones },
    { n: "10", texto: t.informe },
  ];
}
