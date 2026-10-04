import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { POR_PAGINA } from "../../src/lib/atlas/estado-lado";
import { abrir, abrirConTecla, listo } from "./lib/abrir";
import { PLATAFORMAS, PUBLICADAS } from "./lib/rutas";

// El lado a lado (`/[idioma]/comparar`, S2): la forma aprobada en la mirada M1 —un solo botón arriba a la derecha
// del recuadro despliega los componentes en el mismo diagrama— y lo que vive en la URL (qué plataformas y qué
// página). Ancho: selector, paginación, botón, ventanas y fichas, idioma con consulta, el primer pintado sin JS. En
// teléfono: una banda a la vez, todas las elegidas apiladas, el mismo botón. Cuántas a la vez es la constante de la
// vista (`POR_PAGINA`), la misma que usa el producto.
const filasVisibles = (page: Page) =>
  page.locator(".lado-fila").evaluateAll((fs) => fs.filter((f) => f.getClientRects().length).map((f) => (f as HTMLElement).dataset.fila));

test.describe("en ancho", () => {
  test.skip(({ isMobile }) => isMobile, "el lado a lado ancho se mira desde 900 px");
  test.use({ viewport: { width: 1280, height: 900 } });

  test("la paginación y el selector cambian las filas sin volver a dibujar, y lo escriben en la URL", async ({ page }) => {
    await page.goto("/es/comparar");
    await listo(page);
    // Cada SVG lleva una marca propia: si React lo volviera a crear, la marca desaparece (contar no lo vería).
    const svgs = await page.locator(".lado-ancho svg").evaluateAll((ss) => {
      ss.forEach((s, i) => ((s as unknown as { __n: number }).__n = i));
      return ss.length;
    });
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(0, POR_PAGINA));
    const siguiente = page.locator(".paginacion button").last();
    const anterior = page.locator(".paginacion button").first();
    await expect(anterior).toBeDisabled();
    await siguiente.click();
    await expect(page).toHaveURL(/\/es\/comparar\?pagina=2$/);
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(POR_PAGINA, 2 * POR_PAGINA));
    if (PLATAFORMAS.length <= 2 * POR_PAGINA) {
      await expect(siguiente).toBeDisabled();
      await expect(anterior).toBeFocused();
    }
    await anterior.click();
    await expect(page).toHaveURL(/\/es\/comparar$/);
    // El selector: quitar una la saca de la comparación; la última elegida no se puede quitar.
    await page.locator(".selector summary").click();
    const casillas = page.locator(".selector-lista input[type=checkbox]");
    await expect(casillas).toHaveCount(PLATAFORMAS.length);
    await casillas.first().uncheck();
    await expect(page).toHaveURL(new RegExp(`plataformas=${PLATAFORMAS.slice(1).join(",")}$`));
    await expect(page.locator(".selector summary")).toHaveText(`Plataformas: ${PLATAFORMAS.length - 1} de ${PLATAFORMAS.length}`);
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(1, 1 + POR_PAGINA));
    for (let i = 1; i < PLATAFORMAS.length - 1; i++) await casillas.nth(i).uncheck();
    await expect(casillas.last()).toBeChecked();
    await expect(casillas.last()).toBeDisabled();
    expect(await filasVisibles(page)).toEqual([PLATAFORMAS.at(-1)]);
    // Nada se volvió a dibujar: los mismos SVG (con su marca), solo cambió qué se ve.
    expect(await page.locator(".lado-ancho svg").evaluateAll((ss) => ss.map((s) => (s as unknown as { __n?: number }).__n))).toEqual([...Array(svgs).keys()]);
  });

  test("una URL con consulta muestra sus filas desde el primer pintado, antes de que React hidrate", async ({ page }) => {
    // Sin los scripts de la página (no hidrata): solo corre el script en línea, previo al pintado.
    await page.route(/\/_next\/static\/.*\.js$/, (r) => r.abort());
    const una = PUBLICADAS.at(-1)!;
    await page.goto(`/es/comparar?plataformas=${una}`);
    expect(await filasVisibles(page)).toEqual([una]);
    await page.goto("/es/comparar?pagina=2");
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(POR_PAGINA, 2 * POR_PAGINA));
  });

  test("«Desplegar todo» abre los componentes en el mismo diagrama sin mover las columnas, y «Contraer todo» vuelve", async ({ page }) => {
    const p = PUBLICADAS[0]!;
    await page.goto(`/es/comparar?plataformas=${p}`);
    await listo(page);
    const boton = page.locator(".lado-ancho .lienzo-cabeza .lado-todo");
    await expect(boton).toHaveText("Desplegar todo");
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    const lienzo = page.locator(".lado-ancho .lienzo");
    // El botón queda arriba a la derecha del recuadro, fuera de lo que se desliza.
    const [b, marco] = await Promise.all([boton.boundingBox(), page.locator(".lado-ancho .lienzo-marco").boundingBox()]);
    expect(b!.x + b!.width).toBeGreaterThan(marco!.x + marco!.width - 40);
    expect(b!.y).toBeLessThan(marco!.y + 30);
    const xs = (variante: string) =>
      page.locator(`.lado-fila[data-fila="${p}"] [data-variante="${variante}"] [data-caja]`).evaluateAll((cs) => [...new Set(cs.map((c) => Math.round((c as SVGGraphicsElement).getBoundingClientRect().x)))].sort((a, z) => a - z));
    const cabecera = await page.locator(".lado-cabecera svg").boundingBox();
    const columnas = await xs("n1");
    await lienzo.evaluate((l) => ((l.style.scrollBehavior = "auto"), (l.scrollLeft = 200)));
    await boton.click();
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    await expect(boton).toHaveText("Contraer todo");
    await expect(page.locator(`.lado-fila[data-fila="${p}"] [data-variante="n2"] svg`)).toBeVisible();
    await expect(page.locator(`.lado-fila[data-fila="${p}"] [data-variante="n1"] svg`)).toBeHidden();
    expect(await lienzo.evaluate((l) => l.scrollLeft)).toBe(200);
    await lienzo.evaluate((l) => (l.scrollLeft = 0));
    expect(await page.locator(".lado-cabecera svg").boundingBox()).toEqual(cabecera);
    // Las columnas no se mueven: cada componente desplegado empieza donde empezaba un bloque de su banda.
    for (const x of await xs("n2")) expect(columnas).toContain(x);
    await boton.click();
    await expect(boton).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(`.lado-fila[data-fila="${p}"] [data-variante="n1"] svg`)).toBeVisible();
  });

  test("tocar un bloque abre su ventana; desplegado, un componente abre su ficha; con teclado también", async ({ page }) => {
    const p = PUBLICADAS[0]!;
    await page.goto(`/es/comparar?plataformas=${p}`);
    await listo(page);
    const panel = page.locator("#panel-ficha");
    const bloque = page.locator(`.lado-fila[data-fila="${p}"] [data-variante="n1"] .dg-elem`).first();
    await abrirConTecla(bloque, panel);
    await expect(panel.locator("#panel-titulo")).toHaveText("Dentro del bloque");
    await expect(panel.locator(".panel-cuerpo .dg-ficha-tipo").first()).toContainText(" · ");
    await expect(panel.locator('svg[data-vista="bloque"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(bloque).toBeFocused();
    await page.locator(".lado-ancho .lado-todo").click();
    const nodo = page.locator(`.lado-fila[data-fila="${p}"] [data-variante="n2"] .dg-nodo`).first();
    await abrir(nodo, panel);
    await expect(panel.locator("#panel-titulo")).toHaveText("Ficha del componente");
    await expect(panel.locator("h2")).toHaveText((await nodo.getAttribute("aria-label"))!.split(". ")[0]!);
  });

  test("el idioma conserva la consulta; la pestaña 04 lleva aquí y la barra marca «Atlas»", async ({ page }) => {
    await page.goto("/es/comparar?pagina=2");
    await listo(page);
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/comparar\?pagina=2$/);
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(POR_PAGINA, 2 * POR_PAGINA));
    await page.goto(`/es/atlas/${PUBLICADAS[0]}`);
    await listo(page);
    await page.locator(".niveles a", { hasText: "Lado a lado" }).click();
    await expect(page).toHaveURL(/\/es\/comparar$/);
    await expect(page.locator(".niveles a", { hasText: "Lado a lado" })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".barra .nav a", { hasText: "Atlas" })).toHaveAttribute("aria-current", "true");
    expect(await filasVisibles(page)).toEqual(PLATAFORMAS.slice(0, POR_PAGINA));
    // Al salir sin recargar (Link de Next), el <html> ya no guarda el estado del lado a lado.
    await page.locator(".niveles a", { hasText: "Visión general" }).click();
    await expect(page).toHaveURL(/\/es\/atlas\/[^/]+$/);
    expect(await page.evaluate(() => [document.documentElement.hasAttribute("data-lado"), document.documentElement.hasAttribute("data-lado-elegidas")])).toEqual([false, false]);
  });

  test("una plataforma sin mapa es una fila «próximamente» que lleva a su página del investigador", async ({ page }) => {
    const pronto = PLATAFORMAS.find((p) => !PUBLICADAS.includes(p));
    test.skip(!pronto, "todas publicadas");
    await page.goto(`/es/comparar?plataformas=${pronto}`);
    await listo(page);
    const fila = page.locator(`.lado-fila[data-fila="${pronto}"]`);
    await expect(fila.locator(".lado-pronto-nombre")).toContainText("próximamente");
    await fila.getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`/es/investigador/${pronto}$`));
  });
});

test.describe("en teléfono", () => {
  test.use({ viewport: { width: 380, height: 800 } });

  test("una banda a la vez con todas las elegidas apiladas; el mismo botón despliega y contrae sus componentes", async ({ page }) => {
    await page.goto("/es/comparar");
    await listo(page);
    await expect(page.locator(".lado-ancho")).toBeHidden();
    const pestanas = page.locator(".lado-angosto-cabeza .indice button");
    const n = await pestanas.count();
    expect(n).toBeGreaterThan(1);
    const visible = page.locator(".lado-banda:not([hidden])");
    await expect(visible).toHaveCount(1);
    await expect(visible.locator(".lado-pl")).toHaveCount(PLATAFORMAS.length);
    await pestanas.nth(n - 1).click();
    await expect(pestanas.nth(n - 1)).toHaveAttribute("aria-current", "true");
    await expect(visible).toHaveAttribute("data-banda", (await page.locator(".lado-banda").nth(n - 1).getAttribute("data-banda"))!);
    await pestanas.nth(2).click();
    const boton = page.locator(".lado-angosto .lado-todo");
    await boton.click();
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    const abiertos = visible.locator("details.lado-comp");
    const k = await abiertos.count();
    expect(k).toBeGreaterThan(0);
    for (let i = 0; i < k; i++) await expect(abiertos.nth(i)).toHaveAttribute("open", "");
    await expect(visible.locator(".dg-tarjeta").first()).toBeVisible();
    await boton.click();
    await expect(boton).toHaveText("Desplegar todo");
    await expect(visible.locator("details.lado-comp[open]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("la selección de la URL también filtra la lista del teléfono (sin paginar)", async ({ page }) => {
    const dos = PLATAFORMAS.slice(-2);
    await page.goto(`/es/comparar?plataformas=${dos.join(",")}`);
    await listo(page);
    const visibles = await page.locator(".lado-banda:not([hidden]) .lado-pl").evaluateAll((ls) => ls.filter((l) => l.getClientRects().length).map((l) => (l as HTMLElement).dataset.pl));
    expect(visibles).toEqual(dos);
    await expect(page.locator(".paginacion")).toBeHidden();
  });
});

// axe sobre los estados que el estado inicial no muestra: todo desplegado y, en ancho, la ficha de un componente
// abierta, en los dos temas.
for (const [esquema, tema] of [
  ["dark", "oscuro"],
  ["light", "claro"],
] as const)
  test(`axe con todo desplegado y la ficha abierta (${tema})`, async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto("/es/comparar");
    await listo(page);
    const boton = page.locator(isMobile ? ".lado-angosto .lado-todo" : ".lado-ancho .lado-todo");
    await boton.click();
    await expect(boton).toHaveAttribute("aria-expanded", "true");
    if (!isMobile) await abrir(page.locator('.lado-fila [data-variante="n2"] .dg-nodo').first(), page.locator("#panel-ficha"));
    const serias = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(serias, JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  });
