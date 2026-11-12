// D7 (S8): el avance de la comparación de pares vive en la URL (como la exploración de pesos: no persiste, el perfil
// aprobado es de solo lectura). `?pares=` guarda un carácter por par, en el orden canónico de los pares (por id del
// criterio, no por posición): «-» sin juzgar; de «a» a «q», el valor v = código − «i» en −8…8. Con v ≥ 0 el primer
// criterio del par importa v + 1 veces más; con v < 0, el segundo importa 1 − v veces más. `?grupo=` es el grupo abierto,
// desde 1: el grupo g reúne los pares cuyo primer criterio es el g-ésimo. Una URL que no cabe cae a «nada juzgado».
import type { Juicio } from "@/engine";

const CERO = "i".charCodeAt(0);
export const SIN_JUZGAR = "-";

/** El valor de un par, de −(max − 1) a max − 1; null sin juzgar. */
export type ValorPar = number | null;

export function leerPares(consulta: string, total: number, escalaMax: number): ValorPar[] {
  const vacio = Array.from({ length: total }, () => null);
  const v = new URLSearchParams(consulta).get("pares");
  if (v === null || v.length !== total) return vacio;
  const out: ValorPar[] = [];
  for (const ch of v) {
    if (ch === SIN_JUZGAR) out.push(null);
    else {
      const x = ch.charCodeAt(0) - CERO;
      if (!/^[a-q]$/.test(ch) || x <= -escalaMax || x >= escalaMax) return vacio;
      out.push(x);
    }
  }
  return out;
}

export function codificarPares(valores: readonly ValorPar[]): string {
  return valores.map((v) => (v === null ? SIN_JUZGAR : String.fromCharCode(CERO + v))).join("");
}

/** Los índices de los pares de cada grupo: el grupo g son los pares que empiezan por el g-ésimo criterio (por id). */
export function gruposDe(pares: readonly (readonly [string, string])[]): number[][] {
  const out: number[][] = [];
  let previo: string | null = null;
  pares.forEach(([a], i) => {
    if (a !== previo) out.push([]);
    previo = a;
    out.at(-1)!.push(i);
  });
  return out;
}

/** El grupo abierto, de 0 a grupos − 1 (la URL lo guarda desde 1); fuera de rango cae al primero. */
export function leerGrupo(consulta: string, grupos: number): number {
  const g = new URLSearchParams(consulta).get("grupo");
  return g !== null && /^\d{1,3}$/.test(g) && Number(g) >= 1 && Number(g) <= grupos ? Number(g) - 1 : 0;
}

/** La consulta con el avance escrito, sin tocar los demás parámetros. */
export function consultaPares(valores: readonly ValorPar[], grupo: number, actual: string): string {
  const q = new URLSearchParams(actual);
  q.set("pares", codificarPares(valores));
  q.set("grupo", String(grupo + 1));
  return `?${q.toString()}`;
}

/** Los juicios del núcleo a partir de los valores juzgados (los null no entran: el núcleo dice cuántos faltan). */
export function juiciosDe(pares: readonly (readonly [string, string])[], valores: readonly ValorPar[]): Juicio[] {
  return pares.flatMap(([a, b], i): Juicio[] => {
    const v = valores[i];
    if (v === null || v === undefined) return [];
    return v >= 0 ? [{ mayor: a, menor: b, intensidad: v + 1 }] : [{ mayor: b, menor: a, intensidad: 1 - v }];
  });
}
