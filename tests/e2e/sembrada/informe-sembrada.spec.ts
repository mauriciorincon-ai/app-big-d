// El informe contra la BASE SEMBRADA (S6, F3): el perfil aprobado llena las secciones 3 a 5, y el plan de prueba (con su
// ciclo de dependencias y su acción alta sin mitigación) deja la hoja de ruta sin fase y el borrador con sus motivos. Lo
// que el dato real todavía no tiene (perfil aprobado, plan con ciclo) se prueba aquí. Ninguna aprobación se corre ni se copia.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { textos } from "../../../src/lib/i18n";
import { listo } from "../lib/abrir";

const CASO = "hospital-futuro";
const RUTA = `/es/casos/${CASO}/informe`;
const T = textos("es");
const TI = T.caso.informe;
// Cuántas decisiones tiene el plan SEMBRADO: sale de sus archivos en `.sembrada/datos` (el webServer lo construye antes de
// la prueba), no del plan real, que tiene otro número. Así la prueba sigue al dato sembrado y no a un número escrito a mano.
const decisionesSembradas = () =>
  readdirSync(join(".sembrada/datos/casos", CASO, "plan", "decisiones")).filter(
    (f) => f.endsWith(".yaml"),
  ).length;

test("el perfil aprobado llena las secciones de matriz, pros y contras y robustez", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  await expect(page.locator("#sec-matriz table.tabla.matriz")).toHaveCount(1);
  await expect(page.locator("#sec-matriz")).toContainText(
    T.caso.comparacion.perfilAprobado,
  );
  await expect(page.locator("#sec-pros-contras .pros").first()).toBeAttached();
  await expect(page.locator("#sec-robustez")).toContainText(
    TI.informe.secciones.robustez,
  );
});

test("el ciclo deja la hoja de ruta sin fase, con cada decisión bloqueada y su razón", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  await expect(
    page.locator("#hoja h3", { hasText: TI.hoja.sinFase }),
  ).toHaveCount(1);
  const bloqueados = page.locator("#hoja li.item-bloqueado");
  await expect(bloqueados).toHaveCount(decisionesSembradas());
  await expect(bloqueados.first().locator(".campo-aviso")).toContainText(
    "ciclo de dependencias",
  );
});

test("la acción alta sin mitigación aparece en el borrador con su motivo", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  const banda = page.locator("[data-borrador]");
  await expect(banda).toContainText(
    "resolver el ciclo de dependencias entre decisiones",
  );
  await expect(banda).toContainText("rie-fuga");
  await expect(banda).toContainText("acción alta sin mitigación");
});

test("sin relato humano, la sección del relato lo dice", async ({ page }) => {
  await page.goto(RUTA);
  await listo(page);
  await expect(page.locator("#sec-relato")).toContainText(TI.relato.sinHumano);
});
