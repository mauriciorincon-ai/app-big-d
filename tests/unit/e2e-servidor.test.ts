// @vitest-environment node
// D-S7-03: los dos sitios del e2e se construyen EN SECUENCIA. Un arreglo de webServers los arranca a la vez y los dos builds
// escribían `.next/` y `out/` al mismo tiempo (caché dañada en el S6). Esta prueba fija la forma: un solo webServer, y el
// script construye la sembrada, luego el dato real, y solo entonces sirve.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = readFileSync("playwright.config.ts", "utf8");
const script = readFileSync("scripts/e2e/servir.mjs", "utf8");

describe("el servidor del e2e", () => {
  it("la config declara UN webServer (objeto), no un arreglo", () => {
    expect(config).toMatch(/webServer:\s*\{/);
    expect(config).not.toMatch(/webServer:\s*\[/);
    expect(config).toContain("scripts/e2e/servir.mjs");
  });
  it("el script construye la sembrada, luego el dato real, y solo después sirve", () => {
    const sembrada = script.indexOf('correr("node", ["scripts/datos/construir-sembrada.mjs"])');
    const real = script.indexOf('correr("pnpm", ["build"])');
    const sirve = script.indexOf('spawn("pnpm", ["exec", "serve"');
    expect(sembrada).toBeGreaterThan(-1);
    expect(real).toBeGreaterThan(sembrada);
    expect(sirve).toBeGreaterThan(real);
  });
  it("Playwright espera al sitio del dato real, que es el último en levantarse", () => {
    expect(script.indexOf('spawn("pnpm", ["start"]')).toBeGreaterThan(script.indexOf("await esperar("));
  });
});
