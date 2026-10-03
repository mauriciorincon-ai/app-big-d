import { compare, toBlockCards, toLegend, toSVG, toText, type Geometria, type Gramatica, type Mapa } from "diagramador";
import type { Datos } from "@/lib/datos";
import { textos, type Idioma } from "@/lib/i18n";
import { ATRIBUTO_ELEGIDAS, ATRIBUTO_VISIBLES, POR_PAGINA, scriptLado } from "./estado-lado";
import { plantilla, plural } from "./plantilla";
import { esc, fichas, ID_LECTURA, ID_PISTA, textosMotor, ventanas } from "./vistas";

// El lado a lado del atlas (`/[idioma]/comparar`), listo para su página. Todo sale del diagramador en el BUILD:
// la cabecera de bandas (`compare`, parte «header») y, por plataforma publicada, su fila en dos variantes —sus
// bloques, y todos sus componentes desplegados— (`compare([mapa])`, parte «rows»). El botón de la página alterna
// entre las dos (D-S2-07, simplificado tras la mirada M1: «un solo botón despliega todo y contrae todo»); la
// propiedad «cada fila sola es su fila de la comparación entera» la prueba el paquete. Las plataformas sin mapa
// son filas «próximamente», sin contenido inventado. La vista de teléfono (una banda a la vez) agrupa como el
// motor: lee los bloques compactos que dibujó.

export { POR_PAGINA };

export interface FilaLado {
  id: string;
  nombre: string;
  /** Solo las publicadas: la fila con sus bloques (n1) y con todos sus componentes (n2). */
  n1?: string;
  n2?: string;
  version?: string;
  /** Página del investigador de la plataforma (el «próximamente» enlaza ahí). */
  investigador: string;
}

export interface ElementoAngosto {
  /** El mismo `data-dueno` que en el dibujo: `<plataforma>/<bloque>`. */
  id: string;
  nombre: string;
  /** «3 comp. · vista previa». */
  resumen: string;
  /** El glifo del tipo del bloque (el de su primer componente, § 4.1), tal como lo dibuja el motor en su tarjeta. */
  glifo: string;
  /** Sus componentes como tarjetas de texto (`toBlockCards`, las mismas de la ventana del nivel 1). */
  tarjetas: string;
}

export interface CeldaAngosta {
  plataforma: string;
  nombre: string;
  pronto: boolean;
  elementos: ElementoAngosto[];
}

export interface BandaAngosta {
  id: string;
  numero: string;
  nombre: string;
  pregunta: string;
  celdas: CeldaAngosta[];
}

export interface VistaLado {
  /** Todas las plataformas, en orden de id. */
  ids: string[];
  porPagina: number;
  cabecera: string;
  filas: FilaLado[];
  /** Índice de bandas del lienzo deslizable: x en px del SVG (1 u = 1 px). */
  columnas: { banda: string; x: number; numero: string; nombre: string }[];
  angosto: BandaAngosta[];
  /** Ventana de cada bloque y ficha de cada componente, por su `data-dueno`; y el título del panel de cada una. */
  fichas: Record<string, string>;
  titulos: Record<string, string>;
  lectura: string;
  leyenda: string;
  /** Reglas generadas: qué filas muestra cada estado del `<html>` y dónde va la guía de las franjas. */
  css: string;
  /** Script previo al pintado: el estado de la URL en el `<html>` (estado-lado.ts). */
  script: string;
}

type Elemento = Geometria["escena"][number];

const ordenar = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** Un aviso de geometría rompe el build: el lado a lado publicado no sale con textos que no caben (V16 ya lo exige). */
function sinAvisos(geo: Geometria, que: string): Geometria {
  if (geo.avisos.length) throw new Error(`lado a lado, ${que}: avisos de geometría\n${geo.avisos.map((a) => a.mensaje).join("\n")}`);
  return geo;
}

/** La x de la guía que separa capas y franjas en la cabecera (la dibuja el motor; la página la sigue entre filas). */
function xGuia(escena: readonly Elemento[]): number | undefined {
  for (const e of escena) {
    if (e.attrs.class === "dg-guia") return Number(/^M(-?[\d.]+),/.exec(String(e.attrs.d))?.[1]);
    const dentro = e.hijos && xGuia(e.hijos);
    if (dentro !== undefined) return dentro;
  }
  return undefined;
}

/**
 * Los elementos de cada banda en una fila, en el orden en que el motor los dibujó (los bloques compactos de la
 * variante n1: `cajas` de clase «bloque», con id `<prefijo>/<elemento>`).
 */
function elementos(geo: Geometria, mapa: Mapa, g: Gramatica): Map<string, { id: string; nodos: Mapa["nodos"] }[]> {
  const porBanda = new Map<string, { id: string; nodos: Mapa["nodos"] }[]>(g.bandas.map((b) => [b.id, []]));
  for (const c of geo.cajas) {
    if (c.clase !== "bloque") continue;
    const id = c.id.slice(c.id.indexOf("/") + 1);
    const bloque = mapa.bloques.find((b) => b.id === id);
    const banda = bloque ? bloque.banda_id : id.slice(1);
    const nodos = bloque
      ? mapa.nodos.filter((n) => n.bloque_id === id)
      : mapa.nodos.filter((n) => n.banda_id === banda && !mapa.bloques.some((b) => b.id === n.bloque_id));
    porBanda.get(banda)!.push({ id, nodos });
  }
  return porBanda;
}

export function vistaLado(d: Datos, idioma: Idioma, fechaConsulta: string): VistaLado {
  const tm = textosMotor();
  const t = textos(idioma);
  const plataformas = ordenar(d.plataformas);
  const publicadas = plataformas.flatMap((p) => d.atlas.get(p.id) ?? []);
  const primera = publicadas[0];
  if (!primera) throw new Error("lado a lado: no hay ninguna plataforma publicada que comparar");
  const g = primera.gramatica;
  const mapas = publicadas.map((a) => a.mapa);
  const enDos = Object.fromEntries(g.bandas.map((b) => [b.id, 2 as const]));
  const opciones = { texts: tm, queryDate: fechaConsulta };

  const geoCabecera = sinAvisos(compare(mapas, g, { ...opciones, levelByBand: {}, part: "header" }), "cabecera");
  const filas: FilaLado[] = [];
  const angosto: BandaAngosta[] = [];
  const fichasLado: Record<string, string> = {};
  const titulos: Record<string, string> = {};
  const porPlataforma = new Map<string, Map<string, { id: string; nodos: Mapa["nodos"] }[]>>();
  const columna = new Map(geoCabecera.columnas.map((c) => [c.banda, c]));
  // Las bandas en el orden de las columnas del motor (capas y luego franjas), el mismo en el teléfono.
  const bandas = geoCabecera.columnas.map((c) => g.bandas.find((b) => b.id === c.banda)!);

  for (const p of plataformas) {
    const investigador = `/${idioma}/investigador/${p.id}`;
    const a = d.atlas.get(p.id);
    if (!a) {
      filas.push({ id: p.id, nombre: p.nombre[idioma], investigador });
      continue;
    }
    const svg = (geo: Geometria) => toSVG(geo, { language: idioma, textId: `${ID_LECTURA}-${p.id}`, hintId: ID_PISTA });
    const n1 = sinAvisos(compare([a.mapa], g, { ...opciones, levelByBand: {}, part: "rows" }), `${p.id} · bloques`);
    const n2 = sinAvisos(compare([a.mapa], g, { ...opciones, levelByBand: enDos, part: "rows" }), `${p.id} · desplegado`);
    filas.push({ id: p.id, nombre: p.nombre[idioma], version: a.mapa.version, n1: svg(n1), n2: svg(n2), investigador });
    const grupos = elementos(n1, a.mapa, g);
    porPlataforma.set(p.id, grupos);
    const pre = a.mapa.sujeto_id;
    // Ventana de cada bloque, con la banda y la plataforma arriba (en el lado a lado no se ven en la ficha).
    const ojo = (id: string) => {
      const b = [...grupos].find(([, es]) => es.some((e) => e.id === id))![0];
      const c = columna.get(b)!;
      return `<p class="dg-ficha-tipo"><span class="dg-ficha-cod">${esc(c.numero)}</span>${esc(plantilla(t.atlas.lado.ventanaDe, { banda: c.nombre[idioma]!, plataforma: p.nombre[idioma] }))}</p>`;
    };
    const ids = [...grupos.values()].flat().map((e) => e.id);
    // Un grupo sin bloque de un solo componente se dibuja con el nombre del componente: su ventana se titula igual.
    const nombrar = (id: string) => {
      const solo = [...grupos.values()].flat().find((e) => e.id === id)!;
      return id.startsWith("_") && solo.nodos.length === 1 ? solo.nodos[0]!.nombre[idioma] : undefined;
    };
    for (const [id, html] of Object.entries(ventanas(a, idioma, fechaConsulta, ids, ojo, nombrar))) {
      fichasLado[`${pre}/${id}`] = html;
      titulos[`${pre}/${id}`] = t.atlas.ventana.titulo;
    }
    for (const [id, html] of Object.entries(fichas(a, idioma, fechaConsulta))) {
      fichasLado[`${pre}/${id}`] = html;
      titulos[`${pre}/${id}`] = t.atlas.ficha.titulo;
    }
  }

  for (const b of bandas) {
    const c = columna.get(b.id)!;
    angosto.push({
      id: b.id,
      numero: c.numero,
      nombre: b.nombre[idioma]!,
      pregunta: b.pregunta_lider[idioma]!,
      celdas: plataformas.map((p) => {
        const a = d.atlas.get(p.id);
        const es = porPlataforma.get(p.id)?.get(b.id) ?? [];
        return {
          plataforma: p.id,
          nombre: p.nombre[idioma],
          pronto: !a,
          elementos: es.map((e) => {
            const bloque = a!.mapa.bloques.find((x) => x.id === e.id);
            const nombre = bloque ? bloque.nombre[idioma]! : e.nodos.length === 1 ? e.nodos[0]!.nombre[idioma]! : tm[idioma]!.sinBloque;
            const peor = [...e.nodos]
              .map((n) => g.escala_madurez.find((m) => m.id === n.madurez)!)
              .sort((x, y) => x.nivel - y.nivel || (x.id < y.id ? -1 : 1))[0];
            const cuenta = plantilla(tm[idioma]!.lado.comp[e.nodos.length === 1 ? "one" : "other"], { n: e.nodos.length });
            const tarjetas = toBlockCards(a!.mapa, g, e.id, { language: idioma, texts: tm, queryDate: fechaConsulta });
            return {
              id: `${a!.mapa.sujeto_id}/${e.id}`,
              nombre,
              resumen: peor && !peor.disponible ? `${cuenta} · ${(peor.etiqueta_corta ?? peor.nombre)[idioma]}` : cuenta,
              glifo: /^<div[^>]*><article[^>]*><p class="dg-ficha-tipo">(<svg[^>]*>[\s\S]*?<\/svg>)/.exec(tarjetas)?.[1] ?? "",
              tarjetas,
            };
          }),
        };
      }),
    });
  }

  // La lectura de cada plataforma, dentro de una raíz con el id al que apunta la cabecera (G10: todo SVG enlaza su texto).
  const lectura = `<div id="${ID_LECTURA}">${publicadas
    .map((a) => `<section class="lado-lectura"><h2>${esc(a.plataforma.nombre[idioma])}</h2>${toText(a.mapa, g, { language: idioma, texts: tm, id: `${ID_LECTURA}-${a.plataforma.id}`, queryDate: fechaConsulta })}</section>`)
    .join("")}</div>`;
  const guia = xGuia(geoCabecera.escena);
  const ids = plataformas.map((p) => p.id);
  const css = [
    ...ids.map((id) => `:root[${ATRIBUTO_VISIBLES}~="${id}"] .lado-fila[data-fila="${id}"]{display:block}`),
    ...ids.map((id) => `:root[${ATRIBUTO_ELEGIDAS}~="${id}"] .lado-pl[data-pl="${id}"]{display:grid}`),
    // Las filas miden lo que el dibujo: una página con solo filas «próximamente» no se encoge a su texto.
    `.lado-filas{width:${geoCabecera.ancho / 10}px}`,
    ...(guia === undefined ? [] : [`.lado-filas::before{left:${guia}px}`]),
  ].join("\n");

  return {
    ids,
    porPagina: POR_PAGINA,
    cabecera: toSVG(geoCabecera, { language: idioma, textId: ID_LECTURA }),
    filas,
    columnas: geoCabecera.columnas.map((c) => ({ banda: c.banda, x: c.x / 10, numero: c.numero, nombre: c.nombre[idioma]! })),
    angosto,
    fichas: fichasLado,
    titulos,
    lectura,
    leyenda: toLegend(g, { language: idioma, texts: tm }),
    css,
    script: scriptLado(ids, POR_PAGINA),
  };
}

/** «Cuatro plataformas, el mismo mapa»: el número en palabras si la lista lo trae; si no, en cifras. */
export function tituloLado(idioma: Idioma, n: number): string {
  const t = textos(idioma).atlas.lado;
  return plural(t.h1, n).replace(String(n), t.numeros[n] ?? String(n));
}

export function rutaLado(idioma: string): string {
  return `/${idioma}/comparar`;
}

