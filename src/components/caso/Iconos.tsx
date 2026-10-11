// Glifos de las secciones Conocimiento y Caso (maqueta: OK, ALERTA, PEND, X, la estrella del criterio esencial y el
// chevrón). Forma y no solo color (regla dura 13): visto, «!», círculo punteado, aspa y estrella se distinguen en grises.

const caja = (s: number) => ({ viewBox: "-8 -8 16 16", width: s, height: s, "aria-hidden": true, focusable: false }) as const;

export function Ok({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M-3.2,0.3 L-1,2.6 L3.4,-2.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Alerta({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0,-5 V1.5 M0,4.2 V4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Pendiente({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
    </svg>
  );
}

/** Un anillo con su centro lleno: lo obligatorio (frente al círculo punteado de lo preferente). */
export function Anillo({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle r="3" fill="currentColor" />
    </svg>
  );
}

/** Un círculo vacío: una opción no elegida. */
export function Circulo({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Aspa({ s = 14 }: { s?: number }) {
  return (
    <svg {...caja(s)}>
      <circle r="7" fill="currentColor" />
      <path d="M-3.8,-3.8 L3.8,3.8 M3.8,-3.8 L-3.8,3.8" fill="none" stroke="var(--fondo)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** La estrella del criterio esencial; lleva su nombre para el lector de pantalla. */
export function Estrella({ titulo, s = 12 }: { titulo: string; s?: number }) {
  return (
    <svg className="esencial" viewBox="-8 -8 16 16" width={s} height={s} role="img" aria-label={titulo} focusable="false">
      <path d="M0,-7 L2,-2.2 L7,-1.8 L3.2,1.6 L4.3,6.6 L0,4 L-4.3,6.6 L-3.2,1.6 L-7,-1.8 L-2,-2.2 Z" fill="currentColor" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false">
      <path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
