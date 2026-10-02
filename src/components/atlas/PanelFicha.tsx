"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const ANGOSTO = "(max-width: 899px)";
function suscribir(avisar: () => void) {
  const m = window.matchMedia(ANGOSTO);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
}

/**
 * Panel de la ficha de un componente (niveles 2 y 3; maqueta: `ficha.js` + contrato de foco del design system
 * § 7): al activar un componente del lienzo (clic, Enter o Espacio) se abre con su ficha, generada por el motor.
 * En el nivel 1 abre la ventana de un bloque (`objetivo` = los activables del lienzo, `clave` = su dueño).
 * En teléfono es una hoja inferior modal (`role="dialog"`, foco contenido); desde 900 px, una región lateral
 * no modal. Al abrir, el foco va al título; Esc o «Cerrar» cierran y lo devuelven al componente de origen.
 * El árbol es el mismo en servidor y cliente: solo cambian atributos y el contenido del cuerpo.
 */
export function PanelFicha({
  fichas,
  titulo,
  cerrar: textoCerrar,
  objetivo = ".lienzo .dg-nodo",
  clave = "data-nodo",
}: {
  fichas: Record<string, string>;
  titulo: string;
  cerrar: string;
  /** Qué elementos del lienzo abren el panel, y el atributo que dice cuál contenido mostrar. */
  objetivo?: string;
  clave?: string;
}) {
  // `n` cuenta las activaciones: reactivar el mismo componente vuelve a llevar el foco al título (B-3 de la
  // auditoría del S1; con solo el id, React no veía cambio y el foco se quedaba donde estaba).
  const [activacion, setActivacion] = useState<{ id: string; n: number } | null>(null);
  const activo = activacion?.id ?? null;
  const angosto = useSyncExternalStore(suscribir, () => window.matchMedia(ANGOSTO).matches, () => false);
  const panel = useRef<HTMLDivElement>(null);
  const origen = useRef<HTMLElement | null>(null);
  const mover = useRef(false);

  // Marca el componente activo en el lienzo y, si lo abrió el usuario, lleva el foco al título de la ficha.
  useEffect(() => {
    for (const n of document.querySelectorAll(`${objetivo}[aria-current="true"]`)) n.removeAttribute("aria-current");
    if (!activo) return;
    for (const n of document.querySelectorAll(`${objetivo}[${clave}="${CSS.escape(activo)}"]`)) n.setAttribute("aria-current", "true");
    const cuerpo = panel.current?.querySelector<HTMLElement>(".panel-cuerpo");
    if (cuerpo) cuerpo.scrollTop = 0;
    if (mover.current) {
      mover.current = false;
      const h = panel.current?.querySelector<HTMLElement>("h2");
      if (h) {
        h.tabIndex = -1;
        h.focus();
      }
    }
  }, [activacion, activo, objetivo, clave]);

  useEffect(() => {
    function abrir(el: HTMLElement) {
      const id = el.getAttribute(clave);
      if (!id || !(id in fichas)) return;
      origen.current = el;
      mover.current = true;
      setActivacion((a) => ({ id, n: (a?.n ?? 0) + 1 }));
    }
    function alClic(ev: MouseEvent) {
      const n = (ev.target as Element).closest<HTMLElement>(objetivo);
      if (n) abrir(n);
    }
    function alTecla(ev: KeyboardEvent) {
      const n = (ev.target as Element).closest?.<HTMLElement>(objetivo);
      if (n && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        abrir(n);
        return;
      }
      const abierto = panel.current && !panel.current.hidden;
      if (!abierto) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        cerrarPanel();
        return;
      }
      // Hoja modal: el foco no sale del panel.
      if (ev.key === "Tab" && window.matchMedia(ANGOSTO).matches) {
        const foco = [...panel.current!.querySelectorAll<HTMLElement>("button, a[href], [tabindex='-1']")].filter((e) => e.getClientRects().length);
        const primero = foco[0];
        const ultimo = foco[foco.length - 1];
        if (!primero || !ultimo) return;
        if (!panel.current!.contains(document.activeElement)) {
          ev.preventDefault();
          primero.focus();
        } else if (ev.shiftKey && document.activeElement === primero) {
          ev.preventDefault();
          ultimo.focus();
        } else if (!ev.shiftKey && document.activeElement === ultimo) {
          ev.preventDefault();
          primero.focus();
        }
      }
    }
    document.addEventListener("click", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("click", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [fichas, objetivo, clave]);

  function cerrarPanel() {
    setActivacion(null);
    const v = origen.current;
    origen.current = null;
    v?.focus();
  }

  return (
    <div
      ref={panel}
      className="panel"
      id="panel-ficha"
      hidden={activo === null}
      role={angosto ? "dialog" : "complementary"}
      aria-modal={angosto ? true : undefined}
      aria-labelledby="panel-titulo"
    >
      <div className="panel-cabeza">
        <span className="ojo" id="panel-titulo">
          {titulo}
        </span>
        <button type="button" className="cerrar" onClick={cerrarPanel}>
          {textoCerrar}
        </button>
      </div>
      {/* La ficha la generó el motor en el build (`toCard`), desde el mapa validado. */}
      <div className="panel-cuerpo" dangerouslySetInnerHTML={{ __html: activo ? (fichas[activo] ?? "") : "" }} />
    </div>
  );
}
