// Genera docs/BROCHURE.html desde docs/brochure-export.json y el molde docs/BROCHURE.plantilla.html (S8, devolución 026-1).
// El brochure y el export dicen LO MISMO porque el segundo sale del primero: ningún texto del brochure se escribe a mano aquí
// salvo los rótulos. El molde pone el estilo y el guion de las tarjetas; el export, el copy y las cifras.
// Uso: node scripts/brochure/generar.mjs [--comprobar]    (--comprobar no escribe: sale 1 si docs/BROCHURE.html está desactualizado)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";

const leer = (r) => readFileSync(join(RAIZ_REPO, r), "utf8");
const e = JSON.parse(leer("docs/brochure-export.json"));
const molde = leer("docs/BROCHURE.plantilla.html");

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Cifra con coma decimal y separador de miles, sin Intl (el repo no usa `Intl`/`toLocale*`). */
const cifra = (n) => {
  const [ent, dec] = String(n).split(".");
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (dec ? `,${dec}` : "");
};
const FUENTE = { medido: "medido", calculada: "calculada", declarado: "declarado", estimacion: "estimación" };

// El estilo y el script salen del molde tal cual (un solo lugar donde se arregla un defecto de estilo).
const estilo = molde.match(/<style>[\s\S]*?<\/style>/)[0];
const script = molde.match(/<script>[\s\S]*?<\/script>/)[0];

// Un icono geométrico por grupo, con aria-hidden: el nombre del grupo lo dice en palabras (el color nunca va solo).
const ICONOS = [
  '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="22" height="6" rx="1.5"/><rect x="3" y="12" width="14" height="6" rx="1.5"/><rect x="3" y="20" width="22" height="4" rx="1.5"/></svg>',
  '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V6M4 22h20"/><path d="M8 18l5-5 4 3 6-8"/></svg>',
  '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M17.5 17.5L24 24M9 12l2 2 4-4"/></svg>',
];

const grupos = [...e.funcionalidades.grupos].sort((a, b) => a.orden - b.orden);
const tarjetas = grupos
  .map((g, i) => {
    const feats = g.features
      .map((f) => `            <div class="feature">\n              <h4>${esc(f.nombre)}</h4>\n              <p class="como">${esc(f.que_hace)}</p>\n            </div>`)
      .join("\n");
    return `      <article class="tarjeta revela">
        <h3 class="tarjeta-cabeza">
          <button class="tarjeta-boton" aria-expanded="false" aria-controls="d${i + 1}">
            <span class="icono" aria-hidden="true">${ICONOS[i % ICONOS.length]}</span>
            <span class="tarjeta-titulos">
              <span class="titulo">${esc(g.nombre)}</span>
              <span class="linea">${esc(g.linea)}</span>
            </span>
            <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </h3>
        <div class="detalle" id="d${i + 1}" role="region" aria-label="${esc(g.nombre)} — detalle">
          <div class="detalle-interior"><div class="detalle-cuerpo">
${feats}
          </div></div>
        </div>
      </article>`;
  })
  .join("\n\n");

const metricas = e.metricas
  .map((m) => `        <li><strong>${esc(m.etiqueta)}:</strong> ${esc(cifra(m.valor))}${m.unidad ? ` ${esc(m.unidad)}` : ""} <span class="suave">· ${esc(FUENTE[m.fuente] ?? m.fuente)}</span></li>`)
  .join("\n");

const html = `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(e.app.nombre)} — Conócela</title>
<!-- GENERADO por scripts/brochure/generar.mjs desde docs/brochure-export.json y docs/BROCHURE.plantilla.html: no se edita a mano
     (tests/unit/brochure-html.test.ts lo comprueba). El copy se cambia en el export; el estilo, en el molde. -->
${estilo}
</head>
<body>
<div class="lienzo">

  <header class="portada">
    <p class="eyebrow">${esc(e.app.nombre)}</p>
    <h1>${esc(e.promesa.tagline)}</h1>
    <p class="promesa">${esc(e.promesa.intro)}</p>
    <p class="baja">Tócala capa por capa — cada tarjeta se abre solo si tú quieres
      <span class="flecha" aria-hidden="true">↓</span></p>
  </header>

  <section class="seccion" aria-labelledby="t-quehace">
    <h2 id="t-quehace" class="revela">Qué hace</h2>
    <p class="suave revela">${esc(e.promesa.para_quien)}</p>
    <div class="tarjetas">

${tarjetas}

    </div>
  </section>

  <section class="seccion" aria-labelledby="t-fino">
    <h2 id="t-fino" class="revela">Los detalles finos</h2>
    <details class="fino revela">
      <summary>Qué la hace distinta</summary>
      <div class="cuerpo chica">${esc(e.promesa.diferencial)}</div>
    </details>
    <details class="fino revela">
      <summary>Qué mide, y de dónde sale cada cifra</summary>
      <div class="cuerpo chica"><ul>
${metricas}
      </ul></div>
    </details>
    <details class="fino revela">
      <summary>Privacidad y dónde se ve</summary>
      <div class="cuerpo chica"><p>${esc(e.privacidad.detalle)}</p><p>${esc(e.enlaces.razon)}</p></div>
    </details>
  </section>

  <footer class="revela">
    <p class="chica suave">Este recorrido cubre las <strong>${e.funcionalidades.total} funcionalidades</strong> de
      ${esc(e.app.nombre)} — todas, agrupadas para que las descubras a tu ritmo.</p>
    <details class="chica">
      <summary>Historial</summary>
      <ul>
        <li><strong>S8 · ${esc(e.actualizado)}:</strong> el copy de la ficha de CV Viva (devolución 026) llega al brochure, al export y al README; el brochure se genera desde el export.</li>
      </ul>
    </details>
  </footer>
</div>

${script}
</body>
</html>
`;

const destino = join(RAIZ_REPO, "docs/BROCHURE.html");
if (process.argv.includes("--comprobar")) {
  let actual = "";
  try {
    actual = readFileSync(destino, "utf8");
  } catch {}
  if (actual !== html) {
    console.error("brochure: docs/BROCHURE.html no sale del export; corre `pnpm brochure`");
    process.exit(1);
  }
  console.log("brochure: al día con el export");
} else {
  writeFileSync(destino, html);
  console.log(`brochure: docs/BROCHURE.html (${e.funcionalidades.total} funcionalidades en ${grupos.length} grupos)`);
}
