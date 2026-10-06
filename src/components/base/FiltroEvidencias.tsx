"use client";

import { Children, useState, type ReactNode } from "react";
import { plantilla } from "@/lib/atlas/plantilla";
import type { Textos } from "@/lib/i18n";

// Los filtros de la base (maqueta base.html: plataforma, criterio y estado). Las tarjetas llegan hechas del servidor; aquí
// solo se ocultan las que no pasan (`hidden`), así el HTML estático trae todas y el árbol no cambia al hidratar.

type T = Textos["base"]["evidencias"];

export function FiltroEvidencias({ t, plataformas, criterios, items, children }: { t: T; plataformas: [string, string][]; criterios: [string, string][]; items: { plataforma: string; criterio: string; estado: string }[]; children: ReactNode }) {
  const [plataforma, setPlataforma] = useState("");
  const [criterio, setCriterio] = useState("");
  const [estado, setEstado] = useState("");
  const pasa = items.map((x) => (!plataforma || x.plataforma === plataforma) && (!criterio || x.criterio === criterio) && (!estado || x.estado === estado));
  const tarjetas = Children.toArray(children);
  const campo = (etiqueta: string, valor: string, cambiar: (v: string) => void, opciones: [string, string][]) => (
    <label className="campo">
      <span className="campo-etiqueta">{etiqueta}</span>
      <span className="select">
        <select value={valor} onChange={(ev) => cambiar(ev.target.value)}>
          {opciones.map(([v, texto]) => (
            <option key={v} value={v}>
              {texto}
            </option>
          ))}
        </select>
        <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false">
          <path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
  return (
    <>
      <div className="filtros">
        {campo(t.filtros.plataforma, plataforma, setPlataforma, [["", plantilla(t.filtros.todas, { n: plataformas.length })], ...plataformas])}
        {campo(t.filtros.criterio, criterio, setCriterio, [["", plantilla(t.filtros.todos, { n: criterios.length })], ...criterios])}
        {campo(t.filtros.estado, estado, setEstado, [
          ["", t.filtros.ambas],
          ["aprobada", t.filtros.aprobadas],
          ["propuesta", t.filtros.propuestas],
        ])}
      </div>
      <p className="conteo" aria-live="polite">
        <span>{plantilla(t.mostrando, { n: pasa.filter(Boolean).length })}</span>
      </p>
      <ul className="kit-grid evidencias">
        {tarjetas.map((x, i) => (
          <li key={i} hidden={!pasa[i]}>
            {x}
          </li>
        ))}
      </ul>
    </>
  );
}
