// V9 y V10 (alertas): los textos de líder, por idioma. V9 busca términos a explicar sin explicación; V10
// cuenta frases. Solo aritmética y expresiones regulares definidas por la especificación (nada de
// `toLocale*`): `toLowerCase` y la bandera `i` usan el plegado simple de Unicode, igual en todo motor.

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** ¿Aparece `termino` como palabra completa en `texto`? (sin distinguir mayúsculas; letras con tilde incluidas) */
export function contieneTermino(texto: string, termino: string): boolean {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(termino)}(?=$|[^\\p{L}\\p{N}])`, "iu").test(texto);
}

/** Frases: cada signo de cierre (. ! ? …) seguido de espacio o del final cuenta una. Un texto sin cierre es una frase. */
export function contarFrases(texto: string): number {
  const cierres = texto.trim().match(/[.!?…]+(?=\s|$)/g)?.length ?? 0;
  return Math.max(cierres, texto.trim() ? 1 : 0);
}

export const normalizarTermino = (t: string): string => t.trim().toLowerCase();
