/* Ficha de nodo (nivel 2): al activar un nodo del lienzo se abre el panel con su artículo.
   Hoja inferior en teléfono, panel lateral en desktop (solo CSS). Preajustes de sala: el eje
   `ficha:<id>` abre ese nodo; `ficha:ninguna` cierra. Esc cierra.
   Foco: si la abre el usuario, el foco va al título de la ficha; al cerrar (Esc o «Cerrar») vuelve al
   nodo de origen. Los preajustes de la sala no mueven el foco. */
(function () {
  var html = document.documentElement;
  var panel = document.getElementById("panel-ficha");
  if (!panel) return;
  var volver = null;
  function abrir(id, origen) {
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
    if (origen) {
      volver = origen;
      var t = panel.querySelector('[data-ficha="' + id + '"] h2, [data-ficha="' + id + '"] h3');
      if (t) { t.setAttribute("tabindex", "-1"); t.focus(); }
    }
  }
  function cerrar() {
    panel.hidden = true;
    document.querySelectorAll('.db-nodo[aria-current="true"]').forEach(function (x) { x.removeAttribute("aria-current"); });
    if (volver) { var v = volver; volver = null; v.focus(); }
  }
  document.addEventListener("click", function (ev) {
    var n = ev.target.closest(".db-nodo");
    if (n) { ev.stopPropagation(); abrir(n.getAttribute("data-nodo"), n); return; }
    if (ev.target.closest('[data-cerrar="panel-ficha"]')) { ev.stopPropagation(); cerrar(); }
  }, true);
  document.addEventListener("keydown", function (ev) {
    var n = ev.target.closest && ev.target.closest(".db-nodo");
    if (n && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); abrir(n.getAttribute("data-nodo"), n); }
    if (ev.key === "Escape" && !panel.hidden) cerrar();
  });
  new MutationObserver(function () {
    var v = html.getAttribute("data-eje-ficha");
    if (v === null) return;
    abrir(v === "ninguna" ? "" : v);
  }).observe(html, { attributes: true, attributeFilter: ["data-eje-ficha"] });
  var v0 = html.getAttribute("data-eje-ficha");
  if (v0 && v0 !== "ninguna") abrir(v0);
})();
