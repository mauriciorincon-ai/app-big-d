import {
  compare,
  diff,
  diffToText,
  toSVG,
  type Geometria,
  type Mapa,
} from "diagramador";
import type { Atlas, Datos } from "@/lib/datos";
import { textos, type Idioma } from "@/lib/i18n";
import { canonico } from "@/lib/investigador/canonico";
import { plantilla } from "./plantilla";
import { esc, ID_PISTA, textosMotor, ventanas } from "./vistas";

// Las versiones de un mapa (`/[idioma]/atlas/[plataforma]/versiones`, D-S2-08), listas para su página. Por cada par de
// versiones seguidas, de la más nueva a la más vieja: el lado a lado de las dos (`compare` con `marks`, § 4.7: arriba
// la anterior, abajo la nueva con una píldora glifo + palabra por clase de cambio) y la lista que explica cada
// diferencia (`diffToText`). El contrato marca lo que cambia el dibujo (componentes nuevos, retirados, renombrados o
// con otra madurez); lo que cambia solo lo que dicen —el texto de un componente, sus fuentes— lo cuenta aparte esta
// vista, para que «sin cambios en el dibujo» no se lea como «nada cambió». Los bloques de las dos filas abren su
// ventana, la de su versión. Sin versiones archivadas, `pares` va vacío (la página muestra su estado vacío).

export interface ParVersiones {
  antes: string;
  despues: string;
  /** Fecha (UTC) en que una persona aprobó la versión nueva, si consta en su revisión. */
  aprobada?: string;
  svg: string;
  /** Lista explicativa (`diffToText`); su id es el que el SVG enlaza como su versión en texto (G10). */
  diferencias: string;
  /** Componentes que siguen y cambiaron lo que dicen (líder, experto, por qué importa o términos), con su nombre nuevo. */
  textos: string[];
  /** Cuántos componentes renovaron sus fuentes. */
  fuentes: number;
}

export interface VistaVersiones {
  vigente: string;
  /** De la más nueva a la más vieja. */
  pares: ParVersiones[];
  /** Ventana de cada bloque, por su `data-dueno` (`<plataforma>-v<versión>/<bloque>`), y el título del panel. */
  fichas: Record<string, string>;
  titulos: Record<string, string>;
}

const QUE_DICE = ["lider", "experto", "por_que_importa", "terminos"] as const;

/** Un aviso de geometría rompe el build, como en las demás vistas: la página no sale con textos que no caben. */
function sinAvisos(geo: Geometria, que: string): Geometria {
  if (geo.avisos.length)
    throw new Error(
      `versiones, ${que}: avisos de geometría\n${geo.avisos.map((a) => a.mensaje).join("\n")}`,
    );
  return geo;
}

/**
 * `aprobaciones`: versión → fecha (UTC) de su aprobación, leída de data/revisiones/ por la página (esta vista no lee
 * el disco). `n` de los textos: los componentes en el orden del mapa nuevo.
 */
export function vistaVersiones(
  d: Datos,
  id: string,
  idioma: Idioma,
  fechaConsulta: string,
  aprobaciones: Readonly<Record<string, string>> = {},
): VistaVersiones {
  const atlas = d.atlas.get(id);
  if (!atlas) throw new Error(`versiones: «${id}» no tiene un mapa publicado`);
  const tm = textosMotor();
  const t = textos(idioma).atlas.versiones;
  const g = atlas.gramatica;
  // De la más vieja a la vigente; cada par es (anterior, siguiente).
  const cadena: Mapa[] = [
    ...(d.versiones.get(id) ?? []).map((v) => v.mapa),
    atlas.mapa,
  ];
  const fichas: Record<string, string> = {};
  const titulos: Record<string, string> = {};
  const pares: ParVersiones[] = [];

  for (let k = cadena.length - 1; k > 0; k--) {
    const antes = cadena[k - 1]!;
    const despues = cadena[k]!;
    const nombre = `${antes.version}-${despues.version}`.replace(/\./g, "-");
    const idTexto = `dif-${id}-${nombre}`;
    const geo = sinAvisos(
      compare([antes, despues], g, {
        texts: tm,
        queryDate: fechaConsulta,
        marks: diff(antes, despues),
      }),
      `v${antes.version} → v${despues.version}`,
    );
    const previos = new Map(antes.nodos.map((n) => [n.id, n]));
    const siguen = despues.nodos.filter((n) => previos.has(n.id));
    pares.push({
      antes: antes.version,
      despues: despues.version,
      ...(aprobaciones[despues.version]
        ? { aprobada: aprobaciones[despues.version] }
        : {}),
      svg: toSVG(geo, {
        language: idioma,
        prefix: `${id}-dif-${nombre}-${idioma}`,
        textId: idTexto,
        hintId: ID_PISTA,
      }),
      diferencias: diffToText(antes, despues, g, {
        language: idioma,
        texts: tm,
        id: idTexto,
      }),
      textos: siguen
        .filter((n) =>
          QUE_DICE.some(
            (c) =>
              canonico(n[c] ?? null) !==
              canonico(previos.get(n.id)![c] ?? null),
          ),
        )
        .map((n) => n.nombre[idioma]!),
      fuentes: siguen.filter(
        (n) => canonico(n.fuentes) !== canonico(previos.get(n.id)!.fuentes),
      ).length,
    });
    // Ventanas de los bloques de las dos filas: cada fila es su versión (el motor les puso el prefijo `<id>-v<versión>`).
    for (const [m, enlace] of [
      [antes, false],
      [despues, k === cadena.length - 1],
    ] as const) {
      const pre = `${m.sujeto_id}-v${m.version.replace(/\./g, "-")}`;
      const elementos = geo.cajas
        .filter((c) => c.clase === "bloque" && c.id.startsWith(`${pre}/`))
        .map((c) => c.id.slice(pre.length + 1));
      const delMapa: Atlas = { ...atlas, mapa: m };
      const banda = (e: string) => {
        const bloque = m.bloques.find((b) => b.id === e);
        return g.bandas.find(
          (b) => b.id === (bloque ? bloque.banda_id : e.slice(1)),
        )!;
      };
      const ojo = (e: string) =>
        `<p class="dg-ficha-tipo">${esc(plantilla(t.ventanaDe, { banda: banda(e).nombre[idioma]!, version: m.version }))}</p>`;
      // Un grupo sin bloque de un solo componente se dibuja con el nombre del componente: su ventana se titula igual.
      const nombrar = (e: string) => {
        const nodos = m.nodos.filter(
          (n) =>
            n.banda_id === banda(e).id &&
            !m.bloques.some((b) => b.id === n.bloque_id),
        );
        return e.startsWith("_") && nodos.length === 1
          ? nodos[0]!.nombre[idioma]
          : undefined;
      };
      // Solo la versión vigente lleva el paso a sus componentes: el nivel 2 del atlas dibuja la vigente.
      for (const [e, html] of Object.entries(
        ventanas(
          delMapa,
          idioma,
          fechaConsulta,
          elementos,
          ojo,
          nombrar,
          enlace,
        ),
      )) {
        fichas[`${pre}/${e}`] = html;
        titulos[`${pre}/${e}`] = textos(idioma).atlas.ventana.titulo;
      }
    }
  }
  return { vigente: atlas.mapa.version, pares, fichas, titulos };
}

export function rutaVersiones(idioma: string, plataforma: string): string {
  return `/${idioma}/atlas/${plataforma}/versiones`;
}
