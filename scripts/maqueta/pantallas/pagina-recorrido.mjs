import fs from "node:fs";
import { BANDA, NODO } from "../nucleo/datos.mjs";
import { esc } from "../nucleo/comun.mjs";
import { PASO_FLUJO, PASO_NUM, PASO_ORDEN, REC, REC_EN } from "./datos2.mjs";
import { svgNivel2, avisos } from "./nivel2.mjs";
import { ES, barra, encabezado, head, lienzo, metaVigente, mqBar, niveles, pie } from "./comun3.mjs";
import { sal } from "../rutas.mjs";

const D = svgNivel2({ recorrido: true });
// Antecesores de cada paso (para «visitado»): la rama sigue de `sigue_de`.
const porId = Object.fromEntries(REC.pasos.map((p) => [p.id, p]));
const antes = (id) => { const out = []; let p = porId[id]; while (p) { const prev = p.sigue_de ?? (PASO_ORDEN[PASO_ORDEN.indexOf(p.id) - 1] && !porId[PASO_ORDEN[PASO_ORDEN.indexOf(p.id) - 1]].bifurca ? PASO_ORDEN[PASO_ORDEN.indexOf(p.id) - 1] : PASO_ORDEN[PASO_ORDEN.indexOf(p.id) - 1]); if (!prev || prev === p.id) break; out.push(prev); p = porId[prev]; } return out; };
// Camino lineal para «anterior / siguiente»: 1 2 3 4 5 6a 7a 6b.
const ORDEN = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
let css = "/* Estados del recorrido por atributo del contenedor (CONTRATO § 4.3): generados del recorrido. */\n";
for (const id of ORDEN) {
  const vis = antes(id);
  css += `.rec[data-paso="${id}"] .db-nodo[data-paso="${id}"] [data-caja] { stroke: var(--tinta-1); stroke-width: 3; }\n`;
  css += `.rec[data-paso="${id}"] .db-nodo[data-paso="${id}"] .dg-paso-insignia rect { stroke-width: 4; }\n`;
  css += `.rec[data-paso="${id}"] .db-nodo:not([data-paso="${id}"]${vis.map((v) => `):not([data-paso="${v}"]`).join("")}) { opacity: 0.35; }\n`;
  css += `.rec[data-paso="${id}"] .db-flujo:not(${[id, ...vis].filter((x) => PASO_FLUJO[x]).map((x) => `[data-flujo="${PASO_FLUJO[x]}"]`).join("):not(") || "[data-flujo]"}) { opacity: 0.2; }\n`;
  if (PASO_FLUJO[id]) css += `.rec[data-paso="${id}"] .db-flujo[data-flujo="${PASO_FLUJO[id]}"] .db-linea { stroke: var(--tinta-1); stroke-width: 3; }\n.rec[data-paso="${id}"] .db-flujo[data-flujo="${PASO_FLUJO[id]}"] .db-punta { fill: var(--tinta-1); }\n`;
}
css += `.rec[data-paso="todos"] .db-nodo:not([data-paso]) { opacity: 0.35; }\n.rec[data-paso="todos"] .db-flujo:not(${Object.values(PASO_FLUJO).map((f) => `[data-flujo="${f}"]`).join("):not(")}) { opacity: 0.2; }\n`;
const pasos = REC.pasos.map((p) => { const en = REC_EN.pasos[p.id]; return `<li data-paso-panel="${p.id}"><span class="paso-n">${PASO_NUM[p.id]}</span><div><b>${ES(esc(p.que_pasa), esc(en[0]))}</b> <span class="paso-nodo">${ES(esc(NODO[p.nodo_id].es), esc(NODO[p.nodo_id].en))}</span><p class="paso-lider">${ES(esc(p.lider), esc(en[1]))}</p><p class="paso-experto">${ES(esc(p.experto), esc(en[2]))}</p>${p.bifurca ? `<p class="paso-rama"><svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><use href="#db-k-rama"/></svg>${ES("Aquí el camino se bifurca en paralelo: 6a hacia el tablero y 6b hacia el agente.", "Here the path forks in parallel: 6a towards the dashboard and 6b towards the agent.")}</p>` : ""}</div></li>`; }).join("\n      ");
const html = `${head({ es: "Recorrido", en: "Journey" }, `<link rel="stylesheet" href="assets/recorrido-animacion.css" media="(prefers-reduced-motion: no-preference)">\n<style>\n${css}</style>\n`)}
<body>
${mqBar("03 Atlas, recorrido", "Estado de la maqueta", [["estatico", "paso:todos", "todos los pasos"], ["paso", "paso:p4", "paso activo"], ["bifurcacion", "paso:p5", "bifurcación"], ["animando", "paso:p2 anim:si", "animación"]], [["estatico", "<b>Vista estática (defecto).</b> Los ocho pasos numerados sobre el mapa de componentes, con la rama 6a/7a y 6b. Nada se mueve. «Siguiente» empieza a recorrer."], ["paso", "<b>Paso activo.</b> El paso 4: borde grueso y su flujo de llegada resaltado; los ya recorridos se quedan; lo que falta se atenúa. El panel cuenta el paso en los dos registros."], ["bifurcacion", "<b>Bifurcación.</b> El paso 5 es paralelo: de aquí salen 6a (tablero) y 6b (agente). El nodo lleva la marca de rama y el panel lo dice."], ["animando", "<b>Animación opcional.</b> «Reproducir» avanza solo, un paso cada dos segundos; la línea activa fluye. Con «reducir movimiento» el botón no existe y nada se mueve: la hoja de animación ni se carga."]])}
${barra("atlas")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Atlas · nivel 3 · recorrido de un dato", en: "Atlas · level 3 · a datum's journey" }, { es: "Plataforma Ejemplo (ficticia)", en: "Example Platform (fictional)" }, { es: REC.titulo, en: REC_EN.titulo }, metaVigente)}
  ${niveles("atlas-recorrido.html")}
  <p class="guia">${ES("<b>Un registro de admisión, paso a paso.</b> Sigue los números: del sistema de origen al tablero y al agente. Avanza con «Siguiente» o con las flechas del teclado.", "<b>One admission record, step by step.</b> Follow the numbers: from the source system to the dashboard and the agent. Move with “Next” or the arrow keys.")}</p>
  <div class="rec" data-paso="todos" id="rec">
  <div class="rec-controles" role="group" data-aria-es="Controles del recorrido" data-aria-en="Journey controls">
    <button type="button" class="boton" data-rec="anterior">${ES("Anterior", "Previous")}</button>
    <span class="rec-pos mono" aria-live="polite"><span data-rec-pos>${ES("Todos los pasos", "All steps")}</span></span>
    <button type="button" class="boton" data-rec="siguiente">${ES("Siguiente", "Next")}</button>
    <button type="button" class="boton boton-sec" data-rec="reproducir">${ES("Reproducir", "Play")}</button>
    <button type="button" class="boton boton-sec" data-rec="todos">${ES("Ver todos", "Show all")}</button>
  </div>
  ${lienzo(D.cols, BANDA, `<div class="lienzo-dir">${D.svg}</div>`)}
  </section>
  <section class="pasos" aria-labelledby="pasos-t">
    <h2 id="pasos-t" class="ojo">${ES("Los pasos", "The steps")}</h2>
    <ol class="pasos-lista">
      ${pasos}
    </ol>
  </section>
  </div>
</main>
<script src="assets/recorrido.js" defer></script>
${pie}`;
fs.writeFileSync(sal("atlas-recorrido.html"), html);
console.log("recorrido", (html.length / 1024).toFixed(1), "KB", avisos.length ? avisos.join("\n") : "sin avisos");
