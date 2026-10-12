import { METRICAS_PILOTO } from "diagramador";

// El diagrama de ondas del plan (maqueta `decisiones.html`, scripts/maqueta/pantallas/m4-comun.mjs `svgOndas`): una
// columna por onda de Kahn, una tarjeta por decisión, una línea por «depende de» con ruteo ortogonal por los huecos entre
// columnas y carriles arriba y abajo para los saltos, y los cruces contados (D11: ninguna línea atraviesa una tarjeta
// ajena). Se genera en el build, una vez por idioma, con la tabla de métricas de la fuente servida (G15): jamás se mide
// el texto en el navegador. Reversibilidad = glifo + palabra + borde (grueso, discontinuo, fino), nunca color solo.
// Un ciclo se dibuja con sus flechas discontinuas y las decisiones que bloquea quedan en la columna «sin onda».

type Reversibilidad = "una_via" | "costosa" | "dos_vias";
type P = [number, number];

const G = {
  M: 8,
  colW: 224,
  gap: 72,
  cabH: 50,
  cH: 112,
  vG: 32,
  pad: 12,
  lane: 22,
};
export const REV_D: Record<Reversibilidad, string> = {
  una_via: "M-6.5,0 H3.5 M0.5,-3.5 L4,0 L0.5,3.5 M6.5,-5 V5",
  costosa: "M-6.5,-2.5 H5 M2,-5.5 L5.5,-2.5 L2,0.5 M5,3.5 H-1",
  dos_vias:
    "M-6,-2.5 H6 M3,-5.5 L6,-2.5 L3,0.5 M6,2.5 H-6 M-3,-0.5 L-6,2.5 L-3,5.5",
};
export const IMPL_D = "M0,-5 V1.5 M0,4.2 V4.6";
/** S5-B-9: las líneas de pregunta con las que se dibuja `G.cH` (la altura base de una tarjeta); cada línea de más suma `LINEA_H`. */
const LINEAS_BASE = 3;
const LINEA_H = 18;
const SUP_D = "M-5,-5.5 H5 V5.5 H-5 Z M-2.5,-2 H2.5 M-2.5,1 H1";

export interface NodoOndas {
  id: string;
  nombre: string;
  reversibilidad: Reversibilidad;
  implicita: boolean;
  /** El estado ya escrito en el idioma de la página. */
  estado: string;
  /** Hay un supuesto sin probar que frena esta decisión. */
  sinProbar: boolean;
  /** La descripción accesible completa de la tarjeta. */
  aria: string;
}
export interface ColumnaOndas {
  titulo: string;
  sub: string;
  ids: readonly string[];
}
export interface EtiquetasOndas {
  reversibilidad: Record<Reversibilidad, string>;
  implicita: string;
  sinProbar: string;
  enCiclo: string;
  sinOnda: string;
}
export interface EntradaOndas {
  id: string;
  columnas: readonly ColumnaOndas[];
  nodos: Readonly<Record<string, NodoOndas>>;
  /** id → las decisiones de que depende. */
  depende_de: Readonly<Record<string, readonly string[]>>;
  /** El camino del ciclo, si lo hay (se marca); las bloqueadas son las que quedaron sin onda. */
  ciclo: readonly string[];
  bloqueadas: readonly string[];
  etiquetas: EtiquetasOndas;
  aria: string;
  idioma: string;
}
export interface SalidaOndas {
  svg: string;
  ancho: number;
  alto: number;
  /** Tramos que atraviesan una tarjeta ajena (D11): debe ser 0. */
  cruces: number;
  /** Cruces entre líneas (informativo). */
  entre: number;
  /** Para el índice «Ir a una onda»: el id de cada columna y su x. */
  columnas: { id: string; x: number; titulo: string }[];
}

// --- medición de texto (G15): suma de avances de la tabla de la fuente, con el 3 % de la tabla sin kerning ---
const FUENTE = METRICAS_PILOTO.fuentes["space-grotesk"]!;
function medir(texto: string, tamano: number, peso: number): number {
  let suma = 0;
  for (const c of texto) {
    const a = FUENTE.pesos[String(peso)]?.[String(c.codePointAt(0))];
    if (a === undefined)
      throw new Error(
        `plan: el carácter «${c}» de «${texto}» no está en la tabla de métricas de la fuente`,
      );
    suma += a;
  }
  return (suma * tamano * 1.03) / FUENTE.unidades_por_em;
}
function partir(
  texto: string,
  tamano: number,
  peso: number,
  max: number,
): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (medir(prueba, tamano, peso) <= max) actual = prueba;
    else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}
/** Línea base de un texto de `tamano` centrado en una caja de línea `lh` que empieza en `arriba`. */
const base = (arriba: number, tamano: number, lh: number) =>
  arriba + (lh - 1.3 * tamano) / 2 + 0.984 * tamano;

const r1 = (n: number) => Math.round(n * 10) / 10;
const esc = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Línea con esquinas redondeadas (los tramos son ortogonales: el largo es la suma de lo recorrido en cada eje). */
function camino(pts: P[], r = 6): string {
  const p = pts.filter(
    (q, i) => i === 0 || q[0] !== pts[i - 1]![0] || q[1] !== pts[i - 1]![1],
  );
  let d = `M${r1(p[0]![0])},${r1(p[0]![1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [a, b, c] = [p[i - 1]!, p[i]!, p[i + 1]!];
    const l1 = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    const l2 = Math.abs(c[0] - b[0]) + Math.abs(c[1] - b[1]);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const u1 = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1];
    const u2 = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
    d += ` L${r1(b[0] - u1[0]! * rr)},${r1(b[1] - u1[1]! * rr)} Q${r1(b[0])},${r1(b[1])} ${r1(b[0] + u2[0]! * rr)},${r1(b[1] + u2[1]! * rr)}`;
  }
  const z = p[p.length - 1]!;
  return `${d} L${r1(z[0])},${r1(z[1])}`;
}
/** Acorta el último tramo `k` unidades para la punta de flecha y devuelve la punta. */
function conFlecha(pts: P[], k = 7): { p: P[]; tri: string } {
  const p = pts.map((q) => [...q] as P);
  const z = p[p.length - 1]!;
  const y = p[p.length - 2]!;
  const L = Math.abs(z[0] - y[0]) + Math.abs(z[1] - y[1]);
  const u = [(z[0] - y[0]) / L, (z[1] - y[1]) / L];
  const b = [z[0] - u[0]! * 9, z[1] - u[1]! * 9];
  const n = [-u[1]! * 4.5, u[0]! * 4.5];
  p[p.length - 1] = [z[0] - u[0]! * k, z[1] - u[1]! * k];
  return {
    p,
    tri: `M${r1(z[0])},${r1(z[1])} L${r1(b[0]! + n[0]!)},${r1(b[1]! + n[1]!)} L${r1(b[0]! - n[0]!)},${r1(b[1]! - n[1]!)} Z`,
  };
}
/** ¿El tramo ortogonal atraviesa la caja [x, y, ancho, alto]? */
function tramoCruzaCaja(
  a: P,
  b: P,
  c: [number, number, number, number],
): boolean {
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return (
    x1 < c[0] + c[2] - 0.5 &&
    x2 > c[0] + 0.5 &&
    y1 < c[1] + c[3] - 0.5 &&
    y2 > c[1] + 0.5
  );
}

interface Posicion {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Arista {
  u: string;
  v: string;
  ciclo: boolean;
  arriba?: number;
  carril?: number;
  tramo?: "baja" | "sube";
}

export function svgOndas(e: EntradaOndas): SalidaOndas {
  const cols = e.columnas;
  // Una tarjeta crece lo que haga falta para que su pregunta quepa entera sin pisar el pie: todas con la misma altura.
  const lineasDe = (id: string) => partir(e.nodos[id]!.nombre, 14, 700, G.colW - 2 * G.pad).length;
  const maxLineas = Math.max(LINEAS_BASE, ...cols.flatMap((c) => c.ids.map(lineasDe)));
  const cH = G.cH + (maxLineas - LINEAS_BASE) * LINEA_H;
  const ancho0 = 2 * G.M + cols.length * G.colW + (cols.length - 1) * G.gap;
  const colX = (i: number) => G.M + i * (G.colW + G.gap);
  const pos: Record<string, Posicion> = {};
  cols.forEach((c, i) =>
    c.ids.forEach(
      (id, k) =>
        (pos[id] = { col: i, row: k, x: colX(i), y: 0, w: G.colW, h: cH }),
    ),
  );
  const enCiclo = new Set(e.ciclo);
  // Aristas u → v («v depende de u»: se dibuja de la anterior a la que depende).
  const aristas: Arista[] = [];
  for (const [v, deps] of Object.entries(e.depende_de))
    for (const u of deps)
      if (pos[u] && pos[v])
        aristas.push({ u, v, ciclo: enCiclo.has(u) && enCiclo.has(v) });
  // Una flecha entre tarjetas NO contiguas de una misma columna (un ciclo de tres o más) sale por la derecha y vuelve por un
  // carril del hueco, para no atravesar las tarjetas de en medio; el ancho reserva esos carriles.
  const esLarga = (a: Arista) => pos[a.u]!.col === pos[a.v]!.col && Math.abs(pos[a.u]!.row - pos[a.v]!.row) > 1;
  const largas = aristas.filter(esLarga).length;
  const W = ancho0 + (largas ? 12 + largas * 8 : 0);
  let carrilLarga = 0;
  // Saltos de columna: entre dos tarjetas de la primera fila van por un carril SUPERIOR (bajo los títulos); los demás, por
  // el carril inferior. Así ningún salto corta las dependencias de las filas de abajo.
  let arriba = 0;
  for (const a of aristas) {
    const pu = pos[a.u]!;
    const pv = pos[a.v]!;
    if (pv.col > pu.col + 1 && pu.row === 0 && pv.row === 0)
      a.arriba = arriba++;
  }
  const cabH = G.cabH + (arriba ? 6 + arriba * G.lane : 0);
  for (const id in pos) pos[id]!.y = cabH + pos[id]!.row * (cH + G.vG);
  const filas = Math.max(1, ...cols.map((c) => c.ids.length));
  const baseCards = cabH + filas * (cH + G.vG) - G.vG;
  // Puertos: salidas por la derecha, entradas por la izquierda, repartidos y ordenados por la y del otro extremo.
  const sal: Record<string, Arista[]> = {};
  const ent: Record<string, Arista[]> = {};
  for (const a of aristas) {
    if (pos[a.u]!.col === pos[a.v]!.col) continue;
    (sal[a.u] ??= []).push(a);
    (ent[a.v] ??= []).push(a);
  }
  for (const k in sal) sal[k]!.sort((a, b) => pos[a.v]!.y - pos[b.v]!.y);
  for (const k in ent)
    ent[k]!.sort((a, b) =>
      pos[a.u]!.col === pos[b.u]!.col
        ? pos[a.u]!.y - pos[b.u]!.y
        : pos[b.u]!.col - pos[a.u]!.col,
    );
  const py = (id: string, lista: Arista[], a: Arista) => {
    const p = pos[id]!;
    return p.y + (p.h * (lista.indexOf(a) + 1)) / (lista.length + 1);
  };
  // Pistas por hueco (el hueco g está entre la columna g y la g + 1).
  const pistas: Record<number, Arista[]> = {};
  const pedir = (g: number, a: Arista) => (pistas[g] ??= []).push(a);
  let carriles = 0;
  for (const a of aristas) {
    const cu = pos[a.u]!.col;
    const cv = pos[a.v]!.col;
    if (cu === cv) continue;
    if (cv === cu + 1) pedir(cu, a);
    else {
      pedir(cu, { ...a, tramo: "baja" });
      pedir(cv - 1, { ...a, tramo: "sube" });
      if (a.arriba === undefined) a.carril = carriles++;
    }
  }
  const pistaX = (g: number, a: Arista, tramo?: "baja" | "sube") => {
    const l = pistas[g]!;
    const i = l.findIndex(
      (q) =>
        q.u === a.u && q.v === a.v && (q.tramo ?? null) === (tramo ?? null),
    );
    return colX(g) + G.colW + (G.gap * (i + 1)) / (l.length + 1);
  };
  const H = baseCards + (carriles ? 14 + carriles * G.lane : 0) + 16;

  const texto = (
    lineas: string[],
    x: number,
    arribaT: number,
    tamano: number,
    lh: number,
    clase: string,
  ) => {
    const y0 = base(arribaT, tamano, lh);
    return `<text lang="${e.idioma}" class="${clase}">${lineas.map((s, i) => `<tspan x="${r1(x)}" y="${r1(y0 + i * lh)}">${esc(s)}</tspan>`).join("")}</text>`;
  };
  const texto1 = (
    s: string,
    x: number,
    arribaT: number,
    tamano: number,
    lh: number,
    clase: string,
  ) => texto([s], x, arribaT, tamano, lh, clase);

  let s = `<svg class="dir-svg dir-b" data-lienzo="${e.id}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="graphics-document document" aria-label="${esc(e.aria)}">`;
  s += `<defs><path id="dd-impl" d="${IMPL_D}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>${(Object.entries(REV_D) as [Reversibilidad, string][]).map(([k, d]) => `<path id="dd-rev-${k}" d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}<path id="dd-sup" d="${SUP_D}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></defs>`;
  cols.forEach((c, i) => {
    const x = colX(i);
    s += `<g data-dueno="onda-${i}">${texto1(c.titulo, x, 4, 12, 16, "db-t-num")}${texto1(c.sub, x, 22, 13, 18, "db-t-meta")}</g>`;
    if (i < cols.length - 1)
      s += `<path class="db-guia" d="M${x + G.colW + G.gap / 2},0 V${baseCards}"/>`;
  });
  // Líneas (debajo de las tarjetas).
  const tramos: { a: Arista; pts: P[] }[] = [];
  const dibuja = (pts: P[], a: Arista) => {
    tramos.push({ a, pts });
    const { p, tri } = conFlecha(pts);
    return `<g class="dd-dep${a.ciclo ? " dd-dep-ciclo" : ""}" data-dep="${a.u}>${a.v}"><path d="${camino(p)}" class="db-linea"/><path d="${tri}" class="db-punta"/></g>`;
  };
  for (const a of aristas) {
    const pu = pos[a.u]!;
    const pv = pos[a.v]!;
    if (esLarga(a)) {
      const rx = pu.x + pu.w + 12 + carrilLarga++ * 8;
      const yu = pu.y + pu.h / 2;
      const yv = pv.y + pv.h / 2;
      s += dibuja(
        [
          [pu.x + pu.w, yu],
          [rx, yu],
          [rx, yv],
          [pv.x + pv.w, yv],
        ],
        a,
      );
      continue;
    }
    if (pu.col === pv.col) {
      // Misma columna (solo en el ciclo): vertical entre tarjetas contiguas; ida a la izquierda del centro, vuelta a la derecha.
      const abajo = pv.row > pu.row;
      const cx = pu.x + pu.w / 2 + (abajo ? -28 : 28);
      s += dibuja(
        abajo
          ? [
              [cx, pu.y + pu.h],
              [cx, pv.y],
            ]
          : [
              [cx, pu.y],
              [cx, pv.y + pv.h],
            ],
        a,
      );
      continue;
    }
    const y1 = py(a.u, sal[a.u]!, a);
    const y2 = py(a.v, ent[a.v]!, a);
    const x1 = pu.x + pu.w;
    const x2 = pv.x;
    if (pv.col === pu.col + 1) {
      const xt = pistaX(pu.col, a);
      s += dibuja(
        Math.abs(y1 - y2) < 0.5
          ? [
              [x1, y1],
              [x2, y1],
            ]
          : [
              [x1, y1],
              [xt, y1],
              [xt, y2],
              [x2, y2],
            ],
        a,
      );
    } else {
      const yl =
        a.arriba !== undefined
          ? G.cabH + 6 + a.arriba * G.lane + G.lane / 2 - 4
          : baseCards + 14 + a.carril! * G.lane + G.lane / 2;
      const xa = pistaX(pu.col, a, "baja");
      const xb = pistaX(pv.col - 1, a, "sube");
      s += dibuja(
        [
          [x1, y1],
          [xa, y1],
          [xa, yl],
          [xb, yl],
          [xb, y2],
          [x2, y2],
        ],
        a,
      );
    }
  }
  // Tarjetas.
  const bloqueadas = new Set(e.bloqueadas);
  for (const id of Object.keys(pos)) {
    const d = e.nodos[id]!;
    const p = pos[id]!;
    const cic = enCiclo.has(id);
    const bloq = bloqueadas.has(id) && !cic;
    s += `<g class="db-elem db-nodo dd-dec dd-${d.reversibilidad}${cic ? " dd-en-ciclo" : ""}${bloq ? " dd-bloq" : ""}" role="graphics-symbol img" tabindex="0" data-dueno="${id}" data-decision="${id}" aria-label="${esc(d.aria)}">`;
    s += `<rect data-caja="${id}" class="db-card dd-caja" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="6"/>`;
    s += `<use href="#dd-rev-${d.reversibilidad}" x="${p.x + G.pad + 7}" y="${p.y + 17}" class="db-marca"/>`;
    s += texto1(
      e.etiquetas.reversibilidad[d.reversibilidad],
      p.x + G.pad + 20,
      p.y + 9,
      12,
      16,
      "db-t-num dd-t-rev",
    );
    const est = cic
      ? e.etiquetas.enCiclo
      : bloq
        ? e.etiquetas.sinOnda
        : d.estado;
    s += texto1(
      est,
      p.x + p.w - G.pad - medir(est, 12, 400) * 1.02,
      p.y + 9,
      12,
      16,
      "db-t-meta db-t-meta-compacta",
    );
    s += texto(
      partir(d.nombre, 14, 700, p.w - 2 * G.pad),
      p.x + G.pad,
      p.y + 32,
      14,
      18,
      "db-t-nombre dd-t-nombre",
    );
    const yb = p.y + p.h - 10 - 16;
    let xb = p.x + G.pad;
    if (d.implicita) {
      s += `<use href="#dd-impl" x="${xb + 4}" y="${yb + 8}" class="db-marca"/>${texto1(e.etiquetas.implicita, xb + 12, yb, 12, 16, "db-t-meta db-t-meta-compacta")}`;
      xb += 12 + medir(e.etiquetas.implicita, 12, 400) + 14;
    }
    if (d.sinProbar)
      s += `<use href="#dd-sup" x="${xb + 5}" y="${yb + 8}" class="db-marca"/>${texto1(e.etiquetas.sinProbar, xb + 14, yb, 12, 16, "db-t-meta db-t-meta-compacta")}`;
    s += `</g>`;
  }
  // D11: ningún tramo atraviesa una tarjeta ajena; los cruces entre líneas se cuentan.
  let cruces = 0;
  const cajas = Object.entries(pos).map(([id, p]) => ({
    id,
    c: [p.x, p.y, p.w, p.h] as [number, number, number, number],
  }));
  for (const { a, pts } of tramos)
    for (let i = 0; i < pts.length - 1; i++)
      for (const { id, c } of cajas)
        if (id !== a.u && id !== a.v && tramoCruzaCaja(pts[i]!, pts[i + 1]!, c))
          cruces++;
  let entre = 0;
  const seg = (p: P, q: P) => ({
    h: p[1] === q[1],
    x1: Math.min(p[0], q[0]),
    x2: Math.max(p[0], q[0]),
    y1: Math.min(p[1], q[1]),
    y2: Math.max(p[1], q[1]),
  });
  for (let i = 0; i < tramos.length; i++)
    for (let j = i + 1; j < tramos.length; j++) {
      const A = tramos[i]!.pts;
      const B = tramos[j]!.pts;
      for (let a = 0; a < A.length - 1; a++)
        for (let b = 0; b < B.length - 1; b++) {
          const s1 = seg(A[a]!, A[a + 1]!);
          const s2 = seg(B[b]!, B[b + 1]!);
          if (s1.h === s2.h) continue;
          const hz = s1.h ? s1 : s2;
          const vt = s1.h ? s2 : s1;
          if (
            vt.x1 > hz.x1 + 0.5 &&
            vt.x1 < hz.x2 - 0.5 &&
            hz.y1 > vt.y1 + 0.5 &&
            hz.y1 < vt.y2 - 0.5
          )
            entre++;
        }
    }
  return {
    svg: `${s}</svg>`,
    ancho: W,
    alto: H,
    cruces,
    entre,
    columnas: cols.map((c, i) => ({
      id: `onda-${i}`,
      x: colX(i),
      titulo: c.titulo,
    })),
  };
}
