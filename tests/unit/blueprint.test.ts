// @vitest-environment node
// El BLUEPRINT as-built (docs/BLUEPRINT.html, S7, D-S7-07): el mapa real de la infraestructura. Un documento que nadie
// comprueba se pudre, así que esta prueba lo ata al repositorio: cada job de CI (y el workflow de un solo PR vivo), cada
// paquete reusable con la versión de su lock, y cada ADR de decisions/ tienen que aparecer; sin marcadores sin llenar, sin
// instrucciones de la plantilla, sin enlaces ni CDNs, y con las dos filas que el usuario más consulta (costo y punto único de falla).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync("docs/BLUEPRINT.html", "utf8");
const texto = html.replace(/<style>[\s\S]*?<\/style>/, "");

describe("docs/BLUEPRINT.html", () => {
  it("es el documento instanciado: sin marcadores [así], sin la caja de instrucciones de la plantilla y con su historial", () => {
    expect(texto).not.toMatch(/\[[A-Z_]{3,}\]|\[(?:servicio|URL|org\/repo|YYYY|ciclo|H1)[^\]]*\]/);
    expect(texto).not.toContain("Instrucciones para el builder");
    expect(texto).toContain("Historial del blueprint");
    expect(texto).toContain("<title>Big-D — Blueprint de infraestructura (as-built)</title>");
  });

  it("lista cada job de CI de ci.yml y el workflow de un solo PR vivo", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    const jobs = [...ci.slice(ci.indexOf("\njobs:")).matchAll(/^ {2}([a-z0-9-]+):\s*$/gm)].map((m) => m[1]!);
    expect(jobs).toEqual(expect.arrayContaining(["quality", "e2e", "lighthouse", "diagramador"]));
    for (const j of jobs) expect(texto, `job ${j}`).toContain(`<code>${j}</code>`);
    const workflows = readdirSync(".github/workflows").filter((f) => f.endsWith(".yml"));
    for (const w of workflows) expect(texto, w).toContain(w);
    expect(texto).toContain("<code>un-pr-vivo</code>");
  });

  it("lista cada paquete reusable con la versión de su CONTRATO.lock y el commit de su origen", () => {
    const paquetes = readdirSync("packages").filter((p) => existsSync(join("packages", p, "CONTRATO.lock")));
    expect(paquetes.length).toBeGreaterThanOrEqual(2);
    for (const p of paquetes) {
      const lock = readFileSync(join("packages", p, "CONTRATO.lock"), "utf8");
      const version = /^version: (\S+)$/m.exec(lock)![1]!;
      const origen = /^origen: ([0-9a-f]{40})$/m.exec(lock)![1]!;
      expect(texto, p).toContain(`<code>packages/${p}</code>`);
      const fila = texto.split("\n").find((l) => l.includes(`<code>packages/${p}</code>`))!;
      expect(fila, `${p}: versión del lock`).toContain(`v${version}`);
      expect(fila, `${p}: origen del lock`).toContain(origen.slice(0, 7));
    }
  });

  it("lista cada ADR de decisions/ (menos la plantilla)", () => {
    const adrs = readdirSync("decisions").filter((f) => f.endsWith(".md") && !f.startsWith("PLANTILLA"));
    expect(adrs.length).toBeGreaterThanOrEqual(14);
    for (const a of adrs) expect(texto, a).toContain(`<code>decisions/${a}</code>`);
  });

  it("declara la IA embebida como NINGUNA y no publica ninguna URL ni carga nada de fuera (regla 17)", () => {
    expect(texto).toMatch(/IA embebida[\s\S]{0,80}NINGUNA/);
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<script|<link[^>]+href=|src=["']http/);
  });

  it("trae las dos filas más consultadas (costo real y punto único de falla) y el diagrama con su descripción", () => {
    expect(texto).toMatch(/class="critica"><td>Costo real \/ mes/);
    expect(texto).toMatch(/class="critica"><td>Punto único de falla/);
    expect(texto).toMatch(/<svg[^>]+role="img"[^>]+aria-label="Diagrama de infraestructura de Big-D/);
    expect(texto).toContain("flecha-futura");
  });
});
