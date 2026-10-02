import { layout, pasoPrevio, toBlockCards, toCard, toJourneyCSS, toLegend, toSVG, toText, type Geometria, type TextosMotor, type Vigencia, type Vista } from "diagramador";
import type { Atlas, Datos } from "@/lib/datos";
import { IDIOMAS, textos, type Idioma, type Textos } from "@/lib/i18n";
import { plantilla, plural } from "./plantilla";

// Las vistas del atlas de una plataforma, listas para sus páginas. Todo sale del diagramador en el BUILD
// (SVG, leyenda, lectura en texto, fichas y CSS de los pasos); la app solo arma la píldora de vigencia con el
// resumen que el motor calculó (§ 4.8: la misma regla que dibuja las insignias). Si un dibujo trae avisos de
// geometría, el build se detiene: un mapa publicado no sale con etiquetas que no caben ni textos fuera de su
// caja.

/** Destino de «Saltar el diagrama» (la sección plegada) y raíz de la lectura (aria-details del SVG). */
export const ID_SECCION_LECTURA = "lectura";
export const ID_LECTURA = "lectura-texto";
/** Pista que describen los elementos activables (A-29): qué hace Enter. */
export const ID_PISTA = "pista-activar";
/** Contenedor del recorrido: el controlador cambia su `data-paso` y el CSS generado hace el resto. */
export const ID_RECORRIDO = "rec";

export type Nivel = "general" | "componentes" | "recorrido";

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

/** `unidad`: qué se cuenta por revisar — bloques en el nivel 1, componentes en el 2 y el recorrido. */
export function pildora(v: Geometria["vigencia"], t: Textos["atlas"]["vigencia"], unidad: "bloques" | "componentes" = "bloques"): Pildora {
  if (v.estado === "vigente") return { estado: v.estado, resumen: t.vigente, detalle: plural(t.verificadoHace, v.dias) };
  const cuenta = (e: Vigencia) => v.elementos.filter((x) => x.estado === e).length;
  const revisar = cuenta("revisar");
  const vencidos = cuenta("vencido");
  const resumen = vencidos
    ? [plural(t.vencidos, vencidos), ...(revisar ? [plantilla(t.porRevisar, { n: revisar })] : [])].join(" · ")
    : plural(unidad === "bloques" ? t.bloquesPorRevisar : t.componentesPorRevisar, revisar);
  return { estado: v.estado, resumen, detalle: plural(t.masViejo, v.dias) };
}

export interface VistaAtlas {
  svg: string;
  lectura: string;
  /** Índice de capas del lienzo deslizable: x en px del SVG (1 u = 1 px). */
  columnas: { banda: string; x: number; numero: string; nombre: string }[];
  capas: number;
  franjas: number;
  pildora: Pildora;
}

function disponer(atlas: Atlas, idioma: Idioma, fechaConsulta: string, vista: Vista): { geo: Geometria; comun: VistaAtlas } {
  const tm = textosMotor();
  const geo = layout(atlas.mapa, atlas.gramatica, vista, { texts: tm, queryDate: fechaConsulta });
  if (geo.avisos.length) throw new Error(`atlas ${atlas.plataforma.id}, ${vista}: avisos de geometría\n${geo.avisos.join("\n")}`);
  return {
    geo,
    comun: {
      svg: toSVG(geo, { language: idioma, textId: ID_LECTURA, hintId: ID_PISTA }),
      lectura: toText(atlas.mapa, atlas.gramatica, { language: idioma, texts: tm, id: ID_LECTURA, queryDate: fechaConsulta }),
      columnas: geo.columnas.map((c) => ({ banda: c.banda, x: c.x / 10, numero: c.numero, nombre: c.nombre[idioma]! })),
      capas: geo.columnas.length,
      franjas: geo.filas.length,
      pildora: pildora(geo.vigencia, textos(idioma).atlas.vigencia, vista === "nivel-1" ? "bloques" : "componentes"),
    },
  };
}

/** Las fichas de todos los nodos (§ 4.5), por id: el panel muestra la del nodo activado. */
function fichas(atlas: Atlas, idioma: Idioma, fechaConsulta: string): Record<string, string> {
  const tm = textosMotor();
  return Object.fromEntries(atlas.mapa.nodos.map((n) => [n.id, toCard(atlas.mapa, atlas.gramatica, n.id, { language: idioma, texts: tm, queryDate: fechaConsulta })]));
}

export interface VistaNivel1 extends VistaAtlas {
  leyenda: string;
  /** La ventana de cada elemento activable del nivel 1 (bloque o «_<banda>»), por su `data-dueno`. */
  ventanas: Record<string, string>;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Ventana de un elemento del nivel 1 (pedido del usuario en la mirada de Fabric): su nombre y su frase, sus
 * componentes dibujados por el motor (vista «bloque»: la tarjeta del nivel 2 y los flujos entre ellos), sus
 * tarjetas de texto (`toBlockCards`) y el paso al nivel 2. Un aviso de geometría rompe el build, como en las
 * demás vistas.
 */
function ventanas(atlas: Atlas, idioma: Idioma, fechaConsulta: string, elementos: readonly string[]): Record<string, string> {
  const tm = textosMotor();
  const t = textos(idioma).atlas.ventana;
  const componentes = rutasAtlas(atlas, idioma).componentes!;
  return Object.fromEntries(
    elementos.map((id) => {
      const geo = layout(atlas.mapa, atlas.gramatica, "bloque", { texts: tm, queryDate: fechaConsulta, group: id });
      if (geo.avisos.length) throw new Error(`atlas ${atlas.plataforma.id}, ventana ${id}: avisos de geometría\n${geo.avisos.join("\n")}`);
      const banda = id.startsWith("_") ? atlas.gramatica.bandas.find((b) => b.id === id.slice(1)) : undefined;
      const bloque = banda ? undefined : atlas.mapa.bloques.find((b) => b.id === id);
      const nombre = banda ? banda.nombre[idioma]! : bloque!.nombre[idioma]!;
      const frase = banda ? banda.pregunta_lider[idioma]! : bloque!.lider[idioma]!;
      const prefijo = `${atlas.plataforma.id}-bl-${id.replace(/^_/, "banda-")}-${idioma}`;
      // Las tarjetas de texto son la versión en texto del dibujo de la ventana (G10, B-41 de la auditoría del S1).
      const svg = toSVG(geo, { language: idioma, prefix: prefijo, textId: `${prefijo}-texto` });
      const tarjetas = toBlockCards(atlas.mapa, atlas.gramatica, id, { language: idioma, texts: tm, queryDate: fechaConsulta, id: `${prefijo}-texto` });
      return [
        id,
        `<h2>${esc(nombre)}</h2><p class="ventana-lider">${esc(frase)}</p><div class="ventana-lienzo">${svg}</div>${tarjetas}<p class="ventana-mas"><a href="${esc(componentes)}">${esc(t.verComponentes)}</a></p>`,
      ];
    }),
  );
}

export function vistaNivel1(atlas: Atlas, idioma: Idioma, fechaConsulta: string): VistaNivel1 {
  const { geo, comun } = disponer(atlas, idioma, fechaConsulta, "nivel-1");
  return {
    ...comun,
    leyenda: toLegend(atlas.gramatica, { language: idioma, texts: textosMotor() }),
    ventanas: ventanas(atlas, idioma, fechaConsulta, geo.vigencia.elementos.map((e) => e.id)),
  };
}

export interface VistaNivel2 extends VistaAtlas {
  fichas: Record<string, string>;
}

export function vistaNivel2(atlas: Atlas, idioma: Idioma, fechaConsulta: string): VistaNivel2 {
  return { ...disponer(atlas, idioma, fechaConsulta, "nivel-2").comun, fichas: fichas(atlas, idioma, fechaConsulta) };
}

export interface PasoPanel {
  id: string;
  numero: string;
  que: string;
  nodo: string;
  lider: string;
  experto: string;
  /** Si el recorrido se divide en este paso: la frase de la rama (paralela o alternativa). */
  rama?: string;
}

export interface VistaRecorrido extends VistaAtlas {
  fichas: Record<string, string>;
  titulo: string;
  /** Reglas de cada paso sobre `#rec[data-paso]` (§ 4.3), generadas del recorrido. */
  css: string;
  pasos: PasoPanel[];
}

/** El primer recorrido del mapa (el que dibuja la vista «recorrido» por defecto). */
export function vistaRecorrido(atlas: Atlas, idioma: Idioma, fechaConsulta: string): VistaRecorrido {
  const { geo, comun } = disponer(atlas, idioma, fechaConsulta, "recorrido");
  const r = geo.recorrido!;
  const dato = atlas.mapa.recorridos.find((x) => x.id === r.id)!;
  const nodo = new Map(atlas.mapa.nodos.map((n) => [n.id, n]));
  const { ramas, y } = textos(idioma).motor;
  const numero = new Map(r.pasos.map((p) => [p.id, p.numero]));
  const previo = new Map(dato.pasos.map((x, k) => [x.id, pasoPrevio(dato, k)?.id]));
  return {
    ...comun,
    fichas: fichas(atlas, idioma, fechaConsulta),
    titulo: r.titulo[idioma]!,
    css: toJourneyCSS(geo, `#${ID_RECORRIDO}`),
    pasos: r.pasos.map((p) => {
      const d = dato.pasos.find((x) => x.id === p.id)!;
      // Si el recorrido se divide aquí: la frase de la rama y los números con que sigue cada una (6a y 6b).
      const hijos = dato.pasos.filter((x) => previo.get(x.id) === p.id).map((x) => numero.get(x.id)!);
      return {
        id: p.id,
        numero: p.numero,
        que: d.que_pasa[idioma]!,
        nodo: nodo.get(p.nodo)!.nombre[idioma]!,
        lider: d.lider[idioma]!,
        experto: d.experto[idioma]!,
        ...(hijos.length > 1 ? { rama: `${ramas[d.bifurca ?? "paralela"]} ${hijos.slice(0, -1).join(", ")}${y}${hijos[hijos.length - 1]}.` } : {}),
      };
    }),
  };
}

/** Las rutas de los niveles de una plataforma; el recorrido solo si el mapa tiene uno. */
export function rutasAtlas(atlas: Atlas, idioma: string): Partial<Record<Nivel, string>> {
  const base = `/${idioma}/atlas/${atlas.plataforma.id}`;
  return { general: base, componentes: `${base}/componentes`, ...(atlas.mapa.recorridos.length ? { recorrido: `${base}/recorrido` } : {}) };
}

export interface OpcionPlataforma {
  id: string;
  nombre: string;
  /** Ruta del mismo nivel en esa plataforma (o su visión general si no lo tiene); sin ruta = «pronto». */
  ruta?: string;
}

/** Las N plataformas en orden de id para el campo «Plataforma»; las que no tienen mapa no llevan ruta. */
export function opcionesPlataforma(d: Datos, idioma: Idioma, nivel: Nivel): OpcionPlataforma[] {
  return d.plataformas.map((p) => {
    const a = d.atlas.get(p.id);
    const rutas = a ? rutasAtlas(a, idioma) : undefined;
    return { id: p.id, nombre: p.nombre[idioma], ...(rutas ? { ruta: rutas[nivel] ?? rutas.general! } : {}) };
  });
}
