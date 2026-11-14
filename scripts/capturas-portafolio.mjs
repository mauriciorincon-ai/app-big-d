// S10 (F1, 026-4): los 15 encuadres del modo «Portafolio» de `pnpm capturas:producto --portafolio` = la portada y las 14 piezas de
// `vitrina/apps/026/big-d/capturas.yaml` de la planeadora (la funcionalidad de cada una es su `id`). Cada encuadre es una ruta en
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

/**
 * { id, archivo, ruta, paso?, arbol?, contiene? } — `id` es la funcionalidad del manual (F1…F14) o «portada».
 * `arbol` (por omisión «out») es el export que fotografía el encuadre: `capturas.yaml` pide F11 de la base sembrada («base de
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
];
