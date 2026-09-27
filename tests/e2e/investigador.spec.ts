import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Conocimiento · investigador (S1, fase 3): una página por plataforma. Sin mapa: el estado vacío con el
// comando que lo llena (A-27). Con mapa: la vigencia de cada capa. «Copiar» deja el comando exacto en el
// portapapeles. Nada se investiga ni se aprueba desde la app.
test.describe("investigador", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("sin mapa: el estado vacío trae el comando para investigar la plataforma, y se copia", async ({ page }) => {
    await page.goto("/es/investigador/databricks");
    await expect(page.getByRole("heading", { name: "Todavía no hay mapa de Databricks." })).toBeVisible();
    const comando = page.locator(".estado .comando");
    await expect(comando.locator("code")).toHaveText("/investigar databricks");
    await comando.getByRole("button", { name: "Copiar" }).click();
    await expect(comando.getByRole("button")).toHaveText("Copiado");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("/investigar databricks");
    await expect(page.getByRole("link", { name: "Conocimiento" })).toHaveAttribute("aria-current", "page");
  });

  test("con mapa: una fila por banda de la gramática, con su semáforo en símbolo y texto", async ({ page }) => {
    await page.goto("/en/investigador/plataforma-ejemplo");
    await expect(page.locator(".sem-lista > li")).toHaveCount(9);
    await expect(page.locator(".sem-lista .semaforo").first()).toContainText(/current|to review|expired/);
    await expect(page.locator(".sem-lista .semaforo svg").first()).toBeVisible();
  });

  for (const [esquema, tema] of [
    ["dark", "oscuro"],
    ["light", "claro"],
  ] as const)
    for (const ruta of ["/es/investigador/databricks", "/es/investigador/plataforma-ejemplo"])
      test(`${ruta} sin violaciones serias (${tema})`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: esquema });
        const page = await ctx.newPage();
        await page.goto(ruta);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
        await ctx.close();
      });
});
