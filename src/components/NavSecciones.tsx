"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Secciones de la barra; la actual se marca por la ruta (`/es/atlas/…`, `/es/investigador/…`). */
export function NavSecciones({ etiqueta, secciones }: { etiqueta: string; secciones: { ruta: string; texto: string; prefijo: string }[] }) {
  const ruta = usePathname() ?? "";
  const actual = secciones.find((s) => ruta.startsWith(s.prefijo)) ?? secciones[0];
  return (
    <ul className="nav" aria-label={etiqueta}>
      {secciones.map((s) => (
        <li key={s.prefijo}>
          <Link href={s.ruta} aria-current={s === actual ? "page" : undefined}>
            {s.texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}
