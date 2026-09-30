import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { textos } from "../../src/lib/i18n";
import { IDIOMAS } from "./lib/rutas";

// La página que no existe (404 global; B-7 de la auditoría del S1: no tenía prueba ni axe): responde 404, dice
// en todos los idiomas que la página no existe y lleva a la portada de cada idioma; axe en los dos temas.
test("una ruta que no existe responde 404 con su página, en todos los idiomas", async ({ page }) => {
  const r = await page.goto("/es/atlas/no-existe");
  expect(r?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText(textos(IDIOMAS[0]).noEncontrada.titulo);
  for (const i of IDIOMAS) {
    await expect(page.locator(`main :is(h1, p)[lang="${i}"]`, { hasText: textos(i).noEncontrada.titulo })).toHaveCount(1);
    await expect(page.getByRole("link", { name: textos(i).noEncontrada.volver })).toHaveAttribute("href", `/${i}`);
  }
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`404 · axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    test(`sin violaciones serias (${tema})`, async ({ page }) => {
      await page.goto("/otra/ruta/que/no/existe");
      const scan = await new AxeBuilder({ page }).analyze();
      const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
    });
  });
