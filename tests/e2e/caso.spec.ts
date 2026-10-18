// El caso y la base con el dato REAL (S3, fase 3): la base tiene sus evidencias aprobadas por una persona (la prueba las
// cuenta en data/evidencias/ para seguir al dato). El perfil hospitalario puede estar en borrador (la comparación dice el estado
// honesto en vez de puntuar) o aprobado (sello, sin editor, y la comparación puntúa): las pruebas siguen a `estado_aprobacion`
// (S7, D-S7-02). La comparación entera y el perfil aprobado se prueban a fondo contra la base sembrada (tests/e2e/sembrada/).
import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { plantilla, plural } from "../../src/lib/atlas/plantilla";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";
import { PERFIL_APROBADO } from "./lib/estado";
import { CASOS, IDIOMAS } from "./lib/rutas";

/** Las evidencias aprobadas del dato real: un archivo por evidencia en data/evidencias/<plataforma>/. */
const APROBADAS = readdirSync("data/evidencias", {
  recursive: true,
  encoding: "utf8",
}).filter((f) => f.endsWith(".yaml")).length;
/** Las instantáneas del dato real, de la más nueva a la más vieja (versión AAAA-MM-DD.N: por fecha y luego por N). */
const INSTANTANEAS = readdirSync("data/instantaneas")
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -".json".length))
  .sort((a, b) =>
    a.slice(0, 10) === b.slice(0, 10)
      ? Number(b.slice(11)) - Number(a.slice(11))
      : a < b
        ? 1
        : -1,
  );

for (const idioma of IDIOMAS) {
  const T = textos(idioma);
  for (const caso of CASOS) {
    test(`${idioma} · ${caso}: la barra lleva al caso; el perfil, según su estado, arma su comando sin aprobarse o muestra su sello`, async ({
      page,
    }) => {
      await page.goto(`/${idioma}`);
      await listo(page);
      const nav = page.getByRole("list", { name: T.barra.secciones });
      await expect(nav.getByRole("link")).toHaveText([
        T.barra.atlas,
        T.barra.conocimiento,
        T.barra.caso,
        T.barra.instrumento,
      ]);
      await expect(nav.locator(".pend")).toHaveCount(0);
      await nav.getByRole("link", { name: T.barra.caso }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/casos/${caso}$`));
      await expect(page.locator(".encabezado .meta")).toContainText(
        PERFIL_APROBADO ? T.caso.perfil.aprobado : T.caso.perfil.borrador,
      );
      await expect(
        page.getByRole("link", { name: T.secciones.perfil }),
      ).toHaveAttribute("aria-current", "page");
      if (PERFIL_APROBADO) {
        // Aprobado: de solo lectura, con su sello, sin editor ni comando.
        await expect(page.locator(".veredicto .sello")).toContainText(
          T.caso.perfil.sello.titulo,
        );
        await expect(page.locator("[data-editor-perfil]")).toHaveCount(0);
        await expect(page.locator(".aprobar-perfil")).toHaveCount(0);
        return;
      }
      const sinResponder = await page
        .locator("[data-decision] .campo-aviso", {
          hasText: T.caso.perfil.decisiones.sinResponder,
        })
        .count();
      expect(sinResponder).toBe(0);
      await expect(
        page.getByRole("button", { name: T.caso.perfil.aprobar.boton }),
      ).toBeDisabled();
      await expect(page.locator(".aprobar-perfil")).toContainText(
        T.caso.perfil.aprobar.comando,
      );
      await expect(page.locator("[data-editor-perfil]")).toBeVisible();
      // S4-B7: el aviso de arriba lleva al editor de abajo.
      const ir = page.getByRole("link", { name: T.caso.perfil.aprobar.irAlEditor });
      await expect(ir).toHaveAttribute("href", "#editor-perfil");
      await expect(page.locator("#editor-perfil[data-editor-perfil]")).toHaveCount(1);
      await expect(page.locator("[data-sin-comando]")).toHaveCount(0);
    });

    test(`${idioma} · ${caso}: la comparación sigue al perfil: en borrador no puntúa y dice qué falta; aprobada, puntúa`, async ({
      page,
    }) => {
      await page.goto(`/${idioma}/casos/${caso}/comparacion`);
      const estado = page.locator('[data-estado="no-evaluable"]');
      if (PERFIL_APROBADO) {
        await listo(page);
        await expect(estado).toHaveCount(0);
        await expect(page.locator(".veredicto").first()).toBeVisible();
        return;
      }
      await expect(estado.getByRole("heading")).toHaveText(
        T.caso.comparacion.noEvaluable.titulo,
      );
      await expect(
        estado.locator('[data-motivo="perfil-en-borrador"]'),
      ).toContainText(T.caso.comparacion.noEvaluable.borrador);
      // Las 33 evidencias reales están aprobadas (S3, P1–P3): ya no falta ninguna, el único motivo es el borrador.
      await expect(
        estado.locator('[data-motivo="falta-evidencia"]'),
      ).toHaveCount(0);
      await expect(page.locator(".totales, .matriz, #sens, #rob")).toHaveCount(
        0,
      );
      await estado
        .getByRole("link", { name: T.caso.comparacion.noEvaluable.verBase })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/base$`));
    });
  }

  test(`${idioma} · la base muestra las evidencias aprobadas, con sus criterios, su escala, sus convenciones y sus instantáneas`, async ({
    page,
  }) => {
    expect(APROBADAS).toBeGreaterThan(0);
    await page.goto(`/${idioma}/base`);
    await listo(page);
    await expect(page.locator('[data-estado="sin-evidencias"]')).toHaveCount(0);
    await expect(page.locator(".evidencias > li")).toHaveCount(APROBADAS);
    await expect(page.locator(".conteo").first()).toContainText(
      plural(T.base.evidencias.aprobadas, APROBADAS),
    );
    await expect(page.locator(".criterios > li")).not.toHaveCount(0);
    await expect(page.locator(".niveles-escala > li")).toHaveCount(5);
    await expect(
      page.getByText(plantilla(T.base.convenciones.empate, { puntos: "5" })),
    ).toBeVisible();
    expect(INSTANTANEAS.length).toBeGreaterThan(0);
    await expect(page.locator('[data-estado="sin-instantaneas"]')).toHaveCount(
      0,
    );
    const filas = page.locator('section[aria-labelledby="inst-t"] tbody tr');
    await expect(filas).toHaveCount(INSTANTANEAS.length);
    for (const [n, v] of INSTANTANEAS.entries())
      await expect(filas.nth(n).locator("td").first()).toContainText(v);
    await expect(filas.first()).toContainText(T.base.instantaneas.vigente);
    await expect(
      page.getByRole("link", { name: T.secciones.base }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: T.secciones.investigador }).click();
    await expect(page).toHaveURL(new RegExp(`/${idioma}/investigador/`));
    await expect(
      page.getByRole("link", { name: T.secciones.base }),
    ).toHaveAttribute("href", `/${idioma}/base`);
  });
}
