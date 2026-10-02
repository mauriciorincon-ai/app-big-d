// Nivel 2 — componentes (§ 4.2) y nivel 3 — recorrido (§ 4.3), sobre la misma geometría: nodos apilados
// por columna a 40 u, flujos entre nodos de capas con su modo y referencias de franja en la fila del nodo
// de la franja (D15). El recorrido suma insignias de paso, la marca de rama y los atributos `data-paso`
// y `data-flujo` que el CSS generado usa (G12: el SVG no cambia entre pasos).
// Referencias de fidelidad: docs/diseno/atlas-nivel-2.html y atlas-recorrido.html (scripts/maqueta/pantallas/nivel2.mjs).
import type { Nodo, Recorrido } from "../tipos";
import { mitad, type Decimas } from "../util/numeros";
import { ordenarPor } from "../util/orden";
import { pasoPrevio } from "../util/recorrido";
import { M, anchoLienzo, colX, diasDe, nodosDe, plural, porIdioma, resumenVigencia, rotuloMadurez, vigenciaDe, type Contexto } from "./contexto";
import { g, plantilla, rect, texto, simbolo } from "./escena";
import {
  X_FICHAS,
  cabeceraFranja,
  cabeceras,
  guias,
  insigniaVigencia,
  lineasPorIdioma,
  medidor,
  referencias,
  tarjeta,
  unaLinea,
  type Referencia,
} from "./piezas";
import { rutear, type Conexion, type Pieza } from "./rutas";
import type { Caja, CajaPropia, Elemento, Geometria, PasoGeo } from "./tipos";

const ALTO = 840;
const SEPARACION = 400;
/** Ficha compacta de un nodo de franja (§ 5.3): 168 × 44 u, a 8 u entre sí. */
export const FICHA_W = 1680;
export const FICHA_H = 440;

/** Numeración del recorrido (§ 4.3): 1–5, y tras una bifurcación 6a → 7a y 6b (la rama hereda su letra). */
export function numerarPasos(r: Recorrido): PasoGeo[] {
  const porId = new Map(r.pasos.map((p) => [p.id, p]));
  const previo = new Map<string, string | undefined>();
  r.pasos.forEach((p, k) => previo.set(p.id, pasoPrevio(r, k)?.id));
  const hijos = new Map<string, string[]>();
  for (const p of r.pasos) {
    const a = previo.get(p.id);
    if (a !== undefined) hijos.set(a, [...(hijos.get(a) ?? []), p.id]);
  }
  const numero = new Map<string, { n: number; sufijo: string }>();
  for (const p of r.pasos) {
    const a = previo.get(p.id);
    const base = a !== undefined ? numero.get(a) : undefined;
    if (!base) {
      numero.set(p.id, { n: 1, sufijo: "" });
      continue;
    }
    const hermanos = hijos.get(a!) ?? [];
    const letra = porId.get(a!)?.bifurca && hermanos.length > 1 ? String.fromCharCode(97 + hermanos.indexOf(p.id)) : "";
    numero.set(p.id, { n: base.n + 1, sufijo: base.sufijo + letra });
  }
  // Un mapa validado no tiene ciclos (V5 exige que cada paso siga a uno anterior en la lista); si llega uno
  // sin validar, se dice cuál en vez de agotar la memoria (A-5 de la auditoría del S1, G14).
  const visitados = (id: string): string[] => {
    const out: string[] = [];
    const vistos = new Set<string>([id]);
    for (let a = previo.get(id); a !== undefined; a = previo.get(a)) {
      if (vistos.has(a)) throw new Error(`recorrido ${r.id}: el paso «${a}» se repite al seguir la cadena de «${id}» (sigue_de en ciclo)`);
      vistos.add(a);
      out.push(a);
    }
    return out;
  };
  return r.pasos.map((p) => {
    const num = numero.get(p.id)!;
    return { id: p.id, numero: `${num.n}${num.sufijo}`, nodo: p.nodo_id, visitados: visitados(p.id) };
  });
}

function ariaNodo(ctx: Contexto, n: Nodo, pasos: { numero: string; que: Record<string, string> }[]): Record<string, string> {
  const dias = diasDe(ctx, [n]);
  const estado = vigenciaDe(ctx, dias);
  return porIdioma(ctx, (l, t) => {
    let s = `${n.nombre[l]}. ${ctx.tipo.get(n.tipo_id)!.nombre[l]}. ${ctx.madurez.get(n.madurez)!.nombre[l]}.`;
    if (estado !== "vigente") s += ` ${plantilla(estado === "revisar" ? t.porRevisar : t.vencido, { n: dias })}`;
    for (const p of pasos) s += ` ${plantilla(t.paso, { numero: p.numero, que: p.que[l]! })}.`;
    return s;
  });
}

export function tarjetaNodo(
  ctx: Contexto,
  n: Nodo,
  caja: Caja,
  compacto: boolean,
  pasos: { id: string; numero: string; bifurca: boolean; que: Record<string, string> }[],
  rotulos: Geometria["rotulos"],
): Elemento {
  const { x, y, w, h } = caja;
  const tp = ctx.tipo.get(n.tipo_id)!;
  const mad = ctx.madurez.get(n.madurez)!;
  const hijos: Elemento[] = [...tarjeta(caja, tp.token_color)];
  const gx = x + 120 + 80;
  const nx = x + 120 + 220;
  const tw = w - (nx - x) - 80;
  if (compacto) {
    hijos.push(simbolo(`g-${tp.glifo}`, gx, y + mitad(h), `dg-c-${tp.token_color}`));
    const nombre = lineasPorIdioma(ctx, n.nombre, 13, 700, tw, 2, `ficha ${n.id}`);
    const lineas = Math.max(...ctx.idiomas.map((l) => nombre[l]!.length));
    hijos.push(texto("dg-t-nombre dg-t-nombre-nodo", nx, ctx.sans.base(y + mitad(h - lineas * 160), 13, 16), 160, nombre));
  } else {
    hijos.push(simbolo(`g-${tp.glifo}`, gx, ctx.sans.base(y + 100, 13, 16) - 45, `dg-c-${tp.token_color}`));
    hijos.push(texto("dg-t-nombre dg-t-nombre-nodo", nx, ctx.sans.base(y + 100, 13, 16), 160, lineasPorIdioma(ctx, n.nombre, 13, 700, tw, 3, `nombre de ${n.id}`)));
    // Fila inferior: madurez (si no es disponible, abreviada por palabras si no cabe: D6) y fuentes.
    const yr = y + h - 80 - 160;
    const nf = n.fuentes.length;
    const fuentes = porIdioma(ctx, (l, t) => (mad.disponible ? plural(t.fuentes, nf) : String(nf)));
    const fw = Math.max(...ctx.idiomas.map((l) => ctx.sans.ancho(fuentes[l]!, 12, 400)));
    const docX = x + w - 80 - fw - 100;
    if (!mad.disponible) {
      hijos.push(medidor(mad.nivel, x + 160, yr + 80));
      const max = docX - 60 - 40 - (x + 240);
      const nombre = Object.fromEntries(ctx.idiomas.map((l) => [l, [ctx.sans.abreviar(rotuloMadurez(mad, l), 12, 400, max)]]));
      hijos.push(texto("dg-t-meta dg-t-meta-compacta", x + 240, ctx.sans.base(yr, 12, 16), 160, nombre));
    }
    hijos.push(simbolo("k-doc", docX, yr + 80, "dg-marca-suave"));
    hijos.push(texto("dg-t-meta dg-t-meta-compacta", x + w - 80 - fw, ctx.sans.base(yr, 12, 16), 160, Object.fromEntries(ctx.idiomas.map((l) => [l, [fuentes[l]!]]))));
  }
  const dias = diasDe(ctx, [n]);
  const estado = vigenciaDe(ctx, dias);
  if (estado !== "vigente") {
    const ins = insigniaVigencia(ctx, caja, estado, dias, n.id, compacto);
    hijos.push(ins.elemento);
    rotulos.push({ id: `vigencia ${n.id}`, dueno: n.id, caja: ins.caja });
  }
  // Insignias de paso en la esquina superior izquierda (un nodo puede estar en varios pasos).
  let px = x - 60;
  for (const p of pasos) {
    const bw = 180 + 60 * p.numero.length;
    hijos.push(
      g({ class: "dg-paso-insignia", "aria-hidden": "true" }, [
        rect({ x: px, y: y - 120, width: bw, height: 240, rx: 120 }),
        texto("dg-t-paso", px + mitad(bw), y + 44, 0, Object.fromEntries(ctx.idiomas.map((l) => [l, [p.numero]])), { "text-anchor": "middle" }),
      ]),
    );
    rotulos.push({ id: `paso ${p.id}`, dueno: n.id, caja: { x: px, y: y - 120, w: bw, h: 240 } });
    px += bw;
    if (p.bifurca) {
      hijos.push(simbolo("k-rama", px + 100, y, "dg-rama"));
      px += 200;
    }
    px += 40;
  }
  return g(
    {
      id: `n-${n.id}`,
      class: compacto ? "dg-elem dg-nodo dg-elem-compacto" : "dg-elem dg-nodo",
      role: "graphics-symbol img",
      tabindex: "0",
      "aria-label": ariaNodo(ctx, n, pasos),
      "data-dueno": n.id,
      "data-nodo": n.id,
      "data-paso": pasos.length ? pasos.map((p) => p.id).join(" ") : undefined,
    },
    hijos,
  );
}

export function nivel2(ctx: Contexto, conRecorrido: string | true | undefined): Geometria {
  const capas = ctx.capas;
  const franjas = ctx.transversales;
  const W = anchoLienzo(capas.length);
  const cab = cabeceras(ctx, capas);
  const Hh = cab.alto;

  // Recorrido (vista 3): pasos numerados y el flujo que lleva a cada uno.
  const recorrido = conRecorrido === undefined ? undefined : conRecorrido === true ? ctx.mapa.recorridos[0] : ctx.mapa.recorridos.find((r) => r.id === conRecorrido);
  if (conRecorrido !== undefined && !recorrido) throw new Error(`layout: el mapa no tiene el recorrido pedido (${String(conRecorrido)})`);
  const flujosOrdenados = ordenarPor(ctx.mapa.flujos, (f) => f.id);
  const pasos: PasoGeo[] = recorrido ? numerarPasos(recorrido) : [];
  if (recorrido) {
    const porId = new Map(recorrido.pasos.map((p) => [p.id, p]));
    for (const p of pasos) {
      const previo = porId.get(p.visitados[0] ?? "");
      if (previo) p.flujo = flujosOrdenados.find((f) => f.origen === previo.nodo_id && f.destino === p.nodo)?.id;
    }
  }
  const pasosDe = (nodo: string) =>
    pasos
      .filter((p) => p.nodo === nodo)
      .map((p) => {
        const dato = recorrido!.pasos.find((x) => x.id === p.id)!;
        return { id: p.id, numero: p.numero, bifurca: dato.bifurca !== undefined, que: dato.que_pasa };
      });

  // Nodos de capa en su columna; filas = la banda más densa.
  const filas = Math.max(1, ...capas.map((b) => nodosDe(ctx, b.id).length));
  const piezas = new Map<string, Pieza>();
  const cajas: CajaPropia[] = [];
  capas.forEach((b, i) => {
    const ns = nodosDe(ctx, b.id);
    ns.forEach((n, r) => {
      const caja = { x: colX(i), y: Hh + r * (ALTO + SEPARACION), w: 1520, h: ALTO };
      piezas.set(n.id, { id: n.id, col: i, fila: r, caja, baja: r === ns.length - 1 });
      cajas.push({ id: n.id, clase: "nodo", caja });
    });
  });
  const yb = Hh + filas * ALTO + (filas - 1) * SEPARACION;

  const conexiones: Conexion[] = flujosOrdenados
    .filter((f) => piezas.has(f.origen) && piezas.has(f.destino) && f.origen !== f.destino)
    .map((f) => ({ id: f.id, o: f.origen, d: f.destino, modos: [f.modo_id] }));
  const ruteo = rutear(ctx, piezas, conexiones, { nivel: 2, yb, extra: recorrido ? (c) => ({ "data-flujo": c.id }) : undefined });
  const finCarril = ruteo.pistas[ruteo.pistas.length - 1]! + 220;
  const franjasY = finCarril + 400;

  const rotulos: Geometria["rotulos"] = [...ruteo.rotulos];
  const escena: Elemento[] = [guias(capas.length, finCarril), ...cab.escena];
  for (const b of capas) for (const n of nodosDe(ctx, b.id)) escena.push(tarjetaNodo(ctx, n, piezas.get(n.id)!.caja, false, recorrido ? pasosDe(n.id) : [], rotulos));
  escena.push(...ruteo.lineas, ...ruteo.etiquetas);

  if (franjas.length)
    escena.push(g({ class: "dg-rotulo", "aria-hidden": "true", "data-dueno": "franjas" }, [texto("dg-t-num", M, ctx.mono.base(franjasY - 260, 12, 16), 160, unaLinea(ctx, (l) => ctx.textos[l]!.transversales))]));
  let yF = franjasY;
  const filasF: Geometria["filas"] = [];
  for (const b of franjas) {
    const ns = nodosDe(ctx, b.id);
    const k = Math.max(1, ns.length);
    const alto = Math.max(640, 200 + 440 * k + 80 * (k - 1));
    escena.push(cabeceraFranja(ctx, b, yF, alto, W));
    filasF.push({ banda: b.id, y: yF, alto });
    const refs: Referencia[] = [];
    ns.forEach((n, j) => {
      const caja = { x: X_FICHAS, y: yF + 100 + j * (FICHA_H + 80), w: FICHA_W, h: FICHA_H };
      cajas.push({ id: n.id, clase: "ficha", caja });
      escena.push(tarjetaNodo(ctx, n, caja, true, recorrido ? pasosDe(n.id) : [], rotulos));
      for (const f of flujosOrdenados.filter((x) => x.origen === n.id || x.destino === n.id)) {
        const envia = f.origen === n.id;
        const otro = envia ? f.destino : f.origen;
        const p = piezas.get(otro);
        if (!envia && !p) continue; // franja → franja: una sola referencia, en la fila del origen
        refs.push({
          id: `r-${f.id}`,
          flujo: f.id,
          envia,
          modos: [f.modo_id],
          nombre: ctx.nodo.get(otro)!.nombre,
          cx: p ? p.caja.x + 760 : 0,
          cy: caja.y + mitad(FICHA_H),
        });
      }
    });
    // Una referencia por fila: cada fila de ficha coloca las suyas, después de la insignia si la hay.
    for (const cy of [...new Set(refs.map((r) => r.cy))]) {
      const insignia = rotulos.find((r) => r.id.startsWith("vigencia ") && r.caja.y + mitad(r.caja.h) === cy && r.caja.x > X_FICHAS);
      const desde = (insignia ? insignia.caja.x + insignia.caja.w : X_FICHAS + FICHA_W) + 80;
      const r = referencias(ctx, refs.filter((x) => x.cy === cy), desde, W, recorrido !== undefined);
      escena.push(...r.escena);
      rotulos.push(...r.cajas);
    }
    yF += alto + 100;
  }
  const alto: Decimas = franjas.length ? yF - 100 + 80 : finCarril + 80;
  const vista = recorrido ? "recorrido" : "nivel-2";
  const valores = (l: string) => ({
    sujeto: ctx.mapa.sujeto_nombre[l]!,
    capas: capas.length,
    franjas: franjas.length,
    nodos: ctx.mapa.nodos.length,
    recorrido: recorrido?.titulo[l] ?? "",
  });
  return {
    vista,
    sujeto: ctx.mapa.sujeto_id,
    gramatica: ctx.gramatica.id,
    idiomas: ctx.idiomas,
    ancho: W,
    alto,
    columnas: capas.map((b, i) => ({ banda: b.id, x: colX(i), numero: String(i + 1).padStart(2, "0"), nombre: b.nombre })),
    filas: filasF,
    cajas,
    trazados: ruteo.trazados,
    rotulos,
    escena,
    titulo: porIdioma(ctx, (l, t) => plantilla(t.titulo[vista], valores(l))),
    descripcion: porIdioma(ctx, (l, t) => plantilla(t.descripcion[vista], valores(l))),
    ...(recorrido ? { recorrido: { id: recorrido.id, titulo: recorrido.titulo, pasos } } : {}),
    vigencia: resumenVigencia(
      ctx,
      [...capas, ...franjas].flatMap((b) => nodosDe(ctx, b.id)).map((n) => ({ id: n.id, nodos: [n] })),
    ),
    avisos: ctx.avisos,
  };
}
