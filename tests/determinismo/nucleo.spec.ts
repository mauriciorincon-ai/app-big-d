// Regla dura 1 en el navegador (D-S3-15): el núcleo comparativo, empaquetado con esbuild, evalúa en una página en
// blanco las mismas entradas que Node y la huella SHA-256 de cada resultado canónico, calculada con `crypto.subtle`
// DENTRO del navegador, es la de tests/determinismo/NUCLEO.SHA256SUMS. Corre en Chromium, Firefox y WebKit, en el job
// `diagramador` (ubuntu-latest y macos-latest).
import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const RAIZ = resolve(__dirname, "../..");
const SUMAS = Object.fromEntries(
  readFileSync(resolve(__dirname, "NUCLEO.SHA256SUMS"), "utf8")
    .trim()
    .split("\n")
    .map((l) => [l.slice(66), l.slice(0, 64)] as const),
);
let nucleo = "";

test.beforeAll(async () => {
  const r = await build({ entryPoints: [resolve(__dirname, "entrada-nucleo.ts")], bundle: true, format: "iife", target: "es2020", write: false, logLevel: "silent", alias: { "@": resolve(RAIZ, "src") } });
  nucleo = r.outputFiles[0]!.text;
});

test("el núcleo da en este navegador las huellas que da en Node", async ({ page }) => {
  // `crypto.subtle` exige un contexto seguro: una página vacía servida por la propia prueba en un dominio reservado.
  await page.route("https://nucleo.invalid/**", (r) => r.fulfill({ contentType: "text/html", body: '<!doctype html><meta charset="utf-8"><title>núcleo</title>' }));
  await page.goto("https://nucleo.invalid/");
  await page.addScriptTag({ content: nucleo });
  const huellas: [string, string][] = await page.evaluate(async () => {
    const casos = (globalThis as unknown as { nucleoCasos: () => { caso: string; texto: string }[] }).nucleoCasos();
    const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    const out: [string, string][] = [];
    for (const c of casos) out.push([c.caso, hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(c.texto)))]);
    return out;
  });
  expect(huellas.length).toBe(Object.keys(SUMAS).length);
  expect(Object.fromEntries(huellas)).toEqual(SUMAS);
});
