import type { ReactNode } from "react";

/**
 * El marco de una tabla ancha (maqueta: `.tabla-marco`): en un teléfono la tabla se desliza dentro de él, nunca la
 * página. Un área que se desliza tiene que alcanzarse con el teclado (axe: scrollable-region-focusable): es una región
 * con nombre y entra al orden del tabulador, como el lienzo del atlas.
 *
 * `pista` es el aviso VISIBLE de que la tabla se desliza (devolución 026-5: a 1024 px la tabla de robustez cortaba su última
 * columna sin decirlo). Va en palabras, arriba del marco, y solo se ve cuando la tabla puede quedar cortada (`.pista-tabla`).
 */
export function MarcoTabla({ etiqueta, id, pista, children }: { etiqueta: string; id?: string; pista?: string; children: ReactNode }) {
  return (
    <>
      {pista ? <p className="pista-tabla">{pista}</p> : null}
      <div className="tabla-marco" id={id} role="region" aria-label={etiqueta} tabIndex={0}>
        {children}
      </div>
    </>
  );
}
