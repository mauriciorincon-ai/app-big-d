// Constructores de la escena y trazados ortogonales, en décimas enteras. Nada de `Math.hypot` ni
// trigonometría (G2): los tramos son horizontales o verticales, así que su largo es |dx| + |dy| y su
// dirección es un signo.
import { fmt, type Decimas } from "../util/numeros";
import type { Condicion } from "../tipos";
import type { Elemento, Punto, TextosMotor, ValorAtributo } from "./tipos";

type Attrs = Record<string, ValorAtributo | undefined>;
const limpiar = (a: Attrs): Record<string, ValorAtributo> => {
  const out: Record<string, ValorAtributo> = {};
  for (const [k, v] of Object.entries(a)) if (v !== undefined) out[k] = v;
  return out;
};

export const g = (attrs: Attrs, hijos: Elemento[]): Elemento => ({ el: "g", attrs: limpiar(attrs), hijos });
export const rect = (attrs: Attrs): Elemento => ({ el: "rect", attrs: limpiar(attrs) });
export const path = (attrs: Attrs): Elemento => ({ el: "path", attrs: limpiar(attrs) });
export const simbolo = (href: string, x: Decimas, y: Decimas, clase?: string): Elemento => ({
  el: "use",
  attrs: limpiar({ class: clase, href: `#${href}`, x, y }),
});
export const texto = (clase: string, x: Decimas, y: Decimas, lh: Decimas, lineas: Record<string, string[]>, extra: Attrs = {}): Elemento => ({
  el: "text",
  attrs: limpiar({ class: clase, ...extra }),
  texto: { x, y, lh, lineas },
});

/**
 * La condición de un flujo en palabras (0.5.0, § 3.4): la tripleta y la función van en la notación del plan
 * (`señal op valor`, `f(entradas)`; el motor no las evalúa) dentro de «{condicion}»; la rama por defecto, con su texto.
 */
export function textoCondicion(c: Condicion, t: TextosMotor): string {
  if (!t.condicion) throw new Error("texts: el mapa usa `condicion` y faltan los textos `condicion` (0.5.0)");
  if ("por_defecto" in c) return t.condicion.porDefecto;
  const cond = "funcion" in c ? `${c.funcion}(${c.entradas.join(", ")})` : `${c.senal} ${c.operador} ${String(c.valor)}`;
  return plantilla(t.condicion.si, { condicion: cond });
}

const signo = (n: number): number => (n > 0 ? 1 : n < 0 ? -1 : 0);
const largo = (a: Punto, b: Punto): number => Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);

/** Quita puntos repetidos y colineales intermedios. */
export function simplificar(pts: readonly Punto[]): Punto[] {
  const p = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1]![0] || q[1] !== pts[i - 1]![1]);
  return p.filter((q, i) => {
    if (i === 0 || i === p.length - 1) return true;
    const a = p[i - 1]!;
    const c = p[i + 1]!;
    return !((a[0] === q[0] && q[0] === c[0]) || (a[1] === q[1] && q[1] === c[1]));
  });
}

/** `d` de un trazado ortogonal con esquinas redondeadas (radio ≤ `radio`, ≤ media del tramo más corto). */
export function camino(pts: readonly Punto[], radio: Decimas): string {
  const p = simplificar(pts);
  let d = `M${fmt(p[0]![0])},${fmt(p[0]![1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    const c = p[i + 1]!;
    const rr = Math.min(radio, Math.floor(largo(a, b) / 2), Math.floor(largo(b, c) / 2));
    const u1 = [signo(b[0] - a[0]), signo(b[1] - a[1])] as const;
    const u2 = [signo(c[0] - b[0]), signo(c[1] - b[1])] as const;
    d += ` L${fmt(b[0] - u1[0] * rr)},${fmt(b[1] - u1[1] * rr)} Q${fmt(b[0])},${fmt(b[1])} ${fmt(b[0] + u2[0] * rr)},${fmt(b[1] + u2[1] * rr)}`;
  }
  const z = p[p.length - 1]!;
  return `${d} L${fmt(z[0])},${fmt(z[1])}`;
}

/** Acorta el último tramo `retiro` décimas para la punta y devuelve la punta (triángulo de 9 × 9 u). */
export function conFlecha(pts: readonly Punto[], retiro: Decimas): { puntos: Punto[]; punta: string } {
  const p = simplificar(pts).map((q) => [q[0], q[1]] as [number, number]);
  const z = p[p.length - 1]!;
  const y = p[p.length - 2]!;
  const u = [signo(z[0] - y[0]), signo(z[1] - y[1])] as const;
  const punta: Punto = [z[0], z[1]];
  p[p.length - 1] = [z[0] - u[0] * retiro, z[1] - u[1] * retiro];
  const base: Punto = [punta[0] - u[0] * 90, punta[1] - u[1] * 90];
  const n = [-u[1] * 45, u[0] * 45] as const;
  const tri = `M${fmt(punta[0])},${fmt(punta[1])} L${fmt(base[0] + n[0])},${fmt(base[1] + n[1])} L${fmt(base[0] - n[0])},${fmt(base[1] - n[1])} Z`;
  return { puntos: p, punta: tri };
}

/** Filete izquierdo de 4 u en el matiz del tipo, siguiendo la esquina de 6 u de la tarjeta (§ 5.1). */
export function filete(x: Decimas, y: Decimas, h: Decimas): string {
  return `M${fmt(x + 60)},${fmt(y)} H${fmt(x + 40)} V${fmt(y + h)} H${fmt(x + 60)} A6,6 0 0 1 ${fmt(x)},${fmt(y + h - 60)} V${fmt(y + 60)} A6,6 0 0 1 ${fmt(x + 60)},${fmt(y)} Z`;
}

/** Sustituye `{clave}` en una plantilla de interfaz. */
export function plantilla(t: string, valores: Record<string, string | number>): string {
  return t.replace(/\{([a-z]+)\}/g, (m, k: string) => (k in valores ? String(valores[k]) : m));
}
