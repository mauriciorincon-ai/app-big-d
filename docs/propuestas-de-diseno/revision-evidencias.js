/* Boceto M1 (S3): Aprobar / Rechazar en cada tarjeta y el comando que arma la página con lo marcado. Las
   rechazadas por el código entran rechazadas y sin botones. El prefijo sale de comandoAprobar. */
(function () {
  var PREFIJO = "node scripts/aprobar.mjs propuestas/2026-10-05-plataforma-ejemplo-evidencias";
  var tarjetas = [].slice.call(document.querySelectorAll("[data-evidencia]"));
  var estado = {};
  tarjetas.forEach(function (t) { estado[t.getAttribute("data-evidencia")] = t.getAttribute("data-inicial") || ""; });
  var faltanP = document.querySelector("[data-faltan]");
  var bloque = document.querySelector("[data-comando]");
  var texto = document.querySelector("[data-texto]");
  var copiar = document.querySelector("[data-copiar]");
  function pintar() {
    var ap = [], re = [], faltan = 0;
    tarjetas.forEach(function (t) {
      var id = t.getAttribute("data-evidencia"), d = estado[id];
      if (d === "aprobada") ap.push(id); else if (d === "rechazada") re.push(id); else faltan++;
      t.querySelectorAll("[data-decidir]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-decidir") === d)); });
      t.querySelectorAll("[data-estado-si]").forEach(function (s) { s.hidden = s.getAttribute("data-estado-si") !== (d || "por-decidir"); });
    });
    faltanP.hidden = faltan === 0;
    faltanP.querySelectorAll("[data-n]").forEach(function (n) { n.textContent = String(faltan); });
    faltanP.querySelector('[data-si-n="1"]').hidden = faltan !== 1;
    faltanP.querySelector('[data-si-n="varias"]').hidden = faltan === 1;
    bloque.hidden = faltan !== 0;
    texto.textContent = PREFIJO + " --aprobar " + (ap.join(",") || "-") + " --rechazar " + (re.join(",") || "-") + " --retirar -";
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-decidir]");
    if (!b) return;
    estado[b.closest("[data-evidencia]").getAttribute("data-evidencia")] = b.getAttribute("data-decidir");
    pintar();
  });
  copiar.addEventListener("click", function () {
    var t = texto.textContent;
    var hecho = function () { copiar.setAttribute("data-copiado", ""); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(hecho, function () {});
    else { var r = document.createRange(); r.selectNodeContents(texto); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); hecho(); }
  });
  pintar();
})();
