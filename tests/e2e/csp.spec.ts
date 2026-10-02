// CSP del export estático (D-S2-05 del S2): cada página del producto trae su `<meta>` con la huella de cada
// script y estilo en línea, sin `unsafe-inline`; con ella la página hidrata y lo que se toca funciona (el tema,
// la ventana de un bloque, la ficha de un componente) sin una sola violación ni un error. Corre en los cuatro
// motores: una CSP puede romper en uno solo. La maqueta (`/diseno/`) trae la suya por cabecera, fija.
import { expect, test, type Page } from "@playwright/test";
import { abrir, listo } from "./lib/abrir";
import { RUTAS } from "./lib/rutas";

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

test("la maqueta trae su CSP de cabecera, sin scripts en línea", async ({ request }) => {
  const r = await request.get("/diseno/index.html");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-security-policy"]).toMatch(/^default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'/);
});
