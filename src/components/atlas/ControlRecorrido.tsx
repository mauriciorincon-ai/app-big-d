"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PasoPanel } from "@/lib/atlas";
import { ID_RECORRIDO, plantilla } from "@/lib/atlas";

interface TextosRecorrido {
  controles: string;
  anterior: string;
  siguiente: string;
  reproducir: string;
  pausar: string;
  verTodos: string;
  todos: string;
  pasoDe: string;
  pasos: string;
}

/**
 * Controlador del recorrido (CONTRATO § 4.3, G12; maqueta: `recorrido.js`): cambia UN atributo del
 * contenedor (`data-paso`) y el CSS generado del recorrido decide qué componente es activo, visitado o
 * pendiente. Anterior / Siguiente / Ver todos, las flechas del teclado (fuera del lienzo, que las usa para
 * deslizar) y tocar un componente del recorrido. «Reproducir» avanza solo cada 2 s y jamás con movimiento
 * reducido: el botón sigue en el DOM y el CSS lo oculta (el árbol no depende de la preferencia).
 */
export function ControlRecorrido({ pasos, t, children }: { pasos: PasoPanel[]; t: TextosRecorrido; children: ReactNode }) {
  const [paso, setPaso] = useState("todos");
  const [animando, setAnimando] = useState(false);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const orden = ["todos", ...pasos.map((p) => p.id)];

  const parar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    setAnimando(false);
  }, []);
  const mover = useCallback(
    (d: number) => setPaso((actual) => {
      const ids = ["todos", ...pasos.map((p) => p.id)];
      return ids[Math.max(0, Math.min(ids.length - 1, ids.indexOf(actual) + d))]!;
    }),
    [pasos],
  );

  function reproducir() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (reloj.current) return parar();
    const ultimo = pasos[pasos.length - 1]?.id;
    setPaso((actual) => (actual === ultimo ? "todos" : actual));
    setAnimando(true);
    mover(1);
    reloj.current = setInterval(() => {
      setPaso((actual) => {
        const ids = ["todos", ...pasos.map((p) => p.id)];
        const i = ids.indexOf(actual);
        if (i >= ids.length - 1) {
          queueMicrotask(parar);
          return actual;
        }
        return ids[i + 1]!;
      });
    }, 2000);
  }

  useEffect(() => {
    function alTecla(ev: KeyboardEvent) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      const objetivo = ev.target as Element;
      if (objetivo.closest?.("input, textarea, select, [contenteditable], .lienzo, .lienzo-marco, .panel")) return;
      if (ev.key === "ArrowRight") {
        parar();
        mover(1);
      }
      if (ev.key === "ArrowLeft") {
        parar();
        mover(-1);
      }
    }
    // Tocar un componente que está en el recorrido lleva a su paso (además de abrir su ficha).
    function alClic(ev: MouseEvent) {
      const n = (ev.target as Element).closest(`#${ID_RECORRIDO} .dg-nodo[data-paso]`);
      const id = n?.getAttribute("data-paso")?.split(" ")[0];
      if (id) {
        parar();
        setPaso(id);
      }
    }
    document.addEventListener("keydown", alTecla);
    document.addEventListener("click", alClic);
    return () => {
      document.removeEventListener("keydown", alTecla);
      document.removeEventListener("click", alClic);
      if (reloj.current) clearInterval(reloj.current);
    };
  }, [mover, parar]);

  const actual = pasos.find((p) => p.id === paso);
  return (
    <div className="rec" id={ID_RECORRIDO} data-paso={paso} data-animando={animando ? "" : undefined}>
      <div className="rec-controles" role="group" aria-label={t.controles}>
        <button type="button" className="boton" data-rec="anterior" onClick={() => (parar(), mover(-1))} disabled={paso === orden[0]}>
          {t.anterior}
        </button>
        <span className="rec-pos mono" aria-live="polite">
          {actual ? plantilla(t.pasoDe, { n: actual.numero, total: pasos.length }) : t.todos}
        </span>
        <button type="button" className="boton" data-rec="siguiente" onClick={() => (parar(), mover(1))} disabled={paso === orden[orden.length - 1]}>
          {t.siguiente}
        </button>
        <button type="button" className="boton boton-sec" data-rec="reproducir" aria-pressed={animando} onClick={reproducir}>
          {animando ? t.pausar : t.reproducir}
        </button>
        <button type="button" className="boton boton-sec" data-rec="todos" onClick={() => (parar(), setPaso("todos"))}>
          {t.verTodos}
        </button>
      </div>
      {children}
      <section className="pasos" aria-labelledby="pasos-t">
        <h2 id="pasos-t" className="ojo">
          {t.pasos}
        </h2>
        <ol className="pasos-lista">
          {pasos.map((p) => (
            <li key={p.id} data-paso-panel={p.id} aria-current={p.id === paso ? "step" : undefined}>
              <span className="paso-n">{p.numero}</span>
              <div>
                <b>{p.que}</b> <span className="paso-nodo">{p.nodo}</span>
                <p className="paso-lider">{p.lider}</p>
                <p className="paso-experto">{p.experto}</p>
                {p.rama && <p className="paso-rama">{p.rama}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
