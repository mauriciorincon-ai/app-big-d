import fs from "node:fs";
import { BANDA, MADUREZ, TIPO } from "../nucleo/datos.mjs";
import { TIPO_GLIFO } from "../nucleo/glifos.mjs";
import { esc } from "../nucleo/comun.mjs";
import { COMPONENTES, DIFF, LADO, PLATAFORMAS } from "./datos2.mjs";
import { PAGINAS_PL, POR_PAGINA, paginas, paginasComp, avisos } from "./lado.mjs";
import { enPalabras } from "./caso.mjs";
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
import { ES, CHEVRON, barra, encabezado, head, mqBar, niveles, pie } from "./comun3.mjs";
import { sal } from "../rutas.mjs";
const nComp = (n) => ES(`${n} ${n === 1 ? "componente" : "componentes"}`, `${n} ${n === 1 ? "component" : "components"}`);
const nFte = (n) => ES(`${n} ${n === 1 ? "fuente" : "fuentes"}`, `${n} ${n === 1 ? "source" : "sources"}`);
/** Componentes de un bloque como TARJETAS DE NODO (ajuste de la mirada 3): filete del color del tipo,
 *  glifo, nombre, madurez con su medidor y fuentes; las mismas piezas que el nodo del nivel 2. */
const MED = (nivel) => { const lleno = nivel >= 0 ? Math.round((11 * nivel) / 4) : 0; return `<svg class="comp-med" viewBox="-6 -8 12 16" width="12" height="16" aria-hidden="true"><rect x="-3.5" y="-5.5" width="7" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"${nivel === 0 ? ' stroke-dasharray="2 1.5"' : ""}/>${lleno ? `<rect x="-3.5" y="${(5.5 - lleno).toFixed(1)}" width="7" height="${lleno}" rx="1" fill="currentColor"/>` : ""}</svg>`; };
const DOC = `<svg viewBox="-6 -7 12 14" width="12" height="14" aria-hidden="true"><path d="M-4,-5.5 H2 L4.5,-3 V5.5 H-4 Z M-1.5,-1 H2 M-1.5,2 H2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const listaComp = (pl, b) => `<ul class="comp-nodos">${COMPONENTES[pl.id][b].map((c) => { const tp = TIPO[c.tipo], m = MADUREZ[c.mad]; return `<li class="comp-nodo comp-${tp.t}">${glifo(tp)}<b>${ES(esc(c.es), esc(c.en))}</b><span class="comp-pie">${c.mad !== "disponible-general" ? `<span>${MED(m.nivel)}${ES(m.es, m.en)}</span>` : ""}<span class="mono">${DOC}${nFte(c.fuentes)}</span></span></li>`; }).join("")}</ul>`;
/** Ficha del bloque (panel): a qué banda y plataforma pertenece, y cuáles son sus componentes. */
const fichaBloque = (pl, b) => { const d = LADO[pl.id][b]; if (!d) return ""; const [es, en, n, tipo, mad] = d, tp = TIPO[tipo], m = MADUREZ[mad]; return `<article class="ficha-nodo ficha-bloque" data-ficha="${pl.id}-${b}" hidden>
  <p class="ficha-tipo"><span class="cod">${String(BANDAS.indexOf(b) + 1).padStart(2, "0")}</span>${ES(esc(BANDA[b].es[0]), esc(BANDA[b].en[0]))}<span class="punto">·</span>${ES(pl.nombre.es, pl.nombre.en)}</p>
  <h2>${ES(esc(es), esc(en))}</h2>
  <p class="ficha-lider">${nComp(n)}${mad !== "disponible-general" ? `${ES(" · madurez más baja: ", " · lowest maturity: ")}${ES(m.largo.es.toLowerCase(), m.largo.en.toLowerCase())}` : ""}. ${ES("El tipo del bloque es el del componente principal.", "The block's type is that of its main component.")}</p>
  <p class="ficha-tipo">${glifo(tp)}<span class="cod">${ES(tp.es[0], tp.en[0])}</span>${ES(tp.es[1], tp.en[1])}</p>
  <h3>${ES("Componentes", "Components")}</h3>
  ${listaComp(pl, b)}
  <p class="meta"><span>${ES(`mapa v${pl.version}`, `map v${pl.version}`)}</span><span class="punto">·</span><span>${ES(`verificado hace ${pl.verificado} días`, `verified ${pl.verificado} days ago`)}</span></p>
</article>`; };
const R = paginas();
let _ini = 0;
const RANGOS = PAGINAS_PL.map((pls, i) => { const a = _ini + 1, b = _ini + pls.length; _ini = b; return [i + 1, a === b ? `${a}` : `${a}–${b}`]; });
const rangos = (de) => RANGOS.map(([k, r]) => `<span data-si="pag:${k}">${r} ${de} ${PLATAFORMAS.length}</span>`).join("");
const RC = paginasComp();
const BANDAS = ["fuentes", "ingesta", "almacenamiento", "procesamiento", "consumo", "ia", "gobierno", "operacion", "orquestacion"];
const glifo = (tp) => { const g = TIPO_GLIFO[tp.g]; return `<svg class="lg-${tp.t}" viewBox="-9 -9 18 18" width="16" height="16" aria-hidden="true">${g.relleno ? `<path d="${g.d}" fill="currentColor"/>` : `<path d="${g.d}" fill="none" stroke="currentColor" stroke-width="${g.trazo}"/>`}</svg>`; };
const selector = `<details class="selector">
      <summary>${ES(`Plataformas: ${PLATAFORMAS.length} de ${PLATAFORMAS.length}`, `Platforms: ${PLATAFORMAS.length} of ${PLATAFORMAS.length}`)}${CHEVRON}</summary>
      <ul class="selector-lista">
        <li class="selector-orden">${ES(`Orden por identificador, el mismo en los dos idiomas: ninguna va primero por ser quien es. Se comparan hasta ${enPalabras(POR_PAGINA, "es").replace("una", "uno")} a la vez; con más, se pagina.`, `Ordered by identifier, the same in both languages: none goes first for being who it is. Up to ${enPalabras(POR_PAGINA, "en")} compare at once; more than that paginates.`)}</li>
        ${PLATAFORMAS.map((p) => `<li><label><input type="checkbox" checked> ${ES(p.nombre.es, p.nombre.en)}</label><span class="meta">v${p.version}</span></li>`).join("\n        ")}
      </ul>
    </details>`;
// Angosto: una banda a la vez (HTML): pestañas de banda + una tarjeta por plataforma.
const angosto = `<div class="lado-angosto" data-banda="fuentes">
    <ul class="indice indice-fija" aria-label="Banda">
      ${BANDAS.map((b, i) => `<li><button type="button" data-banda-ir="${b}"${i === 0 ? ' aria-current="true"' : ""}><span class="n">${String(i + 1).padStart(2, "0")}</span>${ES(BANDA[b].es[0], BANDA[b].en[0])}</button></li>`).join("\n      ")}
    </ul>
    ${BANDAS.map((b) => `<section class="lado-banda" data-banda="${b}"><h2 class="lado-pregunta">${ES(esc(BANDA[b].es[1]), esc(BANDA[b].en[1]))}</h2><ul class="lado-lista">${PLATAFORMAS.map((p) => { const d = LADO[p.id][b]; if (!d) return `<li><span class="lado-pl">${ES(p.nombre.es, p.nombre.en)}</span><span class="lado-vacio">${ES("sin componentes", "no components")}</span></li>`; const [es, en, n, tipo, mad] = d, tp = TIPO[tipo], m = MADUREZ[mad]; return `<li><span class="lado-pl">${ES(p.nombre.es, p.nombre.en)}</span><details class="lado-comp" data-comp="${p.id}-${b}"><summary><span class="lado-bloque">${glifo(tp)}<b>${ES(esc(es), esc(en))}</b><span class="mono">${n} comp.${mad !== "disponible-general" ? ` · ${ES(m.es, m.en)}` : ""}</span></span>${CHEVRON}</summary>${listaComp(p, b)}</details></li>`; }).join("")}</ul></section>`).join("\n    ")}
  </div>`;
const DIFF_ICON = { nuevo: "M0,-4.5 V4.5 M-4.5,0 H4.5", retirado: "M-4.5,0 H4.5", renombrado: "M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5", madurez: "M-3.5,4.5 V-1 M0,4.5 V-4.5 M3.5,4.5 V1.5" };
const DIFF_TXT = { nuevo: ["nuevo", "new"], retirado: ["retirado", "removed"], renombrado: ["renombrado", "renamed"], madurez: ["madurez cambió", "maturity changed"] };
const listaDiff = `<ul class="diff-lista" data-si="vista:diff">${DIFF.map((d) => `<li><span class="diff-marca diff-${d.tipo}"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><path d="${DIFF_ICON[d.tipo]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${ES(DIFF_TXT[d.tipo][0], DIFF_TXT[d.tipo][1])}</span><span><b>${ES(esc(d.nodo.es), esc(d.nodo.en))}</b> <span class="mono">${ES(BANDA[d.banda].es[0], BANDA[d.banda].en[0])}</span><br>${ES(esc(d.detalle.es), esc(d.detalle.en))}</span></li>`).join("")}</ul>`;
const html = `${head({ es: "Lado a lado", en: "Side by side" })}
<body>
${mqBar("04 Lado a lado", "Estado de la maqueta", [["tres", "vista:mapas pag:1 ficha:ninguna", "tres plataformas"], ["desplegados", "vista:comp pag:1 ficha:ninguna", "componentes desplegados"], ["componentes", "vista:mapas pag:1 ficha:norte-ingesta", "ficha de un bloque"], ["pagina", "vista:mapas pag:2 ficha:ninguna", "página 2"], ["desplegados-2", "vista:comp pag:2 ficha:ninguna", "desplegados, página 2"], ["diff", "vista:diff pag:1 ficha:ninguna", "diferencias entre versiones"]], [["tres", "<b>Tres a la vez.</b> Las plataformas elegidas, una por fila, con las nueve bandas en columnas alineadas (misma gramática, mismo lugar). Tres en ancho es una constante de la vista: hay cuatro, así que pagina. En teléfono se compara una banda a la vez, con todas las plataformas apiladas (sin paginar)."], ["desplegados", "<b>Componentes desplegados.</b> El conmutador «Ver: bloques / componentes» abre cada bloque en su pila de componentes: los mismos nodos del nivel 2 (filete y glifo del tipo, nombre, madurez con medidor, fuentes). Las nueve columnas siguen alineadas por banda; cada fila mide lo que su celda más alta. En teléfono, todas las filas de la banda se despliegan como tarjetas de nodo. Ajuste pedido en la mirada 3."], ["componentes", "<b>Ficha de un bloque.</b> Al tocar un bloque se abre su ficha con sus componentes dibujados como tarjetas de nodo (ya no como lista). En teléfono, las mismas tarjetas se despliegan bajo la fila. Ajuste pedido en la mirada 2, dibujado en la mirada 3."], ["desplegados-2", "<b>Desplegados, página 2.</b> La cuarta plataforma con sus componentes; la paginación funciona igual en las dos vistas."], ["pagina", "<b>Página 2.</b> La cuarta plataforma (ficticia), sola en su página. «Anterior» vuelve a las tres primeras."], ["diff", "<b>Diferencias entre versiones.</b> El mismo mapa en dos versiones: cada cambio lleva glifo + palabra sobre el bloque (nuevo, retirado, renombrado, madurez) y la lista de abajo lo explica. El color no interviene."]])}
${barra("lado")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Atlas · lado a lado", en: "Atlas · side by side" }, { es: `${cap(enPalabras(PLATAFORMAS.length, "es"))} plataformas, el mismo mapa`, en: `${cap(enPalabras(PLATAFORMAS.length, "en"))} platforms, the same map` }, { es: "Cada banda en el mismo lugar para todas. Lo que cambia es qué hay en ella.", en: "Every band in the same place for all. What changes is what sits in it." }, `<p class="meta"><span>${ES("consultado 2026-09-26", "checked 2026-09-26")}</span><span class="punto">·</span><span>${ES("vigencia por plataforma en cada fila", "freshness per platform on each row")}</span></p>`, false)}
  ${niveles("lado-a-lado.html")}
  <div class="fila-r2">${selector}
    <div class="alterna vista-alterna" role="group" data-si="vista:mapas|comp" data-aria-es="Ver" data-aria-en="View"><span class="vista-etq">${ES("Ver:", "View:")}</span><button type="button" data-vista-set="mapas">${ES("bloques", "blocks")}</button><span class="sep">/</span><button type="button" data-vista-set="comp">${ES("componentes", "components")}</button></div>
    <div class="paginacion" data-si="vista:mapas|comp"><button type="button" class="boton boton-sec" data-pag="1">${ES("Anterior", "Previous")}</button><span class="mono">${ES(rangos("de"), rangos("of"))}</span><button type="button" class="boton boton-sec" data-pag="2">${ES("Siguiente", "Next")}</button></div>
  </div>
  <p class="guia" data-si="vista:mapas">${ES("<b>Se lee por columnas:</b> una banda, todas las plataformas. Un bloque punteado dice que la plataforma no tiene componentes en esa banda. Toca un bloque para ver cuáles son sus componentes.", "<b>Read it by columns:</b> one band, every platform. A dashed block means the platform has no components in that band. Tap a block to see which components it holds.")}</p>
  <p class="guia" data-si="vista:comp">${ES("<b>Componentes desplegados:</b> cada bloque abierto en sus componentes, los mismos nodos del nivel 2. Las columnas siguen alineadas por banda; se sigue leyendo por columnas.", "<b>Components expanded:</b> each block opened into its components, the same nodes as level 2. Columns stay aligned by band; still read it by columns.")}</p>
  <p class="guia" data-si="vista:diff">${ES("<b>Dos versiones del mismo mapa.</b> Arriba la anterior, abajo la nueva con sus diferencias marcadas.", "<b>Two versions of the same map.</b> The previous one above, the new one below with its differences marked.")}</p>
  <section class="mapa lado-ancho" aria-label="Lado a lado">
    <div class="lienzo-marco">
      <div class="lienzo" tabindex="0" role="region" data-aria-es="Comparación; se desplaza de lado" data-aria-en="Comparison; scrolls sideways">
      <div class="lienzo-dir" data-si="vista:mapas pag:1">${R.p1.svg}</div>
      <div class="lienzo-dir" data-si="vista:mapas pag:2">${R.p2.svg}</div>
      <div class="lienzo-dir" data-si="vista:diff">${R.dif.svg}</div>
      <div class="lienzo-dir" data-si="vista:comp pag:1">${RC.c1.svg}</div>
      <div class="lienzo-dir" data-si="vista:comp pag:2">${RC.c2.svg}</div>
      </div>
    </div>
  </section>
  ${listaDiff}
  ${angosto}
  <aside class="panel panel-solo-ancho" id="panel-ficha" hidden aria-labelledby="panel-titulo">
    <div class="panel-cabeza"><span class="ojo" id="panel-titulo">${ES("Componentes del bloque", "Block components")}</span><button type="button" class="cerrar" data-cerrar="panel-ficha">${ES("Cerrar", "Close")}</button></div>
    <div class="panel-cuerpo">
${PLATAFORMAS.map((p) => BANDAS.map((b) => fichaBloque(p, b)).filter(Boolean).join("\n")).join("\n")}
    </div>
  </aside>
</main>
<script src="assets/ficha.js" defer></script>
<script src="assets/lado.js" defer></script>
${pie}`;
fs.writeFileSync(sal("lado-a-lado.html"), html);
console.log("lado", (html.length / 1024).toFixed(1), "KB", avoids());
function avoids() { return avisos.length ? avisos.join("\n") : "sin avisos"; }
