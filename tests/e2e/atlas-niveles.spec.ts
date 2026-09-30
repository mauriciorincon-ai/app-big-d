import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { abrir, abrirConTecla, listo } from "./lib/abrir";

// Atlas · niveles 2 y 3 (S1, fase 3): la ficha de un componente con su contrato de foco y el recorrido paso a
// paso. Más el campo «Plataforma» con sus N opciones. El movimiento reducido vive en reduced-motion.spec.ts.
const N2 = "/es/atlas/plataforma-ejemplo/componentes";
const REC = "/es/atlas/plataforma-ejemplo/recorrido";

test.describe("ficha de un componente", () => {
  test("abre con clic, lleva el foco al título; Esc la cierra y el foco vuelve al componente", async ({ page }) => {
    await page.goto(N2);
    const panel = page.locator("#panel-ficha");
    await expect(panel).toBeHidden();
    const nodo = page.locator('.lienzo .dg-nodo[data-nodo="captura-cambios"]');
    await abrirConTecla(nodo, panel);
    await expect(panel.locator("h2")).toHaveText("Captura de cambios");
    await expect(panel.locator("h2")).toBeFocused();
    await expect(nodo).toHaveAttribute("aria-current", "true");
    await expect(panel.locator(".dg-terminos")).toContainText("registro de transacciones");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(nodo).toBeFocused();
  });

  test.describe("en teléfono", () => {
    test.use({ viewport: { width: 380, height: 800 } });
    test("es una hoja modal: el foco no sale de ella", async ({ page }) => {
      await page.goto(N2);
      const panel = page.locator("#panel-ficha");
      await abrir(page.locator('.lienzo .dg-nodo[data-nodo="catalogo-central"]'), panel);
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        expect(await panel.evaluate((p) => p.contains(document.activeElement))).toBe(true);
      }
      await panel.getByRole("button", { name: "Cerrar" }).click();
      await expect(panel).toBeHidden();
    });
  });

  test("desde 900 px es una región lateral, no modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(N2);
    // Abierta, no oculta: con el panel oculto el rol se afirmaba sin abrir nada (M-9 de la auditoría del S1).
    const panel = page.getByRole("complementary", { name: "Ficha" });
    await abrir(page.locator('.lienzo .dg-nodo[data-nodo="tablero"]'), panel);
    await expect(panel).toBeVisible();
    await expect(page.locator("#panel-ficha")).not.toHaveAttribute("aria-modal", /.*/);
  });
});

test.describe("recorrido", () => {
  test("Siguiente, Anterior, Ver todos y las flechas cambian el paso; el componente del paso se marca", async ({ page }) => {
    await page.goto(REC);
    await listo(page);
    const rec = page.locator("#rec");
    await expect(rec).toHaveAttribute("data-paso", "todos");
    await expect(page.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(rec).toHaveAttribute("data-paso", "p1");
    await expect(page.locator(".rec-pos")).toHaveText("Paso 1 de 8");
    await expect(page.locator('[data-paso-panel="p1"]')).toHaveAttribute("aria-current", "step");
    const caja = page.locator('.lienzo .dg-nodo[data-paso~="p1"] [data-caja]').first();
    await expect(caja).toHaveCSS("stroke-width", "3px");
    await page.locator("h1").click();
    await page.keyboard.press("ArrowRight");
    await expect(rec).toHaveAttribute("data-paso", "p2");
    await page.getByRole("button", { name: "Anterior" }).click();
    await expect(rec).toHaveAttribute("data-paso", "p1");
    await page.getByRole("button", { name: "Ver todos" }).click();
    await expect(page.locator(".rec-pos")).toHaveText("Todos los pasos");
  });

  test("tocar un componente del recorrido lleva a su paso y abre su ficha", async ({ page }) => {
    await page.goto(REC);
    await abrir(page.locator('.lienzo .dg-nodo[data-paso~="p4"]'), page.locator("#panel-ficha"));
    await expect(page.locator("#rec")).toHaveAttribute("data-paso", "p4");
    await expect(page.locator("#panel-ficha h2")).toHaveText("Motor de transformación");
  });

  test("sin movimiento reducido, «Reproducir» avanza solo y «Pausar» lo detiene", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(REC);
    await listo(page);
    const boton = page.locator('[data-rec="reproducir"]');
    await expect(boton).toBeVisible();
    await boton.click();
    await expect(boton).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#rec")).toHaveAttribute("data-paso", "p2", { timeout: 4000 });
    await boton.click();
    await expect(boton).toHaveAttribute("aria-pressed", "false");
  });
});

test("el campo «Plataforma» lista las N plataformas; las que no tienen mapa dicen «pronto» y no se eligen", async ({ page }) => {
  await page.goto(N2);
  const campo = page.getByRole("combobox", { name: "Plataforma" });
  const ops = await campo.locator("option").evaluateAll((os) => os.map((o) => ({ t: o.textContent, d: (o as HTMLOptionElement).disabled })));
  expect(ops.length).toBeGreaterThanOrEqual(2);
  for (const o of ops) expect(o.d).toBe(o.t!.endsWith("— pronto"));
  await expect(campo).toHaveValue("plataforma-ejemplo");
});

for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test.describe(`axe en ${tema}`, () => {
    test.use({ colorScheme: esquema });
    for (const ruta of [N2, REC])
      test(`${ruta} con la ficha abierta, sin violaciones serias (${tema})`, async ({ page }) => {
        await page.goto(ruta);
        await listo(page);
        // Primero la lectura: en teléfono la ficha es modal y tapa el resto de la página.
        await page.locator("details.lectura-seccion > summary").click();
        await abrir(page.locator(".lienzo .dg-nodo").nth(2), page.locator("#panel-ficha"));
        const scan = await new AxeBuilder({ page }).analyze();
        const serias = scan.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
        expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
      });
  });
