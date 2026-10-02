import type { Vigencia } from "diagramador";

/**
 * Marca de la píldora de vigencia del mapa (maqueta: `.meta b`). Sin matiz: vigente = círculo con visto,
 * por revisar = triángulo de precaución con «!» (el mismo path que la insignia del diagrama; pedido de la
 * persona, 2026-09-30), vencido = círculo lleno con aspa. Tres formas distintas: sobrevive en grises y colores
 * forzados.
 */
export function MarcaVigencia({ estado }: { estado: Vigencia }) {
  return (
    <svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      {estado === "vencido" ? (
        <>
          <circle r="7" fill="currentColor" />
          <path d="M-2.8,-2.8 L2.8,2.8 M2.8,-2.8 L-2.8,2.8" fill="none" stroke="var(--fondo)" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : estado === "revisar" ? (
        <path d="M0,-6.6 L6.8,5 H-6.8 Z M0,-2.3 V0.8 M0,3.05 V3.15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M-3.2,0.3 L-1,2.6 L3.4,-2.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
