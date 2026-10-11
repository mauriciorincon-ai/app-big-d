// El perfil APROBADO contra la base sembrada (S4, F3): el caso con su sello, sin editor, con cada decisión elegida, a 380 px sin
// desbordar y sin violaciones serias de axe en los dos temas. El dato real sigue en borrador hasta que una persona apruebe su
// comando; aquí la base sembrada lo tiene aprobado para probar la pantalla del aprobado.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { textos } from "../../../src/lib/i18n";
import { listo } from "../lib/abrir";

const CASO = "hospital-futuro";
const PAGINAS = ["es", "en"].map((i) => `/${i}/casos/${CASO}`);

for (const idioma of ["es", "en"] as const) {
  const T = textos(idioma).caso.perfil;
  test(`${idioma} · el perfil aprobado muestra su sello, sus criterios y sus decisiones elegidas, sin editor`, async ({
    page,
  }) => {
    await page.goto(`/${idioma}/casos/${CASO}`);
    await listo(page);
    await expect(page.locator(".veredicto .sello")).toContainText(
      T.sello.titulo,
    );
    await expect(page.locator("[data-editor-perfil]")).toHaveCount(0);
    await expect(page.locator(".aprobar-perfil")).toHaveCount(0);
    await expect(page.locator("li[data-criterio]")).toHaveCount(11);
    const decisiones = await page.locator("[data-decision]").count();
    expect(decisiones).toBeGreaterThan(0);
    await expect(page.locator("[data-decision] [data-elegida]")).toHaveCount(
      decisiones,
    );
  });
}

test("a 380 px el perfil aprobado no desborda la página", async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 800 });
  for (const ruta of PAGINAS) {
    await page.goto(ruta);
    await listo(page);
    const ancho = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(ancho, ruta).toBeLessThanOrEqual(380);
  }
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    for (const ruta of PAGINAS)
      test(`${ruta} sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        await listo(page);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );
        expect(
          serias,
          JSON.stringify(
            serias.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          ),
        ).toEqual([]);
      });
  });
