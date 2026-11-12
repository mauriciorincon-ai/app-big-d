// D7 (S8): «Comparar por pares» en el editor del perfil, con el dato REAL (el perfil hospitalario en borrador; si ya está
// aprobado, no hay editor y la prueba no aplica, como en caso.spec.ts). Cruza la pantalla de punta a punta: juzgar un par
// escribe la URL; una URL con todos los pares juzgados propone pesos que suman 100 con su razón de consistencia; «usar» llena
// el editor y el comando sale con esos pesos; sobre el umbral avisa con ícono y texto, sin bloquear; axe sin violaciones con
// la vista abierta y nada desborda a 380 px.
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";
import { PERFIL_APROBADO } from "./lib/estado";

const CASO = "hospital-futuro";
const N = (
  parse(
    readFileSync(
      `${process.env.BIGD_DATOS ?? "data"}/casos/${CASO}.yaml`,
      "utf8",
    ),
  ) as { criterios: unknown[] }
).criterios.length;
const PARES = (N * (N - 1)) / 2;

test.skip(
  PERFIL_APROBADO,
  "el perfil real ya está aprobado: sin editor no hay comparación de pares",
);

async function abrirPares(page: Page, idioma: "es" | "en", consulta = "") {
  await page.goto(`/${idioma}/casos/${CASO}${consulta}`);
  await listo(page);
  const pares = page.locator("[data-pares]");
  await pares.locator("summary").click();
  await expect(pares.locator("select").first()).toBeVisible();
  return pares;
}

for (const idioma of ["es", "en"] as const)
  test(`${idioma} · juzgar un par escribe la URL; con todos juzgados propone pesos, «usar» llena el editor y el comando los lleva`, async ({
    page,
  }) => {
    const P = textos(idioma).caso.perfil.pares;
    const pares = await abrirPares(page, idioma);
    await pares.locator("select").first().selectOption("0");
    await expect(page).toHaveURL(
      new RegExp(`[?&]pares=i-{${PARES - 1}}&grupo=1`),
    );
    await expect(pares.locator("[data-pares-faltan]")).toBeVisible();

    // Todos «igual de importantes»: cada peso es 100 / N, la suma cierra en 100 y la razón es 0 (consistente).
    await page.goto(
      `/${idioma}/casos/${CASO}?pares=${"i".repeat(PARES)}&grupo=2`,
    );
    await listo(page);
    await page.locator("[data-pares] summary").click();
    await expect(page.locator("[data-pares-grupo]")).toHaveAttribute(
      "data-pares-grupo",
      "2",
    );
    await expect(
      page.locator('[data-pares-razon="consistente"]'),
    ).toBeVisible();
    await expect(page.locator("[data-peso-par]")).toHaveCount(N);
    await page.getByRole("button", { name: P.usar }).click();
    await expect(page.locator("[data-pesos-desde-pares]")).toBeVisible();
    await expect(page.locator("[data-suma-editor]")).toContainText(
      idioma === "es" ? "100,00" : "100.00",
    );
    // El comando aparece en cuanto se responden las decisiones: si ya está, lleva los pesos propuestos.
    const comando = page.locator("#editor-perfil .comando code");
    if (await comando.count())
      await expect(comando).toContainText(/--pesos crit-[a-z-]+=9(09|10),/);
  });

test("es · todos los pares a favor del primero (9) no son transitivos: avisa con ícono y texto, y deja usar los pesos", async ({
  page,
}) => {
  const P = textos("es").caso.perfil.pares;
  await abrirPares(page, "es", `?pares=${"q".repeat(PARES)}&grupo=1`);
  const aviso = page.locator('[data-pares-razon="inconsistente"]');
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText(P.inconsistente);
  await expect(aviso.locator("svg")).toHaveCount(1);
  await expect(page.getByRole("button", { name: P.usar })).toBeEnabled();
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    test(`la comparación de pares abierta, con propuesta, sin violaciones de axe (${tema})`, async ({
      page,
    }) => {
      await abrirPares(page, "es", `?pares=${"q".repeat(PARES)}&grupo=1`);
      const scan = await new AxeBuilder({ page })
        .include("[data-pares]")
        .analyze();
      expect(
        scan.violations,
        JSON.stringify(
          scan.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
        ),
      ).toEqual([]);
    });
  });

test("a 380 px la comparación de pares abierta no desborda la página", async ({
  page,
}) => {
  await page.setViewportSize({ width: 380, height: 800 });
  await abrirPares(page, "es", `?pares=${"q".repeat(PARES)}&grupo=1`);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(380);
});
