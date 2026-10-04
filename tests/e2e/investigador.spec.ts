import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PLATAFORMAS, PROXIMAS } from "./lib/rutas";

// Conocimiento · investigador (S1, fase 3): una página por plataforma. Sin mapa: el estado vacío con el botón
// que pide la investigación (A-27). Con mapa: la vigencia de cada capa, y en la que no está vigente, el mismo
// botón para esa capa. Nada se investiga ni se aprueba desde la app: el botón deja una solicitud guardada.
// La primera plataforma sin mapa, si queda alguna. Desde que todas las reales tienen mapa (fase 3 del S2), el estado
// vacío lo cubre tests/unit/ui/sin-mapa.test.tsx y esta prueba se salta diciendo por qué.
const proxima = PROXIMAS[0];

test.describe("investigador", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  // Decisión de la persona (2026-09-30): el botón crea una solicitud que queda guardada (una tarea en el
  // repositorio de GitHub) y la página no explica cómo se corre la investigación.
  test("sin mapa: el estado vacío pide la investigación con una tarea de GitHub ya escrita", async ({ page }) => {
    test.skip(!proxima, "todas las plataformas tienen mapa: el estado vacío lo cubre tests/unit/ui/sin-mapa.test.tsx");
    await page.goto(`/es/investigador/${proxima!.id}`);
    await expect(page.getByRole("heading", { name: `Todavía no hay mapa de ${proxima!.nombre.es}.` })).toBeVisible();
    const pedir = page.locator(".estado").getByRole("link", { name: "Solicitar investigación" });
    await expect(pedir).toHaveAttribute("target", "_blank");
    const url = new URL((await pedir.getAttribute("href"))!);
    expect(url.origin + url.pathname).toBe("https://github.com/mauriciorincon-ai/app-big-d/issues/new");
    expect(url.searchParams.get("title")).toBe(`Investigar ${proxima!.nombre.es}`);
    expect(url.searchParams.get("labels")).toBe("investigacion");
    expect(url.searchParams.get("body")).toContain(`/investigar ${proxima!.id}`);
    await expect(page.locator("main")).not.toContainText("Claude Code");
    // «page» solo en la página a la que lleva la sección (el investigador de la primera plataforma por id).
    await expect(page.getByRole("link", { name: "Conocimiento" })).toHaveAttribute("aria-current", proxima!.id === PLATAFORMAS[0] ? "page" : "true");
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
    for (const ruta of [`/es/investigador/${(proxima ?? { id: PLATAFORMAS[0]! }).id}`, "/es/investigador/plataforma-ejemplo"])
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
