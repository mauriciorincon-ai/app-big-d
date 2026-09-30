import { expect, test, type Page } from "@playwright/test";
import { IDIOMAS, PUBLICADAS, RUTAS } from "./lib/rutas";

// G11 del diagramador (CONTRATO § 2) en el producto, a 380 px y en los tres motores: esta spec corre en
// mobile-chromium y en los proyectos g11-firefox y g11-webkit de playwright.config. En cada ruta del export la
// página no se desliza de lado, y en cada dibujo (el lienzo de la página y la ventana de cada bloque) todo
// texto queda dentro de su lienzo y de su propia caja, fuera de las cajas ajenas y sin pisar otro texto. La tabla de métricas es
// una cota (G15, en tests/determinismo); aquí se mide lo que cada navegador dibuja con las fuentes servidas.
test.use({ viewport: { width: 380, height: 800 } });

async function problemas(page: Page, alcance: string): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((sel) => {
    const out: string[] = [];
    const familia = getComputedStyle(document.body).fontFamily.split(",")[0]!.replace(/"/g, "").trim();
    if (![...document.fonts].some((f) => f.family.replace(/"/g, "") === familia && f.status === "loaded")) out.push(`la fuente ${familia} no cargó`);
    const pisa = (a: DOMRect, b: DOMRect) => a.x < b.x + b.width - 0.5 && a.x + a.width > b.x + 0.5 && a.y < b.y + b.height - 0.5 && a.y + a.height > b.y + 0.5;
    const svgs = [...document.querySelectorAll<SVGSVGElement>(`${sel} svg.dg-svg[viewBox]`)].filter((s) => s.getClientRects().length > 0);
    if (svgs.length === 0) out.push(`sin dibujo visible en ${sel}`);
    for (const svg of svgs) {
      const vb = svg.viewBox.baseVal;
      const dueno = (e: Element) => e.closest("[data-dueno]")?.getAttribute("data-dueno") ?? "";
      const cajas = [...svg.querySelectorAll<SVGGraphicsElement>("[data-caja]")].map((c) => ({ dueno: dueno(c), b: c.getBBox() }));
      // La caja propia de un texto: el rectángulo hijo directo del grupo más cercano que lo tenga (la caja de un
      // nodo o de un bloque, la pastilla de un número de paso, el fondo de una etiqueta).
      const propia = (t: Element) => {
        for (let g: Element | null = t.parentElement; g && g !== svg; g = g.parentElement) {
          const c = [...g.children].find((h) => h.tagName === "rect") as SVGGraphicsElement | undefined;
          if (c) return c.getBBox();
        }
        return null;
      };
      const dentro = (a: DOMRect, c: { x: number; y: number; width: number; height: number }) =>
        a.x >= c.x - 0.5 && a.y >= c.y - 0.5 && a.x + a.width <= c.x + c.width + 0.5 && a.y + a.height <= c.y + c.height + 0.5;
      const textos = [...svg.querySelectorAll<SVGTextElement>("text")].map((t) => ({ txt: (t.textContent ?? "").trim().slice(0, 40), dueno: dueno(t), b: t.getBBox(), caja: propia(t) }));
      textos.forEach((t, i) => {
        const { b } = t;
        if (!dentro(b, vb)) out.push(`«${t.txt}» sale del lienzo`);
        if (t.caja && !dentro(b, t.caja)) out.push(`«${t.txt}» se sale de su caja (${t.dueno})`);
        for (const c of cajas) if (c.dueno !== t.dueno && pisa(b, c.b)) out.push(`«${t.txt}» (${t.dueno}) pisa la caja de ${c.dueno}`);
        for (const o of textos.slice(i + 1)) if (pisa(b, o.b)) out.push(`«${t.txt}» pisa «${o.txt}»`);
      });
    }
    return out;
  }, alcance);
}

const desborde = (page: Page, sel?: string) =>
  page.evaluate((s) => {
    const e = s ? document.querySelector(s)! : document.documentElement;
    return e.scrollWidth - e.clientWidth;
  }, sel);

for (const ruta of RUTAS)
  test(`${ruta}: la página no se desliza de lado y el texto del dibujo cabe`, async ({ page }) => {
    await page.goto(ruta);
    expect(await desborde(page)).toBeLessThanOrEqual(0);
    if (ruta.includes("/atlas/")) expect(await problemas(page, ".lienzo")).toEqual([]);
  });

for (const idioma of IDIOMAS)
  for (const p of PUBLICADAS)
    test(`/${idioma}/atlas/${p}: la ventana de cada bloque cabe, y su dibujo también`, async ({ page }) => {
      await page.goto(`/${idioma}/atlas/${p}`);
      const bloques = page.locator(".lienzo .dg-elem");
      const n = await bloques.count();
      expect(n).toBeGreaterThan(0);
      const panel = page.locator("#panel-ficha");
      for (let i = 0; i < n; i++) {
        const b = bloques.nth(i);
        const id = await b.getAttribute("data-dueno");
        await b.dispatchEvent("click");
        await expect(panel).toBeVisible();
        expect(await desborde(page, "#panel-ficha .panel-cuerpo"), `ventana de ${id}`).toBeLessThanOrEqual(0);
        expect(await problemas(page, "#panel-ficha"), `ventana de ${id}`).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(panel).toBeHidden();
      }
    });
