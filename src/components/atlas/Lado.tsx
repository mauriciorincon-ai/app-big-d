"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { BandaAngosta, FilaLado } from "@/lib/atlas/lado";
import { ATRIBUTO_ELEGIDAS, ATRIBUTO_VISIBLES, consultaDe, estadoDeConsulta } from "@/lib/atlas/estado-lado";
import { plantilla } from "@/lib/atlas/plantilla";
import type { Textos } from "@/lib/i18n";

// La consulta de la URL es la única fuente del estado (qué plataformas y qué página): el componente la lee con
// `useSyncExternalStore` (en el servidor y al hidratar, vacía: el HTML estático es el de todas y la página 1) y la
// escribe con `history.replaceState`. Las filas no las pinta React: las muestra el CSS generado según dos atributos
// del `<html>`, que el script previo al pintado ya puso y este componente mantiene (D-S2-07). Así una URL con
// consulta no salta al hidratar, y el árbol es el mismo en el servidor y en el cliente.
const oyentes = new Set<() => void>();
function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("popstate", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("popstate", avisar);
  };
}
function escribir(consulta: string) {
  if (consulta === window.location.search) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${consulta}${window.location.hash}`);
  for (const avisar of oyentes) avisar();
}

const Chevron = ({ arriba = false }: { arriba?: boolean }) => (
  <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false">
    <path d={arriba ? "M-4,1.5 L0,-2.5 L4,1.5" : "M-4,-1.5 L0,2.5 L4,-1.5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export interface PropsLado {
  ids: string[];
  porPagina: number;
  nombres: Record<string, string>;
  /** «v0.1.0» de las publicadas; las demás dicen «próximamente». */
  versiones: Record<string, string>;
  t: Textos["atlas"]["lado"];
  saltarDiagrama: string;
  indice: string;
  idLectura: string;
  idPista: string;
  cabecera: string;
  filas: FilaLado[];
  columnas: { banda: string; x: number; numero: string; nombre: string }[];
  angosto: BandaAngosta[];
  /** La guía bajo el selector (va entre los controles y el dibujo, como en la maqueta). */
  children: ReactNode;
}

/**
 * El lado a lado (maqueta: `lado-a-lado.html`; forma aprobada en la mirada M1): selector y paginación, el lienzo con
 * la cabecera de bandas y una fila por plataforma, el botón «Desplegar todo» arriba a la derecha del recuadro, y en
 * teléfono una banda a la vez con todas las plataformas apiladas. El mismo botón despliega en las dos vistas.
 */
export function Lado({ ids, porPagina, nombres, versiones, t, saltarDiagrama, indice, idLectura, idPista, cabecera, filas, columnas, angosto, children }: PropsLado) {
  const consulta = useSyncExternalStore(
    suscribir,
    () => window.location.search,
    () => "",
  );
  const estado = estadoDeConsulta(consulta, ids, porPagina);
  const inicio = estadoDeConsulta("", ids, porPagina).visibles;
  const [todo, setTodo] = useState(false);
  const [banda, setBanda] = useState(angosto[0]?.id ?? "");
  const anterior = useRef<HTMLButtonElement>(null);
  const siguiente = useRef<HTMLButtonElement>(null);
  const enfocar = useRef<HTMLButtonElement | null>(null);
  const visibles = estado.visibles.join(" ");
  const elegidas = estado.elegidas.join(" ");

  // Los atributos que lee el CSS generado; al salir de la página se quitan (otra página no los usa).
  useLayoutEffect(() => {
    const h = document.documentElement;
    h.setAttribute(ATRIBUTO_VISIBLES, visibles);
    h.setAttribute(ATRIBUTO_ELEGIDAS, elegidas);
  }, [visibles, elegidas]);
  // El botón de página que se deshabilita pierde el foco: pasa al otro, ya habilitado en este render.
  useLayoutEffect(() => {
    enfocar.current?.focus();
    enfocar.current = null;
  }, [estado.pagina]);
  useLayoutEffect(
    () => () => {
      document.documentElement.removeAttribute(ATRIBUTO_VISIBLES);
      document.documentElement.removeAttribute(ATRIBUTO_ELEGIDAS);
    },
    [],
  );

  function cambiar(elegidasNuevas: string[], pagina: number) {
    const e = ids.filter((id) => elegidasNuevas.includes(id));
    const paginas = Math.max(1, Math.ceil(e.length / porPagina));
    escribir(consultaDe({ elegidas: e, pagina: Math.min(Math.max(1, pagina), paginas) }, ids));
  }
  function alternar(id: string) {
    const ya = estado.elegidas.includes(id);
    if (ya && estado.elegidas.length === 1) return;
    cambiar(ya ? estado.elegidas.filter((x) => x !== id) : [...estado.elegidas, id], estado.pagina);
  }
  function ir(pagina: number) {
    if (pagina >= estado.paginas) enfocar.current = anterior.current;
    if (pagina <= 1) enfocar.current = siguiente.current;
    cambiar(estado.elegidas, pagina);
  }
  function desplegar() {
    const abre = !todo;
    setTodo(abre);
    for (const d of document.querySelectorAll<HTMLDetailsElement>("#lado-angosto details")) d.open = abre;
  }

  const desde = (estado.pagina - 1) * porPagina + 1;
  const hasta = desde + estado.visibles.length - 1;
  const rango = plantilla(desde === hasta ? t.rangoUno : t.rango, { desde, hasta, total: estado.elegidas.length });
  const boton = (controla: string) => (
    <button type="button" className="boton boton-sec lado-todo" aria-expanded={todo} aria-controls={controla} onClick={desplegar}>
      {todo ? t.contraer : t.desplegar}
      <Chevron arriba={todo} />
    </button>
  );

  return (
    <>
      <div className="fila-r2">
        <details className="selector">
          <summary>
            {plantilla(t.selector, { n: estado.elegidas.length, total: ids.length })}
            <Chevron />
          </summary>
          <ul className="selector-lista">
            <li className="selector-orden">{plantilla(t.orden, { n: (t.numeros[porPagina] ?? String(porPagina)).toLowerCase() })}</li>
            {ids.map((id) => {
              const elegida = estado.elegidas.includes(id);
              return (
                <li key={id}>
                  <label>
                    <input type="checkbox" checked={elegida} disabled={elegida && estado.elegidas.length === 1} onChange={() => alternar(id)} /> {nombres[id]}
                  </label>
                  <span className="meta">{versiones[id] ?? t.pronto}</span>
                </li>
              );
            })}
          </ul>
        </details>
        <div className="paginacion" role="group" aria-label={t.paginacion}>
          <button ref={anterior} type="button" className="boton boton-sec" disabled={estado.pagina <= 1} onClick={() => ir(estado.pagina - 1)}>
            {t.anterior}
          </button>
          <span className="mono" aria-live="polite">
            {rango}
          </span>
          <button ref={siguiente} type="button" className="boton boton-sec" disabled={estado.pagina >= estado.paginas} onClick={() => ir(estado.pagina + 1)}>
            {t.siguiente}
          </button>
        </div>
      </div>
      {children}
      <section className="mapa lado-ancho" id="mapa" aria-label={t.mapa}>
        <ul className="indice" aria-label={indice}>
          {columnas.map((c) => (
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
          {plantilla(t.pista, { n: columnas.length })}
        </p>
        <a className="saltar-diagrama" href={`#${idLectura}`}>
          {saltarDiagrama}
        </a>
        <div className="lienzo-marco">
          <div className="lienzo-cabeza">{boton("lienzo-lado")}</div>
          <div className="lienzo" id="lienzo-lado" tabIndex={0} role="region" aria-label={t.lienzo} data-todo={todo ? "" : undefined}>
            {/* Los SVG los generó el diagramador en el build (serializador propio, sin datos del visitante). */}
            <div className="lado-cabecera" dangerouslySetInnerHTML={{ __html: cabecera }} />
            <div className="lado-filas">
              {filas.map((f) => (
                <div key={f.id} className="lado-fila" data-fila={f.id} data-inicio={inicio.includes(f.id) ? "" : undefined}>
                  {f.n1 && f.n2 ? (
                    <>
                      <div data-variante="n1" dangerouslySetInnerHTML={{ __html: f.n1 }} />
                      <div data-variante="n2" dangerouslySetInnerHTML={{ __html: f.n2 }} />
                    </>
                  ) : (
                    <div className="lado-pronto">
                      <p className="lado-pronto-nombre">
                        <b>{f.nombre}</b>
                        <span className="mono">{t.pronto}</span>
                      </p>
                      <p className="lado-pronto-texto">
                        {t.prontoFila} <Link href={f.investigador}>{t.prontoEnlace}</Link>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="solo-lector" id={idPista}>
          {t.pistaActivar}
        </p>
      </section>
      <div className="lado-angosto" id="lado-angosto">
        <div className="lado-angosto-cabeza">
          <ul className="indice indice-fija" aria-label={t.bandas}>
            {angosto.map((b) => (
              <li key={b.id}>
                <button type="button" aria-current={b.id === banda ? "true" : undefined} onClick={() => setBanda(b.id)}>
                  <span className="n">{b.numero}</span>
                  {b.nombre}
                </button>
              </li>
            ))}
          </ul>
          {boton("lado-angosto")}
        </div>
        {angosto.map((b) => (
          <section key={b.id} className="lado-banda" data-banda={b.id} hidden={b.id !== banda}>
            <h2 className="lado-pregunta">{b.pregunta}</h2>
            <ul className="lado-lista">
              {b.celdas.map((c) => (
                <li key={c.plataforma} className="lado-pl" data-pl={c.plataforma}>
                  <span className="lado-pl-nombre">{c.nombre}</span>
                  {c.pronto ? (
                    <span className="lado-vacio">{t.pronto}</span>
                  ) : c.elementos.length === 0 ? (
                    <span className="lado-vacio">{t.sinComponentes}</span>
                  ) : (
                    c.elementos.map((e) => (
                      <details key={e.id} className="lado-comp" data-dueno={e.id}>
                        <summary>
                          <span className="lado-bloque">
                            {e.glifo && <span className="lado-glifo" dangerouslySetInnerHTML={{ __html: e.glifo }} />}
                            <b>{e.nombre}</b>
                            <span className="mono">{e.resumen}</span>
                          </span>
                          <Chevron />
                        </summary>
                        <div dangerouslySetInnerHTML={{ __html: e.tarjetas }} />
                      </details>
                    ))
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
