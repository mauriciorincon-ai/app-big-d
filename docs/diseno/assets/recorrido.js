/* Recorrido (nivel 3): el controlador cambia UN atributo del contenedor (`data-paso`); todo lo
   visual lo decide el CSS generado del recorrido (CONTRATO § 4.3). Reproducción automática solo si
   el usuario no pide movimiento reducido (G12); el preajuste `anim:si` de la sala la arranca. */
(function () {
  var rec = document.getElementById("rec");
  if (!rec) return;
  var ORDEN = ["todos", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
  var NUM = { p1: "1", p2: "2", p3: "3", p4: "4", p5: "5", p6: "6a", p7: "7a", p8: "6b" };
  var html = document.documentElement;
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reloj = null;
  function pinta() {
    var p = rec.getAttribute("data-paso");
    var pos = rec.querySelector("[data-rec-pos]");
    var lang = html.getAttribute("data-lang") || "es";
    pos.textContent = p === "todos" ? (lang === "es" ? "Todos los pasos" : "All steps") : (lang === "es" ? "Paso " : "Step ") + NUM[p] + (lang === "es" ? " de 8" : " of 8");
    rec.querySelectorAll("[data-paso-panel]").forEach(function (li) { li.setAttribute("aria-current", String(li.getAttribute("data-paso-panel") === p)); });
    var b = rec.querySelector('[data-rec="reproducir"]');
    if (b) { b.hidden = reducido; b.setAttribute("aria-pressed", String(!!reloj)); b.querySelectorAll("span").forEach(function (s) { s.textContent = reloj ? (s.lang === "es" ? "Pausar" : "Pause") : (s.lang === "es" ? "Reproducir" : "Play"); }); }
    rec.toggleAttribute("data-animando", !!reloj);
  }
  function ir(p) { rec.setAttribute("data-paso", p); pinta(); }
  function paso(d) { var i = ORDEN.indexOf(rec.getAttribute("data-paso")); ir(ORDEN[Math.max(0, Math.min(ORDEN.length - 1, i + d))]); }
  function parar() { if (reloj) { clearInterval(reloj); reloj = null; } pinta(); }
  function reproducir() { if (reducido) return; if (reloj) return parar(); if (rec.getAttribute("data-paso") === "p8") ir("todos"); reloj = setInterval(function () { if (rec.getAttribute("data-paso") === "p8") return parar(); paso(1); }, 2000); paso(1); pinta(); }
  rec.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-rec]");
    if (!b) return;
    var a = b.getAttribute("data-rec");
    if (a === "anterior") { parar(); paso(-1); }
    if (a === "siguiente") { parar(); paso(1); }
    if (a === "todos") { parar(); ir("todos"); }
    if (a === "reproducir") reproducir();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.target.closest("input, textarea")) return;
    if (ev.key === "ArrowRight") { parar(); paso(1); }
    if (ev.key === "ArrowLeft") { parar(); paso(-1); }
  });
  /* La sala re-aplica su preajuste en cada clic: solo se obedece cuando el preajuste CAMBIA. */
  var ultimo = null;
  new MutationObserver(function () {
    var p = html.getAttribute("data-eje-paso"), a = html.getAttribute("data-eje-anim");
    var clave = p + "|" + a;
    if (clave !== ultimo) { ultimo = clave; if (p) { parar(); ir(p); } if (a === "si" && !reducido && !reloj) reproducir(); }
    else pinta();
  }).observe(html, { attributes: true, attributeFilter: ["data-eje-paso", "data-eje-anim", "data-lang"] });
  var p0 = html.getAttribute("data-eje-paso");
  ultimo = p0 + "|" + html.getAttribute("data-eje-anim");
  if (p0) ir(p0); else pinta();
})();
