/* Barra de SALA DE DISEÑO de la maqueta de Big-D (no es producto).
   - Estados = preajustes: cada botón [data-estado] fija ejes con data-fija="eje:valor eje:valor".
   - Visibilidad: todo [data-si="eje:v1|v2 otro:v"] se muestra solo si se cumplen TODAS sus
     condiciones; si no, recibe [data-oculto].
   - Tema e idioma: botones [data-theme-set] / [data-lang-set] (en la barra de la app); se
     recuerdan por visitante (localStorage, con try/catch: la página funciona sin él).
   - Accesibilidad: [data-aria-es|en] da el aria-label en el idioma activo; title[data-es|en] igual.
   - Expone window.mqAplicar() para el arnés de capturas. */
(function () {
  var html = document.documentElement;
  var PREFIJO = "bigd-maqueta-";
  function guarda(k, v) {
    try {
      localStorage.setItem(PREFIJO + k, v);
    } catch (e) {
      /* sin almacenamiento: no pasa nada */
    }
  }
  function lee(k) {
    try {
      return localStorage.getItem(PREFIJO + k);
    } catch (e) {
      return null;
    }
  }
  html.dataset.theme = lee("theme") || html.dataset.theme || "oscuro";
  html.dataset.lang = lee("lang") || html.dataset.lang || "es";
  var ejes = {};

  function aplicarPreajuste() {
    var b = document.querySelector('.mq-bar [data-estado="' + html.dataset.estado + '"]');
    if (!b) {
      b = document.querySelector(".mq-bar [data-estado]");
      if (b) html.dataset.estado = b.dataset.estado;
    }
    if (!b) return;
    (b.dataset.fija || "").split(" ").forEach(function (par) {
      if (!par) return;
      var kv = par.split(":");
      ejes[kv[0]] = kv[1];
    });
  }

  function cumple(cond) {
    return cond.split(" ").every(function (c) {
      if (!c) return true;
      var kv = c.split(":");
      var v = kv[0] === "lang" ? html.dataset.lang : kv[0] === "theme" ? html.dataset.theme : ejes[kv[0]];
      return kv[1].split("|").indexOf(v) >= 0;
    });
  }

  function aplicar() {
    aplicarPreajuste();
    for (var k in ejes) html.setAttribute("data-eje-" + k, ejes[k]);
    document.querySelectorAll("[data-si]").forEach(function (el) {
      if (cumple(el.getAttribute("data-si"))) el.removeAttribute("data-oculto");
      else el.setAttribute("data-oculto", "");
    });
    var lang = html.dataset.lang;
    html.lang = lang;
    document.querySelectorAll("[data-aria-" + lang + "]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-aria-" + lang));
    });
    document.querySelectorAll("title[data-" + lang + "]").forEach(function (el) {
      el.textContent = el.getAttribute("data-" + lang);
    });
    document.querySelectorAll(".mq-bar [data-estado]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.estado === html.dataset.estado));
    });
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.themeSet === html.dataset.theme));
    });
    document.querySelectorAll("[data-lang-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.langSet === lang));
    });
    document.querySelectorAll(".mq-nota [data-para]").forEach(function (n) {
      n.hidden = n.dataset.para !== html.dataset.estado;
    });
  }

  /* Ficha breve del nivel 1: al activar un bloque, su línea de la lectura en texto. */
  function activar(el) {
    var panel = document.getElementById("ficha-breve");
    if (!panel) return;
    document.querySelectorAll('.dg-elem[aria-current="true"]').forEach(function (x) {
      x.removeAttribute("aria-current");
    });
    el.setAttribute("aria-current", "true");
    var id = el.getAttribute("data-dueno");
    var li = document.querySelector('.lectura:not([data-oculto]) li[data-elem="' + id + '"]');
    panel.querySelector(".ficha-breve-cuerpo").innerHTML = li ? li.innerHTML : "";
    panel.hidden = false;
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("button, .dg-elem");
    if (!t) return;
    if (t.classList.contains("dg-elem")) return activar(t);
    if (t.dataset.estado && t.closest(".mq-bar")) {
      ejes = {};
      html.dataset.estado = t.dataset.estado;
    }
    if (t.dataset.themeSet) {
      html.dataset.theme = t.dataset.themeSet;
      guarda("theme", t.dataset.themeSet);
    }
    if (t.dataset.langSet) {
      html.dataset.lang = t.dataset.langSet;
      guarda("lang", t.dataset.langSet);
    }
    if (t.dataset.cerrar) document.getElementById(t.dataset.cerrar).hidden = true;
    aplicar();
  });
  document.addEventListener("keydown", function (ev) {
    var t = ev.target.closest && ev.target.closest(".dg-elem");
    if (t && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      activar(t);
    }
  });

  window.mqAplicar = function () {
    ejes = {};
    aplicar();
  };
  aplicar();
})();
