// S10 (F2): la demo pública (anexo E4) servida bajo `/piezas/big-d/` (scripts/demo/servir.mjs), en Chromium, Firefox y
// WebKit, en ubuntu-latest y macos-latest (job `diagramador`). Recorre las dos entradas y comprueba lo que promete:
//   - el Worker evalúa con el mismo núcleo y da la huella que dio Node en el build (regla dura 1);
//   - mover un peso cambia el resultado y los pesos siguen sumando 100;
//   - «Probar la neutralidad» entrega las plataformas en otro orden y la huella no cambia (regla dura 5);
//   - BigQuery se ve «próximamente», sin puntaje; la declaración del autor y el rótulo del borrador se ven;
//   - nada se sale del basePath: ninguna petición fuera de /piezas/big-d/ y ninguna violación de la CSP.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PUERTO = process.env.E2E_DEMO_PUERTO ?? "3401";
const BASE = `http://127.0.0.1:${PUERTO}/piezas/big-d/`;

const TEXTOS = {
  es: { rotulo: "Perfil en borrador del autor: mueve los pesos", igual: "Misma huella", proxima: "aún no tiene puntaje", autor: "Declaración del autor", otro: "Read in English", restablecer: "Volver a los pesos del autor", neutralidad: "Reordenar las plataformas" },
  en: { rotulo: "Author's draft profile: move the weights", igual: "Same fingerprint", proxima: "it has no score yet", autor: "Author's statement", otro: "Leer en español", restablecer: "Back to the author's weights", neutralidad: "Reorder the platforms" },
} as const;

function vigilar(page: Page) {
  const fallas: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") fallas.push(`consola: ${m.text()}`);
  });
  page.on("pageerror", (e) => fallas.push(`página: ${e.message}`));
  page.on("request", (r) => {
    if (!r.url().startsWith(BASE)) fallas.push(`fuera del basePath: ${r.url()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) fallas.push(`${r.status()}: ${r.url()}`);
  });
  return fallas;
}

const suma = async (page: Page) =>
  (await page.locator("input[data-criterio]").evaluateAll((xs) => xs.map((x) => (x as HTMLInputElement).id))).length;

for (const idioma of ["es", "en"] as const) {
  test.describe(`demo ${idioma}`, () => {
    test("el Worker da la huella de Node; los pesos mueven el resultado; reordenar no cambia la huella", async ({ page }) => {
      const t = TEXTOS[idioma];
      const fallas = vigilar(page);
      await page.goto(`${BASE}${idioma}.html`);
      const demo = page.locator("#demo");
      await expect(demo).toHaveAttribute("data-listo", "true");
      const node = await demo.getAttribute("data-huella-node");
      expect(node).toMatch(/^[0-9a-f]{64}$/);
      // Regla 1 desde el Worker: misma huella que Node, en este motor.
      await expect(demo).toHaveAttribute("data-huella", node!);
      await expect(page.locator("#huella")).toHaveText(node!);

      await expect(page.getByText(t.rotulo)).toBeVisible();
      await expect(page.getByRole("heading", { name: t.autor })).toBeVisible();
      await expect(page.locator("[data-proxima='bigquery']")).toContainText(t.proxima);
      await expect(page.locator("[data-plataforma='bigquery']")).toHaveCount(0);
      await expect(page.locator(".demo-fila")).toHaveCount(3);
      await expect(page.locator(".demo-mapa")).toHaveCount(3);
      expect(await suma(page)).toBeGreaterThan(1);

      // Neutralidad con los pesos del autor: dos vueltas, dos órdenes distintos, la misma huella.
      const boton = page.getByRole("button", { name: new RegExp(t.neutralidad) });
      const ordenes: string[] = [];
      for (let k = 0; k < 2; k++) {
        await boton.click();
        await expect(page.locator("#neutralidad-veredicto")).toHaveAttribute("data-vuelta", String(k + 1));
        await expect(page.locator("#neutralidad-veredicto")).toHaveAttribute("data-igual", "true");
        await expect(page.locator("#neutralidad-veredicto")).toContainText(t.igual);
        await expect(page.locator("#neutralidad-huella")).toHaveText(node!);
        ordenes.push((await page.locator("#neutralidad-orden").textContent()) ?? "");
      }
      expect(ordenes[0]).not.toBe(ordenes[1]);

      // Mover un peso: la huella cambia y los pesos siguen sumando 100.
      const primero = page.locator("input[data-criterio]").first();
      await primero.fill("0");
      await expect(demo).not.toHaveAttribute("data-huella", node!);
      await expect(demo).toHaveAttribute("data-listo", "true");
      const total = await page.locator(".demo-peso output").evaluateAll((xs) => xs.map((x) => x.textContent ?? ""));
      const centesimas = total.map((s) => {
        const [e, d = ""] = s.split(/[.,]/);
        return Number(e) * 100 + Number(d.padEnd(2, "0"));
      });
      expect(centesimas.reduce((a, b) => a + b, 0)).toBe(10_000);
      expect(centesimas[0]).toBe(0);
      const movida = await demo.getAttribute("data-huella");

      // Neutralidad con los pesos movidos: también la misma huella.
      await boton.click();
      await expect(page.locator("#neutralidad-veredicto")).toHaveAttribute("data-vuelta", "3");
      await expect(page.locator("#neutralidad-huella")).toHaveText(movida!);
      await expect(page.locator("#neutralidad-veredicto")).toHaveAttribute("data-igual", "true");

      // Volver a los pesos del autor: la huella de Node otra vez.
      await page.getByRole("button", { name: t.restablecer }).click();
      await expect(demo).toHaveAttribute("data-huella", node!);

      // El otro idioma, por su enlace relativo, dentro del basePath.
      await page.getByRole("link", { name: t.otro }).click();
      await expect(page).toHaveURL(`${BASE}${idioma === "es" ? "en" : "es"}.html`);
      await expect(page.locator("#demo")).toHaveAttribute("data-huella", node!);
      expect(fallas).toEqual([]);
    });
  });
}

test("axe: la demo no tiene violaciones en ninguna entrada", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "axe corre una vez, en Chromium");
  for (const idioma of ["es", "en"]) {
    await page.goto(`${BASE}${idioma}.html`);
    await expect(page.locator("#demo")).toHaveAttribute("data-listo", "true");
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  }
});
