/* Lado a lado: en teléfono se compara UNA banda a la vez (pestañas `data-banda-ir`); en ancho la
   paginación de plataformas cambia el eje `pag` de la sala (tres a la vez es constante de la vista).
   Los componentes de un bloque: en ancho los abre `ficha.js` en el panel; en teléfono cada fila
   lleva un desplegable `[data-comp]`, y el preajuste `ficha:<plataforma>-<banda>` lo despliega y
   muestra su banda. */
(function () {
  var ang = document.querySelector(".lado-angosto");
  var html = document.documentElement;
  var ultimo = null;
  function preajuste() {
    var v = html.getAttribute("data-eje-ficha");
    if (v === ultimo || !ang) return;
    ultimo = v;
    ang.querySelectorAll("[data-comp]").forEach(function (d) { d.open = d.getAttribute("data-comp") === v; });
    var banda = v && v !== "ninguna" ? v.slice(v.indexOf("-") + 1) : null;
    if (banda) {
      ang.setAttribute("data-banda", banda);
      ang.querySelectorAll("[data-banda-ir]").forEach(function (x) { x.setAttribute("aria-current", String(x.getAttribute("data-banda-ir") === banda)); });
    }
  }
  new MutationObserver(preajuste).observe(html, { attributes: true, attributeFilter: ["data-eje-ficha"] });
  preajuste();
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-banda-ir]");
    if (b && ang) {
      ang.setAttribute("data-banda", b.getAttribute("data-banda-ir"));
      ang.querySelectorAll("[data-banda-ir]").forEach(function (x) { x.setAttribute("aria-current", String(x === b)); });
    }
    var p = ev.target.closest("[data-pag]");
    if (p) { var h = document.documentElement; var actual = h.getAttribute("data-estado"); h.setAttribute("data-estado", p.getAttribute("data-pag") === "2" ? "pagina" : "tres"); if (window.mqAplicar) window.mqAplicar(); }
  });
})();
