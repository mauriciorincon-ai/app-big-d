import { layout, toLegend, toSVG, toText, type Geometria, type TextosMotor, type Vigencia } from "diagramador";
import type { Atlas } from "@/lib/datos";
import { IDIOMAS, textos, type Idioma, type Textos } from "@/lib/i18n";
import { plantilla, plural } from "./plantilla";

// La vista general (nivel 1) de una plataforma, lista para la página: todo sale del diagramador en el BUILD
// (SVG, leyenda y lectura en texto) y la app solo arma la píldora de vigencia con el resumen que el motor
// calculó (§ 4.8: la misma regla que dibuja las insignias). Si el dibujo trae avisos de geometría, el build
// se detiene: un mapa publicado no sale con etiquetas que no caben ni textos fuera de su caja.

/** Destino de «Saltar el diagrama» (la sección plegada) y raíz de la lectura (aria-details del SVG). */
export const ID_SECCION_LECTURA = "lectura";
export const ID_LECTURA = "lectura-texto";
/** Pista que describen los bloques activables (A-29): qué hace Enter. */
export const ID_PISTA = "pista-activar";

/** Las cadenas del motor en todos los idiomas de la interfaz (el motor exige los de la gramática). */
export function textosMotor(): Record<string, TextosMotor> {
  return Object.fromEntries(IDIOMAS.map((i) => [i, textos(i).motor]));
}

export interface Pildora {
  estado: Vigencia;
  /** «vigente» · «2 bloques por revisar» · «1 vencido · 1 por revisar». */
  resumen: string;
  /** «verificado hace 6 días» · «lo más viejo, hace 34 días». */
  detalle: string;
}

export function pildora(v: Geometria["vigencia"], t: Textos["atlas"]["vigencia"]): Pildora {
  if (v.estado === "vigente") return { estado: v.estado, resumen: t.vigente, detalle: plural(t.verificadoHace, v.dias) };
  const cuenta = (e: Vigencia) => v.elementos.filter((x) => x.estado === e).length;
  const revisar = cuenta("revisar");
  const vencidos = cuenta("vencido");
  const resumen = vencidos
    ? [plural(t.vencidos, vencidos), ...(revisar ? [plantilla(t.porRevisar, { n: revisar })] : [])].join(" · ")
    : plural(t.bloquesPorRevisar, revisar);
  return { estado: v.estado, resumen, detalle: plural(t.masViejo, v.dias) };
}

export interface VistaNivel1 {
  svg: string;
  leyenda: string;
  lectura: string;
  /** Índice de capas del lienzo deslizable: x en px del SVG (1 u = 1 px). */
  columnas: { banda: string; x: number; numero: string; nombre: string }[];
  capas: number;
  franjas: number;
  pildora: Pildora;
}

export function vistaNivel1(atlas: Atlas, idioma: Idioma, fechaConsulta: string): VistaNivel1 {
  const tm = textosMotor();
  const geo = layout(atlas.mapa, atlas.gramatica, "nivel-1", { textos: tm, fechaConsulta });
  if (geo.avisos.length) throw new Error(`atlas ${atlas.plataforma.id}, nivel 1: avisos de geometría\n${geo.avisos.join("\n")}`);
  return {
    svg: toSVG(geo, { language: idioma, textId: ID_LECTURA, hintId: ID_PISTA }),
    leyenda: toLegend(atlas.gramatica, { language: idioma, textos: tm }),
    lectura: toText(atlas.mapa, atlas.gramatica, { language: idioma, textos: tm, id: ID_LECTURA, fechaConsulta }),
    columnas: geo.columnas.map((c) => ({ banda: c.banda, x: c.x / 10, numero: c.numero, nombre: c.nombre[idioma]! })),
    capas: geo.columnas.length,
    franjas: geo.filas.length,
    pildora: pildora(geo.vigencia, textos(idioma).atlas.vigencia),
  };
}
