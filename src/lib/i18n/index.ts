import { en } from "./en";
import { es } from "./es";
import type { Textos } from "./tipos";

export type { Textos };

// Idiomas de la interfaz, en el orden en que se ofrecen. Agregar uno es agregar su diccionario aquí.
export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

const DICCIONARIOS: Record<Idioma, Textos> = { es, en };

export const esIdioma = (valor: string): valor is Idioma => (IDIOMAS as readonly string[]).includes(valor);

export function textos(idioma: Idioma): Textos {
  return DICCIONARIOS[idioma];
}

/** Nombre de cada idioma escrito en su propio idioma (para el conmutador). */
export const NOMBRE_PROPIO: Record<Idioma, string> = { es: "Español", en: "English" };

/** La misma ruta en otro idioma: cambia solo el primer segmento (`/es/atlas/x` → `/en/atlas/x`). */
export function rutaEnIdioma(ruta: string, destino: Idioma): string {
  const partes = ruta.split("/");
  if (partes.length > 1 && esIdioma(partes[1] ?? "")) partes[1] = destino;
  else return `/${destino}`;
  return partes.join("/") || `/${destino}`;
}
