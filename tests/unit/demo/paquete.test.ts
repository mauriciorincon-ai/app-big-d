// @vitest-environment node
// S10 (F2): el paquete de la demo, construido de verdad (pnpm build:demo en una carpeta temporal), pasa el gate de fugas
// (scripts/demo/fugas.mjs): nada del investigador, de la aprobación, de las propuestas ni de la maqueta; ningún enlace sale del
// sitio; el manifiesto declara cada archivo con su huella. Dos builds dan los mismos bytes. Y el gate se demuestra fallando
// (regla 15): una fuga plantada a propósito sale con su nombre.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fugasDe } from "../../../scripts/demo/fugas.mjs";
import { ARCHIVO, lineasDe } from "../../../scripts/demo/huellas.mjs";

const tmp = mkdtempSync(join(tmpdir(), "bigd-demo-"));
const a = join(tmp, "a");
const b = join(tmp, "b");
// La fecha de consulta es perilla del build (nunca el reloj): se fija aquí para que los dos builds no dependan del día ni de
// una variable del entorno de quien corre la prueba.
const construir = (destino: string) =>
  execFileSync(process.execPath, ["scripts/demo/construir.mjs", "--destino", destino], { encoding: "utf8", env: { ...process.env, BIGD_FECHA_CONSULTA: "2026-11-12" } });

beforeAll(() => {
  construir(a);
  construir(b);
}, 120_000);
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("el paquete de la demo", () => {
  it("trae las dos entradas, el cliente, el Worker, los datos, la hoja, las fuentes con su licencia y el manifiesto", () => {
    expect(readdirSync(a).sort()).toEqual(["demo-worker.js", "demo.css", "demo.js", "en.html", "es.html", "fuentes", "manifiesto.json"]);
    expect(readdirSync(join(a, "fuentes")).sort()).toEqual(["OFL-jetbrains-mono.txt", "OFL-space-grotesk.txt", "jetbrains-mono.woff2", "space-grotesk.woff2"]);
    const m = JSON.parse(readFileSync(join(a, "manifiesto.json"), "utf8"));
    expect(m).toMatchObject({ paquete: "big-d", basePath: "/piezas/big-d", entradas: ["es.html", "en.html"] });
    expect(m.huella_inicial).toMatch(/^[0-9a-f]{64}$/);
  });

  it("es público por diseño: el gate de fugas no encuentra nada", () => {
    expect(fugasDe(a)).toEqual([]);
  });

  it("cada página trae su CSP por meta, con el Worker del mismo sitio y nada en línea abierto", () => {
    for (const f of ["es.html", "en.html"]) {
      const html = readFileSync(join(a, f), "utf8");
      const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"\/>/)?.[1] ?? "";
      expect(csp).toContain("worker-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
      expect(html).toMatch(/<script src="demo\.js" defer><\/script>/);
    }
  });

  it("las huellas del paquete son las versionadas en tests/determinismo/DEMO.SHA256SUMS (si falla: node scripts/demo/huellas.mjs y revisa el diff)", () => {
    expect(`${lineasDe(a).join("\n")}\n`).toBe(readFileSync(ARCHIVO, "utf8"));
    expect(readFileSync(ARCHIVO, "utf8")).toMatch(/^huella_inicial {2}[0-9a-f]{64}\n/);
  });

  it("dos builds dan los mismos bytes (el manifiesto es el mismo)", () => {
    expect(readFileSync(join(b, "manifiesto.json"), "utf8")).toBe(readFileSync(join(a, "manifiesto.json"), "utf8"));
  });

  it("demo en rojo: una fuga plantada sale con su nombre, y un archivo fuera del manifiesto también", () => {
    const rojo = join(tmp, "rojo");
    cpSync(a, rojo, { recursive: true });
    const es = join(rojo, "es.html");
    writeFileSync(es, readFileSync(es, "utf8").replace("</main>", '<a href="https://ejemplo.invalid/x">x</a><p>/investigar fabric · node scripts/aprobar.mjs</p><img src="/diseno/a.png" alt=""></main>'));
    writeFileSync(join(rojo, "colado.js"), "// propuestas/2026-11-12-fabric\n");
    // Segunda tanda de carnadas: lo que el primer gate no nombraba (IP y localhost, rutas con comilla simple o que suben, url(/…),
    // comandos del repo y la carpeta de la skill).
    writeFileSync(join(rojo, "colado2.html"), `<a href='/fuera'>x</a><img src='../afuera.png' alt=""><p>http://192.168.1.20:3400 · localhost · pnpm aprobar · .claude/skills</p><style>a{background:url(/img/x.png)}</style>`);
    const f = fugasDe(rojo).join("\n");
    for (const debe of ["ruta desde la raíz «/fuera»", "ruta que sube de carpeta «../afuera.png»", "url() desde la raíz «/img/x.png»", "192.168.1.20", "localhost", "pnpm aprobar", ".claude/", "investigar", "aprobar.mjs", "propuestas/", "diseno/", "https://ejemplo.invalid/x", "ruta desde la raíz «/diseno/a.png»", "la huella de es.html no es la del archivo", "colado.js"]) expect(f).toContain(debe);
  });
});
