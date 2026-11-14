// S10 (F2): la demo pública (anexo E4) servida bajo `/piezas/big-d/` (scripts/demo/servir.mjs), en Chromium, Firefox y
// WebKit, en ubuntu-latest y macos-latest (job `diagramador`). Recorre las dos entradas y comprueba lo que promete:
//   - el Worker evalúa con el mismo núcleo y da la huella que dio Node en el build (regla dura 1);
//   - mover un peso cambia el resultado y los pesos siguen sumando 100;
//   - «Probar la neutralidad» entrega las plataformas en otro orden y la huella no cambia (regla dura 5);
//   - BigQuery se ve «próximamente», sin puntaje; la declaración del autor y el rótulo del borrador se ven;
//   - nada se sale del basePath: ninguna petición fuera de /piezas/big-d/ y ninguna violación de la CSP.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEXTOS_DEMO } from "../../src/lib/i18n/demo";

const PUERTO = process.env.E2E_DEMO_PUERTO ?? "3401";
const BASE = `http://127.0.0.1:${PUERTO}/piezas/big-d/`;

// Los textos salen del diccionario de la demo, no de una copia: si se redactan de nuevo, la prueba los sigue.
type Clave = "rotulo" | "igual" | "proxima" | "autor" | "otro" | "restablecer" | "neutralidad";
const TEXTOS = Object.fromEntries(
  (["es", "en"] as const).map((i) => {
    const d = TEXTOS_DEMO[i];
    return [
      i,
      {
        rotulo: d.rotulo,
        igual: d.neutralidadIgual.split(":")[0]!,
        // «{nombre}: … aún no tiene puntos.»: lo que viene después del nombre.
        proxima: d.proximamente.split("{nombre}").pop()!.replace(/^:\s*/, "").trim(),
        autor: d.declaracionTitulo,
        otro: d.otroIdioma.etiqueta,
        restablecer: d.restablecer,
        neutralidad: d.neutralidadBoton,
      },
    ];
  }),
) as Record<"es" | "en", Record<Clave, string>>;

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
      // N sale de los datos que la página trae (no de un literal): una fila y un mapa por plataforma evaluada.
      const n = await page.evaluate(() => (JSON.parse(document.getElementById("datos-demo")!.textContent!) as { entrada: { base: { plataformas: unknown[] } } }).entrada.base.plataformas.length);
      expect(n).toBeGreaterThanOrEqual(2);
      await expect(page.locator(".demo-fila")).toHaveCount(n);
      await expect(page.locator(".demo-mapa")).toHaveCount(n);
      // Anclas escritas a mano (no del diccionario): si alguien vacía o cambia el texto de los dos lados, esto lo ve.
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(idioma === "es" ? /^Compara plataformas/ : /^Compare data platforms/);
      await expect(page.getByRole("button", { name: idioma === "es" ? /^Cambiar el orden/ : /^Change the order/ })).toBeVisible();
      await expect(page.locator("#demo-vigencia")).toHaveText(/\d{4}-\d{2}-\d{2}/);
      // Sin id repetido ni aria-describedby colgante (los tres mapas comparten página).
      const ids = await page.evaluate(() => {
        const todos = [...document.querySelectorAll("[id]")].map((x) => x.id);
        const repetidos = todos.filter((x, i) => todos.indexOf(x) !== i);
        const colgantes = [...document.querySelectorAll("[aria-describedby],[aria-details],[aria-labelledby]")]
          .flatMap((x) => ["aria-describedby", "aria-details", "aria-labelledby"].flatMap((a) => (x.getAttribute(a) ?? "").split(/\s+/).filter(Boolean)))
          .filter((x) => !document.getElementById(x));
        return { repetidos, colgantes };
      });
      expect(ids).toEqual({ repetidos: [], colgantes: [] });
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

for (const esquema of ["dark", "light"] as const) {
  test(`axe y 380 px (${esquema}): la demo no tiene violaciones ni desborda en ninguna entrada`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "axe corre una vez, en Chromium");
    await page.emulateMedia({ colorScheme: esquema });
    await page.setViewportSize({ width: 380, height: 800 });
    for (const idioma of ["es", "en"]) {
      await page.goto(`${BASE}${idioma}.html`);
      await expect(page.locator("#demo")).toHaveAttribute("data-listo", "true");
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      // G11: la página no desliza de lado (los lienzos de los mapas sí, dentro de su propio marco).
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
}

test("el Worker que falla o llega tarde no deja la página a medias", async ({ page }) => {
  // Un Worker que no carga: la página lo dice y muestra la respuesta del build, sin quedarse en «calculando».
  await page.route("**/demo-worker.js", (r) => r.abort());
  await page.goto(`${BASE}es.html`, { waitUntil: "load" });
  await expect(page.locator("#demo")).toHaveAttribute("data-listo", "error");
  await expect(page.locator("#veredicto")).toContainText(TEXTOS_DEMO.es.veredicto.error.split("{mensaje}")[0]!.trim());
});

test("un clic en la neutralidad seguido de un peso movido deja el resultado de los pesos nuevos", async ({ page }) => {
  await page.goto(`${BASE}es.html`);
  const demo = page.locator("#demo");
  await expect(demo).toHaveAttribute("data-listo", "true");
  // La caja de la neutralidad está oculta de verdad hasta que hay una respuesta (el `hidden` no lo pisa el CSS).
  await expect(page.locator("#neutralidad-resultado")).toBeHidden();
  await page.getByRole("button", { name: /^Cambiar el orden/ }).click();
  await page.locator("input[data-criterio]").first().fill("0");
  const antes = (await demo.getAttribute("data-huella-node"))!;
  await expect(demo).not.toHaveAttribute("data-huella", antes);
  await expect(demo).toHaveAttribute("data-listo", "true");
  const huella = await demo.getAttribute("data-huella");
  await expect(page.locator("#huella")).toHaveText(huella!);
  // Si la neutralidad se pinta, es la de los pesos vigentes: la misma huella que el resultado, nunca la de los pesos viejos.
  const visible = await page.locator("#neutralidad-resultado").isVisible();
  if (visible) await expect(page.locator("#neutralidad-huella")).toHaveText(huella!);
});
