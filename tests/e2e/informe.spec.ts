// El informe del caso (S6, F3) con el plan REAL, en borrador: las catorce secciones salen en el orden de § 12 con su
// título; cada ítem de la hoja de ruta lleva a su origen y el enlace llega a su ancla; la banda de borrador dice por qué;
// la vista de impresión deja solo el informe; a 380 px no desborda; axe en los dos temas. Los títulos y el orden salen del
// código (`SECCIONES`) y del texto de la pantalla, no de números escritos a mano.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SECCIONES } from "../../src/engine";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";

const CASO = "hospital-futuro";
const RUTA = `/es/casos/${CASO}/informe`;
const T = textos("es").caso.informe;

test("las catorce secciones salen en el orden de § 12, cada una con su título", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  const ids = await page
    .locator("section.inf-sec")
    .evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(SECCIONES.map((s) => `sec-${s}`));
  expect(ids).toHaveLength(14);
  for (const s of SECCIONES)
    await expect(page.locator(`#sec-${s} h2`)).toContainText(
      T.informe.secciones[s],
    );
});

test("cada ítem de la hoja de ruta trae su origen, y cada origen llega a su ancla", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  const items = await page.locator("#hoja li.item").count();
  expect(items).toBeGreaterThan(0);
  await expect(page.locator("#hoja li.item:not(:has(a.origen))")).toHaveCount(
    0,
  );
  const destinos = await page
    .locator("#hoja li.item a.origen")
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(destinos).toHaveLength(items);
  const existen = await page.evaluate(
    (hrefs) =>
      hrefs.map((h) => h !== null && document.querySelector(h) !== null),
    destinos,
  );
  expect(existen.every(Boolean)).toBe(true);
  await page.locator("#hoja li.item a.origen").first().click();
  await expect(page).toHaveURL(/#(d|r|s)-/);
});

test("sin aprobar, la banda de borrador dice por qué", async ({ page }) => {
  await page.goto(RUTA);
  await listo(page);
  const banda = page.locator("[data-borrador]");
  await expect(banda).toHaveCount(1);
  await expect(banda).toBeVisible();
  await expect(banda).toContainText(T.borrador.titulo);
  await expect(banda).toContainText("aprobar el perfil del caso");
  await expect(banda).toContainText("aprobar el plan del caso");
});

test("la vista de impresión deja solo el informe: sin barra, vistas, índice, botón ni banda", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  for (const sel of [
    ".barra",
    ".niveles",
    ".inf-indice",
    ".informe-acciones",
    "#hoja",
    "[data-borrador]",
  ])
    await expect(page.locator(sel)).not.toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  for (const sel of [
    ".barra",
    ".niveles",
    ".inf-indice",
    ".informe-acciones",
    "#hoja",
    "[data-borrador]",
  ])
    await expect(page.locator(sel).first()).toBeHidden();
  await expect(page.locator("article.informe")).toBeVisible();
});

test("a 380 px la página no desborda", async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 800 });
  await page.goto(RUTA);
  await listo(page);
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(380);
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    test(`${RUTA} sin violaciones serias (${tema})`, async ({ page }) => {
      await page.goto(RUTA);
      await listo(page);
      const scan = await new AxeBuilder({ page }).analyze();
      const serias = scan.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(
        serias,
        JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)])),
      ).toEqual([]);
    });
  });
