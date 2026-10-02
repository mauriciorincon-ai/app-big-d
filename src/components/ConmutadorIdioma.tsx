"use client";

import { usePathname } from "next/navigation";
import { IDIOMAS, NOMBRE_PROPIO, rutaEnIdioma, type Idioma } from "@/lib/i18n";

/** Idioma = ruta: el conmutador lleva a la misma página en el otro idioma (`/es/…` ↔ `/en/…`). */
export function ConmutadorIdioma({ actual, etiqueta }: { actual: Idioma; etiqueta: string }) {
  const ruta = usePathname() ?? `/${actual}`;
  return (
    <div className="alterna" role="group" aria-label={etiqueta}>
      {IDIOMAS.map((idioma, i) => (
        <span key={idioma} className="alterna-par">
          {i > 0 && <span className="sep" aria-hidden="true">/</span>}
          <a
            href={rutaEnIdioma(ruta, idioma)}
            hrefLang={idioma}
            lang={idioma}
            aria-label={NOMBRE_PROPIO[idioma]}
            aria-current={idioma === actual ? "true" : undefined}
          >
            {idioma.toUpperCase()}
          </a>
        </span>
      ))}
    </div>
  );
}
