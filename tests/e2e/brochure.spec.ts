import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// S10 (F2): las escenas del brochure (docs/BROCHURE-storyboard.md), con y sin movimiento (molde v2, regla 6 del molde:
// reduced-motion es una experiencia alterna COMPLETA, verificada activamente). La pieza es un archivo suelto: se abre
// como archivo, sin servidor. Con movimiento, el clímax cambia el orden de las plataformas y la huella no cambia; con
// `reducedMotion: "reduce"`, cada escena se ve completa (opacidad y tamaño reales) y nada se mueve.
const PIEZA = pathToFileURL(join(process.cwd(), "docs/BROCHURE.html")).href;
const ESCENAS = ["e1-gramatica", "e2-empate", "e3-neutralidad"];

/** Opacidad acumulada por la cadena de ancestros y tamaño real: lo que de verdad se ve. */
const seVe = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) =>
    els.map((el) => {
      let o = 1;
      for (let n: Element | null = el; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") return 0;
        o *= Number(cs.opacity);
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? o : 0;
    }),
  );

const huellas = (page: Page) => page.locator("#e3-neutralidad [data-huella]").allTextContents();
/** El orden en que se VEN las fichas de la fila viva (de izquierda a derecha), no el del DOM. */
const ordenVisto = (page: Page) =>
  page.locator("[data-fila-viva] .ficha").evaluateAll((els) =>
    els
      .map((el) => ({ id: el.getAttribute("data-plataforma"), x: el.getBoundingClientRect().left }))
      .sort((a, b) => a.x - b.x)
      .map((f) => f.id)
      .join(","),
  );

test.describe("brochure · escenas", () => {
  test("con movimiento: el clímax cambia el orden una vez por plataforma y la huella no se mueve", async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(PIEZA);
    const antes = await huellas(page);
    expect(antes).toHaveLength(2);
    expect(antes[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(antes[1]).toBe(antes[0]);
    const dom = (await page.locator("[data-fila-viva] .ficha").evaluateAll((e) => e.map((x) => x.getAttribute("data-plataforma")))).join(",");

    await page.locator("#e3-neutralidad").scrollIntoViewIfNeeded();
    const fila = page.locator("[data-fila-viva]");
    await expect(fila).toHaveAttribute("data-vuelta", "1");
    // La primera vuelta deja un orden visto distinto del de partida (cuando la transición asienta).
    await expect.poll(() => ordenVisto(page), { timeout: 3000 }).not.toBe(dom);
    expect(await huellas(page)).toEqual(antes);
    const n = await fila.locator(".ficha").count();
    await expect(fila).toHaveAttribute("data-vuelta", String(n), { timeout: 6000 });
    // N vueltas (una por plataforma) y se detiene, de vuelta en el orden real de la fila (la huella de abajo es la de ESE orden).
    await expect.poll(() => ordenVisto(page), { timeout: 3000 }).toBe(dom);
    await page.clock.runFor(1600); // un ciclo más de reloj: si no se detuviera, avanzaría
    await expect(fila).toHaveAttribute("data-vuelta", String(n));

    await page.locator("[data-repetir]").click();
    await expect(fila).toHaveAttribute("data-vuelta", String(n + 1));
    expect(await huellas(page)).toEqual(antes);
    // E1 y E2 se asientan en su sitio: los trazos dibujados y las barras en su total.
    await page.locator("#e1-gramatica").scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator("#e1-gramatica .trazo").first().evaluate((e) => getComputedStyle(e).strokeDashoffset), { timeout: 4000 }).toMatch(/^0(px)?$/);
  });

  test("con reduced-motion: cada escena completa, a opacidad y tamaño reales, y nada se mueve", async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(PIEZA);
    for (const id of ESCENAS) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      for (const sel of [`#${id} h2`, `#${id} > p:not(.rotulo)`, `#${id} .escena-cuadro`])
        expect(await seVe(page, sel), sel).toEqual(expect.arrayContaining([1]));
    }
    expect(await seVe(page, "#e1-gramatica .mapa-mini")).toEqual([1, 1, 1]);
    const offsets = await page.locator(".trazo").evaluateAll((e) => e.map((x) => getComputedStyle(x).strokeDashoffset));
    expect(offsets.every((o) => /^0(px)?$/.test(o))).toBe(true);
    // Las barras en su total (scaleX = el valor declarado) y la franja del empate visible.
    const barras = await page.locator(".barra").evaluateAll((e) =>
      e.map((x) => ({ v: Number(getComputedStyle(x).getPropertyValue("--v")), m: new DOMMatrix(getComputedStyle(x).transform).a })),
    );
    for (const b of barras) expect(b.m).toBeCloseTo(b.v, 3);
    // …y se VEN: cada barra con alto real y un ancho proporcional a su total dentro de la pista.
    const nBarras = await page.locator(".barra").count();
    expect(await seVe(page, ".barra")).toEqual(Array(nBarras).fill(1));
    const anchos = await page.locator(".barra").evaluateAll((e) =>
      e.map((x) => x.getBoundingClientRect().width / x.parentElement!.getBoundingClientRect().width),
    );
    for (const [i, b] of barras.entries()) expect(anchos[i]).toBeCloseTo(b.v, 2);
    expect(await seVe(page, ".franja-empate")).toEqual(Array(nBarras).fill(1));
    expect(await seVe(page, ".empate-rotulo")).toEqual([1]);
    // El clímax: dos órdenes, dos huellas idénticas y «Misma huella», sin que nada arranque solo.
    expect(await seVe(page, "#e3-neutralidad [data-huella]")).toEqual([1, 1]);
    const [a, b] = await huellas(page);
    expect(a).toBe(b);
    await expect(page.locator("#e3-neutralidad .igual")).toContainText("Misma huella");
    await page.clock.runFor(1600);
    await expect(page.locator("[data-fila-viva]")).not.toHaveAttribute("data-vuelta", /.*/);
    expect(await page.evaluate(() => document.getAnimations().filter((x) => x.playState === "running").length)).toBe(0);
    // El botón responde al instante, sin transición.
    await page.locator("[data-repetir]").click();
    await expect(page.locator("[data-fila-viva]")).toHaveAttribute("data-vuelta", "1");
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("el árbol no depende de la preferencia, y axe sin violaciones serias en los dos modos", async ({ page }) => {
    const arbol = () =>
      page.locator(".lienzo").evaluate((l) =>
        [...l.querySelectorAll("*")].map((n) => n.tagName + (n.id ? `#${n.id}` : "")).join(" "),
      );
    const vistos: string[] = [];
    for (const modo of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion: modo });
      await page.goto(PIEZA);
      vistos.push(await arbol());
      const r = await new AxeBuilder({ page }).include(".lienzo").analyze();
      const serias = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
    }
    expect(vistos[1]).toBe(vistos[0]);
  });
});
