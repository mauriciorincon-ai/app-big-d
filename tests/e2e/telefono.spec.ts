import { expect, test } from "@playwright/test";
import { abrir, listo } from "./lib/abrir";

// A 380 px: lo que la pasada final de capturas del S1 leyó como imagen (2026-09-30) y ninguna prueba miraba. La
// pestaña del nivel actual cortada, un plegable que no parece plegable, un «·» que abre línea, un número separado
// de su palabra y la fecha de la ficha partida en dos.
test.use({ viewport: { width: 380, height: 800 } });

test("la pestaña del nivel actual se ve entera, aunque la fila de niveles se deslice", async ({ page }) => {
  for (const ruta of ["/es/atlas/plataforma-ejemplo/recorrido", "/es/atlas/fabric/recorrido"]) {
    await page.goto(ruta);
    await listo(page);
    const fila = page.locator("ul.niveles");
    const activa = fila.locator('[aria-current="page"]');
    await expect(async () => {
      const [f, a] = await Promise.all([fila.boundingBox(), activa.boundingBox()]);
      expect(a!.x, ruta).toBeGreaterThanOrEqual(f!.x - 0.5);
      expect(a!.x + a!.width, ruta).toBeLessThanOrEqual(f!.x + f!.width + 0.5);
    }).toPass({ timeout: 3000 });
  }
});

test("el plegable «Lectura en texto» lleva una marca dibujada que cambia al abrirlo", async ({ page }) => {
  await page.goto("/es/atlas/fabric");
  await listo(page);
  const resumen = page.locator("details.lectura-seccion > summary");
  const marca = () => resumen.evaluate((el) => {
    const c = getComputedStyle(el, "::after");
    return { visible: c.content !== "none" && parseFloat(c.width) > 0 && parseFloat(c.height) > 0, giro: c.transform };
  });
  const cerrada = await marca();
  expect(cerrada.visible).toBe(true);
  await resumen.click();
  expect((await marca()).giro).not.toBe(cerrada.giro);
});

test("ningún «·» abre una línea, y un número no se separa de su palabra", async ({ page }) => {
  for (const ruta of ["/es/investigador/fabric", "/es/investigador/plataforma-ejemplo", "/es/atlas/fabric", "/en/investigador/fabric"]) {
    await page.goto(ruta);
    const huerfanos = await page.locator(".meta").evaluateAll((metas) =>
      metas.flatMap((m) =>
        [...m.querySelectorAll(".punto")]
          .filter((p) => {
            const r = p.getBoundingClientRect();
            return r.width > 0 && r.left <= m.getBoundingClientRect().left + 1;
          })
          .map(() => m.textContent),
      ),
    );
    expect(huerfanos, ruta).toEqual([]);
  }
  for (const [ruta, palabra] of [["/es/investigador/fabric", "rechazadas"], ["/en/investigador/fabric", "rejected"]] as const) {
    await page.goto(ruta);
    const rectangulos = await page.locator(".veredicto .mono").evaluate((el, p) => {
      const nodo = el.firstChild!;
      const texto = nodo.textContent!;
      const m = texto.match(new RegExp(`\\d+\\s${p}`))!;
      const r = document.createRange();
      r.setStart(nodo, m.index!);
      r.setEnd(nodo, m.index! + m[0].length);
      return r.getClientRects().length;
    }, palabra);
    expect(rectangulos, ruta).toBe(1);
  }
});

test("en la ficha, cada dato del pie (la fecha de consulta incluida) queda en una sola línea", async ({ page }) => {
  await page.goto("/es/atlas/plataforma-ejemplo/componentes");
  await listo(page);
  await abrir(page.locator(".lienzo .dg-nodo").nth(2), page.locator("#panel-ficha"));
  const datos = await page.locator("#panel-ficha .dg-ficha-meta span").evaluateAll((ss) => ss.map((s) => [s.textContent, s.getClientRects().length] as const));
  expect(datos.length).toBeGreaterThan(0);
  for (const [texto, lineas] of datos) expect(lineas, texto ?? "").toBe(1);
});
