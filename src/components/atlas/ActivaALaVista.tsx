"use client";

import { useEffect } from "react";

/**
 * A 380 px la fila de niveles se desliza de lado y la pestaña actual podía quedar cortada («03 Rec…», pasada de
 * capturas del S1). Al cargar, la fila se corre lo justo para mostrarla entera. No dibuja nada (el árbol es el
 * mismo en el servidor y en el cliente) y no mueve la página: solo el desplazamiento de la fila.
 */
export function ActivaALaVista() {
  useEffect(() => {
    for (const fila of document.querySelectorAll<HTMLElement>("ul.niveles")) {
      const activa = fila.querySelector<HTMLElement>('[aria-current="page"]');
      if (!activa) continue;
      const sobra = activa.getBoundingClientRect().right - fila.getBoundingClientRect().right;
      if (sobra > 0) fila.scrollLeft += sobra;
    }
  }, []);
  return null;
}
