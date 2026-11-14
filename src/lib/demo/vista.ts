import {
  decimasDe,
  lista,
  ordinal,
  peso,
  puntos,
  brecha,
} from "@/lib/caso/formato";
import { plantilla } from "@/lib/atlas/plantilla";
import type { Idioma } from "@/lib/i18n";
import type { RespuestaDemo } from "./protocolo";
import type { TextosDemo } from "@/lib/i18n/demo";

// S10 (F2): lo que la demo escribe de una respuesta del núcleo. La MISMA función arma la página en el build (con la respuesta
// que da Node) y la actualiza en el navegador (con la del Worker): sin dos maneras de escribir un número.

export interface FilaVista {
  plataforma_id: string;
  nombre: string;
  puesto: string;
  /** El total en décimas de punto (0 a 1000), para el medidor. */
  decimas: number;
  total: string;
}

export interface Vista {
  filas: FilaVista[];
  veredicto: string;
}

export interface Contexto {
  idioma: Idioma;
  t: TextosDemo;
  nombres: Record<string, string>;
  umbralCentesimas: number;
}

export function vistaDe(
  r: RespuestaDemo,
  { idioma, t, nombres, umbralCentesimas }: Contexto,
): Vista {
  if (r.tipo === "error")
    return {
      filas: [],
      veredicto: plantilla(t.veredicto.error, { mensaje: r.mensaje }),
    };
  if (r.tipo === "no-evaluable")
    return { filas: [], veredicto: t.veredicto.noEvaluable };
  const nombre = (id: string) => nombres[id] ?? id;
  const filas = r.filas.map((f) => ({
    plataforma_id: f.plataforma_id,
    nombre: nombre(f.plataforma_id),
    puesto: ordinal(f.posicion, idioma),
    decimas: decimasDe(f.unidades, r.max),
    total: plantilla(t.deCien, { puntos: puntos(f.unidades, r.max, idioma) }),
  }));
  const v = r.veredicto;
  const veredicto =
    v.tipo === "unica"
      ? plantilla(t.veredicto.unica, { nombre: nombre(v.plataforma_id) })
      : v.tipo === "ganadora-clara"
        ? plantilla(t.veredicto.clara, {
            nombre: nombre(v.plataforma_id),
            brecha: brecha(v.brecha_unidades, r.max, idioma),
          })
        : plantilla(t.veredicto.empate, {
            nombres: lista(v.plataformas.map(nombre), t.y),
            umbral: peso(umbralCentesimas, idioma),
          });
  return { filas, veredicto };
}

/** Un peso en centésimas escrito como parte de 100 puntos: 1800 → «18». */
export const pesoEscrito = (c: number, idioma: Idioma) => peso(c, idioma);
