import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Atlas · nivel 1 en el producto (S1, fase 2): el SVG del diagramador generado en el build, la capa
// interactiva enganchada a sus ids (ficha breve con clic y con teclado, lienzo deslizable con índice de
// capas), la lectura en texto equivalente (G10) y axe en los dos temas. Sin fecha fijada: el build usa el día
// de hoy, así que nada aquí depende de si el mapa está vigente o por revisar.
const RUTA = { es: "/es/atlas/plataforma-ejemplo", en: "/en/atlas/plataforma-ejemplo" } as const;

for (const [idioma, ruta] of Object.entries(RUTA)) {
  test(`${ruta}: el diagrama, su lectura y su leyenda salen del motor, en «${idioma}»`, async ({ page }) => {
    await page.goto(ruta);
    await expect(page.locator("html")).toHaveAttribute("lang", idioma);
    const svg = page.locator(".lienzo svg.dg-svg");
    await expect(svg).toHaveAttribute("lang", idioma);
    await expect(svg).toHaveAttribute("aria-details", "lectura-texto");
    // G10 en el producto: cada bloque del dibujo tiene su entrada en la lectura, y cada nodo de un bloque también.
    const bloques = await page.locator(".lienzo .dg-elem").evaluateAll((es) => es.map((e) => e.getAttribute("data-dueno")!));
    for (const id of bloques.filter((b) => !b.startsWith("_"))) await expect(page.locator(`#lectura-texto li[data-bloque="${id}"]`)).toHaveCount(1);
    const nodos = await page.locator(".lienzo .dg-elem").evaluateAll((es) => es.flatMap((e) => e.getAttribute("data-nodos")!.split(" ")));
    // (Los pasos del recorrido también nombran su nodo; aquí cuenta la entrada del nodo, no sus pasos.)
    for (const id of nodos) await expect(page.locator(`#lectura-texto li[data-nodo="${id}"]:not([data-paso])`)).toHaveCount(1);
    await expect(page.locator(".leyenda .dg-leyenda h2")).toHaveCount(4);
  });
}

test("con teclado: Tab llega a un bloque, Enter muestra su frase debajo del mapa", async ({ page }) => {
  await page.goto(RUTA.es);
  const ficha = page.locator("#ficha-breve");
  await expect(ficha).toBeHidden();
  const primero = page.locator(".lienzo .dg-elem").first();
  await primero.focus();
  await page.keyboard.press("Enter");
  await expect(ficha).toBeVisible();
  await expect(ficha).toContainText("Sistemas de origen");
  await expect(primero).toHaveAttribute("aria-current", "true");
  // Otro bloque con clic cambia la ficha y la marca.
  await page.locator('.lienzo .dg-elem[data-dueno="almacen"]').dispatchEvent("click");
  await expect(ficha).toContainText("Almacén central");
  await expect(primero).not.toHaveAttribute("aria-current", "true");
});

test("«Saltar el diagrama» lleva a la lectura en texto", async ({ page }) => {
  await page.goto(RUTA.es);
  await page.locator(".saltar-diagrama").focus();
  await expect(page.locator(".saltar-diagrama")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#lectura$/);
});

test.describe("en un teléfono de 380 px", () => {
  test.use({ viewport: { width: 380, height: 800 } });
  test("el lienzo se desliza de lado; la página no; el índice lleva a cada capa", async ({ page }) => {
    await page.goto(RUTA.es);
    await expect(page.locator(".mapa")).toHaveAttribute("data-desborda", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await expect(page.locator(".pista")).toBeVisible();
    const lienzo = page.locator(".lienzo");
    await page.getByRole("button", { name: /Inteligencia artificial/ }).click();
    await expect.poll(() => lienzo.evaluate((e) => e.scrollLeft)).toBeGreaterThan(500);
    await expect(page.getByRole("button", { name: /Inteligencia artificial/ })).toHaveAttribute("aria-current", "true");
  });
});

test("la barra y la portada llevan al atlas", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Open the atlas" }).click();
  await expect(page).toHaveURL(/\/en\/atlas\/plataforma-ejemplo$/);
  await page.goto("/es");
  await page.getByRole("navigation", { name: "Secciones" }).or(page.getByRole("list", { name: "Secciones" })).getByRole("link", { name: "Atlas" }).click();
  await expect(page).toHaveURL(/\/es\/atlas\/plataforma-ejemplo$/);
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    for (const ruta of Object.values(RUTA))
      test(`${ruta} sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        await page.locator(".lienzo .dg-elem").first().dispatchEvent("click");
        await page.locator("details.lectura-seccion > summary").click();
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
  });
