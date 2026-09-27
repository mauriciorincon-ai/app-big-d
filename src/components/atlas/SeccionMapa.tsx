import type { ReactNode } from "react";
import { ID_PISTA, ID_SECCION_LECTURA, plantilla, type VistaAtlas } from "@/lib/atlas";
import { textos, type Idioma } from "@/lib/i18n";

/**
 * El mapa de cualquier vista (maqueta: `.mapa`): índice de capas y pista (aparecen si el lienzo desborda),
 * «Saltar el diagrama» hacia la lectura, el lienzo deslizable con el SVG del build y la pista de Enter que
 * describen los elementos activables. `children` = la capa interactiva de la vista.
 */
export function SeccionMapa({ idioma, vista, pista, children }: { idioma: Idioma; vista: VistaAtlas; pista: string; children: ReactNode }) {
  const t = textos(idioma).atlas;
  return (
    <section className="mapa" id="mapa" aria-label={t.mapa}>
      <ul className="indice" aria-label={t.indice}>
        {vista.columnas.map((c) => (
          <li key={c.banda}>
            <button type="button" data-col={c.banda} data-x={c.x}>
              <span className="n">{c.numero}</span>
              {c.nombre}
            </button>
          </li>
        ))}
      </ul>
      <p className="pista">
        <svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M-6,0 H5 M1.5,-3.8 L5.5,0 L1.5,3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {plantilla(t.pista, { n: vista.capas })}
      </p>
      <a className="saltar-diagrama" href={`#${ID_SECCION_LECTURA}`}>
        {t.saltarDiagrama}
      </a>
      <div className="lienzo-marco">
        {/* El SVG lo generó el diagramador en el build (serializador propio, sin datos del visitante). */}
        <div className="lienzo" tabIndex={0} role="region" aria-label={t.lienzo} dangerouslySetInnerHTML={{ __html: vista.svg }} />
      </div>
      <p className="solo-lector" id={ID_PISTA}>
        {pista}
      </p>
      {children}
    </section>
  );
}

/** La lectura en texto (G10), plegada, destino de «Saltar el diagrama». */
export function Lectura({ idioma, html }: { idioma: Idioma; html: string }) {
  return (
    <details className="lectura-seccion" id={ID_SECCION_LECTURA}>
      <summary>{textos(idioma).atlas.lectura}</summary>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </details>
  );
}
