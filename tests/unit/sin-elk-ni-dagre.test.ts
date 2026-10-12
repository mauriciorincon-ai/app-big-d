// @vitest-environment node
// Regla dura 7: ELK y dagre están prohibidos como colocación (el diagramador coloca por bandas y rutea por canales). Hoy lo
// único que lo impedía era la memoria de quien revisa: esta prueba mira cada package.json y el lockfile (S7, D-S7-09).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PROHIBIDOS = /(^|["'/@ :])(elkjs|elk-js|web-worker-elk|dagre|dagre-d3|@dagrejs\/dagre|cytoscape-elk|cytoscape-dagre|react-flow-elk|d3-dag)(["'@\s:/]|$)/m;

describe("sin ELK ni dagre", () => {
  for (const archivo of ["package.json", "packages/diagramador/package.json", "packages/instrumentos-de-plan/package.json", "pnpm-lock.yaml"])
    it(`${archivo} no los declara ni los resuelve`, () => {
      expect(readFileSync(archivo, "utf8")).not.toMatch(PROHIBIDOS);
    });

  it("la prueba muerde: detecta cada nombre prohibido en un package.json de muestra", () => {
    for (const n of ["elkjs", "dagre", "@dagrejs/dagre", "cytoscape-elk"]) expect(`"dependencies": { "${n}": "^1.0.0" }`).toMatch(PROHIBIDOS);
    expect('"dependencies": { "next": "16.4.0", "react": "19.3.0" }').not.toMatch(PROHIBIDOS);
  });
});
