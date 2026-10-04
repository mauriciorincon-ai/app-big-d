// CSP del export estático (D-S2-05 del S2): cada página del producto trae su `<meta>` con la huella de cada
// script y estilo en línea, sin `unsafe-inline`; con ella la página hidrata y lo que se toca funciona (el tema,
// la ventana de un bloque, la ficha de un componente) sin una sola violación ni un error. Corre en los cuatro
// motores: una CSP puede romper en uno solo. La maqueta (`/diseno/`) trae la suya por cabecera, fija.
import { expect, test, type Page } from "@playwright/test";
import { abrir, listo } from "./lib/abrir";
import { IDIOMAS, PUBLICADAS, RUTAS } from "./lib/rutas";

declare global {
  interface Window {
    __violaciones?: string[];
  }
}

async function escucharViolaciones(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__violaciones = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__violaciones!.push(`${e.effectiveDirective} · ${e.blockedURI || "en línea"} · ${(e.sample || "").slice(0, 60)}`),
    );
  });
}

for (const ruta of RUTAS)
  test(`${ruta}: trae su CSP, hidrata y lo que se toca funciona sin una sola violación`, async ({ page }) => {
    await escucharViolaciones(page);
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(ruta);
    const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(meta).toHaveCount(1);
    const csp = (await meta.getAttribute("content")) ?? "";
    expect(csp).toMatch(/script-src 'self' 'sha256-/);
    expect(csp).not.toContain("unsafe-inline");
    await listo(page);
    const otro = page.locator('[data-theme-set][aria-pressed="false"]');
    const tema = await otro.getAttribute("data-theme-set");
    await otro.click();
    await expect(page.locator(`[data-theme-set="${tema}"]`)).toHaveAttribute("aria-pressed", "true");
    const activable = page.locator(".lienzo .dg-elem, .lienzo .dg-nodo").first();
    if (await activable.count()) await abrir(activable, page.locator("#panel-ficha"));
    expect(await page.evaluate(() => window.__violaciones)).toEqual([]);
    expect(errores).toEqual([]);
  });

// Al cambiar de nivel con las pestañas, Next no recarga: React inserta el `<style>` de la página nueva (las reglas de
// los pasos del recorrido) bajo la CSP de la primera. Por eso cada página lleva las huellas de estilo del sitio entero
// (S2, fase 2: el recorrido llegaba sin sus reglas desde el nivel 1).
for (const idioma of IDIOMAS)
  for (const p of PUBLICADAS)
    test(`/${idioma}/atlas/${p}: las pestañas de nivel cambian de página sin recargar y sin una sola violación`, async ({ page }) => {
      await escucharViolaciones(page);
      await page.goto(`/${idioma}/atlas/${p}`);
      await listo(page);
      await page.evaluate(() => ((window as unknown as { __sinRecargar: boolean }).__sinRecargar = true));
      const destinos = await page.locator(".niveles a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
      expect(destinos.length).toBeGreaterThan(1);
      for (const destino of destinos) {
        await page.locator(`.niveles a[href="${destino}"]`).click();
        await expect(page).toHaveURL(new RegExp(`${destino.replace(/[.?]/g, "\\$&")}$`));
        await expect(page.locator(`.niveles a[href="${destino}"]`)).toHaveAttribute("aria-current", "page");
      }
      expect(await page.evaluate(() => (window as unknown as { __sinRecargar?: boolean }).__sinRecargar)).toBe(true);
      expect(await page.evaluate(() => window.__violaciones)).toEqual([]);
    });

test("la maqueta trae su CSP de cabecera, sin scripts en línea", async ({ request }) => {
  const r = await request.get("/diseno/index.html");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-security-policy"]).toMatch(/^default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'/);
});
