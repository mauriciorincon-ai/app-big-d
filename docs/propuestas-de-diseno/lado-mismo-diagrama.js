/* Boceto M1 (S2): una banda abierta a la vez. Tocar el nombre de una banda o uno de sus bloques
   [data-abre] muestra el SVG pregenerado con esa banda desplegada; tocar la banda abierta la cierra.
   Las columnas no se mueven, así que el desplazamiento lateral del lienzo se conserva. */
(function () {
  var actual = "almacenamiento";
  function mostrar(banda, foco) {
    actual = banda;
    document.querySelectorAll("[data-banda-svg]").forEach(function (d) {
      d.hidden = d.getAttribute("data-banda-svg") !== (banda || "ninguna");
    });
    if (window.mqAplicar) window.mqAplicar();
    if (foco) {
      var cab = document.querySelector('[data-banda-svg="' + (banda || "ninguna") + '"] .lado-cab[data-abre="' + foco + '"]');
      if (cab) cab.focus({ preventScroll: true });
    }
  }
  function activar(el) {
    var b = el.getAttribute("data-abre");
    mostrar(b === actual && el.classList.contains("lado-cab") ? null : b, b);
  }
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-abre]");
    if (el) activar(el);
  });
  document.addEventListener("keydown", function (ev) {
    var el = ev.target.closest && ev.target.closest("[data-abre]");
    if (el && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); activar(el); }
  });
})();
