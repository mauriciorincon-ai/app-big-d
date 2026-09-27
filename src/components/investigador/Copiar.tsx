"use client";

import { useState } from "react";

/** Un comando para copiar (maqueta: `.comando`): el texto en mono y un botón que lo copia y lo confirma. */
export function Comando({ texto, copiar, copiado, nota }: { texto: string; copiar: string; copiado: string; nota?: string }) {
  const [hecho, setHecho] = useState(false);
  return (
    <div className="comando">
      <code>{texto}</code>
      <button
        type="button"
        className="boton boton-sec"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setHecho(true);
            setTimeout(() => setHecho(false), 2000);
          } catch {
            // Sin permiso de portapapeles: el texto sigue ahí para seleccionarlo a mano.
          }
        }}
      >
        <span aria-live="polite">{hecho ? copiado : copiar}</span>
      </button>
      {nota && <small>{nota}</small>}
    </div>
  );
}
