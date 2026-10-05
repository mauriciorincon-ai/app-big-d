import type { ReactNode } from "react";

/**
 * El marco de una tabla ancha (maqueta: `.tabla-marco`): en un teléfono la tabla se desliza dentro de él, nunca la
 * página. Un área que se desliza tiene que alcanzarse con el teclado (axe: scrollable-region-focusable): es una región
 * con nombre y entra al orden del tabulador, como el lienzo del atlas.
 */
export function MarcoTabla({ etiqueta, id, children }: { etiqueta: string; id?: string; children: ReactNode }) {
  return (
    <div className="tabla-marco" id={id} role="region" aria-label={etiqueta} tabIndex={0}>
      {children}
    </div>
  );
}
