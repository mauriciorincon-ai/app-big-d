/* Informe: la VISTA DE IMPRESIÓN es papel claro en cualquier tema (clase `tema-claro`, que tokens.css
   define con los valores del tema claro) y la impresión real usa `@media print`. «Imprimir» abre el
   diálogo del navegador. Solo obedece al preajuste cuando cambia (la sala lo re-aplica en cada clic). */
(function () {
  var html = document.documentElement;
  var inf = document.querySelector(".informe");
  var ultimo = null;
  function aplicar() {
    var v = html.getAttribute("data-eje-vista");
    if (v === ultimo || !inf) return;
    ultimo = v;
    inf.classList.toggle("tema-claro", v === "impresion");
    inf.classList.toggle("papel", v === "impresion");
  }
  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-imprimir]")) window.print();
  });
  new MutationObserver(aplicar).observe(html, { attributes: true, attributeFilter: ["data-eje-vista"] });
  aplicar();
})();
