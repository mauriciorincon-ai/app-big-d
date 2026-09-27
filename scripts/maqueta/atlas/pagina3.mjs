// Arma docs/diseno/atlas-nivel-1.html (ronda 3): dirección B, tres tipografías para elegir.
import { BANDA, MODO, TIPO } from "../nucleo/datos.mjs";
import { MODO_MARCA, TIPO_GLIFO } from "../nucleo/glifos.mjs";
import { lectura } from "../nucleo/lectura.mjs";
import { svg, avisos } from "./dir3.mjs";
import { sal } from "../rutas.mjs";
import { escribir } from "../pulir.mjs";

const SAL = sal("atlas-nivel-1.html");
const LIENZOS = [["transversal", "chip"], ["transversal", "lineas"], ["capa", "chip"]];
const D = Object.fromEntries(LIENZOS.map(([v, p]) => [`${v}-${p}`, svg("space-grotesk", v, p)]));
const colsT = D["transversal-chip"].cols, colsC = D["capa-chip"].cols;
const ES = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;
const indice = colsC.map((c) => { const t = colsT.find((x) => x.id === c.id); const ni = (colsT.findIndex((x) => x.id === c.id) + 1) || 0; const nc = colsC.findIndex((x) => x.id === c.id) + 1; return `<li${t ? "" : ' data-si="p9:capa"'}><button type="button" data-col="${c.id}" data-x-t="${t ? t.x : 0}" data-x-c="${c.x}"><span class="n"><span data-si="p9:transversal">${String(ni).padStart(2, "0")}</span><span data-si="p9:capa">${String(nc).padStart(2, "0")}</span></span>${ES(BANDA[c.id].es[0], BANDA[c.id].en[0])}</button></li>`; }).join("\n        ");
const glifo = (tp) => { const g = TIPO_GLIFO[tp.g]; return `<svg class="lg-${tp.t}" viewBox="-9 -9 18 18" width="18" height="18" aria-hidden="true">${g.relleno ? `<path d="${g.d}" fill="currentColor"/>` : `<path d="${g.d}" fill="none" stroke="currentColor" stroke-width="${g.trazo}"/>`}</svg>`; };
const tipos = Object.values(TIPO).map((tp) => `<li>${glifo(tp)}<span class="cod">${ES(tp.es[0], tp.en[0])}</span><span>${ES(tp.es[1], tp.en[1])}</span></li>`).join("\n          ");
const DASH = { "por-lotes": `stroke-dasharray="8 5"`, continuo: "", "a-demanda": `stroke-dasharray="0.1 5.5" stroke-linecap="round" stroke-width="2.8"`, "sin-copia": "" };
const modos = Object.keys(MODO).map((m) => { const mk = MODO_MARCA[m]; const marca = mk.relleno === "mixto" ? `<path d="${mk.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2" transform="translate(52,7)"/>` : `<path d="${mk.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(52,7)"/>`; const linea = m === "sin-copia" ? `<path d="M2,7 H38" stroke="currentColor" stroke-width="6.5"/><path d="M2,7 H38" stroke="var(--fondo)" stroke-width="2.5"/>` : `<path d="M2,7 H38" stroke="currentColor"${DASH[m].includes("stroke-width") ? "" : ' stroke-width="2"'} ${DASH[m]}/>`; return `<li><svg viewBox="0 0 62 14" width="62" height="14" aria-hidden="true" fill="none">${linea}${marca}</svg><span>${ES(MODO[m].es[0], MODO[m].en[0])} — ${ES(MODO[m].es[1], MODO[m].en[1])}</span></li>`; }).join("\n          ");
const svgs = LIENZOS.map(([v, p]) => `<div class="lienzo-dir" data-si="p9:${v} p4:${p}">${D[`${v}-${p}`].svg}</div>`).join("\n      ");
const botones = `<button type="button" data-estado="propuesta" data-fija="vig:vigente p9:transversal p4:chip">propuesta</button>
    <button type="button" data-estado="por-revisar" data-fija="vig:revisar p9:transversal p4:chip">por revisar</button>
    <button type="button" data-estado="vencido" data-fija="vig:vencido p9:transversal p4:chip">vencido</button>
    <button type="button" data-estado="p4-lineas" data-fija="vig:vigente p9:transversal p4:lineas">P4: una línea por modo</button>
    <button type="button" data-estado="p9-capa" data-fija="vig:vigente p9:capa p4:chip">P9: orquestación como capa</button>`;
const nota = (f, txt) => `<p data-para="${f}"${f === "propuesta" ? "" : " hidden"}>${txt}</p>`;
const html = `<!doctype html>
<html lang="es" data-theme="oscuro" data-lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title data-es="Big-D · Atlas · Visión general" data-en="Big-D · Atlas · Overview">Big-D · Atlas · Visión general</title>
<link rel="stylesheet" href="assets/fuentes.css">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/bigd.css">
<link rel="stylesheet" href="assets/diagrama.css">
<link rel="stylesheet" href="assets/maqueta.css">
<script src="assets/maqueta.js" defer></script>
<script src="assets/lienzo.js" defer></script>
</head>
<body>

<div class="mq-bar" role="region" aria-label="Sala de diseño">
  <span class="mq-t">Sala de diseño · 01 Atlas, nivel 1 · ronda 4</span>
  <a href="index.html">recorrido</a>
  <div class="mq-g" role="group" aria-label="Estado de la maqueta">
    <span>estado:</span>
    ${botones}
  </div>
</div>
<div class="mq-nota" aria-live="polite">
  ${nota("propuesta", "<b>La propuesta.</b> Dirección B, Space Grotesk, orquestación como franja transversal, conexiones con etiqueta de modos, todo vigente. Toca un bloque: abajo aparece su frase.")}
  ${nota("por-revisar", "<b>Por revisar.</b> Dos bloques pasan de 30 días desde su verificación: llevan una insignia con «!» y los días, y la línea de estado lo resume. Lo vigente no se marca: se marca la excepción.")}
  ${nota("vencido", "<b>Vencido.</b> Agentes pasa de 60 días: su insignia se invierte (fondo lleno, aspa). Almacén central queda por revisar. Sin color: símbolo, peso y días.")}
  ${nota("p4-lineas", "<b>Alternativa de P4.</b> Una línea por modo en vez de una línea con etiqueta. Mira las dos primeras conexiones y compáralas con la propuesta.")}
  ${nota("p9-capa", "<b>Alternativa de P9.</b> Orquestación como capa 5: son siete columnas (el mapa ya no cabe en 1280 px y se desliza) y la fila principal gana un bloque punteado por donde ningún dato pasa.")}
</div>

<header class="barra">
  <a class="marca" href="index.html"><svg class="marca-signo" viewBox="0 0 22 22" aria-hidden="true"><rect x="1" y="1" width="20" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 7 H16 M6 11 H13 M6 15 H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Big-D <span class="marca-sello">ATLAS</span></a>
  <ul class="nav" aria-label="Secciones">
    <li><a href="atlas-nivel-1.html" aria-current="page">Atlas</a></li>
    <li><a href="investigador.html">${ES("Conocimiento", "Knowledge")}</a></li>
    <li><a href="perfil.html">${ES("Caso", "Case")}</a></li>
    <li><a href="instrumento.html">${ES("Instrumento", "Instrument")}</a></li>
  </ul>
  <div class="ajustes">
    <div class="alterna" role="group" aria-label="Idioma / Language"><button type="button" data-lang-set="es" lang="es-ES" aria-label="Español">ES</button><span class="sep">/</span><button type="button" data-lang-set="en" lang="en-US" aria-label="English">EN</button></div>
    <div class="alterna" role="group" aria-label="Tema"><button type="button" data-theme-set="oscuro">${ES("Oscuro", "Dark")}</button><span class="sep">/</span><button type="button" data-theme-set="claro">${ES("Claro", "Light")}</button></div>
  </div>
</header>

<main class="pagina" id="contenido">
  <div class="encabezado">
    <div>
      <span class="ojo">${ES("Atlas · nivel 1 · visión general", "Atlas · level 1 · overview")}</span>
      <h1>${ES("Plataforma Ejemplo (ficticia)", "Example Platform (fictional)")}</h1>
      <p class="sub">${ES("Para líderes. Cada plataforma se explica con el mismo mapa: seis capas y tres franjas.", "For leaders. Every platform is explained with the same map: six layers and three bands.")}</p>
      <p class="meta"><b data-si="vig:vigente"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-3.2,0.3 L-1,2.6 L3.4,-2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${ES("vigente", "current")}</b><b data-si="vig:revisar"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0,-4 V1 M0,3.4 V3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>${ES("2 bloques por revisar", "2 blocks to review")}</b><b data-si="vig:vencido"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="currentColor"/><path d="M-2.8,-2.8 L2.8,2.8 M2.8,-2.8 L-2.8,2.8" fill="none" stroke="var(--fondo)" stroke-width="1.8" stroke-linecap="round"/></svg>${ES("1 vencido · 1 por revisar", "1 expired · 1 to review")}</b><span class="punto">·</span><span data-si="vig:vigente">${ES("verificado hace 6 días", "verified 6 days ago")}</span><span data-si="vig:revisar|vencido">${ES("lo más viejo, hace 34 días", "oldest check 34 days ago")}</span><span class="punto">·</span><span>${ES("consultado 2026-09-26", "checked 2026-09-26")}</span><span class="punto">·</span><span>${ES("mapa v0.1.0", "map v0.1.0")}</span></p>
    </div>
    <button type="button" class="enlace-boton">${ES("Cambiar de plataforma", "Switch platform")}<svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true"><path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </div>

  <ul class="niveles" aria-label="Nivel de lectura">
    <li><a href="atlas-nivel-1.html" aria-current="page"><span class="n">01</span>${ES("Visión general", "Overview")}</a></li>
    <li><span class="pend"><span class="n">02</span>${ES("Componentes", "Components")}</span></li>
    <li><span class="pend"><span class="n">03</span>${ES("Recorrido de un dato", "A datum's journey")}</span></li>
    <li><span class="pend"><span class="n">04</span>${ES("Lado a lado", "Side by side")}</span></li>
  </ul>
  <p class="guia">${ES("<b>Se lee de izquierda a derecha:</b> es el camino que recorre un dato. Cada capa responde una pregunta; las franjas de abajo abarcan todas las capas. Toca un bloque para leer su frase.", "<b>Read it from left to right:</b> it is the road a piece of data travels. Each layer answers one question; the bands below span every layer. Tap a block to read its line.")}</p>

  <section class="mapa" aria-label="Mapa">
    <ul class="indice" aria-label="Ir a una capa">
        ${indice}
    </ul>
    <p class="pista"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><path d="M-6,0 H5 M1.5,-3.8 L5.5,0 L1.5,3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${ES("Desliza de lado para ver las seis capas.", "Swipe sideways to see all six layers.")}</p>
    <div class="lienzo-marco">
      <div class="lienzo" tabindex="0" role="region" data-aria-es="Diagrama; se desplaza de lado" data-aria-en="Diagram; scrolls sideways">
      ${svgs}
      </div>
    </div>
    <div class="ficha" id="ficha-breve" hidden><div class="ficha-breve-cuerpo"></div></div>
  </section>

  <section class="leyenda" aria-labelledby="lg-t">
    <div>
      <h2 id="lg-t">${ES("Tipos de componente", "Component types")}</h2>
      <ul class="lg-lista dos">
          ${tipos}
      </ul>
    </div>
    <div>
      <h2>${ES("Cómo viaja el dato", "How the data travels")}</h2>
      <ul class="lg-lista lg-modos">
          ${modos}
      </ul>
      <p class="lg-nota">${ES("Varios modos en una conexión: línea gruesa y una etiqueta que dice cuáles, en orden. El color acompaña a la forma; nunca va solo.", "Several modes on one connection: a thick line and a label that says which, in order. Colour goes with shape; never alone.")}</p>
    </div>
  </section>

  <details class="lectura-seccion">
    <summary>${ES("Lectura en texto: lo mismo que dice el mapa, en una lista", "Reading in text: what the map says, as a list")}</summary>
    ${lectura("transversal")}
    ${lectura("capa")}
  </details>
</main>

<footer class="pie">
  <p>${ES("Big-D planea, gestiona y controla; jamás opera una plataforma. Todo lo que ves aquí es ficticio. Declaración del autor: conoce Microsoft Fabric más a fondo que las demás plataformas.", "Big-D plans, manages and controls; it never operates a platform. Everything you see here is fictional. Author's statement: the author knows Microsoft Fabric more deeply than the other platforms.")}</p>
</footer>
</body>
</html>
`;
escribir("atlas-nivel-1.html", html);
console.log(SAL, (html.length / 1024).toFixed(1), "KB", avisos.length ? avisos.join("\n") : "sin avisos");
