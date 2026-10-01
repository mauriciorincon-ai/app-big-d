// Arnés de CAPTURAS del PRODUCTO (pasada de capturas del builder, regla 22 y /deploy-check § 3).
//
// Sirve el export estático de ESTE repo (out/) con su propio servidor en un puerto libre, comprueba que el
// servidor entrega exactamente los bytes de out/ (regla 17-bis b: jamás fotografía otro árbol), y recorre
// cada página del producto en tema × ancho. En cada encuadre MIDE:
//   - desplazamiento horizontal de la página (scrollWidth ≤ clientWidth);
//   - la fuente cargada (la primera familia del cuerpo, en estado «loaded»);
//   - cada <text> del SVG del diagrama dentro de su viewBox y sin pisar la caja de otro dueño;
//   - el ÁREA DE DESPLAZAMIENTO del lienzo: si el diagrama no cabe, el lienzo se desliza y su final alcanza
//     el borde derecho del SVG; si cabe, no sobra nada;
// y hace la PASADA DE INTERACCIÓN: activa cada control de la página (tema, idioma, índice de capas, bloques
// con clic y con Enter, lectura plegada, saltos, enlaces) y exige que ALGO cambie en el DOM. Un control que
// la pasada no sabe activar es una falla: todo control dibujado tiene su prueba (regla 22).
//
// Con --maqueta, además fotografía docs/diseno/<pantalla>.html en los mismos encuadres y compone cada par
// lado a lado (producto | maqueta) para el gate de FIDELIDAD. Las capturas van a --salida, fuera del repo.
//
// Uso: node scripts/capturar-producto.mjs --salida <dir> [--rutas /es/atlas/x,/en] [--anchos 380,1280]
//      [--temas oscuro,claro] [--maqueta] [--solo-medir]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arbol = join(raiz, "out");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const bandera = (n) => process.argv.includes(`--${n}`);

const salida = arg("salida");
if (!salida && !bandera("solo-medir")) {
  console.error("capturar-producto: falta --salida <dir> (temporal, fuera del repo)");
  process.exit(1);
}
if (salida && resolve(salida).startsWith(raiz + "/")) {
  console.error("capturar-producto: --salida dentro del repo; las capturas no se versionan. Aborto.");
  process.exit(1);
}
if (!existsSync(join(arbol, "es.html"))) {
  console.error(`capturar-producto: no hay export en ${arbol}; corre antes BIGD_FECHA_CONSULTA=… pnpm build. Aborto.`);
  process.exit(1);
}

/** Rutas del producto = los HTML del export, sin la maqueta ni los 404. */
function rutasDelExport(dir, base = "") {
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (!["_next", "diseno", "_not-found"].includes(f)) out.push(...rutasDelExport(p, `${base}/${f}`));
    } else if (f.endsWith(".html") && !["404.html", "_not-found.html", "index.html"].includes(f)) out.push(`${base}/${f.replace(/\.html$/, "")}`);
  }
  return out;
}
const rutas = (arg("rutas") ?? rutasDelExport(arbol).join(",")).split(",").filter(Boolean);
/** Cuántas plataformas hay en data/: el campo «Plataforma» debe listarlas todas (N por diseño). */
const N_PLATAFORMAS = readdirSync(join(raiz, "data", "plataformas")).filter((f) => f.endsWith(".yaml")).length;
const anchos = arg("anchos", "380,1280").split(",").map(Number);
const temas = arg("temas", "oscuro,claro").split(",");
/** Pantalla de la maqueta que obedece cada ruta (fidelidad). */
const MAQUETA = [
  [/^\/(es|en)\/atlas\/[^/]+$/, "atlas-nivel-1"],
  [/^\/(es|en)\/atlas\/[^/]+\/componentes$/, "atlas-nivel-2"],
  [/^\/(es|en)\/atlas\/[^/]+\/recorrido$/, "atlas-recorrido"],
];

// Puerto libre y servidor propio: jamás se reusa un servidor que ya estuviera escuchando.
const puerto = await new Promise((ok) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => ok(p));
  });
});
const servidor = spawn(join(raiz, "node_modules/.bin/serve"), [arbol, "-l", `tcp://127.0.0.1:${puerto}`, "--config", "../serve.json", "--no-clipboard"], { stdio: "ignore" });
// Pase lo que pase (una excepción, un Ctrl-C), el servidor y el navegador no quedan vivos (B-22 de la
// auditoría del S1: al fallar, `serve` y Chromium seguían corriendo).
let navegador;
function apagar() {
  try {
    servidor.kill();
  } catch {
    /* ya terminó */
  }
  navegador?.close().catch(() => {});
}
process.on("exit", apagar);
for (const senal of ["SIGINT", "SIGTERM"])
  process.on(senal, () => {
    apagar();
    process.exit(130);
  });
process.on("uncaughtException", (e) => {
  console.error(`capturar-producto: ${e?.stack ?? e}`);
  apagar();
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  console.error(`capturar-producto: ${e?.stack ?? e}`);
  apagar();
  process.exit(1);
});
const base = `http://127.0.0.1:${puerto}`;
async function esperar() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/es`)).ok) return;
    } catch {
      /* todavía no escucha */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("el servidor no respondió");
}
await esperar();
const servida = await (await fetch(`${base}/es`)).text();
if (servida !== readFileSync(join(arbol, "es.html"), "utf8")) {
  servidor.kill();
  console.error(`capturar-producto: ${base}/es no entrega los bytes de ${relative(raiz, arbol)}/es.html. Aborto.`);
  process.exit(1);
}
console.log(`capturar-producto: árbol ${arbol} servido en ${base} (verificado byte a byte)`);
console.log(`  rutas ${rutas.join(" ")}`);
if (salida) mkdirSync(salida, { recursive: true });

navegador = await chromium.launch();
const fallas = [];
let encuadres = 0;
let interacciones = 0;

async function medir(pagina, clave) {
  const r = await pagina.evaluate(() => {
    const el = document.documentElement;
    const out = { desborde: el.scrollWidth - el.clientWidth, fuente: true, fuera: [], pisadas: [], lienzo: null };
    const familia = getComputedStyle(document.body).fontFamily.split(",")[0].replace(/"/g, "").trim();
    out.fuente = [...document.fonts].some((f) => f.family.replace(/"/g, "") === familia && f.status === "loaded");
    for (const svg of document.querySelectorAll("svg.dg-svg[viewBox]")) {
      if (!svg.getClientRects().length || !svg.closest(".lienzo")) continue;
      const vb = svg.viewBox.baseVal;
      const cajas = [...svg.querySelectorAll("[data-caja]")].map((c) => ({ dueno: c.closest("[data-dueno]")?.getAttribute("data-dueno"), b: c.getBBox() }));
      for (const t of svg.querySelectorAll("text")) {
        const b = t.getBBox();
        const txt = (t.textContent ?? "").trim().slice(0, 40);
        if (b.x < vb.x - 0.5 || b.y < vb.y - 0.5 || b.x + b.width > vb.x + vb.width + 0.5 || b.y + b.height > vb.y + vb.height + 0.5) out.fuera.push(`«${txt}»`);
        const dueno = t.closest("[data-dueno]")?.getAttribute("data-dueno");
        for (const c of cajas) {
          if (c.dueno === dueno) continue;
          if (b.x < c.b.x + c.b.width && b.x + b.width > c.b.x && b.y < c.b.y + c.b.height && b.y + b.height > c.b.y) out.pisadas.push(`«${txt}» (${dueno ?? "sin dueño"}) pisa ${c.dueno}`);
        }
      }
      const lz = svg.closest(".lienzo");
      const estilo = getComputedStyle(lz);
      out.lienzo = { svg: svg.getBoundingClientRect().width, cliente: lz.clientWidth, area: lz.scrollWidth - lz.clientWidth, desliza: estilo.overflowX === "auto" || estilo.overflowX === "scroll", padding: parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight) };
    }
    return out;
  });
  if (r.desborde > 0) fallas.push(`${clave}: la página se desplaza de lado ${r.desborde}px`);
  if (!r.fuente) fallas.push(`${clave}: la fuente no cargó`);
  for (const f of r.fuera) fallas.push(`${clave}: texto fuera del lienzo ${f}`);
  for (const f of r.pisadas) fallas.push(`${clave}: ${f}`);
  if (r.lienzo) {
    const l = r.lienzo;
    const debe = Math.max(0, Math.round(l.svg + l.padding - l.cliente));
    if (!l.desliza) fallas.push(`${clave}: el lienzo no se desliza de lado`);
    if (Math.abs(l.area - debe) > 1) fallas.push(`${clave}: área de desplazamiento ${l.area}px, esperada ${debe}px (SVG ${l.svg}px en ${l.cliente}px)`);
    // El final del área de desplazamiento muestra el borde derecho del SVG.
    const fin = await pagina.evaluate(() => {
      const lz = document.querySelector(".lienzo");
      const antes = lz.scrollLeft;
      lz.style.scrollBehavior = "auto";
      lz.scrollLeft = lz.scrollWidth;
      const svg = lz.querySelector("svg").getBoundingClientRect();
      const caja = lz.getBoundingClientRect();
      lz.scrollLeft = antes;
      lz.style.scrollBehavior = "";
      return { derecha: svg.right, visible: caja.right };
    });
    if (fin.derecha > fin.visible + 1) fallas.push(`${clave}: al final del desplazamiento el SVG sigue cortado (${Math.round(fin.derecha - fin.visible)}px)`);
    return l;
  }
  return null;
}

/**
 * Pasada de interacción: cada control de la página se activa y algo tiene que cambiar. Devuelve los
 * controles que no supo activar (se reportan como falla).
 */
async function interactuar(pagina, ruta, tema, ancho, clave) {
  const cambio = (condicion, mensaje) => {
    interacciones++;
    if (!condicion) fallas.push(`${clave}: ${mensaje}`);
  };
  const cubiertos = new Set();
  const marcar = async (loc) => {
    for (const h of await loc.elementHandles()) cubiertos.add(await h.evaluate((e) => e.dataset.pasada ?? (e.dataset.pasada = String(Math.random()))));
  };

  // Tema: los dos botones cambian data-theme y el fondo.
  for (const destino of ["claro", "oscuro"]) {
    const b = pagina.locator(`[data-theme-set="${destino}"]`);
    await marcar(b);
    const fondoAntes = await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await b.click();
    const ahora = await pagina.evaluate(() => ({ t: document.documentElement.getAttribute("data-theme"), f: getComputedStyle(document.body).backgroundColor }));
    cambio(ahora.t === destino, `el botón de tema «${destino}» no puso data-theme`);
    if (destino === "claro") cambio(ahora.f !== fondoAntes || tema === "claro", "el tema claro no cambió el fondo");
  }
  await pagina.locator(`[data-theme-set="${tema}"]`).click();

  // Campo «Plataforma»: lista las N plataformas; las que no tienen mapa dicen «— …» y no se eligen; elegir
  // otra lleva a su atlas.
  const campo = pagina.locator(".campo-plataforma select");
  if (await campo.count()) {
    await marcar(campo);
    const ops = await campo.evaluate((sel) => [...sel.options].map((o) => ({ v: o.value, d: o.disabled, t: o.text, s: o.selected })));
    cambio(ops.filter((o) => o.v).length === N_PLATAFORMAS, `el campo «Plataforma» lista ${ops.filter((o) => o.v).length} de ${N_PLATAFORMAS} plataformas`);
    cambio(ops.filter((o) => o.v && o.d).every((o) => o.t.includes(" — ")), "una plataforma sin mapa no dice que viene pronto");
    const otra = ops.find((o) => o.v && !o.d && !o.s);
    if (otra) {
      // En otra pestaña: navegar aquí borraría las marcas de lo ya probado.
      const aparte = await pagina.context().newPage();
      await aparte.goto(pagina.url());
      await aparte.locator(".campo-plataforma select").selectOption(otra.v);
      // Lleva a la página de esa plataforma en la misma sección (atlas o investigador).
      const seccion = new URL(pagina.url()).pathname.split("/")[2] ?? "atlas"; // desde la portada, el atlas
      const destino = (u) => new URL(u).pathname.split("/").slice(2, 4).join("/") === `${seccion}/${otra.v}`;
      await aparte.waitForURL((u) => destino(u.href), { timeout: 3000 }).catch(() => {});
      cambio(destino(aparte.url()), `elegir «${otra.t}» no llevó a su página de ${seccion}`);
      await aparte.close();
    }
  }

  // Índice de capas: solo aparece si el lienzo desborda; cada botón lleva el lienzo a su capa.
  const indice = pagina.locator(".indice [data-col]");
  await marcar(indice);
  if (await pagina.locator(".mapa[data-desborda]").count()) {
    const n = await indice.count();
    cambio(n > 0 && (await indice.first().isVisible()), "el lienzo desborda y el índice de capas no se ve");
    for (let i = n - 1; i >= 0; i--) {
      const b = indice.nth(i);
      const x = Number(await b.getAttribute("data-x"));
      await b.click();
      // El desplazamiento es suave: se espera a que el lienzo quede quieto antes de medir.
      const r = await pagina.evaluate(async () => {
        const lz = document.querySelector(".lienzo");
        const cuadro = () => new Promise((ok) => requestAnimationFrame(ok));
        let antes = -1;
        for (let quieto = 0; quieto < 6; ) {
          await cuadro();
          quieto = lz.scrollLeft === antes ? quieto + 1 : 0;
          antes = lz.scrollLeft;
        }
        return { izq: lz.scrollLeft, max: lz.scrollWidth - lz.clientWidth };
      });
      const esperado = Math.min(r.max, Math.max(0, x - 8));
      cambio(Math.abs(r.izq - esperado) <= 2, `índice «${await b.textContent()}»: el lienzo quedó en ${r.izq}px, esperado ${esperado}px`);
      cambio((await b.getAttribute("aria-current")) === "true", `índice «${await b.textContent()}»: la capa no quedó marcada`);
    }
    await pagina.evaluate(() => {
      const lz = document.querySelector(".lienzo");
      lz.style.scrollBehavior = "auto";
      lz.scrollLeft = 0;
      lz.style.scrollBehavior = "";
    });
  } else cambio((await indice.first().isVisible().catch(() => false)) === false, "el lienzo cabe y el índice se ve igual");

  // Niveles 2 y 3: cada componente abre el panel con su ficha; nivel 1: cada bloque (o grupo sin bloque) abre
  // su ventana. El foco va al título; Esc cierra y devuelve el foco al elemento; «Cerrar» también cierra.
  const activables = (await pagina.locator(".lienzo .dg-nodo").count()) ? ".lienzo .dg-nodo" : ".lienzo .dg-elem";
  if (await pagina.locator("#panel-ficha").count()) {
    const nodos = pagina.locator(activables);
    await marcar(nodos);
    const panel = pagina.locator("#panel-ficha");
    const n = await nodos.count();
    for (let i = 0; i < n; i++) {
      const nodo = nodos.nth(i);
      const nombre = (await nodo.getAttribute("aria-label")).split(/[.:] /)[0];
      await nodo.evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      await panel.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
      const titulo = (await panel.isVisible()) ? await panel.locator("h2").textContent() : "";
      cambio(titulo === nombre, `«${nombre}» no abrió su panel (título: «${titulo}»)`);
      if (activables.endsWith(".dg-elem"))
        cambio((await panel.locator('svg[data-vista="bloque"] .dg-nodo').count()) > 0 && (await panel.locator(".dg-tarjeta").count()) > 0, `la ventana de «${nombre}» no trae sus componentes dibujados y sus tarjetas`);
      cambio(await pagina.evaluate(() => document.activeElement?.tagName === "H2"), `al abrir «${nombre}» el foco no fue al título`);
      await pagina.keyboard.press("Escape");
      cambio(await panel.isHidden(), `Esc no cerró la ficha de «${nombre}»`);
    }
    if (n) {
      const primero = nodos.first();
      await primero.focus();
      await pagina.keyboard.press("Enter");
      cambio(await panel.isVisible(), "Enter sobre un elemento del lienzo no abrió su panel");
      const cerrar = panel.locator(".cerrar");
      await marcar(cerrar);
      await cerrar.click();
      cambio(await panel.isHidden(), "«Cerrar» no cerró la ficha");
      cambio(await primero.evaluate((e) => e === document.activeElement), "al cerrar, el foco no volvió al elemento del lienzo");
    }
  }

  // Recorrido: cada control cambia `data-paso` (o la reproducción) y las flechas también.
  if (await pagina.locator("#rec").count()) {
    const rec = pagina.locator("#rec");
    const boton = (a) => pagina.locator(`[data-rec="${a}"]`);
    await marcar(pagina.locator("[data-rec]"));
    const paso = () => rec.getAttribute("data-paso");
    const pos = () => pagina.locator(".rec-pos").textContent();
    // Las fichas de arriba también movieron el paso (tocar un componente lleva a su paso): se parte de todos.
    await boton("todos").click();
    cambio((await boton("anterior").isDisabled()) && (await paso()) === "todos", "en «todos los pasos», «Anterior» no está deshabilitado");
    const posTodos = await pos();
    await boton("siguiente").click();
    cambio((await paso()) !== "todos" && (await pos()) !== posTodos, "«Siguiente» no avanzó el recorrido");
    const primero = await paso();
    await boton("siguiente").click();
    await boton("anterior").click();
    cambio((await paso()) === primero, "«Anterior» no retrocedió");
    await boton("todos").click();
    cambio((await paso()) === "todos", "«Ver todos» no volvió a todos los pasos");
    await pagina.locator("h1").click();
    await pagina.keyboard.press("ArrowRight");
    cambio((await paso()) === primero, "la flecha derecha no avanzó el recorrido");
    await boton("todos").click();
    await boton("reproducir").click();
    cambio((await boton("reproducir").getAttribute("aria-pressed")) === "true", "«Reproducir» no arrancó");
    await pagina.waitForTimeout(2300);
    const avanzado = await paso();
    cambio(avanzado !== "todos" && avanzado !== primero, `la reproducción no avanzó sola (quedó en ${avanzado})`);
    await boton("reproducir").click();
    cambio((await boton("reproducir").getAttribute("aria-pressed")) === "false", "«Pausar» no detuvo la reproducción");
  }

  // Investigador: cada par Aprobar/Rechazar marca su decisión; PRIMERO, porque el comando de aprobación (con su
  // propio «Copiar») solo aparece cuando todo está decidido (lo vio la pasada de la auditoría del S1 con una
  // propuesta pendiente). Después, «Copiar» deja en el portapapeles exactamente el comando y lo confirma.
  const decidir = pagina.locator(".decidir button");
  await marcar(decidir);
  for (let i = 0; i < (await decidir.count()); i++) {
    await decidir.nth(i).click();
    cambio((await decidir.nth(i).getAttribute("aria-pressed")) === "true", "un botón Aprobar/Rechazar no marcó su decisión");
  }
  const copiar = pagina.locator(".comando button");
  await marcar(copiar);
  const nCopiar = await copiar.count();
  for (let i = 0; i < nCopiar; i++) {
    const b = copiar.nth(i);
    const texto = await b.locator("xpath=..").locator("code").textContent();
    const antes = await b.textContent();
    await b.click();
    await pagina.waitForTimeout(80);
    cambio((await b.textContent()) !== antes, `«${antes}» no confirmó la copia de «${texto}»`);
    cambio((await pagina.evaluate(() => navigator.clipboard.readText())) === texto, `«Copiar» no dejó «${texto}» en el portapapeles`);
  }

  const lienzoFoco = pagina.locator(".lienzo[tabindex]");
  if (await lienzoFoco.count()) {
    await marcar(lienzoFoco);
    await lienzoFoco.focus();
    cambio(await lienzoFoco.evaluate((e) => e === document.activeElement), "el lienzo no recibe el foco");
  }

  // Saltos: «Saltar el diagrama» lleva a la lectura; «Saltar al contenido» al main.
  for (const [sel, destino] of [
    [".saltar-diagrama", "#lectura"],
    [".saltar", "#contenido"],
  ]) {
    const a = pagina.locator(sel);
    if (!(await a.count())) continue;
    await marcar(a);
    await a.focus();
    await pagina.keyboard.press("Enter");
    cambio(pagina.url().endsWith(destino), `${sel} no llevó a ${destino}`);
  }

  // Lectura plegada: el resumen la abre.
  const resumen = pagina.locator("details.lectura-seccion > summary");
  if (await resumen.count()) {
    await marcar(resumen);
    const abierta = async () => pagina.locator("details.lectura-seccion").evaluate((d) => d.open);
    const antes = await abierta();
    await resumen.click();
    cambio((await abierta()) !== antes, "el resumen de la lectura no la abrió");
  }

  // Al final de los clics (la hoja modal tapa el resto en teléfono): una ficha abierta para la captura de
  // estado; sus enlaces a fuentes entran en la pasada de enlaces que sigue.
  if ((await pagina.locator("#panel-ficha").count()) && (await pagina.locator(activables).count()) > 1)
    await pagina.locator(activables).nth(1).evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));

  // Enlaces: cada uno lleva a una ruta que existe (el de idioma, además, cambia lang).
  const enlaces = pagina.locator("header a[href], main a[href]:not(.saltar-diagrama), #panel-ficha a[href]");
  await marcar(enlaces);
  const hrefs = await enlaces.evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), lang: a.getAttribute("hreflang") })));
  for (const { href, lang } of hrefs) {
    // Una fuente de una ficha apunta fuera del sitio: el arnés jamás sale a la red; basta con que sea https.
    if (/^https?:/.test(href) && !href.startsWith(base)) {
      cambio(href.startsWith("https://"), `el enlace externo ${href} no es https`);
      continue;
    }
    const r = await fetch(new URL(href, base));
    cambio(r.ok, `el enlace ${href} no existe (${r.status})`);
    if (lang) {
      const html = await r.text();
      cambio(html.includes(`<html lang="${lang}"`), `el enlace de idioma ${href} no lleva a una página en «${lang}»`);
    }
  }

  // Todo control de la página tiene que haber pasado por la pasada.
  const sin = await pagina.evaluate(() =>
    [...document.querySelectorAll('button, a[href], summary, [tabindex="0"], input, select, textarea')]
      .filter((e) => !e.dataset.pasada && e.getClientRects().length)
      .map((e) => e.outerHTML.slice(0, 90)),
  );
  for (const s of sin) fallas.push(`${clave}: control sin pasada de interacción: ${s}`);
}

async function capturarMaqueta(pantalla, tema, idioma, ancho, archivo) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(join(raiz, "docs/diseno", `${pantalla}.html`)).href);
  await p.evaluate(
    ([t, i]) => {
      const h = document.documentElement;
      h.dataset.theme = t;
      h.dataset.lang = i;
      window.mqAplicar?.();
    },
    [tema, idioma],
  );
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: archivo, fullPage: true });
  await ctx.close();
}

async function componer(izq, der, archivo, titulo) {
  const ctx = await navegador.newContext({ viewport: { width: 1600, height: 900 } });
  const p = await ctx.newPage();
  const uri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
  await p.setContent(
    `<body style="margin:0;background:#777;font:14px sans-serif"><div style="padding:6px 10px;color:#fff">${titulo}</div><div style="display:flex;gap:12px;align-items:flex-start;padding:0 10px 10px"><figure style="margin:0;flex:1"><figcaption style="color:#fff">producto</figcaption><img style="width:100%" src="${uri(izq)}"></figure><figure style="margin:0;flex:1"><figcaption style="color:#fff">maqueta</figcaption><img style="width:100%" src="${uri(der)}"></figure></div></body>`,
  );
  await p.screenshot({ path: archivo, fullPage: true });
  await ctx.close();
}

for (const ruta of rutas)
  for (const ancho of anchos)
    for (const tema of temas) {
      const ctx = await navegador.newContext({
        viewport: { width: ancho, height: 900 },
        deviceScaleFactor: 2,
        colorScheme: tema === "claro" ? "light" : "dark",
        // «Copiar» escribe en el portapapeles; la pasada lo lee para comprobar que copió el comando.
        permissions: ["clipboard-read", "clipboard-write"],
      });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("bigd-tema", t);
        } catch {
          /* sin almacenamiento */
        }
      }, tema);
      const pagina = await ctx.newPage();
      const errores = [];
      pagina.on("pageerror", (e) => errores.push(e.message));
      pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
      await pagina.goto(`${base}${ruta}`);
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.waitForTimeout(100);
      const nombre = ruta.replace(/^\//, "").replace(/\//g, "_");
      const clave = `${nombre}__${tema}__${ancho}`;
      await medir(pagina, clave);
      let foto;
      if (salida && !bandera("solo-medir")) {
        foto = join(salida, `${clave}.png`);
        await pagina.screenshot({ path: foto, fullPage: true });
      }
      encuadres++;
      await interactuar(pagina, ruta, tema, ancho, clave);
      // Estado con el panel abierto: la ventana de un bloque (nivel 1) o la ficha de un componente (2 y 3).
      if (salida && !bandera("solo-medir")) {
        if (await pagina.locator("#panel-ficha").isVisible()) await pagina.screenshot({ path: join(salida, `${clave}__ficha.png`) });
      }
      for (const e of errores) fallas.push(`${clave}: error en la consola: ${e}`);
      await ctx.close();
      const pantalla = MAQUETA.find(([re]) => re.test(ruta))?.[1];
      if (foto && bandera("maqueta") && pantalla) {
        const idioma = ruta.split("/")[1];
        const ref = join(salida, `maqueta__${pantalla}__${idioma}__${tema}__${ancho}.png`);
        await capturarMaqueta(pantalla, tema, idioma, ancho, ref);
        await componer(foto, ref, join(salida, `par__${clave}.png`), `${ruta} · ${tema} · ${ancho}px — producto | maqueta (${pantalla}.html)`);
      }
    }

await navegador.close();
servidor.kill();
console.log(`capturar-producto: ${encuadres} encuadres, ${interacciones} comprobaciones de interacción${salida ? ` en ${salida}` : ""}`);
if (fallas.length) {
  console.error(`\n${fallas.length} fallas:\n` + fallas.join("\n"));
  process.exit(2);
}
console.log("capturar-producto: 0 fallas");
