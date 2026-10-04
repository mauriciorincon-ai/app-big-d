// Nivel 1 — visión general para líderes (§ 4.1): capas como columnas con bloques, flujos agregados por par
// ordenado de bloques con su etiqueta de modos, y franjas transversales abajo con referencias (D15).
// Referencia de fidelidad: docs/diseno/atlas-nivel-1.html (generada por scripts/maqueta/atlas/dir3.mjs).
import type { Banda, Bloque, Nodo } from "../tipos";
import { mitad, type Decimas } from "../util/numeros";
import { ordenarPor } from "../util/orden";
import { M, anchoLienzo, avisar, colX, diasDe, nodosDe, peorMadurez, plural, porIdioma, resumenVigencia, rotuloMadurez, vigenciaDe, type Contexto } from "./contexto";
import { g, plantilla, texto, simbolo } from "./escena";
import {
  X_FICHAS,
  cabeceraFranja,
  cabeceras,
  guias,
  insigniaVigencia,
  lineasPorIdioma,
  medidor,
  partir,
  referencias,
  tarjeta,
  unaLinea,
  type Referencia,
} from "./piezas";
import { rutear, type Conexion, type Pieza } from "./rutas";
import type { Caja, CajaPropia, Elemento, Geometria } from "./tipos";

const ALTO = 1040;
const SEPARACION = 400;
const FICHA_W = 1800;
const FICHA_H = 600;
const FRANJA_H = 800;

export interface Elem {
  id: string;
  banda: Banda;
  fantasma: boolean;
  bloque?: Bloque;
  nodos: Nodo[];
}

/** Elementos de una banda: sus bloques (por id) y, si quedan nodos sin bloque, una caja «N componentes». */
export function elementosDe(ctx: Contexto, b: Banda): Elem[] {
  const nodos = nodosDe(ctx, b.id);
  const bloques = ordenarPor(ctx.mapa.bloques.filter((x) => x.banda_id === b.id), (x) => x.id);
  const out: Elem[] = bloques.map((bl) => ({ id: bl.id, banda: b, fantasma: false, bloque: bl, nodos: nodos.filter((n) => n.bloque_id === bl.id) }));
  // M-25 de la auditoría del S1: un bloque vacío valida, pero se dibuja como un activable sin glifo (G7) y su
  // ventana no tiene qué mostrar. Hasta que V3 lo rechace (enmienda propuesta), el dibujo lo avisa.
  for (const e of out) if (!e.nodos.length) avisar(ctx, "bloque-vacio", e.id, e.id);
  const sueltos = nodos.filter((n) => !bloques.some((bl) => bl.id === n.bloque_id));
  if (sueltos.length) out.push({ id: `_${b.id}`, banda: b, fantasma: true, nodos: sueltos });
  return out;
}

/**
 * Nombre de la tarjeta (§ 4.1): el del bloque; sin bloque, el del único nodo, y con varios nodos la caja
 * no lleva nombre (solo «N componentes»). En la ficha de franja la maqueta nombra con «N componentes».
 */
export function nombreElem(ctx: Contexto, e: Elem, l: string, ficha = false): string {
  if (e.bloque) return e.bloque.nombre[l]!;
  if (e.nodos.length === 1) return e.nodos[0]!.nombre[l]!;
  return ficha ? plural(ctx.textos[l]!.componentes, e.nodos.length) : "";
}

/** Nombre en una referencia de franja: una caja sin bloque de varios nodos se nombra por su banda. */
function nombreRef(ctx: Contexto, e: Elem, l: string): string {
  return nombreElem(ctx, e, l) || e.banda.nombre[l]!;
}

export function tipoDe(ctx: Contexto, e: Elem) {
  const t = e.nodos[0] ? ctx.tipo.get(e.nodos[0].tipo_id) : undefined;
  return t ?? { token_color: "ninguno", glifo: undefined };
}

function ariaElem(ctx: Contexto, e: Elem, dias: number): Record<string, string> {
  const estado = vigenciaDe(ctx, dias);
  return porIdioma(ctx, (l, t) => {
    const nombres = e.nodos.map((n) => n.nombre[l]).join(", ");
    const base = e.bloque ? `${e.bloque.nombre[l]}. ${e.bloque.lider[l]} ${t.componentesDe}: ${nombres}.` : `${e.banda.nombre[l]}: ${nombres}.`;
    return estado === "vigente" ? base : `${base} ${plantilla(estado === "revisar" ? t.porRevisar : t.vencido, { n: dias })}`;
  });
}

export function tarjetaBloque(ctx: Contexto, e: Elem, caja: Caja, rotulos: Geometria["rotulos"]): Elemento {
  const { x, y, w, h } = caja;
  const tp = tipoDe(ctx, e);
  const hijos: Elemento[] = [...tarjeta(caja, tp.token_color, e.fantasma)];
  const dias = diasDe(ctx, e.nodos);
  const estado = vigenciaDe(ctx, dias);
  if (estado !== "vigente") {
    const ins = insigniaVigencia(ctx, caja, estado, dias, e.id);
    hijos.push(ins.elemento);
    rotulos.push({ id: `vigencia ${e.id}`, dueno: e.id, caja: ins.caja });
  }
  const nx = x + 140 + 240;
  if (tp.glifo) hijos.push(simbolo(`g-${tp.glifo}`, x + 140 + 90, ctx.sans.base(y + 130, 16, 20) - 56, `dg-c-${tp.token_color}`));
  const nombre = Object.fromEntries(ctx.idiomas.map((l) => [l, nombreElem(ctx, e, l)]));
  if (ctx.idiomas.some((l) => nombre[l]))
    hijos.push(texto("dg-t-nombre", nx, ctx.sans.base(y + 130, 16, 20), 200, lineasPorIdioma(ctx, nombre, 16, 700, w - (nx - x) - 100, 2, `nombre de ${e.id}`)));
  // Fila inferior: «N componentes» y, si no es disponible, la madurez más baja (medidor + palabra). Si la
  // palabra no cabe en una línea en algún idioma, ocupa dos y manda sobre «N componentes» (D-S1-17).
  const peor = peorMadurez(ctx, e.nodos);
  const conMadurez = peor !== undefined && !peor.disponible;
  const anchoMadurez = w - 320 - 100;
  const madurez = conMadurez ? Object.fromEntries(ctx.idiomas.map((l) => [l, partir(ctx, rotuloMadurez(peor, l), 13, 400, anchoMadurez, `madurez de ${e.id}`, l)])) : {};
  const dosLineas = conMadurez && ctx.idiomas.some((l) => madurez[l]!.length > 1);
  const fila = 180;
  const cuenta = unaLinea(ctx, (l) => plural(ctx.textos[l]!.componentes, e.nodos.length));
  if (!dosLineas) {
    const yc = y + h - 140 - fila - (conMadurez ? fila : 0);
    hijos.push(texto("dg-t-meta", x + 180, ctx.sans.base(yc, 13, 18), fila, cuenta));
  }
  if (conMadurez) {
    const lineas = dosLineas ? 2 : 1;
    const ym = y + h - 140 - fila * lineas;
    hijos.push(medidor(peor.nivel, x + 220, ym + mitad(fila)));
    hijos.push(texto("dg-t-meta", x + 320, ctx.sans.base(ym, 13, 18), fila, madurez));
  }
  return g(
    {
      id: `e-${e.id}`,
      class: e.fantasma ? "dg-elem dg-elem-fantasma" : "dg-elem",
      role: "graphics-symbol img",
      tabindex: "0",
      "aria-label": ariaElem(ctx, e, dias),
      "data-dueno": e.id,
      "data-nodos": e.nodos.map((n) => n.id).join(" "),
    },
    hijos,
  );
}

function fichaFranja(ctx: Contexto, e: Elem, caja: Caja, rotulos: Geometria["rotulos"]): { elemento: Elemento; fin: number } {
  const { x, y, w, h } = caja;
  const tp = tipoDe(ctx, e);
  const hijos: Elemento[] = [...tarjeta(caja, tp.token_color, e.fantasma)];
  if (tp.glifo) hijos.push(simbolo(`g-${tp.glifo}`, x + 140 + 80, y + mitad(h), `dg-c-${tp.token_color}`));
  const nombre = lineasPorIdioma(ctx, Object.fromEntries(ctx.idiomas.map((l) => [l, nombreElem(ctx, e, l, true)])), 14, 700, w - 400 - 100, 2, `ficha ${e.id}`);
  const lineas = Math.max(...ctx.idiomas.map((l) => nombre[l]!.length));
  const arriba = y + mitad(h - (lineas * 170 + 160));
  hijos.push(texto("dg-t-nombre dg-t-nombre-compacto", x + 400, ctx.sans.base(arriba, 14, 17), 170, nombre));
  const sub = unaLinea(ctx, (l) => (e.fantasma ? ctx.textos[l]!.sinBloque : plural(ctx.textos[l]!.componentes, e.nodos.length)));
  hijos.push(texto("dg-t-meta dg-t-meta-compacta", x + 400, ctx.sans.base(arriba + lineas * 170, 12, 16), 160, sub));
  const dias = diasDe(ctx, e.nodos);
  const estado = vigenciaDe(ctx, dias);
  let fin = x + w;
  if (estado !== "vigente") {
    const ins = insigniaVigencia(ctx, caja, estado, dias, e.id, true);
    hijos.push(ins.elemento);
    rotulos.push({ id: `vigencia ${e.id}`, dueno: e.id, caja: ins.caja });
    fin = ins.caja.x + ins.caja.w;
  }
  const elemento = g(
    {
      id: `e-${e.id}`,
      class: e.fantasma ? "dg-elem dg-elem-compacto dg-elem-fantasma" : "dg-elem dg-elem-compacto",
      role: "graphics-symbol img",
      tabindex: "0",
      "aria-label": ariaElem(ctx, e, dias),
      "data-dueno": e.id,
      "data-nodos": e.nodos.map((n) => n.id).join(" "),
    },
    hijos,
  );
  return { elemento, fin };
}

export function nivel1(ctx: Contexto): Geometria {
  const capas = ctx.capas;
  const franjas = ctx.transversales;
  const W = anchoLienzo(capas.length);
  const cab = cabeceras(ctx, capas);
  const Hh = cab.alto;

  // Elementos y su dueño por nodo.
  const porBanda = new Map<string, Elem[]>();
  const dueno = new Map<string, string>();
  const orden: Elem[] = [];
  for (const b of [...capas, ...franjas]) {
    const es = elementosDe(ctx, b);
    porBanda.set(b.id, es);
    for (const e of es) {
      orden.push(e);
      for (const n of e.nodos) dueno.set(n.id, e.id);
    }
  }
  const indice = new Map(orden.map((e, i) => [e.id, i]));
  const elem = new Map(orden.map((e) => [e.id, e]));

  // Posición de los elementos de capa: una columna por capa, ranuras hacia abajo.
  const filas = Math.max(1, ...capas.map((b) => porBanda.get(b.id)!.length));
  const piezas = new Map<string, Pieza>();
  const cajas: CajaPropia[] = [];
  capas.forEach((b, i) => {
    const es = porBanda.get(b.id)!;
    es.forEach((e, r) => {
      const caja = { x: colX(i), y: Hh + r * (ALTO + SEPARACION), w: 1520, h: ALTO };
      piezas.set(e.id, { id: e.id, col: i, fila: r, caja, baja: r === es.length - 1 });
      cajas.push({ id: e.id, clase: "bloque", caja });
    });
  });
  const yb = Hh + filas * ALTO + (filas - 1) * SEPARACION;

  // Flujos agregados por par ordenado de elementos (§ 4.1), modos en el orden de la gramática.
  const agregados = new Map<string, { o: string; d: string; modos: Set<string> }>();
  for (const f of ctx.mapa.flujos) {
    const o = dueno.get(f.origen);
    const d = dueno.get(f.destino);
    if (!o || !d || o === d) continue;
    const id = `${o}.${d}`;
    if (!agregados.has(id)) agregados.set(id, { o, d, modos: new Set() });
    agregados.get(id)!.modos.add(f.modo_id);
  }
  const conexiones: Conexion[] = [...agregados.entries()]
    .map(([id, a]) => ({ id, o: a.o, d: a.d, modos: [...a.modos].sort((x, y) => ctx.ordenModo.get(x)! - ctx.ordenModo.get(y)!) }))
    .sort((a, b) => indice.get(a.o)! - indice.get(b.o)! || indice.get(a.d)! - indice.get(b.d)!);
  const enCapas = conexiones.filter((c) => piezas.has(c.o) && piezas.has(c.d));
  const ruteo = rutear(ctx, piezas, enCapas, { nivel: 1, yb });
  const finCarril = ruteo.pistas[ruteo.pistas.length - 1]! + 220;
  const franjasY = finCarril + 400;

  const rotulos: Geometria["rotulos"] = [...ruteo.rotulos];
  const escena: Elemento[] = [guias(capas.length, finCarril), ...cab.escena];
  for (const b of capas) for (const e of porBanda.get(b.id)!) escena.push(tarjetaBloque(ctx, e, piezas.get(e.id)!.caja, rotulos));
  escena.push(...ruteo.lineas, ...ruteo.etiquetas);

  // Franjas: ficha compacta por elemento y referencias bajo la columna con la que conectan (D15).
  if (franjas.length) {
    escena.push(g({ class: "dg-rotulo", "aria-hidden": "true", "data-dueno": "franjas" }, [texto("dg-t-num", M, ctx.mono.base(franjasY - 260, 12, 16), 160, unaLinea(ctx, (l) => ctx.textos[l]!.transversales))]));
  }
  franjas.forEach((b, j) => {
    const y = franjasY + j * (FRANJA_H + 100);
    escena.push(cabeceraFranja(ctx, b, y, FRANJA_H, W));
    const es = porBanda.get(b.id)!;
    let fin = X_FICHAS;
    for (const e of es) {
      const caja = { x: fin === X_FICHAS ? X_FICHAS : fin + 120, y: y + mitad(FRANJA_H - FICHA_H), w: FICHA_W, h: FICHA_H };
      cajas.push({ id: e.id, clase: "ficha", caja });
      const f = fichaFranja(ctx, e, caja, rotulos);
      escena.push(f.elemento);
      fin = f.fin;
      // M-24 de la auditoría del S1: la fila de fichas no se parte; si no cabe, se dice (y el build se detiene).
      if (fin > W - M) avisar(ctx, "fuera-del-lienzo", e.id, `ficha ${e.id}`);
    }
    const refs: Referencia[] = [];
    for (const e of es)
      for (const c of conexiones.filter((x) => x.o === e.id || x.d === e.id)) {
        const envia = c.o === e.id;
        const otro = elem.get(envia ? c.d : c.o)!;
        if (!envia && !piezas.has(otro.id)) continue; // franja → franja: una sola referencia, en la fila del origen
        const p = piezas.get(otro.id);
        refs.push({
          id: `r-${c.id}`,
          flujo: c.id,
          envia,
          modos: c.modos,
          nombre: Object.fromEntries(ctx.idiomas.map((l) => [l, nombreRef(ctx, otro, l)])),
          cx: p ? p.caja.x + 760 : 0,
          cy: y + mitad(FRANJA_H),
        });
      }
    const r = referencias(ctx, refs, fin + 80, W);
    escena.push(...r.escena);
    rotulos.push(...r.cajas);
  });

  const alto: Decimas = franjas.length ? franjasY + franjas.length * FRANJA_H + (franjas.length - 1) * 100 + 80 : finCarril + 80;
  const valores = (l: string) => ({ sujeto: ctx.mapa.sujeto_nombre[l]!, capas: capas.length, franjas: franjas.length, nodos: ctx.mapa.nodos.length });
  return {
    vista: "nivel1",
    sujeto: ctx.mapa.sujeto_id,
    gramatica: ctx.gramatica.id,
    idiomas: ctx.idiomas,
    ancho: W,
    alto,
    columnas: capas.map((b, i) => ({ banda: b.id, x: colX(i), numero: String(i + 1).padStart(2, "0"), nombre: b.nombre })),
    filas: franjas.map((b, j) => ({ banda: b.id, y: franjasY + j * (FRANJA_H + 100), alto: FRANJA_H })),
    cajas,
    trazados: ruteo.trazados,
    rotulos,
    escena,
    titulo: porIdioma(ctx, (l, t) => plantilla(t.titulo.nivel1, valores(l))),
    descripcion: porIdioma(ctx, (l, t) => plantilla(t.descripcion.nivel1, valores(l))),
    vigencia: resumenVigencia(ctx, orden),
    cruces: [],
    avisos: ctx.avisos,
  };
}
