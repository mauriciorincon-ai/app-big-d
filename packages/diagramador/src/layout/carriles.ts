// Gramáticas de CARRILES (procesos, § 9) — D-S1-05: el contrato no fija su geometría. Cada carril es una
// fila con cabecera de 200 u a la izquierda (como una franja); los nodos ocupan ranuras de 152 u separadas
// por canales de 50 u según su `orden` GLOBAL (el eje del proceso), así que cada ranura tiene un solo
// nodo y ningún tramo vertical en un canal cruza una caja (D11). Un flujo entre ranuras vecinas baja o
// sube por el canal que las separa; si salta ranuras, viaja por el borde entre carriles.
import type { Banda, Nodo } from "../tipos";
import { mitad, type Decimas } from "../util/numeros";
import { ordenarPor } from "../util/orden";
import { M, porIdioma, plural, resumenVigencia, type Contexto } from "./contexto";
import { plantilla } from "./escena";
import { cabeceraFranja, etiquetaModos, trazo, ZONA } from "./piezas";
import { numerarPasos } from "./nivel2";
import type { Recorrido } from "../tipos";
import { tarjetaBloque } from "./nivel1";
import { tarjetaNodo } from "./nivel2";
import type { Caja, CajaPropia, Elemento, Geometria, PasoGeo, Punto, Trazado } from "./tipos";

const X0 = M + 140 + ZONA + 80;
const COLUMNA = 1520;
const CANAL = 500;
const PAD = 240;

interface Pieza {
  id: string;
  carril: number;
  ranura: number;
  caja: Caja;
  nodos: Nodo[];
  fantasma: boolean;
  nombre?: Record<string, string>;
}

export function carriles(ctx: Contexto, nivel: 1 | 2, conRecorrido?: string | true): Geometria {
  const lanes: Banda[] = ctx.carriles;
  const alto = nivel === 1 ? 1040 : 840;
  const fila = alto + 2 * PAD;
  const global = ordenarPor(ctx.mapa.nodos, (n) => n.orden ?? Number.MAX_SAFE_INTEGER, (n) => n.id);
  const ranuraDe = new Map(global.map((n, i) => [n.id, i]));
  const xRanura = (s: number): Decimas => X0 + s * (COLUMNA + CANAL);

  // Piezas: en el nivel 2, un nodo por ranura; en el nivel 1, un elemento por carril (bloque o «sin bloque»)
  // en la ranura de su primer nodo.
  const piezas = new Map<string, Pieza>();
  const dueno = new Map<string, string>();
  lanes.forEach((b, j) => {
    const ns = global.filter((n) => n.banda_id === b.id);
    const y = M + j * fila + PAD;
    if (nivel === 2) {
      for (const n of ns) {
        piezas.set(n.id, { id: n.id, carril: j, ranura: ranuraDe.get(n.id)!, caja: { x: xRanura(ranuraDe.get(n.id)!), y, w: COLUMNA, h: alto }, nodos: [n], fantasma: false });
        dueno.set(n.id, n.id);
      }
    } else {
      const grupos = new Map<string, Nodo[]>();
      for (const n of ns) {
        const k = n.bloque_id ?? `_${b.id}`;
        grupos.set(k, [...(grupos.get(k) ?? []), n]);
      }
      for (const [id, nodos] of grupos) {
        const s = ranuraDe.get(nodos[0]!.id)!;
        const bloque = ctx.mapa.bloques.find((x) => x.id === id);
        const nombre = porIdioma(ctx, (l, t) => (bloque ? bloque.nombre[l]! : nodos.length === 1 ? nodos[0]!.nombre[l]! : plural(t.componentes, nodos.length)));
        piezas.set(id, { id, carril: j, ranura: s, caja: { x: xRanura(s), y, w: COLUMNA, h: alto }, nodos, fantasma: !bloque, nombre });
        for (const n of nodos) dueno.set(n.id, id);
      }
    }
  });
  const ranuras = Math.max(1, ...[...piezas.values()].map((p) => p.ranura + 1));
  const W = X0 + ranuras * COLUMNA + (ranuras - 1) * CANAL + M;

  // Recorrido.
  const recorrido = conRecorrido === undefined ? undefined : conRecorrido === true ? ctx.mapa.recorridos[0] : ctx.mapa.recorridos.find((r) => r.id === conRecorrido);
  if (conRecorrido !== undefined && !recorrido) throw new Error(`layout: el mapa no tiene el recorrido pedido (${String(conRecorrido)})`);
  const flujos = ordenarPor(ctx.mapa.flujos, (f) => f.id);
  const pasos: PasoGeo[] = recorrido ? numerarPasos(recorrido) : [];
  if (recorrido)
    for (const p of pasos) {
      const previo = recorrido.pasos.find((x) => x.id === p.visitados[0]);
      if (previo) p.flujo = flujos.find((f) => f.origen === previo.nodo_id && f.destino === p.nodo)?.id;
    }

  // Conexiones (en el nivel 1, agregadas por par de piezas).
  const agregados = new Map<string, { o: string; d: string; modos: Set<string> }>();
  for (const f of flujos) {
    const o = dueno.get(f.origen);
    const d = dueno.get(f.destino);
    if (!o || !d || o === d) continue;
    const id = nivel === 1 ? `${o}.${d}` : f.id;
    if (!agregados.has(id)) agregados.set(id, { o, d, modos: new Set() });
    agregados.get(id)!.modos.add(f.modo_id);
  }
  const conexiones = [...agregados.entries()].map(([id, a]) => ({ id, o: a.o, d: a.d, modos: [...a.modos].sort((x, y) => ctx.ordenModo.get(x)! - ctx.ordenModo.get(y)!) }));

  const usos = new Map<string, number>();
  const pista = (clave: string, base: Decimas, paso: Decimas): Decimas => {
    const n = usos.get(clave) ?? 0;
    usos.set(clave, n + 1);
    const orden = [0, -1, 1, -2, 2, -3, 3][n] ?? n;
    if (n > 6) ctx.avisos.push(`carriles: más de 7 pistas en ${clave}`);
    return base + orden * paso;
  };
  const lineas: Elemento[] = [];
  const etiquetas: Elemento[] = [];
  const trazados: Trazado[] = [];
  const rotulos: Geometria["rotulos"] = [];
  for (const c of conexiones) {
    const a = piezas.get(c.o)!;
    const b = piezas.get(c.d)!;
    const ida = b.ranura > a.ranura;
    const ya = a.caja.y + mitad(a.caja.h);
    const yd = b.caja.y + mitad(b.caja.h);
    const xs = ida ? a.caja.x + a.caja.w : a.caja.x;
    const xe = ida ? b.caja.x : b.caja.x + b.caja.w;
    const canal = (s: number) => xRanura(s) + COLUMNA + mitad(CANAL);
    let pts: Punto[];
    let etiqueta: Punto;
    if (Math.abs(b.ranura - a.ranura) === 1) {
      const xc = pista(`canal ${Math.min(a.ranura, b.ranura)}`, canal(Math.min(a.ranura, b.ranura)), 100);
      pts = [[xs, ya], [xc, ya], [xc, yd], [xe, yd]];
      etiqueta = ya === yd ? [mitad(xs + xe), ya] : [xc, mitad(ya + yd)];
    } else {
      const c1 = pista(`canal ${ida ? a.ranura : a.ranura - 1}`, canal(ida ? a.ranura : a.ranura - 1), 100);
      const c2 = pista(`canal ${ida ? b.ranura - 1 : b.ranura}`, canal(ida ? b.ranura - 1 : b.ranura), 100);
      const borde = b.carril > a.carril ? a.caja.y + a.caja.h + PAD : b.carril < a.carril ? a.caja.y - PAD : a.caja.y + a.caja.h + PAD;
      const yb = pista(`borde ${borde}`, borde, 100);
      pts = [[xs, ya], [c1, ya], [c1, yb], [c2, yb], [c2, yd], [xe, yd]];
      etiqueta = [mitad(c1 + c2), yb];
    }
    lineas.push(trazo(ctx, c.id, c.modos, pts, recorrido ? { "data-flujo": c.id } : {}));
    trazados.push({ id: c.id, origen: c.o, destino: c.d, puntos: pts });
    const e = etiquetaModos(ctx, c.id, c.modos, etiqueta[0], etiqueta[1]);
    if (e.elemento && e.caja) {
      etiquetas.push(e.elemento);
      rotulos.push({ id: `etiqueta ${c.id}`, dueno: c.id, caja: e.caja });
    }
  }

  const escena: Elemento[] = [];
  const cajas: CajaPropia[] = [];
  lanes.forEach((b, j) => escena.push(cabeceraFranja(ctx, b, M + j * fila, fila, W)));
  for (const p of piezas.values()) {
    cajas.push({ id: p.id, clase: nivel === 1 ? "bloque" : "nodo", caja: p.caja });
    escena.push(tarjetaCarril(ctx, nivel, p, pasos, recorrido, rotulos));
  }
  escena.push(...lineas, ...etiquetas);
  const vista = recorrido ? "recorrido" : nivel === 1 ? "nivel-1" : "nivel-2";
  const valores = (l: string) => ({ sujeto: ctx.mapa.sujeto_nombre[l]!, capas: lanes.length, franjas: 0, nodos: ctx.mapa.nodos.length, recorrido: recorrido?.titulo[l] ?? "" });
  if (ctx.transversales.length) ctx.avisos.push("carriles: las franjas transversales en una gramática de carriles no se dibujan todavía");
  return {
    vista,
    sujeto: ctx.mapa.sujeto_id,
    gramatica: ctx.gramatica.id,
    idiomas: ctx.idiomas,
    ancho: W,
    alto: M + lanes.length * fila + 80,
    columnas: [],
    filas: lanes.map((b, j) => ({ banda: b.id, y: M + j * fila, alto: fila })),
    cajas,
    trazados,
    rotulos,
    escena,
    titulo: porIdioma(ctx, (l, t) => plantilla(t.titulo[vista], valores(l))),
    descripcion: porIdioma(ctx, (l, t) => plantilla(t.descripcion[vista], valores(l))),
    ...(recorrido ? { recorrido: { id: recorrido.id, titulo: recorrido.titulo, pasos } } : {}),
    vigencia: resumenVigencia(ctx, [...piezas.values()]),
    avisos: ctx.avisos,
  };
}

function tarjetaCarril(ctx: Contexto, nivel: 1 | 2, p: Pieza, pasos: PasoGeo[], recorrido: Recorrido | undefined, rotulos: Geometria["rotulos"]): Elemento {
  const banda = ctx.carriles[p.carril]!;
  if (nivel === 1) {
    const bloque = ctx.mapa.bloques.find((x) => x.id === p.id);
    return tarjetaBloque(ctx, { id: p.id, banda, fantasma: p.fantasma, ...(bloque ? { bloque } : {}), nodos: p.nodos }, p.caja, rotulos);
  }
  const n = p.nodos[0]!;
  const suyos = pasos
    .filter((x) => x.nodo === n.id)
    .map((x) => {
      const dato = recorrido!.pasos.find((y) => y.id === x.id)!;
      return { id: x.id, numero: x.numero, bifurca: dato.bifurca !== undefined, que: dato.que_pasa };
    });
  return tarjetaNodo(ctx, n, p.caja, false, suyos, rotulos);
}
