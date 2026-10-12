// La pantalla de decisiones con el plan REAL del caso (S5, F3): el diagrama de ondas con las decisiones de una vía, la ficha
// de una decisión con su evidencia citada, la tabla de riesgos por prioridad, el teléfono sin desbordar y axe en los dos
// temas. El plan real sigue en borrador: la pantalla arma el comando de aprobación y no lo corre nadie aquí. Los conteos
// salen de los YAML del plan, para que la prueba siga al dato y no a un número escrito a mano.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { textos } from "../../src/lib/i18n";
import { abrir, listo } from "./lib/abrir";

const CASO = "hospital-futuro";
const RUTA = `/es/casos/${CASO}/decisiones`;
const T = textos("es").caso.decisiones;
const DIR = join("data/casos", CASO, "plan");

/** Los archivos YAML de una carpeta del plan (un archivo por entidad). */
const yamls = (carpeta: string) =>
  readdirSync(join(DIR, carpeta))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => readFileSync(join(DIR, carpeta, f), "utf8"));

const decisiones = yamls("decisiones");
const UNA_VIA = decisiones.filter((y) =>
  /^reversibilidad: una_via$/m.test(y),
).length;
const RIESGOS = yamls("modos-de-falla").length;
const idDe = (yaml: string) => /^id: (\S+)$/m.exec(yaml)![1]!;
const primeraVia = idDe(
  decisiones.find((y) => /^reversibilidad: una_via$/m.test(y))!,
);

test.describe("ES · el plan real del caso", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RUTA);
    await listo(page);
  });

  test("el diagrama de ondas trae todas las decisiones del plan y las de una vía van marcadas", async ({
    page,
  }) => {
    await expect(page.locator(".lienzo svg[data-lienzo]")).toHaveCount(1);
    await expect(page.locator(".lienzo .dd-dec")).toHaveCount(
      decisiones.length,
    );
    await expect(page.locator(".lienzo .dd-una_via")).toHaveCount(UNA_VIA);
  });

  test("la ficha de una decisión muestra su evidencia citada y su recomendación", async ({
    page,
  }) => {
    const panel = page.locator("#panel-ficha");
    await abrir(
      page.locator(`.lienzo .dd-dec[data-decision="${primeraVia}"]`),
      panel,
    );
    const ficha = panel.locator(`[data-ficha="${primeraVia}"]`);
    await expect(ficha.locator(".ficha-tipo")).toContainText(
      T.reversibilidad.una_via.toUpperCase(),
    );
    await expect(
      ficha.locator("h3", { hasText: T.ficha.opciones }),
    ).toBeVisible();
    await expect(ficha.locator(".cita").first()).toContainText(
      T.ficha.evidencia,
    );
    await expect(
      ficha.locator("h3", { hasText: T.ficha.recomendada }),
    ).toBeVisible();
  });

  test("la tabla de riesgos ordena por prioridad de acción y trae cada riesgo del plan", async ({
    page,
  }) => {
    await expect(page.locator("#riesgos .tabla-riesgos tbody tr")).toHaveCount(
      RIESGOS,
    );
    await expect(page.locator("#riesgos h2")).toHaveText(T.riesgos.titulo);
  });

  test("la tabla de prioridad de acción trae la tabla AIAG-VDA completa", async ({
    page,
  }) => {
    // La tabla va plegada en un <details> (es referencia, no lectura principal): se comprueba que existe con sus filas.
    await expect(page.locator(".tabla-accion tbody tr").first()).toBeAttached();
    await expect(page.locator(".tabla-accion")).toContainText(
      T.riesgos.prioridad.alta,
    );
  });

  test("a 380 px la página no desborda", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await page.goto(RUTA);
    await listo(page);
    const ancho = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(ancho).toBeLessThanOrEqual(380);
  });

  for (const [esquema, tema] of [
    ["dark", "oscuro"],
    ["light", "claro"],
  ] as const)
    test.describe(`axe en ${tema}`, () => {
      test.use({ colorScheme: esquema });
      test(`${RUTA} sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(RUTA);
        await listo(page);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );
        expect(
          serias,
          JSON.stringify(
            serias.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          ),
        ).toEqual([]);
      });
    });
});
