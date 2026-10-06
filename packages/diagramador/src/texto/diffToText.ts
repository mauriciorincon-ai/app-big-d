// `diffToText(before, after, grammar, { language, texts })` (§ 4.7; extensión del piloto, va a «Enmiendas»): la lista
// explicativa que va debajo del dibujo de las diferencias. Una línea por componente que cambió, con su glifo y su
// palabra (G7: el color nunca va solo), su nombre, su banda y qué cambió —también cada bloque nuevo, retirado o
// renombrado (0.6.0, F-030)—; en el orden de las clases (nuevo,
// renombrado, madurez, retirado) y, dentro de cada una, por banda en el orden de la gramática y por id. Si cambiaron
// flujos o pasos, cuántos; sin cambios, una línea que lo dice. HTML, sobre dos mapas YA VALIDADOS.
import { diff } from "../diff";
import { plantilla } from "../layout/escena";
import { plural } from "../layout/contexto";
import type { TextosMotor } from "../layout/tipos";
import { DIFERENCIAS } from "../svg/glifos";
import { escapar } from "../svg/serializar";
import type { Bloque, Gramatica, Mapa, Nodo } from "../tipos";
import { compararCodigo } from "../util/orden";
import { idiomaPedido } from "./idioma";

export interface OpcionesDiferencias {
  language: string;
  texts: Record<string, TextosMotor>;
  /** Id de la lista: el SVG de las diferencias la enlaza como su versión en texto (G10, `textId`). */
  id?: string;
}

const CLASES = ["nuevo", "renombrado", "madurez", "retirado"] as const;

export function diffToText(before: Mapa, after: Mapa, grammar: Gramatica, opciones: OpcionesDiferencias): string {
  const l = opciones.language;
  const t = idiomaPedido("diffToText", grammar, l, opciones.texts);
  const e = escapar;
  const d = diff(before, after);
  const banda = new Map(grammar.bandas.map((b) => [b.id, b]));
  // Capas, carriles y franjas, en ese orden; dentro de cada clase, por `orden` y por id (un comparador total, G1).
  const CLASE = { capa: 0, carril: 1, transversal: 2 } as const;
  const ordenBanda = new Map([...grammar.bandas].sort((a, b) => CLASE[a.clase] - CLASE[b.clase] || a.orden - b.orden || compararCodigo(a.id, b.id)).map((b, i) => [b.id, i]));
  const madurez = (id: string) => grammar.escala_madurez.find((m) => m.id === id)!.nombre[l]!.toLowerCase();
  const antes = new Map(before.nodos.map((n) => [n.id, n]));
  const despues = new Map(after.nodos.map((n) => [n.id, n]));
  type Linea = { c: (typeof CLASES)[number]; id: string; banda: string; nombre: string; detalle: string; de: "nodo" | "bloque" };
  const deNodo = (c: Linea["c"], n: Nodo, detalle: string): Linea => ({ c, id: n.id, banda: n.banda_id, nombre: n.nombre[l]!, detalle, de: "nodo" });
  const bloquesAntes = new Map(before.bloques.map((b) => [b.id, b]));
  const bloquesDespues = new Map(after.bloques.map((b) => [b.id, b]));
  const tb = (): NonNullable<TextosMotor["lado"]["detalle"]["bloque"]> => {
    if (!t.lado.detalle.bloque) throw new Error("diffToText: las diferencias traen bloques y faltan los textos `lado.detalle.bloque` (0.6.0)");
    return t.lado.detalle.bloque;
  };
  const deBloque = (c: Linea["c"], b: Bloque, detalle: string): Linea => ({ c, id: b.id, banda: b.banda_id, nombre: b.nombre[l]!, detalle, de: "bloque" });
  const lineas: Linea[] = [
    ...d.nodos.nuevos.map((id) => {
      const n = despues.get(id)!;
      return deNodo("nuevo", n, plantilla(t.lado.detalle.nuevo, { banda: banda.get(n.banda_id)!.nombre[l]!, madurez: madurez(n.madurez) }));
    }),
    ...d.nodos.renombrados.map((r) => deNodo("renombrado", despues.get(r.id)!, plantilla(t.lado.detalle.renombrado, { antes: r.antes[l]! }))),
    ...d.nodos.madurez.map((r) => deNodo("madurez", despues.get(r.id)!, plantilla(t.lado.detalle.madurez, { antes: madurez(r.antes), ahora: madurez(r.ahora) }))),
    ...d.nodos.retirados.map((id) => deNodo("retirado", antes.get(id)!, t.lado.detalle.retirado)),
    // 0.6.0 (F-030): los bloques, por id y con su nombre.
    ...d.bloques.nuevos.map((id) => {
      const b = bloquesDespues.get(id)!;
      return deBloque("nuevo", b, plantilla(tb().nuevo, { banda: banda.get(b.banda_id)!.nombre[l]! }));
    }),
    ...d.bloques.renombrados.map((r) => deBloque("renombrado", bloquesDespues.get(r.id)!, plantilla(tb().renombrado, { antes: r.antes[l]! }))),
    ...d.bloques.retirados.map((id) => deBloque("retirado", bloquesAntes.get(id)!, tb().retirado)),
  ].sort((a, b) => CLASES.indexOf(a.c) - CLASES.indexOf(b.c) || ordenBanda.get(a.banda)! - ordenBanda.get(b.banda)! || compararCodigo(a.de, b.de) || compararCodigo(a.id, b.id));
  const glifo = (c: (typeof CLASES)[number]) =>
    `<svg class="dg-svg" viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><path d="${DIFERENCIAS[c]!.d}" fill="none" stroke="currentColor" stroke-width="${DIFERENCIAS[c]!.trazo}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const otros = d.flujos.nuevos.length + d.flujos.retirados.length + d.flujos.cambiados.length + d.pasos.nuevos.length + d.pasos.retirados.length + d.pasos.cambiados.length;
  const id = opciones.id ? ` id="${e(opciones.id)}"` : "";
  const items = lineas
    .map(
      (x) =>
        `<li class="dg-dif-item dg-dif-${x.c}" data-${x.de}="${e(x.id)}"><span class="dg-dif-palabra">${glifo(x.c)}${e(t.lado.marcas[x.c])}</span>` +
        `<span><b>${e(x.nombre)}</b> <span class="dg-dif-banda">${e(banda.get(x.banda)!.nombre[l]!)}</span><br>${e(x.detalle)}</span></li>`,
    )
    .join("");
  const resto = otros ? `<p class="dg-dif-otros">${e(plural(t.lado.detalle.otros, otros, l))}</p>` : "";
  if (!lineas.length) return `<div class="dg-dif-texto" lang="${e(l)}"${id}><p class="dg-dif-ninguna">${e(otros ? plural(t.lado.detalle.otros, otros, l) : t.lado.detalle.ninguna)}</p></div>\n`;
  return `<div class="dg-dif-texto" lang="${e(l)}"${id}><ul class="dg-dif-lista">${items}</ul>${resto}</div>\n`;
}
