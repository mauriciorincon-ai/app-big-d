// La comparación entera contra la BASE SEMBRADA (D-S3-14): la base ficticia de la maqueta con el caso aprobado. Cruza la
// costura Worker ↔ pantalla de punta a punta (regla 19, D-S3-08): mover un peso escribe la URL, el Worker simula con los
// pesos explorados y la pantalla pinta la aceptabilidad. Mide la respuesta al mover el peso con la CPU 4× más lenta
// (INP ≤ 200 ms), que nada desborde a 380 px, el mismo árbol con y sin movimiento reducido, axe en los dos temas y la
// CSP sin una sola violación, también mientras corre el Worker.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { plantilla } from "../../../src/lib/atlas/plantilla";
import { textos } from "../../../src/lib/i18n";
import { listo } from "../lib/abrir";

const CASO = "hospital-sabana";
const PAGINAS = ["es", "en"].flatMap((i) => [`/${i}/base`, `/${i}/casos/${CASO}`, `/${i}/casos/${CASO}/comparacion`]);

declare global {
  interface Window {
    __violaciones?: string[];
    __eventos?: number[];
  }
}

async function escucharViolaciones(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__violaciones = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__violaciones!.push(`${e.effectiveDirective} · ${e.blockedURI || "en línea"}`));
  });
}

test("mover un peso cruza la costura: la URL guarda el peso, el Worker simula y la aceptabilidad se pinta, sin violar la CSP", async ({ page }) => {
  const T = textos("es").caso.comparacion;
  await escucharViolaciones(page);
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(`/es/casos/${CASO}/comparacion`);
  await listo(page);
  await expect(page.locator(".veredicto")).toBeVisible();
  await expect(page.locator('[data-simulacion="lista"]')).toContainText(plantilla(T.robustez.pesosDe, { pesos: T.robustez.pesosPerfil }));
  const control = page.locator("#peso-explorado");
  const inicial = Number(await control.inputValue());
  await control.focus();
  for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowLeft");
  const t = inicial - 300;
  await expect(page).toHaveURL(new RegExp(`[?&]t=${t}(&|$)`));
  const lista = page.locator('[data-simulacion="lista"]');
  await expect(lista).toContainText(`${(t / 100).toString().replace(".", ",")}.`, { timeout: 20_000 });
  await expect(lista.locator("tbody tr")).not.toHaveCount(0);
  await expect(page.locator(`tr[data-peso="${t}"]`)).toHaveAttribute("aria-current", "true");
  expect(await page.evaluate(() => window.__violaciones)).toEqual([]);
  expect(errores).toEqual([]);
});

test("la URL con un peso explorado abre la pantalla en ese peso; una URL que no cabe cae al peso del perfil", async ({ page }) => {
  await page.goto(`/es/casos/${CASO}/comparacion`);
  await listo(page);
  const criterio = await page.locator(".filtros select").inputValue();
  await page.goto(`/es/casos/${CASO}/comparacion?criterio=${criterio}&t=1000`);
  await listo(page);
  await expect(page.locator("#peso-explorado")).toHaveValue("1000");
  await expect(page.locator("output[for=peso-explorado]")).toHaveText("10");
  await page.goto(`/es/casos/${CASO}/comparacion?criterio=${criterio}&t=99999`);
  await listo(page);
  await expect(page.locator('[data-simulacion="lista"]')).toBeVisible();
  await expect(page.locator("tr[aria-current]")).toContainText(textos("es").caso.comparacion.sensibilidad.actual);
});

test("con la CPU 4× más lenta, mover el peso responde en 200 ms o menos (INP)", async ({ page }) => {
  await page.goto(`/es/casos/${CASO}/comparacion`);
  await listo(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.evaluate(() => {
    window.__eventos = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__eventos!.push(e.duration);
    }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });
  const control = page.locator("#peso-explorado");
  await control.focus();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press(i % 2 ? "ArrowRight" : "ArrowLeft");
    await page.waitForTimeout(450);
  }
  await page.locator(".filtros select").selectOption({ index: 1 });
  await page.waitForTimeout(600);
  const duraciones = await page.evaluate(() => window.__eventos!);
  const peor = Math.max(0, ...duraciones);
  console.log(`INP sembrada (CPU 4×): peor interacción ${peor} ms en ${duraciones.length} eventos medidos`);
  expect(peor).toBeLessThanOrEqual(200);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
});

test("a 380 px nada desborda la página: la matriz y las tablas se deslizan dentro de su marco", async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 800 });
  for (const ruta of PAGINAS) {
    await page.goto(ruta);
    await listo(page);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, ruta).toBeLessThanOrEqual(380);
  }
  await page.goto(`/es/casos/${CASO}/comparacion`);
  const caja = await page.locator("#peso-explorado").boundingBox();
  expect(caja!.x).toBeGreaterThanOrEqual(0);
  expect(caja!.x + caja!.width).toBeLessThanOrEqual(380);
});

const HIDRATACION = /#418|#423|#425|hydrat/i;
for (const ruta of PAGINAS)
  test(`${ruta}: el mismo árbol con y sin movimiento reducido, sin errores de hidratación`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => HIDRATACION.test(e.message) && errores.push(e.message));
    page.on("console", (m) => m.type() === "error" && HIDRATACION.test(m.text()) && errores.push(m.text()));
    const arbol = () => page.locator("main").evaluate((m) => m.outerHTML);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(ruta);
    await listo(page);
    const sin = await arbol();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ruta);
    await listo(page);
    expect(await arbol()).toBe(sin);
    expect(errores).toEqual([]);
  });

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    for (const ruta of PAGINAS)
      test(`${ruta} sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        await listo(page);
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
  });

test("los filtros de la base ocultan las evidencias que no pasan y dicen cuántas quedan", async ({ page }) => {
  const T = textos("es").base.evidencias;
  await page.goto("/es/base");
  await listo(page);
  const visibles = page.locator(".evidencias > li:not([hidden])");
  const todas = await visibles.count();
  expect(todas).toBeGreaterThan(1);
  await expect(page.locator(".conteo[aria-live]")).toHaveText(plantilla(T.mostrando, { n: todas }));
  await page.getByLabel(T.filtros.plataforma).selectOption({ index: 1 });
  const ahora = await visibles.count();
  expect(ahora).toBeGreaterThan(0);
  expect(ahora).toBeLessThan(todas);
  await expect(page.locator(".conteo[aria-live]")).toHaveText(plantilla(T.mostrando, { n: ahora }));
});
