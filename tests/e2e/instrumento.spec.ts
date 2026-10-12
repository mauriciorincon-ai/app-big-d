// La pantalla del instrumento con la validación REAL de la base que se publica (S4, F3): en verde, con cada fila pasada, sin
// bloqueo de publicación y «7 de 7 detectados»; a 380 px sin desbordar; y sin violaciones de axe en los dos temas. Las
// filas se cuentan del archivo que escribe `pnpm build` (data/instrumento/validacion.json), no de un número fijo.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { plantilla } from "../../src/lib/atlas/plantilla";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";

const VALIDACION = JSON.parse(
  readFileSync(
    join(__dirname, "../../data/instrumento/validacion.json"),
    "utf8",
  ),
) as {
  referencias: unknown[];
  propiedades: unknown[];
  sembrados: unknown[];
  aprobaciones: unknown[];
};
const FILAS =
  VALIDACION.referencias.length +
  VALIDACION.propiedades.length +
  VALIDACION.sembrados.length +
  VALIDACION.aprobaciones.length;
const SEMBRADOS = VALIDACION.sembrados.length;
const PAGINAS = ["/es/instrumento", "/en/instrumento"];

test("en español: la validación está en verde, cada fila pasa, no hay bloqueo y los sembrados se detectan todos", async ({
  page,
}) => {
  const T = textos("es").instrumento;
  await page.goto("/es/instrumento");
  await listo(page);
  await expect(page.locator('[data-estado="verde"]')).toBeVisible();
  await expect(page.locator('[data-estado="rojo"]')).toHaveCount(0);
  await expect(page.locator("[data-bloqueo]")).toHaveCount(0);
  await expect(page.locator("[data-validacion]")).toHaveCount(FILAS);
  await expect(page.locator('[data-validacion][data-ok="false"]')).toHaveCount(
    0,
  );
  await expect(page.locator('section[data-bloque="sembrados"]')).toContainText(
    plantilla(T.sembrados.detectados, { ok: SEMBRADOS, total: SEMBRADOS }),
  );
});

test("a 380 px la pantalla del instrumento no desborda la página", async ({
  page,
}) => {
  await page.setViewportSize({ width: 380, height: 800 });
  for (const ruta of PAGINAS) {
    await page.goto(ruta);
    await listo(page);
    const ancho = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(ancho, ruta).toBeLessThanOrEqual(380);
  }
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    for (const ruta of PAGINAS)
      test(`${ruta} sin violaciones de axe (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        await listo(page);
        const scan = await new AxeBuilder({ page }).analyze();
        const violaciones = scan.violations;
        expect(
          violaciones,
          JSON.stringify(
            violaciones.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          ),
        ).toEqual([]);
      });
  });
