import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { abrir } from "./lib/abrir";
import { RUTAS } from "./lib/rutas";

// Movimiento reducido en el sitio entero (regla 5 del CLAUDE.md y contrapeso del ⭐ diferido): en cada ruta
// del export (1) la forma del árbol no depende de la preferencia: el mismo `main` con y sin ella; (2) con la
// preferencia, lo que importa se VE: el título, el dibujo y cada bloque, componente y flujo con opacidad
// plena y sin ocultar, y la ventana o la ficha se abren; (3) axe sin violaciones serias en los dos temas. El
// movimiento vive en el CSS (`recorrido-animacion.css` solo con `no-preference`); ningún componente decide
// qué pinta según la preferencia: el recorrido solo se niega a reproducir.
const arbol = (page: Page) => page.locator("main").evaluate((m) => m.outerHTML);

/**
 * Lo que no se ve de verdad: display none o visibility hidden en la cadena, u opacidad acumulada < 1. En el
 * recorrido cuenta lo que está en el camino (`data-paso`): el resto se atenúa por diseño, con o sin movimiento.
 */
const ocultos = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main h1, .lienzo svg.dg-svg, .lienzo .dg-elem, .lienzo .dg-flujo")].flatMap((e) => {
      if (e.closest('svg[data-vista="recorrido"]') && e.matches(".dg-elem, .dg-flujo") && !e.hasAttribute("data-paso")) return [];
      let o = 1;
      for (let n: Element | null = e; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") return [`${e.getAttribute("data-dueno") ?? e.tagName} oculto`];
        o *= parseFloat(cs.opacity);
      }
      return o < 0.99 ? [`${e.getAttribute("data-dueno") ?? e.tagName} con opacidad ${o.toFixed(2)}`] : [];
    }),
  );

for (const ruta of RUTAS)
  test(`${ruta}: el mismo árbol con y sin la preferencia, y con ella todo se ve`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(ruta);
    const sin = await arbol(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ruta);
    expect(await arbol(page)).toBe(sin);
    await expect(page.locator("main h1")).toBeVisible();
    if (ruta.includes("/atlas/")) await expect(page.locator(".lienzo svg.dg-svg")).toBeVisible();
    expect(await ocultos(page)).toEqual([]);
    // Lo que se toca también se abre: la ventana de un bloque, la ficha de un componente o su paso.
    const activable = page.locator(".lienzo .dg-elem").first();
    if (await activable.count()) {
      await abrir(activable, page.locator("#panel-ficha"));
      await expect(page.locator("#panel-ficha h2")).toBeVisible();
    }
  });

test("en el recorrido, «Reproducir» queda oculto y no reproduce", async ({ page }) => {
  const ruta = RUTAS.find((r) => r.endsWith("/recorrido"))!;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ruta);
  const boton = page.locator('[data-rec="reproducir"]');
  await expect(boton).toHaveCount(1);
  await expect(boton).toBeHidden();
  await boton.dispatchEvent("click");
  await expect(boton).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#rec")).toHaveAttribute("data-paso", "todos");
  // Lo que sí se ve: los controles del paso y la lista de pasos.
  await expect(page.locator('[data-rec="siguiente"]')).toBeVisible();
  await expect(page.locator(".pasos-lista li").first()).toBeVisible();
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe con movimiento reducido, en ${tema}`, () => {
    test.use({ colorScheme: esquema, reducedMotion: "reduce" });
    for (const ruta of RUTAS)
      test(`${ruta} sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
  });
