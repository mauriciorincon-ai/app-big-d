/**
 * Dónde una tinta vetada como texto (regla 5-b del CLAUDE.md; `TINTAS_VETADAS` del generador de la paleta)
 * termina coloreando texto. Lo comparten el gate de la maqueta y el del producto:
 * - `css`: `color:` en cualquier regla (también `style="color:…"`), y `fill:` en una regla cuyo selector es
 *   texto (`text`, `tspan`, las clases `.dg-t-*` del diagramador);
 * - `html`: lo mismo dentro de `<style>` y de `style="…"`, y `fill` en un `<text>` o `<tspan>`;
 * - `codigo`: clases de Tailwind que pintan texto con la tinta (`text-linea`, `hover:text-linea`…) y
 *   `color: "var(--linea)"` en un estilo en línea.
 * `border-color`, `stroke` y los fondos no cuentan: la tinta sigue permitida para líneas.
 */
export function usosVetados(texto: string, clase: "css" | "html" | "codigo", vetadas: readonly string[]): string[] {
  const v = vetadas.join("|");
  const out: string[] = [];
  for (const m of texto.matchAll(new RegExp(`(?:^|[;{\\s"'\`])color\\s*:\\s*["'\`]?var\\(--(?:${v})\\)`, "gm"))) out.push(`color → ${m[0].trim()}`);
  if (clase !== "codigo") {
    const css = clase === "css" ? texto : [...texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
    const fill = new RegExp(`fill\\s*:\\s*var\\(--(?:${v})\\)`);
    for (const [, sel, cuerpo] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      if (/\btext\b|\btspan\b|\.dg-t-/.test(sel!) && fill.test(cuerpo!)) out.push(`fill en «${sel!.trim()}»`);
  }
  if (clase === "html")
    for (const m of texto.matchAll(new RegExp(`<(?:text|tspan)\\b[^>]*(?:fill="var\\(--(?:${v})\\)"|style="[^"]*fill\\s*:\\s*var\\(--(?:${v})\\))`, "gi")))
      out.push(`texto SVG → ${m[0].slice(0, 70)}`);
  if (clase === "codigo")
    for (const m of texto.matchAll(new RegExp(`(?<![\\w-])(?:[a-z-]+:)*(?:text|fill|placeholder|decoration)-(?:${v})(?![\\w-])`, "g"))) out.push(`clase ${m[0]}`);
  return out;
}
