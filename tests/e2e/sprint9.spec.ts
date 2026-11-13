// S9 (F3): lo nuevo del sprint, con el dato REAL y en español (la guía dice dónde se mira cada cosa: l6, f8 y n3; el inglés lo cubren
// las unitarias de los textos y el manual). El entrevistador arma pesos que suman 100 y «usar» solo llena el editor; BigQuery entra
// como «próximamente» con la propuesta que escribió el modelo del sistema (si ya la aprobó una persona, esa prueba no aplica); el
// instrumento trae su fila de jerga en verde. axe sobre la entrevista abierta, en los dos temas, y nada desborda a 380 px.
import AxeBuilder from "@axe-core/playwright";
import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";
import { PERFIL_APROBADO } from "./lib/estado";

const DATOS = process.env.BIGD_DATOS ?? "data";
const CASO = "hospital-futuro";
const N = (parse(readFileSync(`${DATOS}/casos/${CASO}.yaml`, "utf8")) as { criterios: unknown[] }).criterios.length;

test.describe("el entrevistador (l6)", () => {
  test.skip(PERFIL_APROBADO, "el perfil real ya está aprobado: sin editor no hay entrevista");

  async function abrir(page: Page) {
    await page.goto(`/es/casos/${CASO}`);
    await listo(page);
    const e = page.locator("[data-entrevista]");
    await e.locator("summary").click();
    await expect(e.locator("[data-pregunta]").first()).toBeVisible();
    return e;
  }
  /** Responde cada pregunta con la opción número `nivel` de su escala (0 = la más baja). */
  const responder = async (page: Page, nivel: number) => {
    const preguntas = page.locator("[data-pregunta]");
    await expect(preguntas).toHaveCount(N);
    for (let i = 0; i < N; i++) await preguntas.nth(i).locator("input[type=radio]").nth(nivel).check();
  };

  test("incompleta no propone; completa propone pesos que suman 100; «usar» llena el editor y nada se aprueba", async ({ page }) => {
    const T = textos("es").caso.perfil.entrevista;
    const e = await abrir(page);
    await expect(e.locator("[data-entrevista-faltan]")).toContainText(`Faltan responder ${N} preguntas`);
    await expect(e.locator("[data-entrevista-propuesta]")).toHaveCount(0);

    await responder(page, 2);
    await expect(e.locator("[data-entrevista-faltan]")).toHaveCount(0);
    await expect(e.locator("[data-peso-entrevista]")).toHaveCount(N);
    const pesos = (await e.locator("[data-peso-entrevista] td").allTextContents()).map((t) => Number(t.replace(",", ".")));
    expect(Math.round(pesos.reduce((a, b) => a + b, 0) * 100)).toBe(10000);
    await page.getByRole("button", { name: T.usar }).click();
    await expect(page.locator("[data-pesos-desde-entrevista]")).toBeVisible();
    await expect(page.locator("[data-suma-editor]")).toContainText("100,00");
    // Nada se aprueba: el perfil sigue en borrador y el comando, si aparece, es el de siempre (lo corre una persona).
    await expect(page.locator("main")).toContainText("borrador");
  });

  test("«poco» a todo: avisa que no hay con qué repartir y no propone pesos", async ({ page }) => {
    const e = await abrir(page);
    await responder(page, 0);
    await expect(e.locator("[data-entrevista-sin-prioridad]")).toBeVisible();
    await expect(e.locator("[data-entrevista-propuesta]")).toHaveCount(0);
  });

  for (const [esquema, tema] of [["dark", "oscuro"], ["light", "claro"]] as const)
    test.describe(`axe en ${tema}`, () => {
      test.use({ colorScheme: esquema });
      test(`la entrevista abierta, con propuesta, sin violaciones de axe (${tema})`, async ({ page }) => {
        await abrir(page);
        await responder(page, 2);
        const scan = await new AxeBuilder({ page }).include("[data-entrevista]").analyze();
        expect(scan.violations, JSON.stringify(scan.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
    });

  test("a 380 px la entrevista abierta no desborda la página", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await abrir(page);
    await responder(page, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(380);
  });
});

test.describe("BigQuery y el modelo del sistema (f8)", () => {
  test.skip(existsSync(`${DATOS}/mapas/bigquery.mapa.yaml`), "el mapa de BigQuery ya lo aprobó una persona: la propuesta pasó al historial");

  test("«próximamente», sin inventar un mapa, y la propuesta dice que la escribió el modelo del sistema", async ({ page }) => {
    await page.goto("/es/investigador/bigquery");
    await listo(page);
    await expect(page.getByRole("heading", { name: "Todavía no hay mapa de BigQuery." })).toBeVisible();
    const propuesta = page.locator('section[aria-labelledby="prop-t"]');
    await expect(propuesta).toContainText("la escribió el modelo del sistema de este equipo sobre propuestas/");
    await expect(propuesta).toContainText(/afirmaciones? (es|son) suyas?/);
    // Cada afirmación trae su cita; nada viene aprobado de entrada y esta página no aprueba nada.
    await expect(page.locator("main")).not.toContainText("mapa aprobado v");
  });

  test("en el lado a lado BigQuery es una fila «próximamente» sin mapa que comparar", async ({ page }) => {
    await page.goto("/es/comparar?plataformas=bigquery");
    await listo(page);
    const fila = page.locator('.lado-fila[data-fila="bigquery"]');
    await expect(fila.locator(".lado-pronto-nombre")).toContainText("próximamente");
    // El enlace a su página del investigador ya lo cruza lado.spec.ts; aquí, que BigQuery está y dice que aún no tiene mapa.
    await expect(fila).not.toContainText("mapa aprobado v");
  });
});

test("el instrumento trae la fila de jerga en verde, y en los dos idiomas", async ({ page }) => {
  await page.goto("/es/instrumento");
  await listo(page);
  const fila = page.locator('[data-validacion="jerga"]');
  await expect(fila).toHaveAttribute("data-ok", "true");
  await expect(fila).toContainText("jerga");
  await page.goto("/en/instrumento");
  await listo(page);
  await expect(page.locator('[data-validacion="jerga"]')).toContainText("jargon");
});
