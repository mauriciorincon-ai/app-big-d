// Boceto de FORMA del S3 (mirada M1, D-S3-10): la revisión de una propuesta de EVIDENCIAS del investigador.
// La maqueta del investigador (docs/diseno/investigador.html) solo revisa mapas; aquí cada evidencia muestra su
// puntaje sobre la escala de 0 a 4 con el tope por madurez, el texto del nivel propuesto y por qué ese y no el
// de al lado, y la página arma el comando con lo que la persona marcó (con la misma función de la app).
// No es producto ni maqueta: es la propuesta que se mira antes de construir la pantalla. Las evidencias son
// ficticias (Plataforma Ejemplo, fuentes example.org); la escala, los topes y las madureces salen de data/.
//
// Uso: node scripts/propuestas/revision-evidencias.mjs
//   → docs/propuestas-de-diseno/revision-evidencias.html (+ .js), abrir con doble clic.
import fs from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { RAIZ } from "../maqueta/rutas.mjs";
import { esc } from "../maqueta/nucleo/comun.mjs";
import { ES, OK, barra, encabezado, head, pestanas, pie } from "../maqueta/pantallas/comun3.mjs";
import { cargarTs } from "../lib/cargar-ts.mjs";

const { comandoAprobar } = await cargarTs("src/lib/investigador/comando.ts");
const yaml = (ruta) => parse(fs.readFileSync(resolve(RAIZ, ruta), "utf8"));
const ESCALA = yaml("data/escalas/esc-evidencia.yaml");
const MADUREZ = Object.fromEntries(yaml("data/gramaticas/plataformas-datos.gramatica.yaml").escala_madurez.map((m) => [m.id, m.nombre]));
const tope = (m) => ESCALA.tope_por_madurez.find((t) => t.madurez === m);
const nivel = (v) => ESCALA.niveles.find((n) => n.valor === v);

const CARPETA = "propuestas/2026-10-05-plataforma-ejemplo-evidencias";
// El comando sale de comandoAprobar (src/lib/investigador/comando.ts): el boceto no lo redacta.
const PREFIJO = comandoAprobar(CARPETA, [], []).split(" --aprobar ")[0];

const CONFLICTO = { "propio-fabricante": ["fuente del propio fabricante", "the vendor's own source"], independiente: ["independiente", "independent"] };
const NO_VERIF = `<svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0,-4.5 V1.2 M0,3.8 V4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const NO_ENC = `<svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M-3,-3 L3,3 M3,-3 L-3,3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const PUNTEADO = `<svg viewBox="-8 -8 16 16" width="12" height="12" aria-hidden="true"><circle r="7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2"/></svg>`;

// Cuatro evidencias ficticias: una verificable que el código no pudo comprobar, dos verificadas y una cuya cita
// no aparece en la fuente. La segunda está en vista previa para que se vea el tope.
const EVIDENCIAS = [
  {
    a: "A-1", id: "evi-plataforma-ejemplo-costo", criterio: ["Previsibilidad del costo", "Cost predictability"], tipo: ["transversal", "cross-cutting"],
    afirma: ["Cada área puede tener un presupuesto con alerta y suspensión automática del cómputo al llegar al límite.", "Each area can have a budget with an alert and automatic compute suspension when it reaches the limit."],
    puntaje: 3, madurez: "vista-previa-publica",
    porque: ["3 y no 4: la suspensión cubre el cómputo, no el almacenamiento. 3 y no 2: funciona sin herramientas de terceros. La vista previa la descuenta el tope, no este puntaje.", "3, not 4: the suspension covers compute, not storage. 3, not 2: it works without third-party tools. The preview is discounted by the cap, not by this score."],
    cita: "Budget caps with automatic compute suspension are available in public preview for every workspace in the account.",
    fuente: ["Anuncio ficticio de presupuestos", "Fictional budgets announcement", "https://example.org/ficticia/presupuestos", "oficial", "official", "2026-09-12", "propio-fabricante"],
    verif: "no-verificable", componentes: ["Consola de costos", "Cost console"],
  },
  {
    a: "A-2", id: "evi-plataforma-ejemplo-gobierno", criterio: ["Gobierno y seguridad", "Governance and security"], tipo: ["capacidad", "capability"],
    afirma: ["Las políticas de acceso por fila y por columna se definen una vez en el catálogo y las aplica cada motor.", "Row and column access policies are defined once in the catalog and every engine enforces them."],
    puntaje: 4, madurez: "disponible-general", esencial: true,
    porque: ["4 y no 3: la documentación no declara límites que afecten a un hospital y la función es nativa del catálogo, sin herramientas aparte.", "4, not 3: the documentation states no limits that affect a hospital and the feature is native to the catalog, with no separate tools."],
    cita: "Row filters and column masks are defined once in the catalog and enforced by every compute engine that reads the table.",
    fuente: ["Documentación ficticia del catálogo", "Fictional catalog documentation", "https://example.org/ficticia/catalogo", "oficial", "official", "2026-08-30", "propio-fabricante"],
    verif: "verificada", http: 200, sha: "7d21c0e4", componentes: ["Catálogo", "Catalog"],
  },
  {
    a: "A-3", id: "evi-plataforma-ejemplo-ingesta", criterio: ["Ingesta", "Ingestion"], tipo: ["capacidad", "capability"],
    afirma: ["Recibe los cambios de las bases relacionales casi en tiempo real, con conectores incluidos.", "It receives changes from relational databases in near real time, with built-in connectors."],
    puntaje: 3, madurez: "disponible-general",
    porque: ["3 y no 4: el límite de 500 tablas por conector está documentado y obliga a repartir las bases grandes. 3 y no 2: está disponible de forma general.", "3, not 4: the 500-tables-per-connector limit is documented and forces large databases to be split. 3, not 2: it is generally available."],
    cita: "Change data capture connectors are generally available for the most common relational databases, up to 500 tables per connector.",
    fuente: ["Documentación ficticia de conectores", "Fictional connectors documentation", "https://example.org/ficticia/conectores", "oficial", "official", "2026-09-02", "propio-fabricante"],
    verif: "verificada", http: 200, sha: "b3a9f112", componentes: ["Conectores", "Connectors"], limitaciones: ["Hasta 500 tablas por conector.", "Up to 500 tables per connector."],
  },
  {
    a: "A-4", id: "evi-plataforma-ejemplo-ia", criterio: ["Inteligencia artificial", "Artificial intelligence"], tipo: ["capacidad", "capability"],
    afirma: ["Los modelos se entrenan y se sirven dentro de la plataforma, con registro de versiones.", "Models are trained and served inside the platform, with a version registry."],
    puntaje: 3, madurez: "disponible-general",
    porque: ["3 y no 4: el servicio de modelos tiene cuotas por región. 3 y no 2: está disponible de forma general.", "3, not 4: model serving has per-region quotas. 3, not 2: it is generally available."],
    cita: "Model training and serving run inside the workspace with a versioned model registry and per-region quotas.",
    fuente: ["Documentación ficticia de modelos", "Fictional models documentation", "https://example.org/ficticia/modelos", "oficial", "official", "2026-07-21", "propio-fabricante"],
    verif: "no-encontrada", http: 200, componentes: ["Registro de modelos", "Model registry"],
  },
];

const tira = (e) => {
  const t = tope(e.madurez);
  const cuenta = Math.min(e.puntaje, t.tope);
  const items = ESCALA.niveles.map((n) => {
    const clases = [n.valor === e.puntaje && "propuesto", n.valor > t.tope && "sobre-tope", cuenta !== e.puntaje && n.valor === cuenta && "cuenta"].filter(Boolean).join(" ");
    const marca = n.valor === e.puntaje ? `<i>${OK}${ES("propuesto", "proposed")}</i>` : cuenta !== e.puntaje && n.valor === cuenta ? `<i>${ES("cuenta", "counts")}</i>` : "";
    return `<li${clases ? ` class="${clases}"` : ""}><b>${n.valor}</b><span>${ES(esc(n.nombre.es), esc(n.nombre.en))}</span>${marca}</li>`;
  });
  const m = MADUREZ[e.madurez];
  const nota = t.tope < 4
    ? `<p class="tope-nota">${ES(
        `Rayado, lo que la madurez «${esc(m.es.toLowerCase())}» no deja contar: aquí cuenta como ${cuenta}${t.tope_aceptando_vista_previa > t.tope ? `, y como ${Math.min(e.puntaje, t.tope_aceptando_vista_previa)} si el caso acepta vista previa` : ""}.`,
        `Hatched, what the “${esc(m.en.toLowerCase())}” maturity does not let count: here it counts as ${cuenta}${t.tope_aceptando_vista_previa > t.tope ? `, and as ${Math.min(e.puntaje, t.tope_aceptando_vista_previa)} if the case accepts previews` : ""}.`,
      )}</p>`
    : "";
  return `<ol class="escala-tira" aria-label="${esc(`Puntaje ${e.puntaje} de 4`)}" data-aria-es="${esc(`Puntaje ${e.puntaje} de 4`)}" data-aria-en="${esc(`Score ${e.puntaje} out of 4`)}">${items.join("")}</ol>${nota}`;
};

const porQue = (p) => {
  const ad = [p - 1, p + 1].filter((x) => x >= 0 && x <= 4);
  return ES(`¿Por qué ${p} y no ${ad.join(" ni ")}?`, `Why ${p} and not ${ad.join(" or ")}?`);
};

const verificacion = (e) =>
  e.verif === "verificada"
    ? `<span class="verif"><b>${OK}${ES("cita verificada", "quote verified")}</b><span class="mono">curl · ${e.http} · 2026-10-05 · sha256 ${e.sha}…</span></span>`
    : e.verif === "no-verificable"
      ? `<span class="verif"><b>${NO_VERIF}${ES("no verificable por código", "not verifiable by code")}</b><span class="mono">${ES("la página se arma con JavaScript · revisión humana · 2026-10-05", "the page is built with JavaScript · human review · 2026-10-05")}</span></span>`
      : `<span class="verif"><b>${NO_ENC}${ES("cita no encontrada", "quote not found")}</b><span class="mono">curl · ${e.http} · ${ES("la cita no aparece en la página · rechazada por el código", "the quote is not on the page · rejected by the code")}</span></span>`;

const insignias = (porCodigo) =>
  [
    ["por-decidir", "insignia insignia-punteada", `${PUNTEADO}${ES("por decidir", "to decide")}`],
    ["aprobada", "insignia", `${OK}${ES("aprobada", "approved")}`],
    ["rechazada", "insignia insignia-llena", ES("rechazada", "rejected")],
  ]
    .map(([id, clase, txt]) => `<span class="${clase}" data-estado-si="${id}"${(porCodigo ? id !== "rechazada" : id !== "por-decidir") ? " hidden" : ""}>${txt}</span>`)
    .join("");

const tarjeta = (e) => {
  const n = nivel(e.puntaje);
  const [fes, fen, url, tes, ten, fpub, conf] = e.fuente;
  const porCodigo = e.verif === "no-encontrada";
  const meta = [
    [ES("Fuente", "Source"), `<a href="${url}">${ES(fes, fen)}</a> <span class="mono">${ES(tes, ten)} · ${fpub}</span>`],
    [ES("Madurez", "Maturity"), ES(MADUREZ[e.madurez].es, MADUREZ[e.madurez].en)],
    [ES("Conflicto de interés", "Conflict of interest"), ES(...CONFLICTO[conf])],
    [ES("Componentes", "Components"), ES(...e.componentes)],
    ...(e.limitaciones ? [[ES("Limitaciones", "Limitations"), ES(...e.limitaciones)]] : []),
    ...(e.esencial ? [[ES("Esencial", "Essential"), ES("sí: si el criterio tiene varias evidencias, el mínimo la cuenta", "yes: if the criterion has several pieces of evidence, the minimum counts it")]] : []),
  ];
  return `<article class="afirmacion evidencia-rev" data-evidencia="${e.a}"${porCodigo ? ' data-inicial="rechazada"' : ""}>
      <header><span class="cod">${e.a}</span><span class="mono">${e.id}</span>${insignias(porCodigo)}</header>
      <p class="afirmacion-sobre">${ES(e.criterio[0], e.criterio[1])} <span class="mono">· ${ES(e.tipo[0], e.tipo[1])}</span></p>
      <p class="evidencia-afirma">${ES(e.afirma[0], e.afirma[1])}</p>
      ${tira(e)}
      <p class="ancla"><b>${e.puntaje} · ${ES(esc(n.nombre.es), esc(n.nombre.en))}.</b> ${ES(esc(n.descripcion.es), esc(n.descripcion.en))}</p>
      <p class="porque"><b>${porQue(e.puntaje)}</b> ${ES(e.porque[0], e.porque[1])}</p>
      <blockquote class="evidencia-cita${e.verif === "verificada" ? "" : " evidencia-no-verificada"}" lang="en">«${esc(e.cita)}»</blockquote>
      ${verificacion(e)}
      <dl class="evidencia-meta">${meta.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}</dl>
      ${porCodigo ? "" : `<footer><span class="decidir" role="group" aria-label="${e.a}"><button type="button" class="boton" data-decidir="aprobada" aria-pressed="false">${ES("Aprobar", "Approve")}</button><button type="button" class="boton boton-sec" data-decidir="rechazada" aria-pressed="false">${ES("Rechazar", "Reject")}</button></span></footer>`}
    </article>`;
};

const GRUPOS = [
  [ES("Necesitan tu decisión: el código no pudo verificar la cita", "Need your decision: the code could not check the quote"), (e) => e.verif === "no-verificable"],
  [ES("Citas verificadas por el código: el puntaje lo decides tú", "Quotes verified by the code: you decide the score"), (e) => e.verif === "verificada"],
  [ES("Rechazadas por el código: la cita no aparece en la fuente", "Rejected by the code: the quote is not on the source page"), (e) => e.verif === "no-encontrada"],
];
const grupos = GRUPOS.map(([titulo, f]) => {
  const xs = EVIDENCIAS.filter(f);
  return `<section class="grupo-afirmaciones"><h3 class="ojo">${titulo} · ${xs.length}</h3>
    <div class="kit-grid">${xs.map(tarjeta).join("\n    ")}</div></section>`;
}).join("\n  ");

const anclas = ESCALA.niveles.map((n) => `<li><b>${n.valor} · ${ES(esc(n.nombre.es), esc(n.nombre.en))}.</b> ${ES(esc(n.descripcion.es), esc(n.descripcion.en))}</li>`).join("");
const cuenta = (f) => EVIDENCIAS.filter(f).length;

const cambiarRutas = (html) => html.replace(/(href|src)="(assets\/|index\.html|atlas-nivel-1\.html|atlas-nivel-2\.html|atlas-recorrido\.html|lado-a-lado\.html|investigador\.html|base\.html|perfil\.html|comparacion\.html|decisiones\.html|informe\.html|instrumento\.html)/g, '$1="../diseno/$2');
const html = cambiarRutas(`${head({ es: "Propuesta · Revisar evidencias", en: "Proposal · Reviewing evidence" }, `<style>
  .escala-ref { margin: 0 0 18px; border: 1px solid var(--linea); border-radius: 6px; padding: 10px 14px; background: var(--sup-1); }
  .escala-ref summary { cursor: pointer; font-weight: 600; }
  .escala-anclas { margin: 10px 0 6px; padding-left: 0; list-style: none; display: grid; gap: 6px; font-size: 14px; }
  .escala-tira { list-style: none; margin: 2px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
  .escala-tira li { border: 1px solid var(--linea); border-radius: 4px; padding: 6px 6px 8px; display: grid; gap: 3px; align-content: start; font-size: 12px; line-height: 1.25; color: var(--tinta-2); min-height: 66px; }
  .escala-tira li b { font: 700 16px/1 var(--letra-mono); color: var(--tinta-1); }
  .escala-tira li.sobre-tope { background-image: repeating-linear-gradient(135deg, transparent 0 5px, var(--linea) 5px 7px); }
  .escala-tira li.propuesto { border: 2px solid var(--tinta-1); color: var(--tinta-1); font-weight: 600; }
  .escala-tira li.cuenta { border: 2px dashed var(--tinta-1); color: var(--tinta-1); }
  .escala-tira li i { font: 600 11px/1.2 var(--letra-mono); font-style: normal; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 3px; color: var(--tinta-1); }
  .escala-tira li i svg { display: inline-block; }
  @media (max-width: 479px) {
    .escala-tira { grid-template-columns: 1fr; gap: 3px; }
    .escala-tira li { grid-template-columns: 22px 1fr auto; align-items: center; gap: 8px; min-height: 0; padding: 5px 8px; font-size: 13px; }
  }
  .tope-nota { margin: 0; font-size: 13px; color: var(--tinta-2); }
  .ancla, .porque { margin: 0; }
  .evidencia-rev .decidir { display: inline-flex; gap: 10px; flex-wrap: wrap; }
  .aprobar-ev { margin-top: 8px; }
  .aprobar-ev [data-comando] { display: grid; gap: 8px; }
  .evidencia-rev .insignia[hidden], .aprobar-ev [hidden] { display: none; }
</style>
`)}
<body>
<a class="saltar" href="#contenido">${ES("Saltar al contenido", "Skip to content")}</a>
<div class="mq-bar" role="region" aria-label="Propuesta">
  <span class="mq-t">${ES("Propuesta: así revisarías las evidencias de una plataforma. Toca «Aprobar» o «Rechazar» en cada tarjeta; cuando decidas todas, abajo aparece el comando. Es un boceto: ese comando no se corre.", "Proposal: this is how you would review a platform's evidence. Tap “Approve” or “Reject” on each card; once you decide them all, the command appears at the bottom. It is a sketch: that command is not to be run.")}</span>
</div>
${barra("conocimiento")}
<main class="pagina" id="contenido">
  ${encabezado({ es: "Conocimiento · investigador · propuesta", en: "Knowledge · researcher · proposal" }, { es: "Plataforma Ejemplo (ficticia)", en: "Example Platform (fictional)" }, { es: "Evidencias propuestas: una por criterio, con su puntaje de 0 a 4 y la cita que lo respalda. Nada entra a la base hasta que lo apruebes en tu terminal.", en: "Proposed evidence: one per criterion, with its 0-to-4 score and the quote that backs it. Nothing enters the base until you approve it in your terminal." }, `<p class="meta"><b>${PUNTEADO}${ES("propuesta", "proposal")}</b><span class="punto">·</span><span class="mono">${CARPETA}</span><span class="punto">·</span><span>2026-10-05</span></p>`, false)}
  ${pestanas("conocimiento", "investigador.html")}
  <section class="seccion">
    <h2>${ES("Propuesta: evidencias", "Proposal: evidence")}</h2>
    <div class="tarjeta"><p class="ojo">${ES("Corrida", "Run")}</p><p class="huella"><b>${CARPETA.slice("propuestas/".length)}</b></p><p class="meta"><span>2026-10-05 14:02</span><span class="punto">·</span><span>${ES("modelo declarado en ejecucion.json", "model declared in ejecucion.json")}</span><span class="punto">·</span><span>${ES("validador: válida al primer intento", "validator: valid on the first try")}</span><span class="punto">·</span><span>${ES("9 fuentes consultadas (registro del hook)", "9 sources consulted (hook log)")}</span></p></div>
    <div class="conteo"><span>${ES(`${EVIDENCIAS.length} evidencias`, `${EVIDENCIAS.length} pieces of evidence`)}</span><span>${ES(`${cuenta((e) => e.verif === "verificada")} citas verificadas · ${cuenta((e) => e.verif === "no-verificable")} no verificable · ${cuenta((e) => e.verif === "no-encontrada")} no encontrada`, `${cuenta((e) => e.verif === "verificada")} quotes verified · ${cuenta((e) => e.verif === "no-verificable")} not verifiable · ${cuenta((e) => e.verif === "no-encontrada")} not found`)}</span></div>
    <details class="escala-ref"><summary>${ES("La escala de 0 a 4 y el tope por madurez", "The 0-to-4 scale and the maturity cap")}</summary>
      <ol class="escala-anclas">${anclas}</ol>
      <p class="kit-nota">${ES("Lo que no está disponible de forma general cuenta a lo sumo 2. Si el caso acepta vista previa, la vista previa y la beta cuentan enteras; lo anunciado y lo retirado, nunca más de 2.", "Anything not generally available counts 2 at most. If the case accepts previews, preview and beta count in full; announced and retired, never more than 2.")}</p>
    </details>
  </section>
  ${grupos}
  <section class="aprobar aprobar-ev" aria-labelledby="aprobar-t">
    <h3 id="aprobar-t">${ES("Aprobar lo marcado", "Approve what is marked")}</h3>
    <p class="kit-nota" data-faltan aria-live="polite"><span data-si-n="1" hidden>${ES("Falta 1 evidencia por decidir.", "1 piece of evidence left to decide.")}</span><span data-si-n="varias">${ES('Faltan <b data-n>0</b> evidencias por decidir.', '<b data-n>0</b> pieces of evidence left to decide.')}</span></p>
    <div data-comando hidden>
      <div class="comando"><code data-texto></code><button type="button" class="boton" data-copiar>${ES("Copiar", "Copy")}</button><small>${ES("Solo una persona lo corre, en su propia terminal abierta en la carpeta del proyecto. Cada evidencia aprobada entra a data/evidencias/plataforma-ejemplo/ con tu aprobación y la fecha; la comparación la usa en el siguiente build.", "Only a person runs it, in their own terminal opened in the project folder. Each approved piece of evidence goes into data/evidencias/plataforma-ejemplo/ with your approval and the date; the comparison uses it on the next build.")}</small></div>
    </div>
  </section>
  <ul class="prop-notas">
    <li>${ES("<b>Qué cambia frente a la revisión de un mapa:</b> cada tarjeta suma la regla de 0 a 4 con el puntaje propuesto, el texto de ese nivel y por qué ese y no el de al lado. Y ninguna viene aprobada de entrada: el código comprueba la cita, no el puntaje.", "<b>What changes from reviewing a map:</b> each card adds the 0-to-4 ruler with the proposed score, that level's text and why that one and not the next. And none comes approved by default: the code checks the quote, not the score.")}</li>
    <li>${ES("<b>El tope por madurez</b> se ve en la misma regla: lo rayado no cuenta con esa madurez. La propuesta puntúa la función; el tope lo aplica el motor.", "<b>The maturity cap</b> shows on the same ruler: what is hatched does not count at that maturity. The proposal scores the feature; the engine applies the cap.")}</li>
    <li>${ES("<b>En el teléfono,</b> una tarjeta por fila y la regla de 0 a 4 en vertical, un nivel por renglón, para que cada nombre quepa entero.", "<b>On the phone,</b> one card per row and the 0-to-4 ruler stands vertical, one level per line, so every name fits whole.")}</li>
  </ul>
</main>
<script src="revision-evidencias.js" defer></script>
${pie}`);

const JS = `/* Boceto M1 (S3): Aprobar / Rechazar en cada tarjeta y el comando que arma la página con lo marcado. Las
   rechazadas por el código entran rechazadas y sin botones. El prefijo sale de comandoAprobar. */
(function () {
  var PREFIJO = ${JSON.stringify(PREFIJO)};
  var tarjetas = [].slice.call(document.querySelectorAll("[data-evidencia]"));
  var estado = {};
  tarjetas.forEach(function (t) { estado[t.getAttribute("data-evidencia")] = t.getAttribute("data-inicial") || ""; });
  var faltanP = document.querySelector("[data-faltan]");
  var bloque = document.querySelector("[data-comando]");
  var texto = document.querySelector("[data-texto]");
  var copiar = document.querySelector("[data-copiar]");
  function pintar() {
    var ap = [], re = [], faltan = 0;
    tarjetas.forEach(function (t) {
      var id = t.getAttribute("data-evidencia"), d = estado[id];
      if (d === "aprobada") ap.push(id); else if (d === "rechazada") re.push(id); else faltan++;
      t.querySelectorAll("[data-decidir]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-decidir") === d)); });
      t.querySelectorAll("[data-estado-si]").forEach(function (s) { s.hidden = s.getAttribute("data-estado-si") !== (d || "por-decidir"); });
    });
    faltanP.hidden = faltan === 0;
    faltanP.querySelectorAll("[data-n]").forEach(function (n) { n.textContent = String(faltan); });
    faltanP.querySelector('[data-si-n="1"]').hidden = faltan !== 1;
    faltanP.querySelector('[data-si-n="varias"]').hidden = faltan === 1;
    bloque.hidden = faltan !== 0;
    texto.textContent = PREFIJO + " --aprobar " + (ap.join(",") || "-") + " --rechazar " + (re.join(",") || "-") + " --retirar -";
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-decidir]");
    if (!b) return;
    estado[b.closest("[data-evidencia]").getAttribute("data-evidencia")] = b.getAttribute("data-decidir");
    pintar();
  });
  copiar.addEventListener("click", function () {
    var t = texto.textContent;
    var hecho = function () { copiar.setAttribute("data-copiado", ""); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(hecho, function () {});
    else { var r = document.createRange(); r.selectNodeContents(texto); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); hecho(); }
  });
  pintar();
})();
`;
const DIR = resolve(RAIZ, "docs/propuestas-de-diseno");
fs.writeFileSync(resolve(DIR, "revision-evidencias.html"), html);
fs.writeFileSync(resolve(DIR, "revision-evidencias.js"), JS);
console.log(`revision-evidencias: ${(html.length / 1024).toFixed(1)} KB · ${EVIDENCIAS.length} evidencias`);
