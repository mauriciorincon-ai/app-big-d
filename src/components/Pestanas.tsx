import Link from "next/link";
import type { Pestana } from "@/lib/caso/rutas";
import { ActivaALaVista } from "./atlas/ActivaALaVista";

/**
 * Pestañas de una sección (maqueta: `.niveles`; D-S3-16): las de Conocimiento (05–06) y las del Caso (07–10). Una
 * pestaña con ruta es un enlace; una que todavía no existe en el producto se muestra pendiente, sin enlace. En un
 * teléfono la fila se desliza y la pestaña actual se trae a la vista al cargar.
 */
export function Pestanas({ etiqueta, pestanas }: { etiqueta: string; pestanas: readonly Pestana[] }) {
  return (
    <>
      <ul className="niveles" aria-label={etiqueta}>
        {pestanas.map((p) => {
          const cuerpo = (
            <>
              <span className="n">{p.n}</span>
              {p.texto}
            </>
          );
          return (
            <li key={p.n}>
              {p.ruta ? (
                <Link href={p.ruta} aria-current={p.actual ? "page" : undefined}>
                  {cuerpo}
                </Link>
              ) : (
                <span className="pend">{cuerpo}</span>
              )}
            </li>
          );
        })}
      </ul>
      <ActivaALaVista />
    </>
  );
}
