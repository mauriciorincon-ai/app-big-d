// Barras del caso en SVG (maqueta: `.peso-barra`, `.total-barra`, `.barra-mini`). Las posiciones son ATRIBUTOS en por
// ciento del ancho (x="25%"), no `style=`: la CSP del export no admite estilos en línea (S2), y un SVG sin viewBox no
// deforma el punto ni las líneas. Las cifras llegan como enteros (centésimas de peso, décimas de punto, por mil).

const pct = (parte: number, total: number) => `${(Math.round((parte * 10000) / total) / 100).toString()}%`;

/** Un peso sobre [0, escala]: la pista, el rango declarado, el punto y las marcas (inversión, empate). Centésimas. */
export function BarraPeso({ escala, rango, punto, marcas = [], alto = 12, etiqueta }: { escala: number; rango?: [number, number]; punto?: number; marcas?: { t: number; tipo: "inversion" | "empate" }[]; alto?: number; etiqueta?: string }) {
  const r = alto / 2;
  return (
    <svg className="barra-svg" width="100%" height={alto} {...(etiqueta ? { role: "img", "aria-label": etiqueta } : { "aria-hidden": true })} focusable="false">
      <rect className="barra-pista" x="0" y="0.5" width="100%" height={alto - 1} rx={r - 0.5} />
      {rango && <rect className="barra-rango" x={pct(rango[0], escala)} y="1" width={pct(rango[1] - rango[0], escala)} height={alto - 2} rx={r - 1} />}
      {marcas.map((m, i) => (
        <line key={i} className={m.tipo === "inversion" ? "barra-inversion" : "barra-empate"} x1={pct(m.t, escala)} x2={pct(m.t, escala)} y1={-5} y2={alto + 5} />
      ))}
      {punto !== undefined && <circle className="barra-punto" cx={pct(punto, escala)} cy={r} r={Math.min(9, r + 3)} />}
    </svg>
  );
}

/** Un total en décimas de punto (0 a 1000) con la marca de la banda de empate bajo la primera. */
export function BarraTotal({ decimas, banda, etiqueta }: { decimas: number; banda: number | null; etiqueta: string }) {
  return (
    <svg className="barra-svg" width="100%" height="14" role="img" aria-label={etiqueta} focusable="false">
      <rect className="barra-pista" x="0" y="0.5" width="100%" height="13" rx="2.5" />
      <rect className="barra-relleno" x="0" y="0.5" width={pct(decimas, 1000)} height="13" rx="2" />
      {banda !== null && <line className="barra-banda" x1={pct(banda, 1000)} x2={pct(banda, 1000)} y1={-5} y2={19} />}
    </svg>
  );
}

/** La barrita de la aceptabilidad, en por mil. */
export function BarraMini({ porMil }: { porMil: number }) {
  return (
    <svg className="barra-mini barra-svg" width="64" height="8" aria-hidden="true" focusable="false">
      <rect className="barra-pista" x="0" y="0.5" width="100%" height="7" rx="1.5" />
      <rect className="barra-relleno" x="0" y="0.5" width={pct(porMil, 1000)} height="7" rx="1.5" />
    </svg>
  );
}
