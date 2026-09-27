// Piezas de dibujo comunes a las vistas (§ 5.1–5.4): cabeceras de capa, tarjeta con filete y glifo,
// etiqueta de modos, trazo de flujo, referencia de franja, cabecera de franja, medidor de madurez,
// insignias de vigencia y de paso. Todo en décimas; el texto se guarda por idioma.
import type { Banda, NivelMadurez, TextoIdioma } from "../tipos";
import { dividirRedondeando, fmt, mitad, type Decimas } from "../util/numeros";
import { camino, conFlecha, filete, g, path, plantilla, rect, texto, simbolo } from "./escena";
import { COL, CANAL, M, colX, porIdioma, type Contexto, type Vigencia } from "./contexto";
import type { Caja, Elemento, Punto } from "./tipos";

// ── Cabeceras de capa (§ 5.3) ─────────────────────────────────────────────────────────────────────────
export interface Cabeceras {
  alto: Decimas;
  escena: Elemento[];
}

/** Número, nombre y pregunta de cada columna; el alto sale de las líneas máximas entre todos los idiomas. */
export function cabeceras(ctx: Contexto, bandas: readonly Banda[]): Cabeceras {
  let lineasNombre = 1;
  let lineasPregunta = 1;
  const cortes = bandas.map((b) => {
    const nombre: Record<string, string[]> = {};
    const pregunta: Record<string, string[]> = {};
    for (const l of ctx.idiomas) {
      nombre[l] = partir(ctx, b.nombre[l]!, 17, 700, COL, `cabecera ${b.id}`, l);
      pregunta[l] = partir(ctx, b.pregunta_lider[l]!, 14, 400, COL, `pregunta ${b.id}`, l);
      lineasNombre = Math.max(lineasNombre, nombre[l]!.length);
      lineasPregunta = Math.max(lineasPregunta, pregunta[l]!.length);
    }
    return { nombre, pregunta };
  });
  const yNombre = 260;
  const yPregunta = yNombre + lineasNombre * 210 + 60;
  const alto = yPregunta + lineasPregunta * 190 + 180;
  const escena = bandas.map((b, i) => {
    const x = colX(i);
    return g(
      { id: `b-${b.id}`, role: "group", "aria-label": porIdioma(ctx, (l) => `${b.nombre[l]}: ${b.pregunta_lider[l]}`), "data-dueno": b.id },
      [
        texto("dg-t-num", x, ctx.mono.base(40, 12, 16), 160, Object.fromEntries(ctx.idiomas.map((l) => [l, [String(i + 1).padStart(2, "0")]]))),
        texto("dg-t-banda", x, ctx.sans.base(yNombre, 17, 21), 210, cortes[i]!.nombre),
        texto("dg-t-pregunta", x, ctx.sans.base(yPregunta, 14, 19), 190, cortes[i]!.pregunta),
      ],
    );
  });
  return { alto, escena };
}

/** Guías punteadas en la mitad de cada canal, hasta `fin`. */
export function guias(n: number, fin: Decimas): Elemento {
  const hijos: Elemento[] = [];
  for (let i = 1; i < n; i++) hijos.push(path({ class: "dg-guia", d: `M${fmt(colX(i) - mitad(CANAL))},0 V${fmt(fin)}` }));
  return g({ class: "dg-guias", "aria-hidden": "true", "data-dueno": "canales" }, hijos);
}

// ── Texto ─────────────────────────────────────────────────────────────────────────────────────────────
/** Corte voraz con aviso si una palabra no cabe sola. */
export function partir(ctx: Contexto, t: string, tamano: number, peso: number, max: Decimas, que: string, idioma: string): string[] {
  const { lineas, anchas } = ctx.sans.partir(t, tamano, peso, max);
  for (const p of anchas) ctx.avisos.push(`${que} (${idioma}): la palabra «${p}» no cabe en ${fmt(max)} u`);
  return lineas;
}

/** Líneas por idioma de un mapa de idioma, avisando si alguna pasa de `maxLineas`. */
export function lineasPorIdioma(ctx: Contexto, t: TextoIdioma, tamano: number, peso: number, max: Decimas, maxLineas: number, que: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const l of ctx.idiomas) {
    out[l] = partir(ctx, t[l]!, tamano, peso, max, que, l);
    if (out[l]!.length > maxLineas) ctx.avisos.push(`${que} (${l}): ${out[l]!.length} líneas; caben ${maxLineas}`);
  }
  return out;
}

export const unaLinea = (ctx: Contexto, f: (l: string) => string): Record<string, string[]> => Object.fromEntries(ctx.idiomas.map((l) => [l, [f(l)]]));

// ── Tarjeta ───────────────────────────────────────────────────────────────────────────────────────────
/** Caja + filete de tipo (§ 5.1, D14): el texto va en tinta, el matiz solo en el filete y el glifo. */
export function tarjeta(caja: Caja, token: string, fantasma = false): Elemento[] {
  return [
    rect({ class: fantasma ? "dg-card dg-fantasma" : "dg-card", "data-caja": "", x: caja.x, y: caja.y, width: caja.w, height: caja.h, rx: 60 }),
    path({ class: `dg-f-${token}`, d: filete(caja.x, caja.y, caja.h) }),
  ];
}

/** Medidor de madurez (§ 5.4, D13): 7 × 11 que se llena por `nivel`; −1 tachado, 0 contorno discontinuo. */
export function medidor(nivel: number, cx: Decimas, cy: Decimas): Elemento {
  const hijos: Elemento[] = [rect({ class: nivel === 0 ? "dg-madurez-caja dg-madurez-anunciado" : "dg-madurez-caja", x: cx - 35, y: cy - 55, width: 70, height: 110, rx: 15 })];
  const lleno = nivel > 0 ? dividirRedondeando(11 * nivel, 4) * 10 : 0;
  if (lleno > 0) hijos.push(rect({ class: "dg-madurez-nivel", x: cx - 35, y: cy + 55 - lleno, width: 70, height: lleno, rx: 10 }));
  if (nivel < 0) hijos.push(path({ class: "dg-madurez-tachado", d: `M${fmt(cx - 35)},${fmt(cy + 55)} L${fmt(cx + 35)},${fmt(cy - 55)}` }));
  return g({ class: "dg-madurez" }, hijos);
}

/**
 * Insignia compacta de vigencia (§ 4.8): marca + «N d». En bloques y nodos va montada sobre el borde
 * superior, a la derecha; en las fichas compactas de franja (60 y 44 u de alto) el borde superior pisaría el
 * nombre, así que va afuera, a su derecha y centrada (las referencias de la fila empiezan después).
 */
export function insigniaVigencia(ctx: Contexto, caja: Caja, estado: Exclude<Vigencia, "vigente">, dias: number, dueno: string, lado = false): { elemento: Elemento; caja: Caja } {
  const t = porIdioma(ctx, (_l, tx) => plantilla(tx.dias, { n: dias }));
  const tw = Math.max(...ctx.idiomas.map((l) => ctx.mono.ancho(t[l]!, 12, 700)));
  const bw = 100 + 120 + 40 + tw + 100;
  const bx = lado ? caja.x + caja.w + 80 : caja.x + caja.w - 100 - bw;
  const y = lado ? caja.y + mitad(caja.h) : caja.y;
  const cajaI: Caja = { x: bx, y: y - 100, w: bw, h: 200 };
  const elemento = g({ class: `dg-insignia dg-insignia-${estado}`, "aria-hidden": "true", "data-dueno": dueno }, [
    rect({ x: cajaI.x, y: cajaI.y, width: cajaI.w, height: cajaI.h, rx: 100 }),
    simbolo(`k-${estado}`, bx + 160, y, "dg-insignia-marca"),
    texto("dg-t-insignia", bx + 260, y + 43, 0, Object.fromEntries(ctx.idiomas.map((l) => [l, [t[l]!]]))),
  ]);
  return { elemento, caja: cajaI };
}

// ── Flujos ────────────────────────────────────────────────────────────────────────────────────────────
/** Modos con marcador (los de marcador «ninguno» no ocupan lugar en la etiqueta). */
export function marcadores(ctx: Contexto, modos: readonly string[]): string[] {
  return modos.map((m) => ctx.modo.get(m)!.marcador).filter((m) => m !== "ninguno");
}

/**
 * Etiqueta de modos (§ 5.3): píldora de 18 u de alto y 6 + 16·k de ancho con los marcadores en el orden
 * de la gramática. D-S1-01: con más de dos marcadores se parte en dos filas (6 + 16·⌈k/2⌉ × 32 u) para
 * caber en el canal de 50 u (A3).
 */
export function etiquetaModos(ctx: Contexto, dueno: string, modos: readonly string[], cx: Decimas, cy: Decimas): { elemento?: Elemento; caja?: Caja } {
  const ms = marcadores(ctx, modos);
  const k = ms.length;
  if (k === 0) return {};
  const dosFilas = k > 2;
  const cols = dosFilas ? Math.ceil(k / 2) : k;
  const w = 60 + 160 * cols;
  const h = dosFilas ? 320 : 180;
  const caja: Caja = { x: cx - mitad(w), y: cy - mitad(h), w, h };
  const hijos: Elemento[] = [rect({ x: caja.x, y: caja.y, width: w, height: h, rx: 90 })];
  ms.forEach((m, i) => {
    const fila = dosFilas ? Math.floor(i / cols) : 0;
    const enFila = dosFilas ? (fila === 0 ? cols : k - cols) : k;
    const col = dosFilas ? i % cols : i;
    const corrimiento = (cols - enFila) * 80;
    const x = caja.x + 110 + 160 * col + corrimiento;
    const y = dosFilas ? cy - 70 + 140 * fila : cy;
    hijos.push(simbolo(`m-${m}`, x, y, "dg-marca"));
  });
  return { elemento: g({ class: "dg-etiqueta", "aria-hidden": "true", "data-dueno": dueno }, hijos), caja };
}

/** Trazo de un flujo: un modo = su estilo de línea; varios = haz sólido de 4 u (§ 5.4). */
export function trazo(ctx: Contexto, id: string, modos: readonly string[], pts: readonly Punto[], extra: Record<string, string> = {}): Elemento {
  const { puntos, punta } = conFlecha(pts, 80);
  const d = camino(puntos, 100);
  const estilo = modos.length === 1 ? `dg-linea-${ctx.modo.get(modos[0]!)!.estilo_linea}` : "dg-haz";
  const lineas: Elemento[] =
    estilo === "dg-linea-doble"
      ? [path({ class: "dg-linea dg-doble-ext", d }), path({ class: "dg-linea dg-doble-int", d })]
      : [path({ class: "dg-linea", d })];
  return g({ class: `dg-flujo ${estilo}`, "aria-hidden": "true", "data-dueno": id, ...extra }, [...lineas, path({ class: "dg-punta", d: punta })]);
}

// ── Franjas (§ 4.1, D15) ───────────────────────────────────────────────────────────────────────────────
export const ZONA = 2000;
export const X_FICHAS = M + 140 + ZONA + 80;

/** Filete superior a todo lo ancho + nombre y pregunta de la franja centrados en su alto. */
export function cabeceraFranja(ctx: Contexto, b: Banda, y: Decimas, alto: Decimas, ancho: Decimas): Elemento {
  const hijos: Elemento[] = [path({ class: "dg-franja-filete", d: `M${fmt(M)},${fmt(y)} H${fmt(ancho - M)}` })];
  const cortes = ctx.idiomas.map((l) => ({
    l,
    nombre: partir(ctx, b.nombre[l]!, 15, 700, ZONA, `franja ${b.id}`, l),
    pregunta: partir(ctx, b.pregunta_lider[l]!, 13, 400, ZONA, `pregunta ${b.id}`, l),
  }));
  const altoTexto = Math.max(...cortes.map((c) => c.nombre.length * 190 + 40 + c.pregunta.length * 170));
  if (altoTexto > alto - 40) ctx.avisos.push(`cabecera de la franja ${b.id}: ${fmt(altoTexto)} u en ${fmt(alto)} u`);
  const arriba = y + mitad(alto - altoTexto);
  const lineasN = Math.max(...cortes.map((c) => c.nombre.length));
  hijos.push(texto("dg-t-banda dg-t-banda-franja", M + 140, ctx.sans.base(arriba, 15, 19), 190, Object.fromEntries(cortes.map((c) => [c.l, c.nombre]))));
  hijos.push(texto("dg-t-pregunta dg-t-pregunta-franja", M + 140, ctx.sans.base(arriba + lineasN * 190 + 40, 13, 17), 170, Object.fromEntries(cortes.map((c) => [c.l, c.pregunta]))));
  return g({ id: `b-${b.id}`, role: "group", "aria-label": porIdioma(ctx, (l) => `${b.nombre[l]}: ${b.pregunta_lider[l]}`), "data-dueno": b.id }, hijos);
}

export interface Referencia {
  id: string;
  flujo: string;
  /** true si el elemento de la franja es el origen (envía, ↑). */
  envia: boolean;
  modos: string[];
  nombre: Record<string, string>;
  cx: Decimas;
  cy: Decimas;
}

/**
 * Coloca las referencias de una fila de franja de izquierda a derecha, cada una centrada bajo su columna
 * cuando cabe y, si no, en la ranura siguiente (Gaps del contrato). Avisa si alguna se sale del lienzo.
 */
export function referencias(ctx: Contexto, refs: readonly Referencia[], desde: Decimas, ancho: Decimas, recorrido = false): { escena: Elemento[]; cajas: { id: string; dueno: string; caja: Caja }[] } {
  const escena: Elemento[] = [];
  const cajas: { id: string; dueno: string; caja: Caja }[] = [];
  let cursor = desde;
  for (const r of [...refs].sort((a, b) => a.cx - b.cx || (a.id < b.id ? -1 : 1))) {
    const ms = marcadores(ctx, r.modos);
    const tw = Math.max(...ctx.idiomas.map((l) => ctx.sans.ancho(r.nombre[l]!, 13, 700)));
    const w = 280 + 140 * ms.length + 40 + tw + 120;
    const h = 300;
    // Centrada bajo su columna; si se sale por la derecha, se corre hacia adentro sin pisar la anterior.
    const limite = ancho - M - 40;
    let x = Math.max(r.cx - mitad(w), cursor);
    if (x + w > limite) x = Math.max(cursor, limite - w);
    if (x + w > limite) ctx.avisos.push(`referencia ${r.id}: se sale del lienzo`);
    cursor = x + w + 80;
    const caja: Caja = { x, y: r.cy - mitad(h), w, h };
    cajas.push({ id: r.id, dueno: r.flujo, caja });
    const modosTexto = (l: string) => r.modos.map((m) => ctx.modo.get(m)!.nombre[l]!.toLowerCase()).join(ctx.textos[l]!.y);
    const hijos: Elemento[] = [
      rect({ x: caja.x, y: caja.y, width: w, height: h, rx: 150 }),
      simbolo(r.envia ? "k-envia" : "k-recibe", x + 160, r.cy, "dg-marca"),
      ...ms.map((m, i) => simbolo(`m-${m}`, x + 280 + 70 + 140 * i, r.cy, "dg-marca")),
      texto("dg-t-ref", x + 280 + 140 * ms.length + 40, ctx.sans.base(r.cy - 90, 13, 18), 0, Object.fromEntries(ctx.idiomas.map((l) => [l, [r.nombre[l]!]]))),
    ];
    escena.push(
      g(
        {
          id: r.id,
          class: "dg-ref",
          role: "graphics-symbol img",
          "aria-label": porIdioma(ctx, (l, t) => plantilla(r.envia ? t.envia : t.recibe, { nombre: r.nombre[l]!, modos: modosTexto(l) })),
          "data-dueno": r.flujo,
          "data-flujo": recorrido ? r.flujo : undefined,
        },
        hijos,
      ),
    );
  }
  return { escena, cajas };
}

// ── Madurez en texto ──────────────────────────────────────────────────────────────────────────────────
export const nombreMadurez = (m: NivelMadurez, l: string): string => m.nombre[l]!;
