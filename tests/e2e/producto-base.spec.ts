import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Cascarón del producto (S1, fase 0): tema por data-theme + prefers-color-scheme (A-31), idioma por
// ruta, fuentes = tabla de métricas (G15), salto al contenido y axe en los dos temas.
const FONDO = { oscuro: "rgb(11, 15, 20)", claro: "rgb(242, 244, 246)" } as const;
const metricas = JSON.parse(readFileSync("docs/diseno/assets/fuentes/metricas.json", "utf8"));

for (const [esquema, tema] of [["dark", "oscuro"], ["light", "claro"]] as const) {
  test.describe(`sistema en ${esquema}`, () => {
    test.use({ colorScheme: esquema });

    test(`sin elección, manda el sistema: ${tema} (A-31)`, async ({ page }) => {
      await page.goto("/es");
      await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
      await expect(page.locator("body")).toHaveCSS("background-color", FONDO[tema]);
      const nombre = tema === "oscuro" ? "Oscuro" : "Claro";
      await expect(page.getByRole("button", { name: nombre, exact: true })).toHaveAttribute("aria-pressed", "true");
    });

    for (const ruta of ["/", "/es", "/en"]) {
      test(`${ruta} sin violaciones serias de accesibilidad (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => v.id))).toEqual([]);
      });
    }
  });
}

test.describe("elección del visitante", () => {
  test.use({ colorScheme: "dark" });
  test("el tema elegido vence al sistema y se recuerda al recargar", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: "Claro", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "claro");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "claro");
    await expect(page.locator("body")).toHaveCSS("background-color", FONDO.claro);
  });
});

test("el idioma es la ruta: el conmutador lleva a la misma página en el otro idioma", async ({ page }) => {
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toHaveText("Every data platform, on the same map");
});

test("«Saltar al contenido» es el primer foco", async ({ page }) => {
  await page.goto("/es");
  await page.keyboard.press("Tab");
  await expect(page.locator(".saltar")).toBeFocused();
});

test("el sitio sirve las fuentes de la tabla de métricas, byte a byte (G15)", async ({ page, request }) => {
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);
  const urls: string[] = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.endsWith(".woff2")),
  );
  const servidas: string[] = [];
  for (const url of urls) {
    const cuerpo = await (await request.get(url)).body();
    servidas.push(createHash("sha256").update(cuerpo).digest("hex"));
  }
  const esperadas = Object.values(metricas.fuentes as Record<string, { sha256: string }>).map((f) => f.sha256);
  expect([...new Set(servidas)].sort()).toEqual([...esperadas].sort());
});
