/* Ficha de nodo (nivel 2): al activar un nodo del lienzo se abre el panel con su artículo.
   Hoja inferior en teléfono, panel lateral en desktop (solo CSS). Preajustes de sala: el eje
   `ficha:<id>` abre ese nodo; `ficha:ninguna` cierra. Esc cierra. */
(function () {
  var html = document.documentElement;
  var panel = document.getElementById("panel-ficha");
  if (!panel) return;
  function abrir(id) {
    var hay = false;
    panel.querySelectorAll("[data-ficha]").forEach(function (a) {
      var es = a.getAttribute("data-ficha") === id;
      a.hidden = !es;
      if (es) hay = true;
    });
    document.querySelectorAll('.db-nodo[aria-current="true"]').forEach(function (n) { n.removeAttribute("aria-current"); });
    if (!hay) { panel.hidden = true; return; }
    document.querySelectorAll('.db-nodo[data-nodo="' + id + '"]').forEach(function (n) { n.setAttribute("aria-current", "true"); });
    panel.hidden = false;
    panel.querySelector(".panel-cuerpo").scrollTop = 0;
  }
  document.addEventListener("click", function (ev) {
    var n = ev.target.closest(".db-nodo");
    if (n) { ev.stopPropagation(); abrir(n.getAttribute("data-nodo")); }
  }, true);
  document.addEventListener("keydown", function (ev) {
    var n = ev.target.closest && ev.target.closest(".db-nodo");
    if (n && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); abrir(n.getAttribute("data-nodo")); }
    if (ev.key === "Escape" && !panel.hidden) { panel.hidden = true; document.querySelectorAll('.db-nodo[aria-current="true"]').forEach(function (x) { x.removeAttribute("aria-current"); }); }
  });
  new MutationObserver(function () {
    var v = html.getAttribute("data-eje-ficha");
    if (v === null) return;
    abrir(v === "ninguna" ? "" : v);
  }).observe(html, { attributes: true, attributeFilter: ["data-eje-ficha"] });
  var v0 = html.getAttribute("data-eje-ficha");
  if (v0 && v0 !== "ninguna") abrir(v0);
})();
