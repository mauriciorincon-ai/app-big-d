"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Secciones de la barra; la actual se marca por la ruta (`/es/atlas/…` y `/es/comparar`, `/es/investigador/…`). `aria-current`
 * vale «page» solo si el enlace lleva a ESTA página, y «true» si la página está dentro de su sección; en la
 * portada ninguna está marcada (B-4 de la auditoría del S1: «Atlas» decía «página actual» en la portada). Una sección
 * sin ruta todavía no existe en el producto: se muestra pendiente, sin enlace (D-S3-16).
 */
export function NavSecciones({ etiqueta, secciones }: { etiqueta: string; secciones: { ruta?: string; texto: string; prefijos: string[] }[] }) {
  const ruta = usePathname() ?? "";
  const actual = secciones.find((s) => s.prefijos.some((p) => ruta.startsWith(p)));
  return (
    <ul className="nav" aria-label={etiqueta}>
      {secciones.map((s) => (
        <li key={s.texto}>
          {s.ruta ? (
            <Link href={s.ruta} aria-current={s !== actual ? undefined : s.ruta === ruta ? "page" : "true"}>
              {s.texto}
            </Link>
          ) : (
            <span className="pend">{s.texto}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
