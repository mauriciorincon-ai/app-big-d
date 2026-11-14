  (function () {
    // S10 · escenas del storyboard. E1 y E2: un disparo al entrar en pantalla (la clase «visto»; el CSS decide si hay
    // movimiento). E3, el clímax: la segunda fila cambia el orden de sus nombres TRES vueltas al entrar (menos de 5 s) y el
    // botón repite la jugada; la huella no se toca nunca. Sin azar: el ciclo de órdenes está escrito abajo. Con
    // reduced-motion el árbol es el mismo, nada arranca solo y el botón cambia el orden al instante, sin transición.
    var escenas = document.querySelectorAll(".escena-viva");
    var ver = function (el) { el.classList.add("visto"); };
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { ver(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0 });
      escenas.forEach(function (el) { obs.observe(el); });
    } else { escenas.forEach(ver); }

    var fila = document.querySelector("[data-fila-viva]");
    if (!fila) return;
    var fichas = Array.prototype.slice.call(fila.querySelectorAll(".ficha"));
    // El ciclo de órdenes: en la vuelta s la ficha i ocupa el lugar (i - s - 1) módulo N, con N las fichas de la fila; en la
    // vuelta N vuelve al orden de partida. N sale del documento (hoy las plataformas de la demo), no de un literal.
    var N = fichas.length;
    var CICLO = [];
    for (var s = 0; s < N; s++) CICLO.push(fichas.map(function (_, i) { return (((i - s - 1) % N) + N) % N; }));
    var paso = 0, timer = 0, vueltas = 0, ancho = 0;
    var medir = function () { ancho = fichas.length > 1 ? fichas[1].offsetLeft - fichas[0].offsetLeft : 0; };
    var colocar = function (lugares) {
      fichas.forEach(function (f, i) { f.style.setProperty("--dx", (lugares[i] - i) * ancho + "px"); });
    };
    var vuelta = function () {
      colocar(CICLO[paso % CICLO.length]);
      paso += 1; vueltas += 1;
      fila.setAttribute("data-vuelta", String(vueltas));
    };
    var jugada = function () {
      clearInterval(timer);
      var quedan = N;
      vuelta(); quedan -= 1;
      timer = setInterval(function () {
        if (document.hidden) return;
        vuelta(); quedan -= 1;
        if (quedan <= 0) clearInterval(timer);
      }, 1500);
    };
    medir();
    window.addEventListener("resize", function () { medir(); colocar(CICLO[(paso + CICLO.length - 1) % CICLO.length]); });
    var climax = document.getElementById("e3-neutralidad");
    // Con reduced-motion la escena ya está completa (dos órdenes, una huella): nada arranca solo; el botón sí responde.
    var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("IntersectionObserver" in window && climax && !quieto) {
      var o = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !fila.hasAttribute("data-vuelta")) jugada();
          if (!e.isIntersecting) clearInterval(timer);
        });
      }, { threshold: 0 });
      o.observe(climax);
    }
    var boton = document.querySelector("[data-repetir]");
    if (boton) boton.addEventListener("click", jugada);
  })();
