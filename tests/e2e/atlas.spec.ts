import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Atlas · nivel 1 en el producto (S1, fase 2): el SVG del diagramador generado en el build, la capa
// interactiva enganchada a sus ids (la ventana de un bloque con clic y con teclado, lienzo deslizable con
// índice de capas), la lectura en texto equivalente (G10) y axe en los dos temas. Sin fecha fijada: el build usa el día
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

test("con teclado: Enter sobre un bloque abre su ventana con sus componentes; Esc la cierra y devuelve el foco", async ({ page }) => {
  await page.goto(RUTA.es);
  const panel = page.locator("#panel-ficha");
  await expect(panel).toBeHidden();
  const primero = page.locator(".lienzo .dg-elem").first();
  await primero.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await expect(panel.locator("h2")).toHaveText("Sistemas de origen");
  await expect(panel.locator("h2")).toBeFocused();
  await expect(panel.locator('svg[data-vista="bloque"] .dg-nodo')).toHaveCount(1);
  await expect(panel.locator(".dg-tarjeta")).toHaveCount(1);
  await expect(primero).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(primero).toBeFocused();
  // Otro bloque con clic: sus dos componentes dibujados, el flujo que los une y una tarjeta por cada uno.
  await page.locator('.lienzo .dg-elem[data-dueno="consumo-bi"]').dispatchEvent("click");
  await expect(panel.locator("h2")).toHaveText("Tableros");
  await expect(panel.locator('svg[data-vista="bloque"] .dg-nodo')).toHaveCount(2);
  await expect(panel.locator('svg[data-vista="bloque"] .dg-flujo[data-dueno="f-semantico-tablero"]')).toHaveCount(1);
  await expect(panel.locator(".dg-tarjeta")).toHaveCount(2);
  await expect(panel.locator('.dg-tarjeta[data-nodo="tablero"] li[data-flujo="f-semantico-tablero"]')).toContainText("Desde Modelo semántico");
  await expect(panel.getByRole("link", { name: /Componentes/ })).toHaveAttribute("href", "/es/atlas/plataforma-ejemplo/componentes");
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
  test("la ventana de un bloque es una hoja modal que cabe sin deslizar de lado", async ({ page }) => {
    await page.goto(RUTA.en);
    await page.locator('.lienzo .dg-elem[data-dueno="almacen"]').dispatchEvent("click");
    const panel = page.getByRole("dialog", { name: "Inside the block" });
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(panel.locator('svg[data-vista="bloque"] .dg-nodo')).toHaveCount(2);
    expect(await panel.locator(".panel-cuerpo").evaluate((e) => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test("la barra y la portada llevan al atlas", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("combobox", { name: "Platform" }).selectOption("plataforma-ejemplo");
  await expect(page).toHaveURL(/\/en\/atlas\/plataforma-ejemplo$/);
  await page.goto("/es");
  await page.getByRole("navigation", { name: "Secciones" }).or(page.getByRole("list", { name: "Secciones" })).getByRole("link", { name: "Atlas" }).click();
  // La primera plataforma publicada en orden de id (ninguna tiene trato especial): desde la parada B, fabric.
  await expect(page).toHaveURL(/\/es\/atlas\/fabric$/);
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
        // La lectura antes que la ventana: en un teléfono la ventana es una hoja modal que tapa la página.
        await page.locator("details.lectura-seccion > summary").click();
        await page.locator(".lienzo .dg-elem").first().dispatchEvent("click");
        await expect(page.locator("#panel-ficha")).toBeVisible();
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
  });
