"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Secciones de la barra; la actual se marca por la ruta (`/es/atlas/…`, `/es/investigador/…`). `aria-current`
 * vale «page» solo si el enlace lleva a ESTA página, y «true» si la página está dentro de su sección; en la
 * portada ninguna está marcada (B-4 de la auditoría del S1: «Atlas» decía «página actual» en la portada).
 */
export function NavSecciones({ etiqueta, secciones }: { etiqueta: string; secciones: { ruta: string; texto: string; prefijo: string }[] }) {
  const ruta = usePathname() ?? "";
  const actual = secciones.find((s) => ruta.startsWith(s.prefijo));
  return (
    <ul className="nav" aria-label={etiqueta}>
      {secciones.map((s) => (
        <li key={s.prefijo}>
          <Link href={s.ruta} aria-current={s !== actual ? undefined : s.ruta === ruta ? "page" : "true"}>
            {s.texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}
