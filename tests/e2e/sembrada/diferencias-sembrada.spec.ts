// D2 (S8) contra la BASE SEMBRADA con dos instantáneas (scripts/datos/construir-sembrada.mjs, `segunda`): la página de la
// base abre la más nueva frente a la anterior, nombra la evidencia modificada y sus campos, y evalúa el caso con las dos; cada
// cambio lleva ícono y texto (el color nunca va solo). En los dos idiomas; axe ya cubre /base en comparacion-sembrada.
import { expect, test } from "@playwright/test";
import { plantilla } from "../../../src/lib/atlas/plantilla";
import { textos } from "../../../src/lib/i18n";
import { listo } from "../lib/abrir";

const EVIDENCIA = "evi-norte-gobierno";

for (const idioma of ["es", "en"] as const)
  test(`${idioma} · la base dice qué cambió entre sus dos instantáneas y qué pasa con el caso`, async ({ page }) => {
    const T = textos(idioma).base.diferencias;
    await page.goto(`/${idioma}/base`);
    await listo(page);
    const par = page.locator('[data-par-instantaneas="2026-09-26.1|2026-09-26.2"]');
    await expect(par).toHaveAttribute("open", "");
    await expect(par.locator("summary")).toHaveText(plantilla(T.par, { ahora: "2026-09-26.2", antes: "2026-09-26.1" }));
    const mod = par.locator('[data-dif="modificadas"] dd');
    await expect(mod).toHaveCount(1);
    await expect(mod).toContainText(EVIDENCIA);
    await expect(mod).toContainText(plantilla(T.campos, { campos: "justificacion_puntaje, puntaje" }));
    await expect(par.locator('[data-dif="nuevas"], [data-dif="retiradas"]')).toHaveCount(0);
    const fila = par.locator('tr[data-caso-dif="hospital-futuro"]');
    await expect(fila).toBeVisible();
    const cambia = await fila.getAttribute("data-cambia");
    const celda = fila.locator("td").last();
    await expect(celda.locator("svg")).toHaveCount(1);
    if (cambia === "nada") await expect(celda).toHaveText(T.sinCambio);
    else for (const x of cambia!.split(" ")) await expect(celda).toContainText(T.cambio[x as keyof typeof T.cambio]);
  });
