import type { Resultado } from "./esquema";

// Verificación de citas por CÓDIGO (sin modelo): la página cruda que devolvió `curl` se pasa a texto y se
// busca la cita. La comparación perdona solo lo tipográfico (mayúsculas, comillas y guiones tipográficos,
// espacios, entidades HTML); jamás las palabras. Una página que casi no trae texto (armada con JavaScript)
// o que no respondió 200 es «no verificable»: la revisa una persona.

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", trade: "™" };

function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

/** HTML → texto visible: fuera scripts, estilos y marcas; entidades decodificadas; NFC. */
export function htmlATexto(html: string): string {
  const sinBloques = html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1\s*>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  return decodificar(sinBloques.replace(/<[^>]+>/g, " ")).normalize("NFC");
}

/** Forma comparable: minúsculas, comillas y guiones rectos, espacios colapsados. */
export function normalizar(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″«»]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[\s   ]+/g, " ")
    .trim();
}

/** Menos texto que esto y la página se considera armada con JavaScript: no se puede verificar por código. */
export const TEXTO_MINIMO = 400;

export function verificarCita(http: number | null, cuerpo: string | null, cita: string): { resultado: Resultado; motivo?: string } {
  if (http === null || cuerpo === null) return { resultado: "no-verificable", motivo: "sin respuesta" };
  if (http !== 200) return { resultado: "no-verificable", motivo: `HTTP ${http}` };
  const texto = normalizar(htmlATexto(cuerpo));
  if (texto.length < TEXTO_MINIMO) return { resultado: "no-verificable", motivo: "la página casi no trae texto (se arma con JavaScript)" };
  return texto.includes(normalizar(cita)) ? { resultado: "verificada" } : { resultado: "no-encontrada", motivo: "la cita no aparece en la página" };
}
