// D3 (S8): el comando que arma la pantalla del caso para duplicarlo. Puro y sin dependencias (lo importa un componente del
// navegador). La pantalla lo arma con el id que la persona escribe; ella lo corre en su terminal (scripts/duplicar-caso.mjs).
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ProblemaDuplicar = "vacio" | "invalido" | "mismo" | "existe";

/** Lo que impide duplicar con este id; null si se puede. */
export function problemaDuplicar(original: string, nuevo: string, existentes: readonly string[]): ProblemaDuplicar | null {
  if (nuevo === "") return "vacio";
  if (!ID.test(nuevo)) return "invalido";
  if (nuevo === original) return "mismo";
  if (existentes.includes(nuevo)) return "existe";
  return null;
}

/** El comando exacto. Lanza si el id no se puede usar (la pantalla no lo muestra en ese caso). */
export function comandoDuplicarCaso(original: string, nuevo: string, existentes: readonly string[]): string {
  if (!ID.test(original)) throw new Error(`id de caso no permitido: «${original}»`);
  const p = problemaDuplicar(original, nuevo, existentes);
  if (p) throw new Error(`no se puede armar el comando: ${p}`);
  return `node scripts/duplicar-caso.mjs ${original} ${nuevo}`;
}
