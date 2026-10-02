"use client";

import { useEffect } from "react";

/**
 * Capa interactiva del lienzo (CONTRATO § 8: SVG en el build, interacción en el cliente, enganchada a ids
 * estables). No dibuja el mapa: lo encuentra dentro de `#{mapa}` y le suma
 *   - desborde: `data-desborda` en la sección cuando el SVG no cabe (aparecen el índice y la pista);
 *   - sombras de borde: `data-mas-izq` / `data-mas-der` en el marco según lo que queda oculto;
 *   - índice de capas: cada botón `[data-col]` desplaza el lienzo hasta la x de su capa.
 * Lo que abre un elemento activable (la ventana de un bloque en el nivel 1, la ficha de un componente en los
 * niveles 2 y 3) es de `PanelFicha`.
 * Con teclado, el lienzo es una región enfocable y las flechas lo desplazan (lo hace el navegador).
 * No pinta nada: el árbol es el mismo en el servidor y en el cliente.
 */
export function ControlLienzo({ mapa }: { mapa: string }) {
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

    function alClic(ev: MouseEvent) {
      const objetivo = ev.target as Element;
      const boton = objetivo.closest<HTMLElement>(".indice [data-col]");
      if (boton) {
        lienzo!.scrollLeft = Math.max(0, Number(boton.dataset.x) - 8);
        medir();
      }
    }

    raiz.addEventListener("click", alClic);
    lienzo.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(lienzo);
    medir();
    return () => {
      raiz.removeEventListener("click", alClic);
      lienzo.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [mapa]);

  return null;
}
