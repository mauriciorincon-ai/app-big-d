import type { ReactNode } from "react";

/**
 * Una línea de metadatos (maqueta: `.meta`). Cada dato lleva pegado su «·»: al partirse la línea en un teléfono,
 * el separador queda al final de la línea de arriba y nunca abre la siguiente (pasada de capturas del S1).
 */
export function Meta({ items }: { items: ReactNode[] }) {
  const n = items.length;
  return (
    <p className="meta">
      {items.map((x, i) => (
        <span key={i} className="meta-dato">
          {x}
          {i < n - 1 && (
            <span className="punto" aria-hidden="true">
              ·
            </span>
          )}
        </span>
      ))}
    </p>
  );
}
