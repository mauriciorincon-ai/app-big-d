// G1 en el navegador (D-S1-12): el mismo motor, empaquetado con esbuild, genera en una página en blanco
// los mismos SVG que los golden files de Node; la huella SHA-256 se calcula con `crypto.subtle` DENTRO del
// navegador y se compara con packages/diagramador/test/golden/SHA256SUMS. Corre en Chromium, Firefox y
// WebKit (config propia, sin servidor: no hay ruta publicada y Lighthouse no se toca).
import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

test("los SVG del motor en este navegador tienen las huellas de los golden files de Node", async ({ page }) => {
  // `crypto.subtle` solo existe en un contexto seguro: una página vacía servida por la propia prueba en un
  // dominio reservado (RFC 6761, `.invalid`); nada sale a la red.
  await page.route("https://diagramador.invalid/", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>determinismo</title>" }));
  await page.goto("https://diagramador.invalid/");
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
