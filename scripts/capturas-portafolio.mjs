// S10 (F1, 026-4; S11 F2): los encuadres del modo «Portafolio» de `pnpm capturas:producto --portafolio` = la portada y una pieza por
// funcionalidad del export (F1…F21; `vitrina/apps/026/big-d/capturas.yaml` de la planeadora pedía F1…F14). La funcionalidad de cada una es su `id`.
// Una funcionalidad sin pantalla se declara en `SIN_PANTALLA`; un test cruza `docs/brochure-export.json` con las dos listas. Cada encuadre es una ruta en
// español, tema claro, y un paso opcional que deja la pantalla como la pieza la pide (abrir la ficha, bajar a la lectura en texto).
// El tamaño lo manda el sprint (1024×640, DPR 1,5, solo el área visible), no el yaml (que pedía 1536×960 a DPR 3).
export const VENTANA = { width: 1024, height: 640 };
export const ESCALA = 1.5;

/** Abre la ficha del primer nodo o componente del lienzo (la ventana lateral de la pieza F2). */
const abrirFicha = async (p) => {
  await p.locator(".lienzo .dg-elem, .lienzo .dg-nodo").first().evaluate((el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await p.locator("#panel-ficha").waitFor({ state: "visible", timeout: 2000 });
};
/** Abre y baja hasta la lectura en texto, debajo del mapa (la pieza F4): el `<details class="lectura-seccion">`. */
const bajarALectura = async (p) => {
  const lectura = p.locator("details.lectura-seccion").first();
  await lectura.locator("summary").click();
  await lectura.scrollIntoViewIfNeeded();
};

/** Baja hasta el titular que contiene `texto` (F15 «Qué cambió», F20 «Se lee por columnas»): el encuadre arranca ahí. */
const bajarATexto = (texto) => async (p) => {
  const el = p.locator("main").getByText(texto).first();
  await el.scrollIntoViewIfNeeded();
  await el.evaluate((n) => n.scrollIntoView({ block: "start" }));
};
/** Abre el `<details>` con ese atributo en la página del caso y lo deja arriba de la ventana. */
const abrirDetalle = (atributo) => async (p) => {
  const d = p.locator(`details[${atributo}]`);
  await d.locator("summary").first().click();
  await d.evaluate((n) => n.scrollIntoView({ block: "start" }));
  return d;
};
/** F16: abre «Comparar por pares» y juzga los primeros pares con las opciones que ofrece cada lista. */
const juzgarPares = async (p) => {
  const d = await abrirDetalle("data-pares")(p);
  const listas = d.locator("select");
  const n = Math.min(4, await listas.count());
  for (let i = 0; i < n; i++) await listas.nth(i).selectOption({ index: 1 + (i % 2) });
  await d.evaluate((x) => x.scrollIntoView({ block: "start" }));
};
/** F18: abre la entrevista y responde las dos primeras preguntas. */
const responderEntrevista = async (p) => {
  const d = await abrirDetalle("data-entrevista")(p);
  const grupos = d.locator("fieldset");
  for (let i = 0; i < Math.min(2, await grupos.count()); i++) await grupos.nth(i).locator('input[type="radio"]').first().check();
  await d.evaluate((x) => x.scrollIntoView({ block: "start" }));
};

/**
 * { id, archivo, ruta, paso?, arbol?, contiene? } — `id` es la funcionalidad del manual (F1…F14) o «portada».
 * `arbol` (por omisión «out»; también `out-sembrada` y `out-demo`, la demo pública en /piezas/big-d) es el export que fotografía el encuadre: `capturas.yaml` pide F11 de la base sembrada («base de
 * prueba, ficticia»), así que ese encuadre solo se toma con `--arbol out-sembrada` (en el árbol real el perfil es borrador y no
 * hay totales). `contiene` es una expresión que el texto visible debe cumplir: sin ella un encuadre «existe» pero puede estar
 * vacío. F6 (propuesta real reabierta, «-ensayo») depende de lo que haya en `propuestas/` en el equipo de quien captura y no se
 * puede afirmar desde el repo: se documenta aquí y en el cierre en vez de simularlo.
 */
export const ENCUADRES = [
  { id: "portada", archivo: "entrada", ruta: "/es" },
  { id: "F1", archivo: "F1", ruta: "/es/atlas/fabric", contiene: "Fabric" },
  { id: "F2", archivo: "F2", ruta: "/es/atlas/fabric/componentes", paso: abrirFicha },
  { id: "F3", archivo: "F3", ruta: "/es/atlas/fabric/recorrido" },
  { id: "F7", archivo: "F7", ruta: "/es/comparar?plataformas=databricks,fabric,snowflake", contiene: "Databricks" },
  { id: "F5", archivo: "F5", ruta: "/es/atlas/snowflake" },
  { id: "F4", archivo: "F4", ruta: "/es/atlas/fabric", paso: bajarALectura },
  { id: "F10", archivo: "F10", ruta: "/es/casos/hospital-futuro" },
  { id: "F11", archivo: "F11", ruta: "/es/casos/hospital-futuro/comparacion", arbol: "out-sembrada", contiene: "Empate técnico" },
  { id: "F13", archivo: "F13", ruta: "/es/casos/hospital-futuro/decisiones" },
  { id: "F14", archivo: "F14", ruta: "/es/casos/hospital-futuro/informe" },
  { id: "F6", archivo: "F6", ruta: "/es/investigador/bigquery" },
  { id: "F9", archivo: "F9", ruta: "/es/base" },
  { id: "F8", archivo: "F8", ruta: "/es/atlas/fabric/versiones" },
  { id: "F12", archivo: "F12", ruta: "/es/instrumento" },
  { id: "F15", archivo: "F15", ruta: "/es/base", arbol: "out-sembrada", paso: bajarATexto("Qué cambió entre instantáneas"), contiene: "Qué cambió entre instantáneas" },
  { id: "F16", archivo: "F16", ruta: "/es/casos/hospital-futuro", paso: juzgarPares, contiene: "Comparar por pares" },
  { id: "F17", archivo: "F17", ruta: "/es/casos/hospital-futuro", paso: abrirDetalle("data-duplicar"), contiene: "Duplicar" },
  { id: "F18", archivo: "F18", ruta: "/es/casos/hospital-futuro", paso: responderEntrevista, contiene: "pregunta" },
  { id: "F20", archivo: "F20", ruta: "/es/comparar?plataformas=bigquery,databricks,snowflake", paso: bajarATexto("Se lee por columnas"), contiene: "Se lee por columnas" },
  { id: "F21", archivo: "F21", ruta: "/es.html", arbol: "out-demo", contiene: "Hospital" },
];

/** Funcionalidades del export que NO tienen pantalla propia: su resultado se ve dentro de otro encuadre. Una sola, con su razón. */
export const SIN_PANTALLA = [
  { id: "F19", razon: "es un comando que corre una persona en su Mac (investigador con el modelo del sistema); su resultado, una propuesta, se ve dentro de F6" },
];
