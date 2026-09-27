/* Lado a lado: en teléfono se compara UNA banda a la vez (pestañas `data-banda-ir`); en ancho la
   paginación de plataformas cambia el eje `pag` de la sala (tres a la vez es constante de la vista).
   Vista «bloques | componentes» (`data-vista-set`): la segunda abre cada bloque en sus nodos; en
   teléfono despliega todas las filas de la banda. La paginación funciona igual en las dos vistas.
   Los componentes de un bloque: en ancho los abre `ficha.js` en el panel; en teléfono cada fila
   lleva un desplegable `[data-comp]`, y el preajuste `ficha:<plataforma>-<banda>` lo despliega y
   muestra su banda. Solo se obedece al preajuste cuando CAMBIA (la sala lo re-aplica en cada clic). */
(function () {
  var ang = document.querySelector(".lado-angosto");
  var html = document.documentElement;
  var PRESET = { mapas: { 1: "tres", 2: "pagina" }, comp: { 1: "desplegados", 2: "desplegados-2" } };
  function ir(vista, pag) {
    html.setAttribute("data-estado", PRESET[vista][pag]);
    if (window.mqAplicar) window.mqAplicar();
  }
  function vistaActual() { return html.getAttribute("data-eje-vista") === "comp" ? "comp" : "mapas"; }
  function pagActual() { return html.getAttribute("data-eje-pag") === "2" ? "2" : "1"; }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-banda-ir]");
    if (b && ang) {
      ang.setAttribute("data-banda", b.getAttribute("data-banda-ir"));
      ang.querySelectorAll("[data-banda-ir]").forEach(function (x) { x.setAttribute("aria-current", String(x === b)); });
    }
    var p = ev.target.closest("[data-pag]");
    if (p) ir(vistaActual(), p.getAttribute("data-pag"));
    var v = ev.target.closest("[data-vista-set]");
    if (v) ir(v.getAttribute("data-vista-set"), pagActual());
  });
  var ultimo = null;
  function preajuste() {
    var clave = html.getAttribute("data-eje-ficha") + "|" + html.getAttribute("data-eje-vista");
    document.querySelectorAll("[data-vista-set]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-vista-set") === vistaActual())); });
    if (clave === ultimo || !ang) return;
    ultimo = clave;
    var f = html.getAttribute("data-eje-ficha");
    var todas = vistaActual() === "comp";
    ang.querySelectorAll("[data-comp]").forEach(function (d) { d.open = todas || d.getAttribute("data-comp") === f; });
    var banda = f && f !== "ninguna" ? f.slice(f.indexOf("-") + 1) : null;
    if (banda) {
      ang.setAttribute("data-banda", banda);
      ang.querySelectorAll("[data-banda-ir]").forEach(function (x) { x.setAttribute("aria-current", String(x.getAttribute("data-banda-ir") === banda)); });
    }
  }
  new MutationObserver(preajuste).observe(html, { attributes: true, attributeFilter: ["data-eje-ficha", "data-eje-vista"] });
  preajuste();
})();
