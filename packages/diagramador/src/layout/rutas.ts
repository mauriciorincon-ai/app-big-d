// Ruteo ortogonal por canales (D4, § 5.3), compartido por los niveles 1 y 2. Cada flujo sale y entra por
// puertos fijos en los bordes, recorre los canales entre columnas por pistas y, si salta columnas, baja al
// carril exprés bajo las tarjetas. Las diferencias entre niveles son parámetros:
//   · nivel 1: puertos laterales a 22 u alrededor del centro; el salto entra por el borde inferior (maqueta);
//   · nivel 2: k puertos en y + alto·i/(k+1); el salto sube por el canal anterior al destino y entra por el lado.
import { mitad, type Decimas } from "../util/numeros";
import { CANAL, COL, PISTA_EXPRES_1, PISTA_EXPRES_PASO, colX, type Contexto } from "./contexto";
import { etiquetaModos, marcadores, trazo } from "./piezas";
import type { Caja, Elemento, Punto, Trazado } from "./tipos";

export interface Pieza {
  id: string;
  col: number;
  fila: number;
  caja: Caja;
  /** ¿Es la pieza más baja de su columna? (solo ella puede salir o entrar por abajo sin cruzar otra caja) */
  baja: boolean;
}
export interface Conexion {
  id: string;
  o: string;
  d: string;
  modos: string[];
}
export interface OpcionesRuteo {
  nivel: 1 | 2;
  /** Borde inferior de la fila más baja de tarjetas. */
  yb: Decimas;
  /** Atributos extra del grupo del flujo (p. ej. `data-flujo` en el recorrido). */
  extra?: (c: Conexion) => Record<string, string>;
}
export interface Ruteo {
  lineas: Elemento[];
  etiquetas: Elemento[];
  trazados: Trazado[];
  rotulos: { id: string; dueno: string; caja: Caja }[];
  /** Pistas del carril exprés, de arriba abajo; el lienzo reserva hasta la última. */
  pistas: Decimas[];
}

type Lado = "der" | "izq";
const INFINITO = Number.MAX_SAFE_INTEGER;
const OFFSETS_PISTA = [-50, 50, 150, 250, -150, -250];
/** Separación mínima entre pistas de un canal repartido: 4 u. */
const PISTA_MIN = 40;
/** Media anchura útil de un canal repartido: 2 u de aire contra cada tarjeta. */
const MEDIO_UTIL = mitad(CANAL) - 20;

/**
 * Posiciones de las pistas de un canal que pide `n`, relativas a su centro y en el orden en que se asignan.
 * Hasta 6, las fijas de § 5.3. Con más, `n` posiciones parejas en el canal (a 2 u de cada tarjeta) y el mismo
 * orden de las fijas: desde la de la izquierda del centro hacia la derecha y después hacia la izquierda.
 * Por debajo de 4 u entre pistas no se reparte más: el que sobra comparte la última y el motor lo reporta.
 */
export function offsetsPista(n: number): number[] {
  if (n <= OFFSETS_PISTA.length) return OFFSETS_PISTA;
  const cupo = Math.min(n, Math.floor((2 * MEDIO_UTIL) / PISTA_MIN) + 1);
  const paso = Math.floor((2 * MEDIO_UTIL) / (cupo - 1));
  const pos = Array.from({ length: cupo }, (_, i) => -MEDIO_UTIL + paso * i + Math.floor((2 * MEDIO_UTIL - paso * (cupo - 1)) / 2));
  const inicio = Math.floor((cupo - 1) / 2);
  return [...pos.slice(inicio), ...pos.slice(0, inicio).reverse()];
}

export function rutear(ctx: Contexto, piezas: ReadonlyMap<string, Pieza>, conexiones: readonly Conexion[], op: OpcionesRuteo): Ruteo {
  const P = (id: string) => piezas.get(id)!;
  const cy = (p: Pieza) => p.caja.y + mitad(p.caja.h);
  const span = (c: Conexion) => Math.abs(P(c.d).col - P(c.o).col);
  const clase = (c: Conexion): "vecino" | "intra" | "salto" => {
    const dc = Math.abs(P(c.d).col - P(c.o).col);
    return dc === 0 ? "intra" : dc === 1 ? "vecino" : "salto";
  };
  const adelante = (c: Conexion) => P(c.d).col > P(c.o).col;

  // ── Saltos: orden (el más lejano primero) y pistas del carril exprés ──
  const saltos = conexiones
    .filter((c) => clase(c) === "salto")
    .sort((a, b) => span(b) - span(a) || P(a.o).col - P(b.o).col || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // Dos pistas y una más por cada salto adicional: el carril crece hacia abajo y la fila de franjas se corre
  // (enmienda del piloto: el primer mapa real trae 3 saltos en el nivel 1 y 4 en el nivel 2).
  const nPistas = Math.max(2, saltos.length);
  const pistas = Array.from({ length: nPistas }, (_, k) => op.yb + PISTA_EXPRES_1 + PISTA_EXPRES_PASO * k);
  const pistaDe = new Map(saltos.map((c, j) => [c.id, pistas[nPistas - 1 - j]!]));

  // ── Registro de puertos ──
  const laterales = new Map<string, { c: Conexion; ref: number; orden: number }[]>();
  const abajo = new Map<string, { c: Conexion; ref: number }[]>();
  const entradas = new Map<string, { c: Conexion; ref: number }[]>();
  const lateral = (pieza: string, lado: Lado, c: Conexion, ref: number, orden = 0) => {
    const k = `${pieza}:${lado}`;
    if (!laterales.has(k)) laterales.set(k, []);
    laterales.get(k)!.push({ c, ref, orden });
  };
  const empujar = (m: Map<string, { c: Conexion; ref: number }[]>, pieza: string, c: Conexion, ref: number) => {
    if (!m.has(pieza)) m.set(pieza, []);
    m.get(pieza)!.push({ c, ref });
  };
  const entraPorAbajo = (c: Conexion) => op.nivel === 1 && P(c.d).baja;
  for (const c of conexiones) {
    const a = P(c.o);
    const b = P(c.d);
    const k = clase(c);
    if (k === "vecino") {
      const ida = adelante(c);
      lateral(c.o, ida ? "der" : "izq", c, cy(b), ida ? 0 : 1);
      lateral(c.d, ida ? "izq" : "der", c, cy(a), ida ? 0 : 1);
    } else if (k === "intra") {
      if (Math.abs(b.fila - a.fila) > 1) {
        lateral(c.o, "der", c, cy(b));
        lateral(c.d, "der", c, cy(a));
      }
    } else {
      const ida = adelante(c);
      if (a.baja) empujar(abajo, c.o, c, span(c));
      else lateral(c.o, ida ? "der" : "izq", c, INFINITO);
      if (entraPorAbajo(c)) empujar(entradas, c.d, c, span(c));
      else lateral(c.d, ida ? "izq" : "der", c, INFINITO);
    }
  }
  for (const l of laterales.values()) l.sort((u, v) => u.ref - v.ref || u.orden - v.orden);
  for (const l of abajo.values()) l.sort((u, v) => v.ref - u.ref || (u.c.id < v.c.id ? -1 : 1));
  for (const l of entradas.values()) l.sort((u, v) => u.ref - v.ref || (u.c.id < v.c.id ? -1 : 1));

  const puertoY = (pieza: string, lado: Lado, c: Conexion): Decimas => {
    const lista = laterales.get(`${pieza}:${lado}`)!;
    const i = lista.findIndex((u) => u.c === c);
    const k = lista.length;
    const p = P(pieza);
    return op.nivel === 1 ? cy(p) + (2 * i - (k - 1)) * 110 : p.caja.y + Math.floor((p.caja.h * (i + 1)) / (k + 1));
  };
  const puertoAbajo = (c: Conexion): Decimas => {
    const lista = abajo.get(c.o)!;
    const i = lista.findIndex((u) => u.c === c);
    const p = P(c.o);
    const base = op.nivel === 1 ? 851 : 760;
    const paso = op.nivel === 1 ? 365 : 334;
    return adelante(c) ? p.caja.x + base + paso * i : p.caja.x + p.caja.w - base - paso * i;
  };
  const entradaAbajo = (c: Conexion): Decimas => {
    const lista = entradas.get(c.d)!;
    const i = lista.findIndex((u) => u.c === c);
    const p = P(c.d);
    return adelante(c) ? p.caja.x + 456 - 150 * i : p.caja.x + p.caja.w - 456 + 150 * i;
  };
  // Cuántas pistas pide cada canal, con las mismas condiciones del dibujo de abajo: hasta 6 van en las
  // posiciones fijas; con más, el canal entero se reparte parejo (ver `offsetsPista`).
  const pedidas = new Map<number, number>();
  const pedir = (canal: number) => pedidas.set(canal, (pedidas.get(canal) ?? 0) + 1);
  for (const c of conexiones) {
    const a = P(c.o);
    const b = P(c.d);
    const k = clase(c);
    const ida = adelante(c);
    if (k === "vecino") {
      if (puertoY(c.o, ida ? "der" : "izq", c) !== puertoY(c.d, ida ? "izq" : "der", c)) pedir(Math.min(a.col, b.col));
    } else if (k === "intra") {
      if (Math.abs(b.fila - a.fila) > 1) pedir(a.col);
    } else {
      if (!a.baja) pedir(ida ? a.col : a.col - 1);
      if (!entraPorAbajo(c)) pedir(ida ? b.col - 1 : b.col);
    }
  }
  const usoCanal = new Map<number, number>();
  const pista = (canal: number): Decimas => {
    const n = usoCanal.get(canal) ?? 0;
    usoCanal.set(canal, n + 1);
    const offsets = offsetsPista(pedidas.get(canal) ?? n + 1);
    if (n >= offsets.length) ctx.avisos.push(`canal ${canal}: más de ${offsets.length} pistas`);
    return colX(canal) + COL + mitad(CANAL) + offsets[Math.min(n, offsets.length - 1)]!;
  };

  const anchoEtiqueta = (c: Conexion): Decimas => {
    const k = marcadores(ctx, c.modos).length;
    return 60 + 160 * (k > 2 ? Math.ceil(k / 2) : k);
  };
  const lineas: Elemento[] = [];
  const etiquetas: Elemento[] = [];
  const trazados: Trazado[] = [];
  const rotulos: { id: string; dueno: string; caja: Caja }[] = [];
  const cruza = (p: Caja, q: Caja) => p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
  const libre = (caja: Caja) => ![...piezas.values()].some((p) => cruza(caja, p.caja)) && !rotulos.some((s) => cruza(caja, s.caja));
  /**
   * La etiqueta va en su lugar principal; si ahí pisa una caja o una etiqueta ya puesta, prueba las
   * alternativas en orden (enmienda del piloto: en un canal con muchas pistas dos etiquetas chocaban). Si
   * ninguna está libre se queda en la principal y el aviso de abajo lo reporta.
   */
  const dibujar = (c: Conexion, pts: Punto[], ex: Decimas, ey: Decimas, alternativas: readonly Punto[] = []) => {
    lineas.push(trazo(ctx, c.id, c.modos, pts, op.extra?.(c)));
    trazados.push({ id: c.id, origen: c.o, destino: c.d, puntos: pts });
    let e = etiquetaModos(ctx, c.id, c.modos, ex, ey);
    if (e.caja && !libre(e.caja))
      for (const [ax, ay] of alternativas) {
        const alt = etiquetaModos(ctx, c.id, c.modos, ax, ay);
        if (alt.caja && libre(alt.caja)) {
          e = alt;
          break;
        }
      }
    if (e.elemento && e.caja) {
      etiquetas.push(e.elemento);
      rotulos.push({ id: `etiqueta ${c.id}`, dueno: c.id, caja: e.caja });
    }
  };

  // ── Vecinos ──
  for (const c of conexiones.filter((x) => clase(x) === "vecino")) {
    const a = P(c.o);
    const b = P(c.d);
    const ida = adelante(c);
    const x1 = ida ? a.caja.x + a.caja.w : a.caja.x;
    const x2 = ida ? b.caja.x : b.caja.x + b.caja.w;
    const y1 = puertoY(c.o, ida ? "der" : "izq", c);
    const y2 = puertoY(c.d, ida ? "izq" : "der", c);
    if (y1 === y2) dibujar(c, [[x1, y1], [x2, y1]], mitad(x1 + x2) + (ida ? -40 : 40), y1);
    else {
      const xc = pista(Math.min(a.col, b.col));
      // En el tramo corto entre la tarjeta y la pista, la etiqueta se despega 2 u del borde (§ 5.3: no
      // dibuja encima de nada); la maqueta la dejaba rozando la caja.
      const media = mitad(anchoEtiqueta(c)) + 20;
      const ex = ida ? Math.max(mitad(x1 + xc), x1 + media) : Math.min(mitad(x1 + xc), x1 - media);
      // Alternativa: el tramo de llegada, pegada del lado de la pista y sin tocar la tarjeta de destino.
      const ex2 = ida ? Math.min(mitad(xc + x2), x2 - media) : Math.max(mitad(xc + x2), x2 + media);
      dibujar(c, [[x1, y1], [xc, y1], [xc, y2], [x2, y2]], ex, y1, [[ex2, y2]]);
    }
  }
  // ── Dentro de una columna ──
  for (const c of conexiones.filter((x) => clase(x) === "intra")) {
    const a = P(c.o);
    const b = P(c.d);
    const bajando = b.fila > a.fila;
    if (Math.abs(b.fila - a.fila) === 1) {
      const x = a.caja.x + mitad(a.caja.w);
      const y1 = bajando ? a.caja.y + a.caja.h : a.caja.y;
      const y2 = bajando ? b.caja.y : b.caja.y + b.caja.h;
      dibujar(c, [[x, y1], [x, y2]], x + 240, mitad(y1 + y2));
    } else {
      const xa = a.caja.x + a.caja.w;
      const xc = pista(a.col);
      const y1 = puertoY(c.o, "der", c);
      const y2 = puertoY(c.d, "der", c);
      dibujar(c, [[xa, y1], [xc, y1], [xc, y2], [xa, y2]], mitad(xa + xc), y1);
    }
  }
  // ── Saltos por el carril exprés ──
  const porCercania = [...saltos].reverse();
  let xdPrevio: Decimas | undefined;
  for (const c of porCercania) {
    const a = P(c.o);
    const b = P(c.d);
    const ida = adelante(c);
    const yt = pistaDe.get(c.id)!;
    const pts: Punto[] = [];
    let xSalida: Decimas;
    if (a.baja) {
      xSalida = puertoAbajo(c);
      pts.push([xSalida, a.caja.y + a.caja.h], [xSalida, yt]);
    } else {
      const xs = ida ? a.caja.x + a.caja.w : a.caja.x;
      xSalida = pista(ida ? a.col : a.col - 1);
      const ys = puertoY(c.o, ida ? "der" : "izq", c);
      pts.push([xs, ys], [xSalida, ys], [xSalida, yt]);
    }
    let xLlegada: Decimas;
    if (entraPorAbajo(c)) {
      xLlegada = entradaAbajo(c);
      pts.push([xLlegada, yt], [xLlegada, b.caja.y + b.caja.h]);
    } else {
      xLlegada = pista(ida ? b.col - 1 : b.col);
      const yd = puertoY(c.d, ida ? "izq" : "der", c);
      pts.push([xLlegada, yt], [xLlegada, yd], [ida ? b.caja.x : b.caja.x + b.caja.w, yd]);
    }
    // Nivel 1 (maqueta): entre la llegada del salto anterior y la propia, si esa llegada cae dentro de este
    // salto; si no (saltos que no salen del mismo lado, enmienda del piloto), en la mitad de su propio tramo.
    const anidado = xdPrevio !== undefined && xdPrevio > Math.min(xSalida, xLlegada) && xdPrevio < Math.max(xSalida, xLlegada);
    const ex = op.nivel === 1 && ida && anidado ? mitad(xdPrevio! + xLlegada) : mitad(xSalida + xLlegada);
    dibujar(c, pts, ex, yt);
    if (ida) xdPrevio = xLlegada;
  }

  // ── Avisos: ninguna etiqueta encima de una caja ni de otra etiqueta (§ 5.3) ──
  for (const r of rotulos) {
    for (const p of piezas.values()) if (cruza(r.caja, p.caja)) ctx.avisos.push(`${r.id}: queda encima de la caja de ${p.id}`);
    for (const s of rotulos) if (s !== r && r.id < s.id && cruza(r.caja, s.caja)) ctx.avisos.push(`${r.id}: queda encima de ${s.id}`);
  }
  return { lineas, etiquetas, trazados, rotulos, pistas };
}
