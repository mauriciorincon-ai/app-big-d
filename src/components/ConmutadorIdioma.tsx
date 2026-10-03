"use client";

import { usePathname } from "next/navigation";
import { IDIOMAS, NOMBRE_PROPIO, rutaEnIdioma, type Idioma } from "@/lib/i18n";

/**
 * Idioma = ruta: el conmutador lleva a la misma página en el otro idioma (`/es/…` ↔ `/en/…`), con la misma consulta
 * (en el lado a lado, qué plataformas y qué página). La consulta se suma al tocar, no al pintar: el HTML estático no
 * la conoce y el árbol tiene que ser el mismo en el servidor y en el cliente.
 */
const conConsulta = (destino: string) => (ev: { currentTarget: HTMLAnchorElement }) => ev.currentTarget.setAttribute("href", destino + window.location.search);

export function ConmutadorIdioma({ actual, etiqueta }: { actual: Idioma; etiqueta: string }) {
  const ruta = usePathname() ?? `/${actual}`;
  return (
    <div className="alterna" role="group" aria-label={etiqueta}>
      {IDIOMAS.map((idioma, i) => {
        const destino = rutaEnIdioma(ruta, idioma);
        const sumar = conConsulta(destino);
        return (
          <span key={idioma} className="alterna-par">
            {i > 0 && <span className="sep" aria-hidden="true">/</span>}
            <a
              href={destino}
              hrefLang={idioma}
              lang={idioma}
              aria-label={NOMBRE_PROPIO[idioma]}
              aria-current={idioma === actual ? "true" : undefined}
              onClick={sumar}
              onAuxClick={sumar}
              onFocus={sumar}
              onPointerEnter={sumar}
            >
              {idioma.toUpperCase()}
            </a>
          </span>
        );
      })}
    </div>
  );
}
