/* Lado a lado: en teléfono se compara UNA banda a la vez (pestañas `data-banda-ir`); en ancho la
   paginación de plataformas cambia el eje `pag` de la sala (tres a la vez es constante de la vista). */
(function () {
  var ang = document.querySelector(".lado-angosto");
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
