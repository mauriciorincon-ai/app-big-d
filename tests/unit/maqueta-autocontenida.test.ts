import { relative } from "node:path";
import { describe, expect, it } from "vitest";
import { archivosMaqueta, leer } from "./lib/maqueta";

/**
 * Gate de MAQUETA AUTOCONTENIDA (orden de diseño, entregable 2; reglas 12 y 17 del CLAUDE.md).
 * `docs/diseno/` abre con doble clic y en el preview sin tocar la red: cero CDNs, cero
 * frameworks, cero fuentes remotas, cero dominios de despliegue. Única URL absoluta permitida:
 * `https://example.org/…` — las fuentes FICTICIAS de las tarjetas de evidencia (regla dura 12).
 *
 * Demo en rojo (regla 15): `<script src="https://cdn.jsdelivr.net/…">` plantado en index.html —
 * registrada en sprints/ETAPA-DISENO-implementation-log.md.
 */
const PROHIBIDO: Array<[RegExp, string]> = [
  [/(?:https?:)?\/\/(?!example\.org[/"'\s<)])[a-z0-9-]+\.[a-z]/i, "URL absoluta fuera de example.org"],
  [/<script[^>]*\ssrc\s*=\s*["'](?!assets\/|\.\/assets\/)/i, "script fuera de assets/"],
  [/<link[^>]*\shref\s*=\s*["'](?!assets\/|\.\/assets\/|[a-z0-9-]+\.html)/i, "link fuera de assets/ o de la maqueta"],
  [/@import/i, "@import (la hoja se enlaza, no se importa)"],
  [/vercel[.]app|workers[.]dev|pages[.]dev/i, "dominio de despliegue (regla 17, cero enlaces)"],
  [/\b(?:react|vue|alpine|htmx|jquery|tailwind)(?:\.min)?\.js\b/i, "framework"],
];

describe("maqueta autocontenida (docs/diseno)", () => {
  const lista = archivosMaqueta(/\.(html|css|js)$/);

  it("existe la maqueta y tiene archivos que inspeccionar", () => {
    expect(lista.length).toBeGreaterThan(0);
  });

  it("ningún HTML/CSS/JS referencia la red ni un framework", () => {
    const hallazgos: string[] = [];
    for (const f of lista)
      leer(f)
        .split("\n")
        .forEach((linea, i) => {
          for (const [re, que] of PROHIBIDO)
            if (re.test(linea)) hallazgos.push(`${relative(".", f)}:${i + 1}  ${que}  →  ${linea.trim().slice(0, 100)}`);
        });
    expect(hallazgos, `referencias externas:\n${hallazgos.join("\n")}`).toEqual([]);
  });
});
