// D3 (S8): «Duplicar este caso» en la pantalla del perfil, con el dato REAL, en los dos idiomas: la pantalla arma el comando
// con el id que la persona escribe (lo corre ella, en su terminal) y lo calla con un id que no sirve.
import { expect, test } from "@playwright/test";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";

const CASO = "hospital-futuro";

for (const idioma of ["es", "en"] as const)
  test(`${idioma} · duplicar el caso arma el comando con el id de la copia y lo calla con un id que no sirve`, async ({ page }) => {
    const t = textos(idioma).caso.perfil.duplicar;
    await page.goto(`/${idioma}/casos/${CASO}`);
    await listo(page);
    const d = page.locator("[data-duplicar]");
    await d.locator("summary").click();
    await expect(d.locator(".comando code")).toHaveText(`node scripts/duplicar-caso.mjs ${CASO} ${CASO}-b`);
    const campo = d.getByLabel(t.etiqueta);
    await campo.fill(CASO);
    await expect(d.locator('[data-duplicar-problema="mismo"]')).toHaveText(t.problemas.mismo);
    await expect(d.locator(".comando")).toHaveCount(0);
    await campo.fill("hospital-variante");
    await expect(d.locator(".comando code")).toHaveText(`node scripts/duplicar-caso.mjs ${CASO} hospital-variante`);
  });
