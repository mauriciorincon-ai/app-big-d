// Genera docs/BROCHURE.html desde docs/brochure-export.json y el molde docs/BROCHURE.plantilla.html (S8, devolución 026-1).
// El brochure y el export dicen LO MISMO porque el segundo sale del primero: ningún texto del brochure se escribe a mano aquí
// salvo los rótulos. El molde pone el estilo y el guion de las tarjetas; el export, el copy y las cifras.
// Uso: node scripts/brochure/generar.mjs [--comprobar]    (--comprobar no escribe: sale 1 si docs/BROCHURE.html está desactualizado)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { cargarTs, RAIZ_REPO } from "../lib/cargar-ts.mjs";

const leer = (r) => readFileSync(join(RAIZ_REPO, r), "utf8");
const e = JSON.parse(leer("docs/brochure-export.json"));
const molde = leer("docs/BROCHURE.plantilla.html");
const guion = JSON.parse(leer("docs/brochure-escenas.json"));

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Cifra con coma decimal y separador de miles, sin Intl (el repo no usa `Intl`/`toLocale*`). */
const cifra = (n) => {
  const [ent, dec] = String(n).split(".");
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (dec ? `,${dec}` : "");
};
const FUENTE = { medido: "medido", calculada: "calculada", declarado: "declarado", estimacion: "estimación" };

// El estilo y el script salen del molde tal cual (un solo lugar donde se arregla un defecto de estilo); las escenas del
// storyboard (S10, docs/BROCHURE-storyboard.md) suman su estilo y su guion propios, de scripts/brochure/escenas.{css,js}.
const estilo = molde
  .match(/<style>[\s\S]*?<\/style>/)[0]
  .replace("</style>", leer("scripts/brochure/escenas.css") + "</style>");
const script = molde.match(/<script>[\s\S]*?<\/script>/)[0] + "\n<script>\n" + leer("scripts/brochure/escenas.js") + "</script>";

// ===== Las cifras REALES de la demo pública (S10) =====
// El brochure no dibuja números: evalúa la misma entrada que la demo (src/lib/demo) con el mismo núcleo. La base es siempre
// data/ del repo (la que se publica), aunque la suite corra con la perilla BIGD_DATOS sobre una copia.
delete process.env.BIGD_DATOS;
const { entradaDemo, CASO_DEMO } = await cargarTs("src/lib/demo/pagina.ts");
const { atenderDemo } = await cargarTs("src/lib/demo/protocolo.ts");
const { reordenada } = await cargarTs("src/lib/demo/entrada.ts");
const { vistaDe } = await cargarTs("src/lib/demo/vista.ts");
const { TEXTOS_DEMO } = await cargarTs("src/lib/i18n/demo.ts");
const { datos } = await cargarTs("src/lib/datos/index.ts");
const sha = async (t) => createHash("sha256").update(t, "utf8").digest("hex");
const entrada = entradaDemo();
const nPlat = entrada.base.plataformas.length;
// Todos los órdenes que da «probar la neutralidad» (rotación × inversión: con tres plataformas, las seis permutaciones).
const vueltas = [];
for (let k = 0; k < 2 * nPlat; k++) {
  const r = await atenderDemo({ tipo: "evaluar", id: k, entrada: reordenada(entrada, k) }, sha);
  if (r.tipo !== "evaluado") throw new Error(`brochure: la demo no evalúa (${JSON.stringify(r)})`);
  vueltas.push(r);
}
const huellas = new Set(vueltas.map((r) => r.huella));
if (huellas.size !== 1) throw new Error(`brochure: la neutralidad falla, ${huellas.size} huellas distintas para ${vueltas.length} órdenes`);
const ordenes = new Set(vueltas.map((r) => r.recibido.join(",")));
const atlasDe = datos().atlas;
const nombres = Object.fromEntries(entrada.base.plataformas.map((p) => [p.id, atlasDe.get(p.id)?.plataforma.nombre.es ?? p.id]));
const umbralCentesimas = entrada.base.convenciones.umbral_empate_centesimas;
const vista = vistaDe(vueltas[0], { idioma: "es", t: TEXTOS_DEMO.es, nombres, umbralCentesimas });
const umbralPuntos = cifra(String(umbralCentesimas / 100));

const climaxes = guion.escenas.filter((x) => x.rol === "climax");
if (climaxes.length !== 1) throw new Error(`brochure: el guion debe tener UN clímax (tiene ${climaxes.length})`);
const texto = (x) => esc(x.texto.replace("{umbral}", umbralPuntos));

/** E1: un mapa abstracto de bandas (no imita la app): un marco, tres bandas, cajas por banda. Un solo trazo por mapa. */
const mapaAbstracto = (i) => {
  const cajas = [[3, 2, 3], [2, 3, 2], [3, 3, 2]][i % 3];
  let d = "M4 4H116V76H4Z";
  [0, 1, 2].forEach((b) => {
    const y = 10 + b * 22;
    const n = cajas[b];
    const ancho = (100 - (n - 1) * 6) / n;
    for (let c = 0; c < n; c++) {
      const x = 10 + c * (ancho + 6);
      d += `M${x.toFixed(1)} ${y}h${ancho.toFixed(1)}v14h${(-ancho).toFixed(1)}Z`;
    }
  });
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><path class="trazo" pathLength="1" d="${d}"/></svg>`;
};

const fichas = (orden) =>
  orden.map((id) => `<li class="ficha" data-plataforma="${esc(id)}">${esc(nombres[id])}</li>`).join("");
const otro = vueltas.find((r) => r.recibido.join(",") !== vueltas[0].recibido.join(",") && r.recibido[0] !== vueltas[0].recibido[0]) ?? vueltas[1];

const cuerpoEscena = {
  "e1-gramatica": () => `<div class="mapas">${entrada.base.plataformas
    .map((p, i) => `<figure class="mapa-mini">${mapaAbstracto(i)}<figcaption>${esc(nombres[p.id])}</figcaption></figure>`)
    .join("")}</div>`,
  "e2-empate": () => {
    const max = Math.max(...vista.filas.map((f) => f.decimas));
    const desde = (max - umbralCentesimas / 10) / 10;
    return `<ul class="barras">${vista.filas
      .map(
        (f) => `<li data-plataforma="${esc(f.plataforma_id)}"><span>${esc(f.nombre)}</span><span class="pista-envoltura"><span class="barra-pista"><span class="barra" style="--v:${f.decimas / 1000}"></span></span><span class="franja-empate" style="--desde:${desde}%;--ancho:${umbralCentesimas / 100}%" aria-hidden="true"></span></span><span class="barra-valor mono">${esc(f.total)}</span></li>`,
      )
      .join("")}</ul><p class="empate-rotulo"><span class="signo" aria-hidden="true">≈</span> ${esc(vista.veredicto)}</p>`;
  },
  "e3-neutralidad": () => `<div class="orden-fila"><span class="rotulo">Un orden</span><ol class="fichas">${fichas(vueltas[0].recibido)}</ol><p class="huella mono" data-huella>${vueltas[0].huella}</p></div>
      <div class="orden-fila"><span class="rotulo">Otro orden</span><ol class="fichas" data-fila-viva>${fichas(otro.recibido)}</ol><p class="huella mono" data-huella>${otro.huella}</p></div>
      <p class="igual"><span aria-hidden="true">✓</span> Misma huella. Las ${ordenes.size} maneras de ordenar las ${nPlat} plataformas dan esta misma huella.</p>
      <button type="button" class="repetir" data-repetir>Cambiar el orden otra vez</button>`,
};

const escenas = guion.escenas
  .map(
    (x, i) => `  <section class="seccion escena${x.rol === "climax" ? " climax" : " escena-viva"}" id="${esc(x.id)}" data-rol="${esc(x.rol)}" aria-labelledby="t-${esc(x.id)}">
    <p class="rotulo">${i + 1} de ${guion.escenas.length}${x.rol === "climax" ? " · lo central" : ""}</p>
    <h2 id="t-${esc(x.id)}">${esc(x.titulo)}</h2>
    <p>${texto(x)}</p>
    <div class="escena-cuadro">
      ${cuerpoEscena[x.id]()}
    </div>
  </section>`,
  )
  .join("\n\n");

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

${escenas}

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
        <li><strong>S10:</strong> tres escenas con las cifras y la huella reales de la demo pública (${esc(CASO_DEMO)}); lo central: cambiar el orden de las plataformas no cambia la huella.</li>
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
