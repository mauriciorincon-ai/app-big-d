"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import type { OpcionPlataforma } from "@/lib/atlas";

/**
 * Campo «Plataforma» (kit aprobado: etiqueta en mono, lista desplegable, chevrón dibujado; forma aprobada en
 * la parada A del S1). Las N plataformas por id; las que aún no tienen mapa dicen «— pronto» y no se pueden
 * elegir. Elegir otra lleva a su atlas, en el mismo nivel si lo tiene. En la portada nace sin elección.
 * En Windows y Linux una flecha sobre la lista cerrada ya elige: la nota visible, enlazada como descripción,
 * avisa antes del cambio de página (WCAG 3.2.2; M-11 de la auditoría del S1).
 */
export function CampoPlataforma({
  opciones,
  actual,
  etiqueta,
  pronto,
  elegir,
  nota,
}: {
  opciones: OpcionPlataforma[];
  actual?: string;
  etiqueta: string;
  pronto: string;
  elegir?: string;
  nota: string;
}) {
  const router = useRouter();
  const idLista = useId();
  const idNota = useId();
  // La nota va FUERA de la etiqueta: dentro, se sumaba al nombre accesible de la lista.
  return (
    <div className="campo campo-plataforma">
      <label className="campo-etiqueta" htmlFor={idLista}>
        {etiqueta}
      </label>
      <span className="select">
        <select
          id={idLista}
          aria-describedby={idNota}
          value={actual ?? ""}
          onChange={(ev) => {
            const destino = opciones.find((o) => o.id === ev.target.value)?.ruta;
            if (destino) router.push(destino);
          }}
        >
          {actual === undefined && (
            <option value="" disabled>
              {elegir}
            </option>
          )}
          {opciones.map((o) => (
            <option key={o.id} value={o.id} disabled={!o.ruta}>
              {o.ruta ? o.nombre : `${o.nombre} — ${pronto}`}
            </option>
          ))}
        </select>
        <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false">
          <path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="campo-nota" id={idNota}>
        {nota}
      </p>
    </div>
  );
}
