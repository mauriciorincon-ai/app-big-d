"use client";

import { useSyncExternalStore } from "react";
import { CLAVE_TEMA } from "./scriptTema";

type Tema = "oscuro" | "claro";

/** Tema efectivo: el atributo elegido, o el del sistema si no hay elección. */
function temaEfectivo(): Tema {
  const elegido = document.documentElement.getAttribute("data-theme");
  if (elegido === "oscuro" || elegido === "claro") return elegido;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro";
}

/** Se entera si cambia el atributo (este u otro conmutador) o la preferencia del sistema. */
function suscribir(avisar: () => void) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const sistema = window.matchMedia("(prefers-color-scheme: light)");
  sistema.addEventListener("change", avisar);
  return () => {
    observador.disconnect();
    sistema.removeEventListener("change", avisar);
  };
}

export function ConmutadorTema({ etiqueta, oscuro, claro }: { etiqueta: string; oscuro: string; claro: string }) {
  // El servidor no conoce el tema: los dos botones nacen sin marcar y el cliente marca el vigente.
  // El árbol es el mismo en servidor y cliente; solo cambia `aria-pressed` (regla 5-a).
  const actual = useSyncExternalStore<Tema | null>(suscribir, temaEfectivo, () => null);

  function elegir(tema: Tema) {
    document.documentElement.setAttribute("data-theme", tema);
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin almacenamiento (ventana privada): el tema vale para esta página.
    }
  }

  return (
    <div className="alterna" role="group" aria-label={etiqueta}>
      <button type="button" data-theme-set="oscuro" aria-pressed={actual === "oscuro"} onClick={() => elegir("oscuro")}>
        {oscuro}
      </button>
      <span className="sep" aria-hidden="true">/</span>
      <button type="button" data-theme-set="claro" aria-pressed={actual === "claro"} onClick={() => elegir("claro")}>
        {claro}
      </button>
    </div>
  );
}
