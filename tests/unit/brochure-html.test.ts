// @vitest-environment node
// El brochure (docs/BROCHURE.html) sale del export (docs/brochure-export.json): dicen lo mismo porque no hay dos copias que
// mantener (S8, devolución 026-1). Aquí: está al día, trae cada funcionalidad y cada grupo del export con su texto, cuenta
// las mismas funcionalidades, el patrón canónico <h3><button> y ningún enlace ni la palabra «manual» a la vista.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const HTML = readFileSync("docs/BROCHURE.html", "utf8");
const e = JSON.parse(readFileSync("docs/brochure-export.json", "utf8")) as {
  promesa: { tagline: string; intro: string };
  funcionalidades: { total: number; grupos: { nombre: string; linea: string; features: { nombre: string; que_hace: string }[] }[] };
};
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const visible = HTML.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[\s\S]*?<\/\1>/g, "");

describe("docs/BROCHURE.html", () => {
  it("sale del export: regenerarlo no cambia nada (si esto falla, corre `pnpm brochure`)", () => {
    const r = spawnSync("node", ["scripts/brochure/generar.mjs", "--comprobar"], { encoding: "utf8" });
    expect(r.status, r.stderr).toBe(0);
  });

  it("dice la promesa del export y cada grupo y funcionalidad con su texto, y declara el mismo total", () => {
    expect(visible).toContain(esc(e.promesa.tagline));
    expect(visible).toContain(esc(e.promesa.intro));
    const feats = e.funcionalidades.grupos.flatMap((g) => g.features);
    expect(feats).toHaveLength(e.funcionalidades.total);
    for (const g of e.funcionalidades.grupos) {
      expect(visible).toContain(esc(g.nombre));
      expect(visible).toContain(esc(g.linea));
    }
    for (const f of feats) {
      expect(visible, f.nombre).toContain(esc(f.nombre));
      expect(visible, f.nombre).toContain(esc(f.que_hace));
    }
    expect(visible).toContain(`<strong>${e.funcionalidades.total} funcionalidades</strong>`);
  });

  it("A11y estructural: cada tarjeta es <h3><button aria-expanded aria-controls> y su región existe; ninguna tarjeta abre sola", () => {
    const botones = [...HTML.matchAll(/<h3 class="tarjeta-cabeza">\s*<button class="tarjeta-boton" aria-expanded="false" aria-controls="(d\d+)">/g)];
    expect(botones).toHaveLength(e.funcionalidades.grupos.length);
    for (const [, id] of botones) expect(HTML).toContain(`id="${id}" role="region"`);
    expect(HTML).not.toMatch(/<h3[^>]*>\s*<button[^>]*>\s*<h3/);
  });

  it("sin enlaces y sin la palabra «manual» en lo que se ve", () => {
    expect(HTML).not.toMatch(/:\/\/|www\./);
    expect(visible).not.toMatch(/manual/i);
  });
});
