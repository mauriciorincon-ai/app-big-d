import { expect, test, type Page } from "@playwright/test";
import { abrir, listo } from "./lib/abrir";
import { conDibujo, IDIOMAS, PUBLICADAS, RUTAS, VERSIONADAS } from "./lib/rutas";

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
    const pisa = (a: DOMRect, b: DOMRect, vertical = 0.5) =>
      a.x < b.x + b.width - 0.5 && a.x + a.width > b.x + 0.5 && a.y < b.y + b.height - vertical && a.y + a.height > b.y + vertical;
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
        // Entre dos textos, lo que el navegador decide es el ANCHO (0,5 px). La altura de su caja es la caja de
        // línea de la fuente, que el motor apila una pegada a la otra (G15: ascendente + descendente); Chromium
        // la redondea a píxeles enteros y en Linux ese redondeo las solapa ~1 px sin que las letras se toquen.
        for (const o of textos.slice(i + 1)) if (pisa(b, o.b, 1.5)) out.push(`«${t.txt}» pisa «${o.txt}»`);
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
    if (conDibujo(ruta)) expect(await problemas(page, ".lienzo")).toEqual([]);
  });

// Las ventanas de los bloques del nivel 1 y, en las versiones de un mapa, las de cada versión (S2, D-S2-08).
const CON_VENTANAS = IDIOMAS.flatMap((i) => [...PUBLICADAS.map((p) => `/${i}/atlas/${p}`), ...VERSIONADAS.map((p) => `/${i}/atlas/${p}/versiones`)]);
for (const ruta of CON_VENTANAS)
    test(`${ruta}: la ventana de cada bloque cabe, y su dibujo también`, async ({ page }) => {
      await page.goto(ruta);
      const bloques = page.locator(".lienzo .dg-elem");
      const n = await bloques.count();
      expect(n).toBeGreaterThan(0);
      const panel = page.locator("#panel-ficha");
      for (let i = 0; i < n; i++) {
        const b = bloques.nth(i);
        const id = await b.getAttribute("data-dueno");
        await abrir(b, panel);
        expect(await desborde(page, "#panel-ficha .panel-cuerpo"), `ventana de ${id}`).toBeLessThanOrEqual(0);
        expect(await problemas(page, "#panel-ficha"), `ventana de ${id}`).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(panel).toBeHidden();
      }
    });

// El lado a lado se dibuja en ancho (en teléfono es una lista por banda): ahí, cada fila con sus bloques y con sus
// componentes desplegados, en los tres motores. Todas las publicadas, página por página (tres a la vez).
test.describe("lado a lado en ancho", () => {
  test.use({ viewport: { width: 1400, height: 900 } });
  for (const idioma of IDIOMAS)
    test(`/${idioma}/comparar: el texto de cada fila cabe, con bloques y desplegado`, async ({ page }) => {
      const paginas = Math.ceil(PUBLICADAS.length / 3);
      for (let pagina = 1; pagina <= paginas; pagina++) {
        await page.goto(`/${idioma}/comparar?plataformas=${PUBLICADAS.join(",")}&pagina=${pagina}`);
        await listo(page);
        const visibles = await page.locator(".lado-fila").evaluateAll((fs) => fs.filter((f) => f.getClientRects().length).map((f) => (f as HTMLElement).dataset.fila));
        expect(visibles).toEqual(PUBLICADAS.slice((pagina - 1) * 3, pagina * 3));
        expect(await problemas(page, ".lado-ancho .lienzo"), `página ${pagina}, bloques`).toEqual([]);
        await page.locator(".lado-ancho .lado-todo").click();
        await expect(page.locator(".lado-ancho .lado-todo")).toHaveAttribute("aria-expanded", "true");
        expect(await problemas(page, ".lado-ancho .lienzo"), `página ${pagina}, desplegado`).toEqual([]);
      }
    });
});
