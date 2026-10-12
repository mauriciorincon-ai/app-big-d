// El segundo idioma, en inglés (S7, D-S7-05; regla 20: e2e y capturas en UN idioma por sprint, el otro al cierre del hito).
// Una tabla de rutas × tema, no los trece specs parametrizados: cada ruta en inglés carga, declara `lang="en"`, trae el título
// que sale de `textos("en")` (y no el del español), no tiene violaciones de axe de ninguna gravedad, no desborda a 380 px y no
// deja texto en español a la vista. El informe, además, saca sus catorce secciones en el orden de § 12 con los títulos en inglés.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SECCIONES } from "../../src/engine";
import { textos } from "../../src/lib/i18n";
import { listo } from "./lib/abrir";
import { CASOS, PUBLICADAS, RUTAS, vistasDe } from "./lib/rutas";

const EN = textos("en");
const ES = textos("es");
const SUFIJO = EN.sitio.nombre;

/** El texto que cada ruta pone antes de « · Big-D» en su título, en un idioma. Sale del mismo `textos` que usa la página. */
function tituloDe(ruta: string, t: typeof EN): string | null {
  const m = /^\/(?:es|en)(\/.*)?$/.exec(ruta);
  const resto = m?.[1] ?? "";
  if (resto === "") return null; // la portada lleva solo el nombre del sitio
  if (resto === "/comparar") return t.atlas.lado.titulo;
  if (resto === "/base") return t.base.titulo;
  if (resto === "/instrumento") return t.instrumento.titulo;
  if (resto.startsWith("/casos/")) {
    const [, , , vista] = resto.split("/");
    return vista === undefined
      ? t.secciones.perfil
      : (
          {
            comparacion: t.secciones.comparacion,
            decisiones: t.secciones.decisiones,
            informe: t.secciones.informe,
          } as Record<string, string>
        )[vista]!;
  }
  if (resto.startsWith("/investigador/")) return t.investigador.titulo;
  if (resto.startsWith("/atlas/")) {
    const vista = resto.split("/")[3];
    if (vista === undefined) return t.atlas.tituloNivel1;
    return {
      componentes: t.atlas.nivel2.titulo,
      recorrido: t.atlas.recorrido.titulo,
      versiones: t.atlas.versiones.titulo,
    }[vista]!;
  }
  return null;
}

// Todas las rutas del sitio en inglés, más las dos pantallas de plan e informe de cada caso (rutas.ts las deja al lado).
const RUTAS_EN = [
  ...RUTAS.filter((r) => r.startsWith("/en")),
  ...CASOS.flatMap((c) => [
    `/en/casos/${c}/decisiones`,
    `/en/casos/${c}/informe`,
  ]),
];

// Palabras que el español usa y el inglés no. Una sola en el texto visible de la página es texto sin traducir.
const SOLO_ESPANOL = [
  "el",
  "los",
  "las",
  "una",
  "unos",
  "para",
  "por",
  "con",
  "del",
  "qué",
  "cómo",
  "más",
  "está",
  "también",
  "pero",
  "sobre",
  "sin",
  "entre",
  "desde",
  "hasta",
  "cuando",
  "mientras",
];

/**
 * Las palabras del español que quedan en la prosa de la página. Quedan fuera las órdenes de terminal y los códigos (`--desde`,
 * `una-o-combinacion`) y las siglas en mayúsculas (la capa «CON» del mapa): no son prosa.
 */
async function palabrasDeEspanol(page: Page): Promise<string[]> {
  const texto = await page.locator("main").evaluate((el) => {
    const copia = el.cloneNode(true) as HTMLElement;
    for (const n of copia.querySelectorAll("code, pre, kbd, script, style, .mono, .cod")) n.remove();
    return copia.textContent ?? "";
  });
  const palabras = (texto.match(/[\p{L}]+/gu) ?? []).filter((w) => w !== w.toUpperCase()).map((w) => w.toLowerCase());
  return [...new Set(palabras.filter((w) => SOLO_ESPANOL.includes(w)))];
}

test("la tabla cubre el sitio entero: portada, atlas, lado a lado, investigador, base, instrumento y cada pantalla del caso", () => {
  expect(RUTAS_EN).toContain("/en");
  expect(RUTAS_EN).toContain("/en/comparar");
  for (const p of PUBLICADAS)
    for (const v of vistasDe(p))
      expect(RUTAS_EN).toContain(`/en/atlas/${p}${v}`);
  for (const c of CASOS)
    for (const v of ["", "/comparacion", "/decisiones", "/informe"])
      expect(RUTAS_EN).toContain(`/en/casos/${c}${v}`);
  expect(RUTAS_EN.every((r) => r.startsWith("/en"))).toBe(true);
});

for (const [esquema, tema] of [
  ["dark", "dark"],
  ["light", "light"],
] as const)
  test.describe(`en inglés · ${tema}`, () => {
    test.use({ colorScheme: esquema });

    for (const ruta of RUTAS_EN)
      test(`${ruta}: carga en inglés, con su título, sin violaciones de axe y sin texto en español`, async ({
        page,
      }) => {
        const respuesta = await page.goto(ruta);
        expect(respuesta?.status(), ruta).toBeLessThan(400);
        await listo(page);
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expect(page.locator("main h1").first()).toBeVisible();

        const esperado = tituloDe(ruta, EN);
        const titulo = await page.title();
        if (esperado === null) expect(titulo, ruta).toBe(SUFIJO);
        else {
          expect(titulo, ruta).toContain(esperado);
          expect(titulo, ruta).toMatch(
            new RegExp(`${SUFIJO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
          );
          // …y no es el del español.
          const enEs = tituloDe(ruta.replace(/^\/en/, "/es"), ES);
          if (enEs !== null && enEs !== esperado)
            expect(titulo, ruta).not.toContain(enEs);
        }

        // Sin texto en español a la vista.
        expect(await palabrasDeEspanol(page), `${ruta}: palabras del español en la página`).toEqual([]);

        const scan = await new AxeBuilder({ page }).analyze();
        expect(
          scan.violations,
          JSON.stringify(
            scan.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          ),
        ).toEqual([]);
      });
  });

test.describe("en inglés · teléfono", () => {
  test.use({ viewport: { width: 380, height: 800 } });
  for (const ruta of RUTAS_EN)
    test(`${ruta}: a 380 px la página no se desliza de lado`, async ({
      page,
    }) => {
      await page.goto(ruta);
      await listo(page);
      const ancho = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(ancho, ruta).toBeLessThanOrEqual(380);
    });
});

for (const caso of CASOS)
  test(`/en/casos/${caso}/informe: las catorce secciones salen en el orden de § 12, con su título en inglés`, async ({
    page,
  }) => {
    await page.goto(`/en/casos/${caso}/informe`);
    await listo(page);
    const ids = await page
      .locator("section.inf-sec")
      .evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(SECCIONES.map((s) => `sec-${s}`));
    expect(ids).toHaveLength(14);
    for (const s of SECCIONES)
      await expect(page.locator(`#sec-${s} h2`)).toContainText(
        EN.caso.informe.informe.secciones[s],
      );
  });

// Un detector que nunca ve nada no prueba nada: en español, la misma función SÍ encuentra palabras.
test("el detector ve el español: en /es/base encuentra palabras del español", async ({ page }) => {
  await page.goto("/es/base");
  await listo(page);
  expect((await palabrasDeEspanol(page)).length).toBeGreaterThan(0);
});
