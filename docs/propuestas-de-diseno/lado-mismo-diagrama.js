/* Boceto M1 (S2), segunda vuelta: un solo botón [data-todo] alterna entre el SVG contraído y el
   desplegado. Las columnas no se mueven, así que el desplazamiento lateral del lienzo se conserva. */
(function () {
  var boton = document.querySelector("[data-todo]");
  boton.addEventListener("click", function () {
    var abre = boton.getAttribute("aria-expanded") !== "true";
    boton.setAttribute("aria-expanded", String(abre));
    boton.querySelectorAll("[data-todo-si]").forEach(function (s) { s.hidden = s.getAttribute("data-todo-si") !== String(abre); });
    document.querySelectorAll("[data-desplegado]").forEach(function (d) { d.hidden = d.getAttribute("data-desplegado") !== String(abre); });
    if (window.mqAplicar) window.mqAplicar();
  });
})();
