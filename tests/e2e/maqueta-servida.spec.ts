import { expect, test } from "@playwright/test";

// A-04 (deuda de la Etapa de Diseño): la maqueta se sirve CON estilos y sus enlaces relativos
// funcionan detrás del servidor real, no solo por doble clic. El 404 del preview y la redirección
// de `serve` (`/diseno/index.html` → `/diseno`, sin barra: los `assets/` relativos salían de la
// carpeta) pasaron cuatro miradas porque ningún gate pedía `/diseno`. Vercel se verifica en el
// preview con sesión (`vercel.json`); este spec cubre el servidor de `pnpm start`, que es el de
// e2e y Lighthouse.
const FONDO_OSCURO = "rgb(11, 15, 20)"; // --fondo del tema oscuro (tokens.css)

for (const entrada of ["/diseno/index.html", "/diseno/", "/diseno"]) {
  test(`la maqueta abre con estilos desde ${entrada}`, async ({ page }) => {
    const respuesta = await page.goto(entrada);
    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveURL(/\/diseno\/index\.html$/);
    await expect(page.locator("body")).toHaveCSS("background-color", FONDO_OSCURO);
    await expect(page.locator("h1")).toBeVisible();
  });
}

test("un enlace relativo de la maqueta abre otra pantalla con estilos", async ({ page }) => {
  await page.goto("/diseno/index.html");
  await page.locator('a[href="kit.html"]').first().click();
  await expect(page).toHaveURL(/\/diseno\/kit\.html$/);
  await expect(page.locator("body")).toHaveCSS("background-color", FONDO_OSCURO);
});
