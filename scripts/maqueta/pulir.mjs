// Pulido de accesibilidad común a las 13 páginas, aplicado al escribir (auditoría A-13, A-14, A-21):
// «Saltar al contenido» como primer foco, «Saltar el diagrama» delante de cada lienzo (hacia su lectura
// en texto si la página tiene una sola, G10; si no, justo detrás del lienzo), nombres accesibles en los
// dos idiomas y títulos de página por sección.
import fs from "node:fs";
import { sal } from "./rutas.mjs";

const SECCION = {
  "atlas-nivel-1.html": ["Atlas", "Atlas"], "atlas-nivel-2.html": ["Atlas", "Atlas"], "atlas-recorrido.html": ["Atlas", "Atlas"], "lado-a-lado.html": ["Atlas", "Atlas"],
  "investigador.html": ["Conocimiento", "Knowledge"], "base.html": ["Conocimiento", "Knowledge"],
  "perfil.html": ["Caso", "Case"], "comparacion.html": ["Caso", "Case"], "decisiones.html": ["Caso", "Case"], "informe.html": ["Caso", "Case"],
  "instrumento.html": ["Instrumento", "Instrument"], "kit.html": ["Design system", "Design system"], "index.html": ["Sala de diseño", "Design room"],
};
const ARIA_EN = {
  Tema: "Theme", Secciones: "Sections", Sección: "Section", "Nivel de lectura": "Reading level", Mapa: "Map", "Ir a una capa": "Go to a layer",
  Vistas: "Views", Decisiones: "Decisions", "Ir a una onda": "Go to a wave", "Secciones del kit": "Kit sections", Pestañas: "Tabs",
  "Lado a lado": "Side by side", Banda: "Band", "Vistas de la comparación": "Comparison views", "Secciones del informe": "Report sections",
};
const ES = (es, en) => `<span lang="es">${es}</span><span lang="en">${en}</span>`;

/** Posición justo después del </div> que cierra el <div> que empieza en `i`. */
function finDelDiv(html, i) {
  const re = /<(\/?)div\b[^>]*>/g;
  re.lastIndex = i;
  let hondo = 0, m;
  while ((m = re.exec(html))) { hondo += m[1] ? -1 : 1; if (hondo === 0) return re.lastIndex; }
  throw new Error("pulir: <div class=\"lienzo-marco\"> sin cierre");
}

export function pulir(archivo, html) {
  const sec = SECCION[archivo];
  if (!sec) throw new Error(`pulir: página sin sección declarada: ${archivo}`);
  html = html.replace(/<title data-es="Big-D · Atlas · ([^"]*)" data-en="Big-D · Atlas · ([^"]*)">Big-D · Atlas · ([^<]*)<\/title>/, (_, es, en, txt) => `<title data-es="Big-D · ${sec[0]} · ${es}" data-en="Big-D · ${sec[1]} · ${en}">Big-D · ${sec[0]} · ${txt}</title>`);
  html = html.replace(/aria-label="([^"]*)"(?![^>]*data-aria-en)/g, (m, es) => (ARIA_EN[es] ? `aria-label="${es}" data-aria-es="${es}" data-aria-en="${ARIA_EN[es]}"` : m));
  html = html.replace("<body>\n", `<body>\n<a class="saltar" href="#contenido">${ES("Saltar al contenido", "Skip to content")}</a>\n`);
  const lienzos = html.split('<div class="lienzo-marco">').length - 1;
  const unaLectura = lienzos === 1 && html.split('<details class="lectura-seccion">').length === 2;
  if (unaLectura) html = html.replace('<details class="lectura-seccion">', '<details class="lectura-seccion" id="lectura">');
  for (let k = 1, i = html.indexOf('<div class="lienzo-marco">'); i >= 0; k++, i = html.indexOf('<div class="lienzo-marco">', i)) {
    const fin = finDelDiv(html, i);
    const destino = unaLectura ? "lectura" : `tras-diagrama-${k}`;
    const tras = unaLectura ? "" : `<span id="${destino}" tabindex="-1"></span>`;
    const salto = `<a class="saltar-diagrama" href="#${destino}">${ES("Saltar el diagrama", "Skip the diagram")}</a>`;
    html = html.slice(0, i) + salto + html.slice(i, fin) + tras + html.slice(fin);
    i = fin + salto.length + tras.length;
  }
  return html;
}

/** Escribe una página de la maqueta ya pulida. */
export const escribir = (archivo, html) => fs.writeFileSync(sal(archivo), pulir(archivo, html));
