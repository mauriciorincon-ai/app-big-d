import { expect, test } from "@playwright/test";
import { abrir, abrirConTecla, listo } from "./lib/abrir";
import { PUBLICADAS, VERSIONADAS } from "./lib/rutas";

// Versiones de un mapa (S2, D-S2-08): se llega desde la cabecera del atlas; cada par muestra las dos filas (arriba la
// anterior, abajo la nueva) y la lista que explica sus diferencias; cada bloque abre la ventana de SU versión, y solo
// la vigente ofrece el paso a «Componentes». Un mapa con una sola versión muestra su estado vacío. Las plataformas
// salen del dato (VERSIONADAS: las que tienen una versión archivada en data/mapas/versiones/).
const conVersiones = VERSIONADAS[0];
const sinVersiones = PUBLICADAS.find((p) => !VERSIONADAS.includes(p));

test("desde el atlas se llega a las versiones; cada fila abre la ventana de su versión", async ({ page }) => {
  test.skip(!conVersiones, "ningún mapa publicado tiene una versión archivada");
  await page.goto(`/es/atlas/${conVersiones}`);
  await listo(page);
  await page.getByRole("link", { name: "ver versiones" }).click();
  await expect(page).toHaveURL(new RegExp(`/es/atlas/${conVersiones}/versiones$`));
  await listo(page);
  await expect(page.getByRole("link", { name: "Atlas", exact: true })).toHaveAttribute("aria-current", "true");
  const par = page.locator(".version-par").first();
  await expect(par.getByRole("heading", { level: 2 })).toHaveText(/^De v[\d.]+ a v[\d.]+$/);
  await expect(par.locator(".version-dif")).toBeVisible();
  await expect(par.locator(".version-dice h3")).toHaveText("Lo que dicen los componentes");
  // El primer bloque del dibujo es de la fila de arriba (la versión anterior); el último, de la de abajo (la nueva).
  const bloques = par.locator(".version-lienzo .dg-elem");
  const panel = page.locator("#panel-ficha");
  await abrir(bloques.first(), panel);
  await expect(panel.locator(".dg-ficha-tipo").first()).toContainText(/versión \d+\.\d+\.\d+/);
  await expect(panel.locator(".ventana-mas")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await abrirConTecla(bloques.last(), panel);
  await expect(panel.locator(".ventana-mas a")).toBeVisible();
});

test("en inglés, el mismo par con sus textos", async ({ page }) => {
  test.skip(!conVersiones, "ningún mapa publicado tiene una versión archivada");
  await page.goto(`/en/atlas/${conVersiones}/versiones`);
  await listo(page);
  await expect(page.locator(".version-par h2").first()).toHaveText(/^From v[\d.]+ to v[\d.]+$/);
  await expect(page.locator(".version-dice h3").first()).toHaveText("What the components say");
});

test("un mapa con una sola versión muestra su estado vacío, sin dibujo", async ({ page }) => {
  test.skip(!sinVersiones, "todos los mapas publicados tienen versiones archivadas");
  await page.goto(`/es/atlas/${sinVersiones}/versiones`);
  await listo(page);
  await expect(page.locator(".version-vacio h2")).toHaveText(/tiene una sola versión\.$/);
  await expect(page.locator(".version-lienzo")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Volver al atlas de / })).toHaveAttribute("href", `/es/atlas/${sinVersiones}`);
});
