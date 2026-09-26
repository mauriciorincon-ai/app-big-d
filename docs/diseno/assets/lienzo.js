/* Lienzo con desplazamiento lateral (ronda 2): el diagrama jamás se encoge ni se transpone.
   - Marca [data-desborda] en .mapa cuando el SVG visible no cabe; así aparecen el índice de capas y
     la pista «desliza».
   - Sombras de borde: [data-mas-izq] / [data-mas-der] en .lienzo-marco según lo que queda oculto.
   - Índice: cada botón [data-col] lleva la x de su capa por dirección (data-x-a|b|c); al tocarlo, el
     lienzo se desplaza hasta ella. Con teclado, el lienzo es enfocable y las flechas lo mueven. */
(function () {
  function visible(mapa) {
    var svgs = mapa.querySelectorAll(".lienzo svg");
    for (var i = 0; i < svgs.length; i++) if (svgs[i].getClientRects().length) return svgs[i];
    return null;
  }
  function medir(mapa) {
    var lz = mapa.querySelector(".lienzo");
    var marco = mapa.querySelector(".lienzo-marco");
    var sobra = lz.scrollWidth - lz.clientWidth;
    if (sobra > 2) mapa.setAttribute("data-desborda", "");
    else mapa.removeAttribute("data-desborda");
    if (lz.scrollLeft > 2) marco.setAttribute("data-mas-izq", "");
    else marco.removeAttribute("data-mas-izq");
    if (lz.scrollLeft < sobra - 2) marco.setAttribute("data-mas-der", "");
    else marco.removeAttribute("data-mas-der");
    var svg = visible(mapa);
    var dir = svg ? svg.getAttribute("data-dir") : "a";
    var actual = null;
    mapa.querySelectorAll(".indice [data-col]").forEach(function (b) {
      var x = Number(b.getAttribute("data-x-" + dir));
      if (x <= lz.scrollLeft + 40) actual = b;
    });
    mapa.querySelectorAll(".indice [data-col]").forEach(function (b) {
      b.setAttribute("aria-current", String(b === actual));
    });
  }
  document.querySelectorAll(".mapa").forEach(function (mapa) {
    var lz = mapa.querySelector(".lienzo");
    lz.addEventListener("scroll", function () { medir(mapa); }, { passive: true });
    mapa.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-col]");
      if (!b) return;
      var svg = visible(mapa);
      var dir = svg ? svg.getAttribute("data-dir") : "a";
      lz.scrollLeft = Math.max(0, Number(b.getAttribute("data-x-" + dir)) - 8);
      medir(mapa);
    });
    new ResizeObserver(function () { medir(mapa); }).observe(lz);
    document.addEventListener("click", function () { setTimeout(function () { medir(mapa); }, 0); });
    medir(mapa);
  });
})();
