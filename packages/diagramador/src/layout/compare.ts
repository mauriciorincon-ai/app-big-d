// `compare(maps, grammar, options)` (§ 4.4): el lado a lado. N mapas de la MISMA gramática, una fila por mapa y una
// columna por banda —las capas y después las franjas, en el orden de la gramática—, así cada banda cae en el mismo
// lugar para todos (G5). Cuántos mapas a la vez lo declara el consumidor (`n`, `page`), jamás el motor. Con
// `levelByBand`, la rejilla es la de componentes (152 u) y cada banda en 2 muestra los nodos de cada bloque en todas
// las filas; las demás, su bloque compacto: la fila crece hasta su celda más alta y las columnas no se mueven.
// Sin flujos: el lado a lado compara qué hay en cada banda. Con `marks` (dos versiones de un mapa, § 4.7), cada
// tarjeta lleva una píldora glifo + palabra por clase de cambio (G7).
// Referencia de fidelidad: docs/diseno/lado-a-lado.html (scripts/maqueta/pantallas/lado.mjs) y el boceto aprobado en
// la mirada M1 del S2 (docs/propuestas-de-diseno/lado-mismo-diagrama.html).
import { diff, type Diferencias } from "../diff";
import type { Banda, Gramatica, Mapa, Nodo } from "../tipos";
import { compararCodigo } from "../util/orden";
import { fmt, mitad, type Decimas } from "../util/numeros";
import {
  avisar,
  contexto,
  diasDe,
  peorMadurez,
  plural,
  porIdioma,
  rotuloMadurez,
  vigenciaDe,
  type Contexto,
} from "./contexto";
import { g, path, plantilla, rect, simbolo, texto } from "./escena";
import { elementosDe, nombreElem, tipoDe, type Elem } from "./nivel1";
import { tarjetaNodo } from "./nivel2";
import {
  lineasPorIdioma,
  medidor,
  partir,
  tarjeta,
  unaLinea,
} from "./piezas";
import type {
  Aviso,
  Caja,
  CajaPropia,
  Elemento,
  Geometria,
  OpcionesLayout,
} from "./tipos";

export interface OpcionesCompare extends Omit<
  OpcionesLayout,
  "recorrido" | "group"
> {
  /**
   * Nivel de cada banda (§ 4.4): 2 despliega sus nodos en todas las filas; las que faltan van en 1. Con esta opción
   * la rejilla es la de componentes (152 u) aunque ninguna banda esté en 2, para que desplegar no mueva columnas.
   */
  levelByBand?: Record<string, 1 | 2>;
  /** Mapas por página: la constante de la vista que declara el consumidor (sin ella, todos). */
  n?: number;
  /** Página, desde 1. */
  page?: number;
  /** Solo la cabecera de bandas, solo las filas, o todo (por defecto). */
  part?: "all" | "header" | "rows";
  /** Diferencias entre `maps[0]` (antes) y `maps[1]` (después): marca cada tarjeta que cambió (§ 4.7). */
  marks?: Diferencias;
}

// Constantes de § 5.3 (lado a lado), en décimas.
const M = 80;
const ENTRE_COLUMNAS = 140;
const COL_BLOQUES = 1180;
const COL_COMPONENTES = 1520;
const ROTULO = 260;
const BLOQUE_H = 640;
const NODO_H = 880;
const PILA = 80;
const ENTRE_ELEMENTOS = 140;
const ENTRE_FILAS = { bloques: 140, componentes: 220 };
// Marca de diferencia: píldora de 18 u montada 2 u bajo el borde inferior de su tarjeta (no pisa la fila de abajo de
// la tarjeta, que termina 8 u sobre el borde); con marcas, las tarjetas de una pila se separan lo que ella baja.
const MARCA_H = 180;
const MARCA_BAJA = 20;
const CLASES = ["nuevo", "renombrado", "madurez", "retirado"] as const;
type Clase = (typeof CLASES)[number];

interface Rejilla {
  col: Decimas;
  ancho: Decimas;
  x: (i: number) => Decimas;
}

const rejilla = (n: number, componentes: boolean): Rejilla => {
  const col = componentes ? COL_COMPONENTES : COL_BLOQUES;
  return {
    col,
    ancho: 2 * M + n * col + (n - 1) * ENTRE_COLUMNAS,
    x: (i) => M + i * (col + ENTRE_COLUMNAS),
  };
};

/** Orden de dos versiones semánticas `x.y.z`, por número. */
const compararVersion = (a: string, b: string): number => {
  const x = a.split(".").map(Number),
    y = b.split(".").map(Number);
  return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]!;
};

/**
 * Las filas de esta página: por `sujeto_id` y versión (el mismo orden en todos los idiomas y con cualquier orden de
 * entrada); con `marks`, antes y después.
 */
function filasDe(
  maps: readonly Mapa[],
  grammar: Gramatica,
  o: OpcionesCompare,
): Mapa[] {
  if (!maps.length)
    throw new Error("compare: no hay ningún mapa que comparar");
  for (const m of maps)
    if (m.gramatica_id !== grammar.id)
      throw new Error(
        `compare: «${m.sujeto_id}» es de la gramática «${m.gramatica_id}» y se compara con «${grammar.id}» (§ 4.4)`,
      );
  const vistos = new Set<string>();
  for (const m of maps) {
    const k = `${m.sujeto_id}@${m.version}`;
    if (vistos.has(k))
      throw new Error(`compare: «${m.sujeto_id}» v${m.version} llega dos veces`);
    vistos.add(k);
  }
  if (o.page !== undefined && o.n === undefined)
    throw new Error("compare: «page» pide «n»");
  if (o.marks) {
    if (maps.length !== 2)
      throw new Error(
        "compare: las marcas de diferencia comparan exactamente dos mapas, el anterior y el nuevo",
      );
    if (o.n !== undefined || o.page !== undefined)
      throw new Error(
        "compare: las marcas de diferencia dibujan las dos versiones en una sola página (sin «n» ni «page»)",
      );
    const [a, b] = maps as [Mapa, Mapa];
    if (a.sujeto_id !== b.sujeto_id)
      throw new Error(
        `compare: las marcas comparan dos versiones del mismo sujeto («${a.sujeto_id}» y «${b.sujeto_id}»)`,
      );
    if (JSON.stringify(diff(a, b)) !== JSON.stringify(o.marks))
      throw new Error("compare: «marks» no es diff(maps[0], maps[1])");
  }
  const ordenados = o.marks
    ? [...maps]
    : [...maps].sort(
        (a, b) =>
          compararCodigo(a.sujeto_id, b.sujeto_id) ||
          compararVersion(a.version, b.version),
      );
  if (o.n === undefined) return ordenados;
  if (!Number.isInteger(o.n) || o.n < 1)
    throw new Error(`compare: «n» es un entero mayor que 0 (llegó ${o.n})`);
  const paginas = Math.max(1, Math.ceil(ordenados.length / o.n));
  const page = o.page ?? 1;
  if (!Number.isInteger(page) || page < 1 || page > paginas)
    throw new Error(`compare: la página ${page} no existe (hay ${paginas})`);
  return ordenados.slice((page - 1) * o.n, page * o.n);
}

/** Espacio de nombres de cada fila (D12): el sujeto; si se repite (dos versiones), también su versión. */
function prefijos(filas: readonly Mapa[]): string[] {
  return filas.map((m) =>
    filas.filter((x) => x.sujeto_id === m.sujeto_id).length > 1
      ? `${m.sujeto_id}-v${m.version.replace(/\./g, "-")}`
      : m.sujeto_id,
  );
}

/** Ids y dueños de una fila con su prefijo (D12: en el lado a lado, los ids llevan un prefijo por mapa). */
function prefijar(e: Elemento, pre: string): Elemento {
  const attrs = { ...e.attrs };
  if (typeof attrs.id === "string") attrs.id = `${pre}--${attrs.id}`;
  if (typeof attrs["data-dueno"] === "string")
    attrs["data-dueno"] = `${pre}/${attrs["data-dueno"]}`;
  return { ...e, attrs, hijos: e.hijos?.map((h) => prefijar(h, pre)) };
}

/** Clases de cambio de un nodo en la fila `k` (0 = antes, 1 = después). */
function clasesDe(
  marks: Diferencias | undefined,
  k: number,
  nodo: string,
): Clase[] {
  if (!marks) return [];
  const d = marks.nodos;
  if (k === 0) return d.retirados.includes(nodo) ? ["retirado"] : [];
  const out: Clase[] = [];
  if (d.nuevos.includes(nodo)) out.push("nuevo");
  if (d.renombrados.some((r) => r.id === nodo)) out.push("renombrado");
  if (d.madurez.some((r) => r.id === nodo)) out.push("madurez");
  return out;
}

/** Píldoras glifo + palabra bajo el borde inferior de una tarjeta, de derecha a izquierda (§ 4.7, G7). */
/** Posición de cada píldora: de derecha a izquierda dentro del ancho de la tarjeta; si no cabe, otra fila debajo. */
function colocarPildoras(ctx: Contexto, caja: Caja, clases: readonly Clase[]): { c: Clase; p: Caja }[] {
  const out: { c: Clase; p: Caja }[] = [];
  const tope = caja.x + caja.w - 60;
  let derecha = tope;
  let cy = caja.y + caja.h + MARCA_BAJA;
  for (const c of CLASES.filter((x) => clases.includes(x))) {
    const tw = Math.max(...ctx.idiomas.map((l) => ctx.mono.ancho(ctx.textos[l]!.lado.marcas[c], 11, 700)));
    const w = 220 + tw + 80;
    if (derecha - w < caja.x + 60 && derecha !== tope) {
      derecha = tope;
      cy += MARCA_H + 40;
    }
    out.push({ c, p: { x: derecha - w, y: cy - mitad(MARCA_H), w, h: MARCA_H } });
    derecha -= w + 40;
  }
  return out;
}

/** Cuánto baja lo que cuelga bajo una tarjeta: sus píldoras (0 si no tiene). */
function bajoDe(ctx: Contexto, caja: Caja, clases: readonly Clase[]): Decimas {
  const ps = colocarPildoras(ctx, caja, clases);
  return ps.length ? Math.max(...ps.map(({ p }) => p.y + p.h)) - (caja.y + caja.h) : 0;
}

/** Píldoras glifo + palabra bajo el borde inferior de una tarjeta (§ 4.7, G7): no pisan su fila de abajo. */
function pildoras(ctx: Contexto, caja: Caja, clases: readonly Clase[], dueno: string, rotulos: Geometria["rotulos"]): Elemento[] {
  return colocarPildoras(ctx, caja, clases).map(({ c, p }) => {
    const cy = p.y + mitad(p.h);
    rotulos.push({ id: `marca ${c} ${dueno}`, dueno, caja: p });
    return g({ class: `dg-dif dg-dif-${c}`, "aria-hidden": "true", "data-dueno": dueno, "data-marca": c }, [
      rect({ x: p.x, y: p.y, width: p.w, height: p.h, rx: mitad(MARCA_H) }),
      simbolo(`d-${c}`, p.x + 110, cy, "dg-dif-marca"),
      texto("dg-t-dif", p.x + 200, ctx.mono.base(cy - 70, 11, 14), 0, unaLinea(ctx, (l) => ctx.textos[l]!.lado.marcas[c])),
    ]);
  });
}

const palabrasMarcas = (ctx: Contexto, clases: readonly Clase[], l: string) =>
  CLASES.filter((c) => clases.includes(c)).map(
    (c) => ctx.textos[l]!.lado.marcas[c],
  );

/** Bloque compacto (el del lado a lado de la maqueta): glifo, nombre en 12/700 y la cuenta con la madurez más baja. */
function bloqueCompacto(
  ctx: Contexto,
  e: Elem,
  caja: Caja,
  clases: Clase[],
  cajas: CajaPropia[],
  rotulos: Geometria["rotulos"],
): Elemento {
  const { x, y, w, h } = caja;
  const tp = tipoDe(ctx, e);
  const hijos: Elemento[] = [...tarjeta(caja, tp.token_color, e.fantasma)];
  const dias = diasDe(ctx, e.nodos);
  const estado = vigenciaDe(ctx, dias);
  // Sin insignia de vigencia: en el lado a lado el estado va en palabras en el rótulo de la fila (como la maqueta).
  if (tp.glifo)
    hijos.push(
      simbolo(
        `g-${tp.glifo}`,
        x + 160,
        ctx.sans.base(y + 80, 12, 15) - 40,
        `dg-c-${tp.token_color}`,
      ),
    );
  const nombre = Object.fromEntries(
    ctx.idiomas.map((l) => [l, nombreElem(ctx, e, l)]),
  );
  if (ctx.idiomas.some((l) => nombre[l]))
    hijos.push(
      texto(
        "dg-t-nombre dg-t-nombre-nodo",
        x + 280,
        ctx.sans.base(y + 80, 12, 15),
        150,
        lineasPorIdioma(
          ctx,
          nombre,
          12,
          700,
          w - 280 - 60,
          2,
          `nombre de ${e.id}`,
        ),
      ),
    );
  // Fila inferior: la cuenta y, si no es disponible, la madurez más baja tras la cuenta MEDIDA (la maqueta la fijaba a
  // 52 u y a 118 u rozaba «comp.»; ajuste del boceto M1). Si las dos no caben, manda la madurez.
  const yr = y + h - 80 - 140;
  const cuenta = unaLinea(ctx, (l) =>
    plural(ctx.textos[l]!.lado.comp, e.nodos.length),
  );
  const peor = peorMadurez(ctx, e.nodos);
  const conMadurez = peor !== undefined && !peor.disponible;
  const cw = Math.max(
    ...ctx.idiomas.map((l) => ctx.sans.ancho(cuenta[l]![0]!, 11, 400)),
  );
  const mw = conMadurez
    ? Math.max(
        ...ctx.idiomas.map((l) =>
          ctx.sans.ancho(rotuloMadurez(peor, l), 11, 400),
        ),
      )
    : 0;
  const caben = !conMadurez || 100 + cw + 100 + 80 + mw <= w - 80;
  if (caben)
    hijos.push(
      texto(
        "dg-t-meta dg-t-meta-compacta",
        x + 100,
        ctx.sans.base(yr, 11, 14),
        140,
        cuenta,
      ),
    );
  if (conMadurez) {
    const mx = caben ? x + 100 + cw + 100 : x + 140;
    hijos.push(medidor(peor.nivel, mx, yr + 70));
    const max = x + w - 80 - (mx + 80);
    hijos.push(
      texto(
        "dg-t-meta dg-t-meta-compacta",
        mx + 80,
        ctx.sans.base(yr, 11, 14),
        140,
        unaLinea(ctx, (l) =>
          ctx.sans.abreviar(rotuloMadurez(peor, l), 11, 400, max),
        ),
      ),
    );
  }
  hijos.push(...pildoras(ctx, caja, clases, e.id, rotulos));
  cajas.push({ id: e.id, clase: "bloque", caja });
  const aria = porIdioma(ctx, (l, t) => {
    const base = `${nombre[l] || e.banda.nombre[l]}: ${plural(t.componentes, e.nodos.length)}${conMadurez ? `, ${peor.nombre[l]!.toLowerCase()}` : ""}. ${t.componentesDe}: ${e.nodos.map((n) => n.nombre[l]).join(", ")}.`;
    const vig =
      estado === "vigente"
        ? ""
        : ` ${plantilla(estado === "revisar" ? t.porRevisar : t.vencido, { n: dias })}`;
    const marcas = palabrasMarcas(ctx, clases, l);
    return `${base}${vig}${marcas.length ? ` ${marcas.join(", ")}.` : ""}`;
  });
  return g(
    {
      id: `e-${e.id}`,
      class: e.fantasma
        ? "dg-elem dg-lado-bloque dg-elem-fantasma"
        : "dg-elem dg-lado-bloque",
      role: "graphics-symbol img",
      tabindex: "0",
      "aria-label": aria,
      "data-dueno": e.id,
      "data-nodos": e.nodos.map((n) => n.id).join(" "),
    },
    hijos,
  );
}

/**
 * Una banda sin componentes en esta fila: tarjeta punteada que no se activa (no abre nada). Su texto se mide: en la
 * rejilla de bloques (118 u) «sin componentes» ocupa dos líneas, centradas en la tarjeta.
 */
function vacia(ctx: Contexto, b: Banda, caja: Caja): Elemento {
  const lineas = lineasPorIdioma(
    ctx,
    Object.fromEntries(
      ctx.idiomas.map((l) => [l, ctx.textos[l]!.lado.sinComponentes]),
    ),
    12,
    400,
    caja.w - 240,
    2,
    `vacia ${b.id}`,
  );
  const n = Math.max(...ctx.idiomas.map((l) => lineas[l]!.length));
  return g(
    {
      id: `vacia-${b.id}`,
      class: "dg-lado-vacia",
      role: "img",
      "aria-label": porIdioma(
        ctx,
        (l, t) => `${b.nombre[l]}: ${t.lado.sinComponentes}`,
      ),
      "data-dueno": b.id,
    },
    [
      ...tarjeta(caja, "ninguno", true).slice(0, 1),
      texto(
        "dg-t-meta dg-t-meta-compacta",
        caja.x + 120,
        ctx.sans.base(caja.y + mitad(caja.h - n * 160), 12, 16),
        160,
        lineas,
      ),
    ],
  );
}

interface Celda {
  alto: Decimas;
  dibujar: (x: Decimas, y: Decimas) => Elemento[];
}

/**
 * Apila tarjetas de alto `h` desde `y`: entre una y la siguiente, 8 u, o lo que cuelga bajo la de arriba más 6 u. Da
 * la `y` de cada una y el alto total, contando lo que cuelga bajo la última.
 */
function apilar(ctx: Contexto, x: Decimas, w: Decimas, h: Decimas, clases: readonly Clase[][]): { ys: Decimas[]; alto: Decimas } {
  const ys: Decimas[] = [];
  let y = 0;
  clases.forEach((cl, i) => {
    ys.push(y);
    const bajo = bajoDe(ctx, { x, y, w, h }, cl);
    y += h + (i < clases.length - 1 ? (bajo ? bajo + 60 : PILA) : bajo);
  });
  return { ys, alto: y };
}

/** La celda de una banda en una fila: sus elementos del nivel 1 en bloques compactos, o desplegados en sus nodos. */
function celda(ctx: Contexto, b: Banda, nivel: 1 | 2, col: Decimas, k: number, marks: Diferencias | undefined, cajas: CajaPropia[], rotulos: Geometria["rotulos"]): Celda {
  const es = elementosDe(ctx, b);
  const clasesElem = (e: Elem) => [...new Set(e.nodos.flatMap((n) => clasesDe(marks, k, n.id)))];
  if (nivel === 1) {
    if (!es.length) return { alto: BLOQUE_H, dibujar: (x, y) => [vacia(ctx, b, { x, y, w: col, h: BLOQUE_H })] };
    const pila = apilar(ctx, 0, col, BLOQUE_H, es.map(clasesElem));
    return {
      alto: pila.alto,
      dibujar: (x, y) => es.map((e, i) => bloqueCompacto(ctx, e, { x, y: y + pila.ys[i]!, w: col, h: BLOQUE_H }, clasesElem(e), cajas, rotulos)),
    };
  }
  // Nivel 2: por elemento, su nombre (el del bloque; «sin bloque» para los sueltos) y su pila de nodos de 152 × 88.
  const cabeza = (e: Elem | undefined) => {
    const nombre = Object.fromEntries(ctx.idiomas.map((l) => [l, e?.bloque ? e.bloque.nombre[l]! : ctx.textos[l]!.sinBloque]));
    return lineasPorIdioma(ctx, nombre, 12, 700, col, 2, `cabecera de ${e?.id ?? b.id}`);
  };
  const altoCabeza = (lineas: Record<string, string[]>) => Math.max(...ctx.idiomas.map((l) => lineas[l]!.length)) * 160 + 60;
  if (!es.length) {
    const cab = cabeza(undefined);
    const ac = altoCabeza(cab);
    return {
      alto: ac + NODO_H,
      dibujar: (x, y) => [vacia(ctx, b, { x, y: y + ac, w: col, h: NODO_H })],
    };
  }
  const partes = es.map((e) => {
    const cab = cabeza(e);
    const ac = altoCabeza(cab);
    const pila = apilar(ctx, 0, col, NODO_H, e.nodos.map((n) => clasesDe(marks, k, n.id)));
    return { e, cab, ac, pila, alto: ac + pila.alto };
  });
  return {
    alto: partes.reduce((a, p) => a + p.alto, 0) + (partes.length - 1) * ENTRE_ELEMENTOS,
    dibujar: (x, y) => {
      const out: Elemento[] = [];
      let yy = y;
      for (const p of partes) {
        out.push(texto("dg-t-meta dg-t-cab-bloque", x, ctx.sans.base(yy, 12, 16), 160, p.cab));
        p.e.nodos.forEach((n: Nodo, i) => {
          const caja = { x, y: yy + p.ac + p.pila.ys[i]!, w: col, h: NODO_H };
          cajas.push({ id: n.id, clase: "nodo", caja });
          const t = tarjetaNodo(ctx, n, caja, false, [], rotulos, true);
          out.push({ ...t, attrs: { ...t.attrs, class: `${t.attrs.class} dg-lado-nodo` }, hijos: [...(t.hijos ?? []), ...pildoras(ctx, caja, clasesDe(marks, k, n.id), n.id, rotulos)] });
        });
        yy += p.alto + ENTRE_ELEMENTOS;
      }
      return out;
    },
  };
}

export function compare(
  maps: readonly Mapa[],
  grammar: Gramatica,
  options: OpcionesCompare,
): Geometria {
  const filas = filasDe(maps, grammar, options);
  const parte = options.part ?? "all";
  const base = contexto(filas[0]!, grammar, options, "compare");
  if (base.carriles.length)
    throw new Error(
      "compare: una gramática de carriles no tiene lado a lado todavía",
    );
  const bandas = [...base.capas, ...base.transversales];
  for (const id of Object.keys(options.levelByBand ?? {}))
    if (!bandas.some((b) => b.id === id))
      throw new Error(
        `compare: «${id}» no es una banda de la gramática «${grammar.id}» (levelByBand)`,
      );
  for (const [id, v] of Object.entries(options.levelByBand ?? {}))
    if (v !== 1 && v !== 2)
      throw new Error(
        `compare: el nivel de «${id}» es 1 o 2 (llegó ${String(v)})`,
      );
  const nivel = (b: Banda): 1 | 2 => options.levelByBand?.[b.id] ?? 1;
  const desplegada = bandas.some((b) => nivel(b) === 2);
  const R = rejilla(bandas.length, options.levelByBand !== undefined);
  const escena: Elemento[] = [];
  const cajas: CajaPropia[] = [];
  const rotulos: Geometria["rotulos"] = [];

  // ── Cabecera: número y nombre de cada banda; las franjas llevan «·» y una guía las separa de las capas ──
  let alto = 0;
  if (parte !== "rows") {
    const nombres = bandas.map((b) =>
      Object.fromEntries(
        base.idiomas.map((l) => [
          l,
          partir(base, b.nombre[l]!, 13, 700, R.col, `cabecera ${b.id}`, l),
        ]),
      ),
    );
    const lineas = Math.max(
      1,
      ...nombres.flatMap((n) => Object.values(n).map((x) => x.length)),
    );
    alto = 40 + 140 + 40 + lineas * 160 + 140;
    bandas.forEach((b, i) => {
      const x = R.x(i);
      const num = `${String(i + 1).padStart(2, "0")}${b.clase === "transversal" ? " ·" : ""}`;
      escena.push(
        g(
          {
            id: `b-${b.id}`,
            role: "group",
            "aria-label": porIdioma(
              base,
              (l) => `${b.nombre[l]}: ${b.pregunta_lider[l]}`,
            ),
            "data-dueno": b.id,
          },
          [
            texto(
              "dg-t-num",
              x,
              base.mono.base(40, 12, 14),
              140,
              unaLinea(base, () => num),
            ),
            texto(
              "dg-t-banda dg-t-banda-lado",
              x,
              base.sans.base(220, 13, 16),
              160,
              nombres[i]!,
            ),
          ],
        ),
      );
    });
  }

  // ── Filas: rótulo (nombre + versión y vigencia) y una celda por banda ──
  // Un contexto por fila, aparte del de la cabecera y § 5.6: así cada aviso sabe de qué fila es (D12).
  const ctxs = filas.map((m) => contexto(m, grammar, options, "compare"));
  const pres = prefijos(filas);
  const entre = desplegada ? ENTRE_FILAS.componentes : ENTRE_FILAS.bloques;
  const geoFilas: Geometria["filas"] = [];
  const vigencias: Geometria["vigencia"]["elementos"] = [];
  let y = alto;
  (parte === "header" ? [] : filas).forEach((m, k) => {
    const ctx = ctxs[k]!;
    const pre = pres[k]!;
    const misCajas: CajaPropia[] = [];
    const misRotulos: Geometria["rotulos"] = [];
    const celdas = bandas.map((b) =>
      celda(
        ctx,
        b,
        nivel(b),
        R.col,
        k,
        options.marks,
        misCajas,
        misRotulos,
      ),
    );
    const h = ROTULO + Math.max(...celdas.map((c) => c.alto));
    const dias = diasDe(ctx, m.nodos);
    const estado = vigenciaDe(ctx, dias);
    vigencias.push({ id: pre, dias, estado });
    const meta = porIdioma(ctx, (_l, t) =>
      plantilla(
        estado === "vigente"
          ? plural(t.lado.fila, dias)
          : estado === "revisar"
            ? t.lado.filaRevisar
            : t.lado.filaVencido,
        { version: m.version, n: dias },
      ),
    );
    const nw = Math.max(
      ...ctx.idiomas.map((l) => ctx.sans.ancho(m.sujeto_nombre[l]!, 13, 700)),
    );
    const mx = M + 40 + nw + 100;
    const mw = Math.max(
      ...ctx.idiomas.map((l) => ctx.mono.ancho(meta[l]!, 11, 400)),
    );
    if (mx + mw > R.ancho - M)
      avisar(
        ctx,
        "texto",
        pre,
        `rótulo de ${pre}: ${Math.ceil((mx + mw - (R.ancho - M)) / 10)} u más que la fila`,
      );
    const hijos: Elemento[] = [
      path({
        class: "dg-franja-filete",
        d: `M${fmt(M)},${fmt(y)} H${fmt(R.ancho - M)}`,
      }),
      texto(
        "dg-t-banda dg-t-fila-lado",
        M,
        ctx.sans.base(y + 40, 13, 18),
        180,
        unaLinea(ctx, (l) => m.sujeto_nombre[l]!),
      ),
      texto(
        "dg-t-fila-meta",
        mx,
        ctx.mono.base(y + 50, 11, 16),
        160,
        unaLinea(ctx, (l) => meta[l]!),
      ),
    ];
    bandas.forEach((_b, i) =>
      hijos.push(...celdas[i]!.dibujar(R.x(i), y + ROTULO)),
    );
    escena.push(
      prefijar(
        g(
          {
            id: "fila",
            role: "group",
            "aria-label": porIdioma(
              ctx,
              (l) => `${m.sujeto_nombre[l]}: ${meta[l]}`,
            ),
            "data-dueno": m.sujeto_id,
            "data-mapa": m.sujeto_id,
          },
          hijos,
        ),
        pre,
      ),
    );
    for (const c of misCajas) cajas.push({ ...c, id: `${pre}/${c.id}` });
    for (const r of misRotulos)
      rotulos.push({ ...r, id: `${pre}/${r.id}`, dueno: `${pre}/${r.dueno}` });
    geoFilas.push({ banda: pre, y, alto: h });
    y += h + entre;
  });
  if (filas.length) y -= entre;
  const H = (parte === "header" ? alto : y) + (parte === "header" ? 0 : 80);
  if (
    parte !== "rows" &&
    bandas.some((b) => b.clase === "transversal") &&
    base.capas.length
  )
    escena.splice(
      bandas.length,
      0,
      path({
        class: "dg-guia",
        d: `M${fmt(R.x(base.capas.length) - mitad(ENTRE_COLUMNAS))},0 V${fmt(H - 80)}`,
      }),
    );

  // ── § 5.6 sobre lo dibujado: ninguna píldora ni insignia encima de una tarjeta ajena; nada fuera del lienzo ──
  const cruza = (p: Caja, q: Caja) =>
    p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
  for (const r of rotulos)
    for (const c of cajas)
      if (c.id !== r.dueno && cruza(r.caja, c.caja))
        avisar(base, "encima", r.id, `${r.id} sobre la caja de ${c.id}`);
  for (const c of [
    ...cajas.map((x) => ({ id: x.id, caja: x.caja })),
    ...rotulos,
  ])
    if (
      c.caja.x < 0 ||
      c.caja.y < 0 ||
      c.caja.x + c.caja.w > R.ancho ||
      c.caja.y + c.caja.h > H
    )
      avisar(base, "fuera-del-lienzo", c.id, c.id);

  const avisos: Aviso[] = [...base.avisos];
  ctxs.forEach((c, k) => {
    const p = pres[k]!;
    for (const a of c.avisos) {
      const id =
        a.id === p || a.id.startsWith(`${p}/`) ? a.id : `${p}/${a.id}`;
      if (!avisos.some((x) => x.id === id && x.mensaje === a.mensaje))
        avisos.push({ ...a, id });
    }
  });
  const peor = vigencias.reduce((a, v) => Math.max(a, v.dias), 0);
  const lista = (l: string) => {
    const ns = filas.map((m) => m.sujeto_nombre[l]!);
    return ns.length > 1
      ? `${ns.slice(0, -1).join(", ")}${base.textos[l]!.y}${ns[ns.length - 1]}`
      : (ns[0] ?? "");
  };
  const valores = (l: string) => ({
    sujetos: lista(l),
    mapas: filas.length,
    capas: base.capas.length,
    franjas: base.transversales.length,
  });
  return {
    vista: "compare",
    variante: options.levelByBand ? (desplegada ? "n2" : "n1") : undefined,
    sujeto: parte === "header" ? "bandas" : pres.join("_") || "lado",
    gramatica: grammar.id,
    idiomas: base.idiomas,
    ancho: R.ancho,
    alto: H,
    columnas: bandas.map((b, i) => ({
      banda: b.id,
      x: R.x(i),
      numero: String(i + 1).padStart(2, "0"),
      nombre: b.nombre,
    })),
    filas: geoFilas,
    cajas,
    trazados: [],
    rotulos,
    escena,
    titulo: porIdioma(base, (l, t) => plantilla(t.titulo.compare, valores(l))),
    descripcion: porIdioma(base, (l, t) =>
      plantilla(t.descripcion.compare, valores(l)),
    ),
    vigencia: {
      dias: peor,
      estado: vigenciaDe(base, peor),
      elementos: vigencias,
    },
    cruces: [],
    avisos,
  };
}
