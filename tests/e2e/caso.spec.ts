// El caso y la base con el dato REAL de hoy (S3, fase 3): el perfil hospitalario es un borrador sin respuestas y a la
// base le faltan evidencias aprobadas, así que la comparación dice el estado honesto en vez de puntuar a medias; la base
// muestra las que una persona ya aprobó (las cuenta en data/evidencias/, para que la prueba siga al dato). Cuando el
// perfil se apruebe, estas pruebas cambian con el dato: la comparación entera se prueba hoy contra la base sembrada
// (tests/e2e/sembrada/).
import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { plantilla, plural } from "../../src/lib/atlas/plantilla";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";
import { CASOS, IDIOMAS } from "./lib/rutas";

/** Las evidencias aprobadas del dato real: un archivo por evidencia en data/evidencias/<plataforma>/. */
const APROBADAS = readdirSync("data/evidencias", { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".yaml")).length;

for (const idioma of IDIOMAS) {
  const T = textos(idioma);
  for (const caso of CASOS) {
    test(`${idioma} · ${caso}: la barra lleva al caso y el perfil en borrador dice qué le falta`, async ({ page }) => {
      await page.goto(`/${idioma}`);
      await listo(page);
      const nav = page.getByRole("list", { name: T.barra.secciones });
      await expect(nav.getByRole("link")).toHaveText([T.barra.atlas, T.barra.conocimiento, T.barra.caso]);
      await expect(nav.locator(".pend")).toHaveText(T.barra.instrumento);
      await nav.getByRole("link", { name: T.barra.caso }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/casos/${caso}$`));
      await expect(page.locator(".encabezado .meta")).toContainText(T.caso.perfil.borrador);
      await expect(page.getByRole("link", { name: T.secciones.perfil })).toHaveAttribute("aria-current", "page");
      const sinResponder = await page.locator('[data-decision] .campo-aviso', { hasText: T.caso.perfil.decisiones.sinResponder }).count();
      expect(sinResponder).toBeGreaterThan(0);
      await expect(page.getByRole("button", { name: T.caso.perfil.aprobar.boton })).toBeDisabled();
      await expect(page.locator(".aprobar-perfil")).toContainText(plural(T.caso.perfil.aprobar.faltanDecisiones, sinResponder));
    });

    test(`${idioma} · ${caso}: la comparación no puntúa y dice qué falta`, async ({ page }) => {
      await page.goto(`/${idioma}/casos/${caso}/comparacion`);
      const estado = page.locator('[data-estado="no-evaluable"]');
      await expect(estado.getByRole("heading")).toHaveText(T.caso.comparacion.noEvaluable.titulo);
      await expect(estado.locator('[data-motivo="perfil-en-borrador"]')).toContainText(T.caso.comparacion.noEvaluable.borrador);
      await expect(estado.locator('[data-motivo="falta-evidencia"]')).toBeVisible();
      await expect(page.locator(".totales, .matriz, #sens, #rob")).toHaveCount(0);
      await estado.getByRole("link", { name: T.caso.comparacion.noEvaluable.verBase }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/base$`));
    });
  }

  test(`${idioma} · la base muestra las evidencias aprobadas, con sus criterios, su escala y sus convenciones`, async ({ page }) => {
    expect(APROBADAS).toBeGreaterThan(0);
    await page.goto(`/${idioma}/base`);
    await listo(page);
    await expect(page.locator('[data-estado="sin-evidencias"]')).toHaveCount(0);
    await expect(page.locator(".evidencias > li")).toHaveCount(APROBADAS);
    await expect(page.locator(".conteo").first()).toContainText(plural(T.base.evidencias.aprobadas, APROBADAS));
    await expect(page.locator(".criterios > li")).not.toHaveCount(0);
    await expect(page.locator(".niveles-escala > li")).toHaveCount(5);
    await expect(page.getByText(plantilla(T.base.convenciones.empate, { puntos: "5" }))).toBeVisible();
    await expect(page.locator('[data-estado="sin-instantaneas"]')).toHaveText(T.base.instantaneas.vacio);
    await expect(page.getByRole("link", { name: T.secciones.base })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: T.secciones.investigador }).click();
    await expect(page).toHaveURL(new RegExp(`/${idioma}/investigador/`));
    await expect(page.getByRole("link", { name: T.secciones.base })).toHaveAttribute("href", `/${idioma}/base`);
  });
}
