import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Raíz de la maqueta de la Etapa de Diseño. Los gates leen SOLO este árbol. */
export const RAIZ_MAQUETA = "docs/diseno";

/** Archivos de la maqueta con la extensión pedida, recursivo, en orden estable. */
export function archivosMaqueta(re: RegExp, ruta = RAIZ_MAQUETA): string[] {
  if (!existsSync(ruta)) return [];
  if (statSync(ruta).isFile()) return re.test(ruta) ? [ruta] : [];
  return readdirSync(ruta)
    .sort()
    .flatMap((n) => archivosMaqueta(re, join(ruta, n)));
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Texto VISIBLE de un HTML de la maqueta: sin comentarios, `<script>`, `<style>` ni etiquetas; con
 * entidades decodificadas. Incluye el texto de los `<text>` del SVG (es lo que el lector ve).
 */
export function textoVisible(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTIDADES[n.toLowerCase()] ?? m);
}

/** Lee un archivo como UTF-8. */
export const leer = (f: string) => readFileSync(f, "utf8");
