// G1 en el navegador (D-S1-12): el mismo motor, empaquetado con esbuild, genera en una página en blanco
// los mismos SVG que los golden files de Node; la huella SHA-256 se calcula con `crypto.subtle` DENTRO del
// navegador y se compara con packages/diagramador/test/golden/SHA256SUMS. Corre en Chromium, Firefox y
// WebKit (config propia, sin servidor: no hay ruta publicada y Lighthouse no se toca).
import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { METRICAS_PILOTO } from "../../packages/diagramador/src/index";
import { medidor } from "../../packages/diagramador/src/texto/metricas";

const RAIZ = resolve(__dirname, "../..");
const SUMAS = readFileSync(resolve(RAIZ, "packages/diagramador/test/golden/SHA256SUMS"), "utf8")
  .trim()
  .split("\n")
  .map((l) => [l.slice(66), l.slice(0, 64)] as const);
let motor = "";

test.beforeAll(async () => {
  const r = await build({ entryPoints: [resolve(__dirname, "entrada.ts")], bundle: true, format: "iife", target: "es2020", write: false, logLevel: "silent" });
  motor = r.outputFiles[0]!.text;
});

/** Página vacía en un contexto seguro, con las fuentes del piloto servidas por la propia prueba. */
async function paginaVacia(page: import("@playwright/test").Page, css = "") {
  // `crypto.subtle` solo existe en un contexto seguro: una página vacía servida por la propia prueba en un
  // dominio reservado (RFC 6761, `.invalid`); nada sale a la red.
  await page.route("https://diagramador.invalid/**", (r) => {
    const archivo = new URL(r.request().url()).pathname.slice(1);
    if (archivo.startsWith("fuentes/")) return r.fulfill({ contentType: "font/woff2", body: readFileSync(resolve(RAIZ, "docs/diseno/assets", archivo)) });
    return r.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset="utf-8"><title>determinismo</title><style>${css}</style>` });
  });
  await page.goto("https://diagramador.invalid/");
}

test("los SVG del motor en este navegador tienen las huellas de los golden files de Node", async ({ page }) => {
  await paginaVacia(page);
  await page.addScriptTag({ content: motor });
  const huellas: [string, string][] = await page.evaluate(async () => {
    const salidas = (globalThis as unknown as { diagramadorGolden: () => { archivo: string; svg: string }[] }).diagramadorGolden();
    const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    const out: [string, string][] = [];
    for (const s of salidas) out.push([s.archivo, hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s.svg)))]);
    return out;
  });
  expect(huellas.length).toBe(SUMAS.length);
  expect(Object.fromEntries(huellas)).toEqual(Object.fromEntries(SUMAS));
});

// G15 — la tabla de métricas es una COTA SUPERIOR del ancho real: todo texto que el motor mide (nombres,
// preguntas, etiquetas, insignias) ocupa en este navegador, con las fuentes del piloto, a lo sumo lo que la
// tabla dijo (margen de 3 %, sin kerning). Si un motor dibuja más ancho, un texto se sale de su caja (G11).
// `getComputedTextLength` mide EN LA PRUEBA, jamás en el motor (G2).
test("ningún texto dibujado es más ancho que lo que midió la tabla (G15, en los dos idiomas)", async ({ page }) => {
  const css = [
    readFileSync(resolve(RAIZ, "docs/diseno/assets/fuentes.css"), "utf8"),
    readFileSync(resolve(RAIZ, "docs/diseno/assets/tokens.css"), "utf8"),
    readFileSync(resolve(RAIZ, "src/styles/diagrama.css"), "utf8"),
    ':root { --letra: "Space Grotesk"; --letra-mono: "JetBrains Mono"; }',
  ].join("\n");
  await paginaVacia(page, css);
  await page.addScriptTag({ content: motor });
  const { medidas, cargadas } = await page.evaluate(async () => {
    const salidas = (globalThis as unknown as { diagramadorGolden: () => { archivo: string; svg: string }[] }).diagramadorGolden();
    const out: { texto: string; tam: number; peso: number; mono: boolean; ancho: number }[] = [];
    for (const s of salidas.filter((x) => /^(plataforma|agente)-ejemplo\.(nivel-1|nivel-2)\./.test(x.archivo))) {
      document.body.innerHTML = s.svg;
      await document.fonts.load('700 16px "Space Grotesk"');
      await document.fonts.load('700 12px "JetBrains Mono"');
      await document.fonts.ready;
      for (const t of document.querySelectorAll<SVGTSpanElement>("svg text tspan")) {
        const cs = getComputedStyle(t.parentElement!);
        if (cs.letterSpacing !== "normal" && cs.letterSpacing !== "0px") continue; // rótulos con espaciado: el motor no los encaja
        out.push({ texto: t.textContent ?? "", tam: parseFloat(cs.fontSize), peso: Number(cs.fontWeight), mono: cs.fontFamily.includes("JetBrains"), ancho: t.getComputedTextLength() });
      }
    }
    const cargadas = ['400 16px "Space Grotesk"', '700 16px "Space Grotesk"', '700 12px "JetBrains Mono"'].map((f) => document.fonts.check(f) && [...document.fonts].some((x) => x.status === "loaded" && f.includes(x.family.replace(/"/g, ""))));
    return { medidas: out, cargadas };
  });
  // Sin las fuentes del piloto la prueba no mide nada: el respaldo del sistema podría caber por casualidad.
  expect(cargadas).toEqual([true, true, true]);
  expect(medidas.length).toBeGreaterThan(300);
  const sans = medidor(METRICAS_PILOTO.fuentes["space-grotesk"]!);
  const mono = medidor(METRICAS_PILOTO.fuentes["jetbrains-mono"]!);
  const excesos = medidas
    .map((m) => ({ ...m, tabla: (m.mono ? mono : sans).ancho(m.texto, m.tam, m.peso >= 600 ? 700 : 400) / 10 }))
    .filter((m) => m.ancho > m.tabla + 0.01);
  const peor = Math.max(...medidas.map((m) => m.ancho / ((m.mono ? mono : sans).ancho(m.texto, m.tam, m.peso >= 600 ? 700 : 400) / 10)));
  console.log(`G15 ${test.info().project.name}: ${medidas.length} textos; el más ajustado usa el ${(peor * 100).toFixed(1)} % de lo que midió la tabla`);
  expect(excesos, JSON.stringify(excesos.slice(0, 5))).toEqual([]);
});
