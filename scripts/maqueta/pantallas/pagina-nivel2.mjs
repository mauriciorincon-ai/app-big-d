import fs from "node:fs";
import { BANDA, MAPA, MADUREZ, NODO, TIPO } from "../nucleo/datos.mjs";
import { esc } from "../nucleo/comun.mjs";
import { FUENTE_EN, NODO_EN, TERMINO_EN } from "./datos2.mjs";
import { svgNivel2, avisos } from "./nivel2.mjs";
import { ES, barra, encabezado, head, lienzo, metaVigente, mqBar, niveles, pie } from "./comun3.mjs";
import { sal } from "../rutas.mjs";

const D = svgNivel2();
const GLOS = MAPA.glosario;
const fecha = (iso) => iso;
const ficha = (n) => {
  const en = NODO_EN[n.id], tp = TIPO[n.tipo_id], mad = MADUREZ[n.madurez];
  const terms = Object.entries(n.terminos ?? {});
  const glos = Object.entries(GLOS).filter(([k]) => (n.experto + n.lider + n.por_que_importa).toLowerCase().includes(k) && !(n.terminos && n.terminos[k]));
  const li = (k, es, enk, end) => `<li><dt>${ES(esc(k), esc(enk))}</dt><dd>${ES(esc(es), esc(end))}</dd></li>`;
  return `<article class="ficha-nodo" data-ficha="${n.id}" hidden>
  <p class="ficha-tipo"><svg class="lg-${tp.t}" viewBox="-9 -9 18 18" width="16" height="16" aria-hidden="true"><use href="#db-g-${tp.g}"/></svg><span class="cod">${ES(tp.es[0], tp.en[0])}</span>${ES(tp.es[1], tp.en[1])}</p>
  <h2>${ES(esc(NODO[n.id].es), esc(NODO[n.id].en))}</h2>
  <p class="ficha-lider">${ES(esc(n.lider), esc(en[0]))}</p>
  <h3>${ES("Qué hace", "What it does")}</h3>
  <p>${ES(esc(n.experto), esc(en[1]))}</p>
  <h3>${ES("Por qué importa", "Why it matters")}</h3>
  <p>${ES(esc(n.por_que_importa), esc(en[2]))}</p>
  ${terms.length || glos.length ? `<h3>${ES("Términos", "Terms")}</h3><dl class="terminos">${terms.map(([k, v]) => li(k, v, TERMINO_EN[k][0], TERMINO_EN[k][1])).join("")}${glos.map(([k, v]) => `<li class="del-glosario"><dt>${ES(esc(k), esc(TERMINO_EN[k][0]))} <span class="cod">${ES("glosario", "glossary")}</span></dt><dd>${ES(esc(v), esc(TERMINO_EN[k][1]))}</dd></li>`).join("")}</dl>` : ""}
  <h3>${ES("Madurez", "Maturity")}</h3>
  <p class="ficha-madurez"><svg viewBox="-6 -8 12 16" width="12" height="16" aria-hidden="true"><rect x="-3.5" y="-5.5" width="7" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="-3.5" y="${(5.5 - Math.round((11 * mad.nivel) / 4)).toFixed(1)}" width="7" height="${Math.round((11 * mad.nivel) / 4)}" rx="1" fill="currentColor"/></svg>${ES(mad.largo.es, mad.largo.en)}</p>
  <h3>${ES("Fuentes", "Sources")}</h3>
  <ul class="fuentes">${n.fuentes.map((f) => `<li><a href="${f.url}">${ES(esc(f.titulo), esc(FUENTE_EN[f.titulo] ?? f.titulo))}</a><span class="mono">${fecha(f.fecha)} · ${ES(f.tipo, f.tipo === "oficial" ? "official" : f.tipo)}</span></li>`).join("")}</ul>
  <p class="meta"><span>${ES("verificado", "verified")} ${n.fecha_verificacion}</span><span class="punto">·</span><span>${ES("consultado 2026-09-26", "checked 2026-09-26")}</span></p>
</article>`;
};
const html = `${head({ es: "Componentes", en: "Components" })}
<body>
${mqBar("02 Atlas, nivel 2", "Estado de la maqueta", [["mapa", "ficha:ninguna", "mapa"], ["ficha", "ficha:captura-cambios", "ficha abierta"], ["glosario", "ficha:catalogo-central", "término del glosario"]], [["mapa", "<b>Componentes.</b> Los 14 componentes de la Plataforma Ejemplo, con su tipo (color + glifo), su madurez cuando no es «disponible» y cuántas fuentes lo respaldan. Toca uno: se abre su ficha (hoja inferior en teléfono, panel lateral en desktop)."], ["ficha", "<b>Ficha abierta.</b> «Captura de cambios»: qué es, qué hace, por qué importa, un término explicado, madurez, fuentes con fecha y fecha de verificación. Cierra con «Cerrar» o Esc."], ["glosario", "<b>Término del glosario.</b> «Catálogo central»: su término propio («linaje») y el del glosario del mapa («catálogo»), marcado como tal."]])}
${barra("atlas")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Atlas · nivel 2 · componentes", en: "Atlas · level 2 · components" }, { es: "Plataforma Ejemplo (ficticia)", en: "Example Platform (fictional)" }, { es: "Para expertos. Cada componente con su tipo, su madurez y sus fuentes; los flujos con su modo.", en: "For experts. Each component with its type, maturity and sources; the flows with their mode." }, metaVigente)}
  ${niveles("atlas-nivel-2.html")}
  <p class="guia">${ES("<b>Mismo mapa, un nivel adentro.</b> Cada bloque del nivel 1 se abre en sus componentes. Las franjas siguen abajo; sus conexiones se escriben bajo la capa que tocan. Toca un componente para leer su ficha.", "<b>Same map, one level in.</b> Each level-1 block opens into its components. The bands stay below; their connections are written under the layer they touch. Tap a component to read its card.")}</p>
  ${lienzo(D.cols, BANDA, `<div class="lienzo-dir">${D.svg}</div>`)}
  </section>
  <aside class="panel" id="panel-ficha" hidden aria-labelledby="panel-titulo">
    <div class="panel-cabeza"><span class="ojo" id="panel-titulo">${ES("Ficha del componente", "Component card")}</span><button type="button" class="cerrar" data-cerrar="panel-ficha">${ES("Cerrar", "Close")}</button></div>
    <div class="panel-cuerpo">
${MAPA.nodos.map(ficha).join("\n")}
    </div>
  </aside>
</main>
${pie}`;
fs.writeFileSync(sal("atlas-nivel-2.html"), html);
console.log("nivel-2", (html.length / 1024).toFixed(1), "KB", avisos.length ? avisos.join("\n") : "sin avisos");
