// Arnés de CAPTURAS de la maqueta (Etapa de Diseño · pasada de capturas desde la ronda 1).
//
// Recorre cada página de docs/diseno/ por file:// en estado × tema × idioma × ancho, guarda la
// captura a tamaño real y MIDE lo que G11 exige de la referencia:
//   - desplazamiento horizontal (scrollWidth ≤ clientWidth) en cada ancho;
//   - cada <text> de un SVG marcado con [data-lienzo] queda dentro de su viewBox;
//   - ningún <text> con data-dueno="X" pisa una caja [data-caja] de otro dueño;
//   - la fuente declarada cargó (document.fonts.check).
// Con --simular, repite la página en deuteranopía, protanopía, tritanopía y acromatopsia (CDP).
//
// Regla 17-bis (b): declara el árbol que lee y ABORTA si una página está fuera de docs/diseno/.
// Las capturas van a un directorio temporal (argumento --salida), nunca al repo.
//
// Uso: node scripts/capturar-maqueta.mjs --salida <dir> [--paginas a,b] [--anchos 380,1280]
//      [--temas oscuro,claro] [--idiomas es,en] [--simular] [--solo-medir]
import { mkdirSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arbol = join(raiz, "docs", "diseno");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const bandera = (n) => process.argv.includes(`--${n}`);

const salida = arg("salida");
if (!salida && !bandera("solo-medir")) {
  console.error(
    "capturar-maqueta: falta --salida <dir> (temporal, fuera del repo)",
  );
  process.exit(1);
}
if (salida && resolve(salida).startsWith(raiz + "/")) {
  console.error(
    "capturar-maqueta: --salida dentro del repo; las capturas no se versionan. Aborto.",
  );
  process.exit(1);
}
const paginas = (
  arg("paginas") ??
  readdirSync(arbol)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""))
    .join(",")
)
  .split(",")
  .map((p) => join(arbol, p.endsWith(".html") ? p : `${p}.html`));
for (const p of paginas)
  if (!resolve(p).startsWith(arbol + "/")) {
    console.error(`capturar-maqueta: ${p} está fuera de ${arbol}. Aborto.`);
    process.exit(1);
  }
const anchos = arg("anchos", "380,1280").split(",").map(Number);
const temas = arg("temas", "oscuro,claro").split(",");
const idiomas = arg("idiomas", "es,en").split(",");
const SIMULACIONES = [
  "deuteranopia",
  "protanopia",
  "tritanopia",
  "achromatopsia",
];

console.log(`capturar-maqueta: árbol ${arbol}`);
console.log(`  páginas ${paginas.map((p) => basename(p)).join(" ")}`);
if (salida) mkdirSync(salida, { recursive: true });

const navegador = await chromium.launch();
const fallas = [];
let n = 0;

async function medir(pagina, clave) {
  const r = await pagina.evaluate(() => {
    const el = document.documentElement;
    const out = {
      desborde: el.scrollWidth - el.clientWidth,
      fuera: [],
      pisadas: [],
      fuente: true,
    };
    // fonts.check() da verdadero también con una cara que FALLÓ: se exige la cara cargada.
    out.fuente = [...document.fonts].some(
      (f) => f.family.replace(/"/g, "") === "Atkinson Hyperlegible Next" && f.status === "loaded",
    );
    for (const svg of document.querySelectorAll("svg[data-lienzo]")) {
      if (!svg.getClientRects().length) continue; // oculto en este estado
      const vb = svg.viewBox.baseVal;
      const cajas = [...svg.querySelectorAll("[data-caja]")].map((c) => ({
        id: c.getAttribute("data-caja"),
        b: c.getBBox(),
      }));
      for (const t of svg.querySelectorAll("text")) {
        if (!t.getClientRects().length) continue;
        const b = t.getBBox();
        const txt = (t.textContent ?? "").trim().slice(0, 40);
        if (
          b.x < vb.x - 0.5 ||
          b.y < vb.y - 0.5 ||
          b.x + b.width > vb.x + vb.width + 0.5 ||
          b.y + b.height > vb.y + vb.height + 0.5
        )
          out.fuera.push(`${svg.getAttribute("data-lienzo")}: «${txt}»`);
        const dueno = t.closest("[data-dueno]")?.getAttribute("data-dueno");
        for (const c of cajas) {
          if (c.id === dueno) continue;
          const cruza =
            b.x < c.b.x + c.b.width &&
            b.x + b.width > c.b.x &&
            b.y < c.b.y + c.b.height &&
            b.y + b.height > c.b.y;
          if (cruza)
            out.pisadas.push(
              `${svg.getAttribute("data-lienzo")}: «${txt}» (${dueno ?? "sin dueño"}) pisa ${c.id}`,
            );
        }
      }
    }
    return out;
  });
  if (r.desborde > 0)
    fallas.push(`${clave}: desplazamiento horizontal de ${r.desborde}px`);
  if (!r.fuente) fallas.push(`${clave}: la fuente no cargó`);
  for (const f of r.fuera) fallas.push(`${clave}: texto fuera del lienzo ${f}`);
  for (const f of r.pisadas) fallas.push(`${clave}: ${f}`);
}

for (const ruta of paginas) {
  const nombre = basename(ruta, ".html");
  for (const ancho of anchos) {
    const ctx = await navegador.newContext({
      viewport: { width: ancho, height: 900 },
      deviceScaleFactor: 2,
    });
    const pagina = await ctx.newPage();
    await pagina.goto(pathToFileURL(ruta).href);
    await pagina.evaluate(() => document.fonts.ready);
    const estados = await pagina.evaluate(() =>
      [...document.querySelectorAll(".mq-bar [data-estado]")].map((b) =>
        b.getAttribute("data-estado"),
      ),
    );
    for (const estado of estados.length ? estados : [""])
      for (const tema of temas)
        for (const idioma of idiomas) {
          await pagina.evaluate(
            ([e, t, i]) => {
              const h = document.documentElement;
              if (e) h.dataset.estado = e;
              h.dataset.theme = t;
              h.dataset.lang = i;
              // La maqueta expone su aplicador (assets/maqueta.js).
              window.mqAplicar?.();
            },
            [estado, tema, idioma],
          );
          const clave = `${nombre}__${estado || "unico"}__${tema}__${idioma}__${ancho}`;
          await medir(pagina, clave);
          if (salida && !bandera("solo-medir"))
            await pagina.screenshot({
              path: join(salida, `${clave}.png`),
              fullPage: true,
            });
          n++;
          if (bandera("simular") && idioma === idiomas[0] && salida) {
            const cdp = await ctx.newCDPSession(pagina);
            for (const tipo of SIMULACIONES) {
              await cdp.send("Emulation.setEmulatedVisionDeficiency", {
                type: tipo,
              });
              await pagina.screenshot({
                path: join(salida, `${clave}__${tipo}.png`),
                fullPage: true,
              });
              n++;
            }
            await cdp.send("Emulation.setEmulatedVisionDeficiency", {
              type: "none",
            });
          }
        }
    await ctx.close();
  }
}
await navegador.close();
console.log(
  `capturar-maqueta: ${n} capturas/medidas${salida ? ` en ${salida}` : ""}`,
);
if (fallas.length) {
  console.error(`\n${fallas.length} fallas de medida:\n` + fallas.join("\n"));
  process.exit(2);
}
console.log("capturar-maqueta: 0 fallas de medida");
