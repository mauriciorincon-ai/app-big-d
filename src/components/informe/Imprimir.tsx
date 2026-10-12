"use client";

// El botón «Imprimir» del informe (S6, RF-06.4): abre el diálogo de impresión del navegador. La hoja de estilos de
// impresión (informe.css) deja el mismo informe como papel claro, sin menús; la app no genera ningún PDF.
export function Imprimir({ etiqueta, nota }: { etiqueta: string; nota: string }) {
  return (
    <div className="informe-acciones">
      <button type="button" className="boton boton-sec" onClick={() => window.print()}>
        {etiqueta}
      </button>
      <span className="kit-nota">{nota}</span>
    </div>
  );
}
