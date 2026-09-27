"use client";

import { useEffect, useState } from "react";

/**
 * Capa interactiva del lienzo (CONTRATO § 8: SVG en el build, interacción en el cliente, enganchada a ids
 * estables). No dibuja el mapa: lo encuentra dentro de `#{mapa}` y le suma
 *   - desborde: `data-desborda` en la sección cuando el SVG no cabe (aparecen el índice y la pista);
 *   - sombras de borde: `data-mas-izq` / `data-mas-der` en el marco según lo que queda oculto;
 *   - índice de capas: cada botón `[data-col]` desplaza el lienzo hasta la x de su capa;
 *   - ficha breve: al activar un bloque (clic, Enter o Espacio) muestra su entrada de la lectura en texto.
 * Con teclado, el lienzo es una región enfocable y las flechas lo desplazan (lo hace el navegador).
 * El árbol es el mismo en el servidor y en el cliente: la ficha nace oculta y solo cambia su contenido.
 */
export function ControlLienzo({ mapa, lectura }: { mapa: string; lectura: string }) {
  const [ficha, setFicha] = useState<string | null>(null);

  useEffect(() => {
    const raiz = document.getElementById(mapa);
    const lienzo = raiz?.querySelector<HTMLElement>(".lienzo");
    const marco = raiz?.querySelector<HTMLElement>(".lienzo-marco");
    if (!raiz || !lienzo || !marco) return;
    const botones = [...raiz.querySelectorAll<HTMLElement>(".indice [data-col]")];

    function medir() {
      const sobra = lienzo!.scrollWidth - lienzo!.clientWidth;
      raiz!.toggleAttribute("data-desborda", sobra > 2);
      marco!.toggleAttribute("data-mas-izq", lienzo!.scrollLeft > 2);
      marco!.toggleAttribute("data-mas-der", lienzo!.scrollLeft < sobra - 2);
      // La capa vigente es la última que empieza antes del borde izquierdo (+40 px); al final del
      // desplazamiento, la última: la columna final nunca llega al borde izquierdo en un lienzo angosto.
      let actual: HTMLElement | null = null;
      for (const b of botones) if (Number(b.dataset.x) <= lienzo!.scrollLeft + 40) actual = b;
      if (sobra > 2 && lienzo!.scrollLeft >= sobra - 2) actual = botones[botones.length - 1] ?? actual;
      for (const b of botones) b.setAttribute("aria-current", String(b === actual));
    }

    function activar(el: Element) {
      for (const x of raiz!.querySelectorAll('.dg-elem[aria-current="true"]')) x.removeAttribute("aria-current");
      el.setAttribute("aria-current", "true");
      const id = el.getAttribute("data-dueno") ?? "";
      const texto = document.getElementById(lectura);
      // Un bloque se lee en su entrada; una caja sin bloque («_banda») en la entrada de su banda.
      const li = id.startsWith("_")
        ? texto?.querySelector(`li[data-banda="${CSS.escape(id.slice(1))}"]`)
        : texto?.querySelector(`li[data-bloque="${CSS.escape(id)}"]`);
      setFicha(li ? li.innerHTML : "");
    }

    function alClic(ev: MouseEvent) {
      const objetivo = ev.target as Element;
      const boton = objetivo.closest<HTMLElement>(".indice [data-col]");
      if (boton) {
        lienzo!.scrollLeft = Math.max(0, Number(boton.dataset.x) - 8);
        medir();
        return;
      }
      const elem = objetivo.closest(".dg-elem");
      if (elem) activar(elem);
    }
    function alTecla(ev: KeyboardEvent) {
      const elem = (ev.target as Element).closest?.(".dg-elem");
      if (elem && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        activar(elem);
      }
    }

    raiz.addEventListener("click", alClic);
    raiz.addEventListener("keydown", alTecla);
    lienzo.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(lienzo);
    medir();
    return () => {
      raiz.removeEventListener("click", alClic);
      raiz.removeEventListener("keydown", alTecla);
      lienzo.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [mapa, lectura]);

  return (
    <div className="ficha-viva" aria-live="polite">
      {/* El contenido es la entrada de la lectura en texto, generada por el motor en el build. */}
      <div className="ficha" id="ficha-breve" hidden={ficha === null} dangerouslySetInnerHTML={{ __html: ficha ?? "" }} />
    </div>
  );
}
