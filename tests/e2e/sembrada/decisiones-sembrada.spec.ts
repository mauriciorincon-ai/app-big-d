// La pantalla de decisiones contra la BASE SEMBRADA (S5, F3): el plan de prueba tiene un ciclo de dependencias, una acción
// alta sin mitigación y un supuesto crítico sin probar, y el caso aprobado da la recomendación. Lo que el dato real aún no
// tiene (los bloqueos y el camino del ciclo) se prueba aquí. Ningún comando se corre ni se copia.
import { expect, test } from "@playwright/test";
import { textos } from "../../../src/lib/i18n";
import { abrir, listo } from "../lib/abrir";

const CASO = "hospital-futuro";
const RUTA = `/es/casos/${CASO}/decisiones`;
const T = textos("es").caso.decisiones;

test("el ciclo de dependencias se muestra con su camino, no se esconde", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  const alerta = page.locator(".veredicto-alerta", { hasText: T.ciclo.alerta });
  await expect(alerta).toBeVisible();
  // El camino del ciclo va en la alerta como «a → b → a».
  await expect(alerta).toContainText("→");
  // Las dos decisiones del ciclo quedan marcadas en el diagrama y sus flechas en discontinuo.
  await expect(page.locator(".lienzo .dd-en-ciclo")).toHaveCount(2);
  await expect(page.locator(".lienzo .dd-dep-ciclo")).not.toHaveCount(0);
});

test("la acción alta sin mitigación bloquea el comando de aprobación", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  await expect(page.locator("#riesgos tr.prioridad-alta-sin")).toHaveCount(1);
  const bloqueo = page.locator("#aprobar .veredicto-alerta");
  await expect(bloqueo).toContainText(T.aprobar.bloqueado);
  // Dos bloqueos: el ciclo entre catálogo y protección, y la acción alta sin mitigación. El supuesto crítico tiene su
  // prueba barata, así que no bloquea; sale como alerta.
  await expect(bloqueo.locator("li")).toHaveCount(2);
  await expect(bloqueo.locator("li").nth(0)).toContainText("ciclo de dependencias");
  await expect(bloqueo.locator("li").nth(1)).toContainText("alta sin mitigación");
  // Mientras haya bloqueos, la pantalla no arma el comando: la caja no existe.
  await expect(page.locator("#aprobar .comando")).toHaveCount(0);
});

test("la recomendación de la decisión aparece con el perfil aprobado", async ({
  page,
}) => {
  await page.goto(RUTA);
  await listo(page);
  const panel = page.locator("#panel-ficha");
  await abrir(
    page.locator('.lienzo .dd-dec[data-decision="dec-identidad"]'),
    panel,
  );
  const ficha = panel.locator('[data-ficha="dec-identidad"]');
  await expect(
    ficha.locator("h3", { hasText: T.ficha.recomendada }),
  ).toBeVisible();
  await expect(ficha.locator(".pros li").first()).toBeVisible();
});
