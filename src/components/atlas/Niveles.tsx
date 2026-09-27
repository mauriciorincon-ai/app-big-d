import Link from "next/link";
import type { Textos } from "@/lib/i18n";

type Nivel = "general" | "componentes" | "recorrido" | "lado";
const ORDEN: Nivel[] = ["general", "componentes", "recorrido", "lado"];

/**
 * Pestañas de nivel de lectura (maqueta: `.niveles`). Un nivel con ruta es un enlace; uno que todavía no
 * existe en el producto se muestra pendiente, sin enlace (jamás un control que no hace nada).
 */
export function Niveles({ t, actual, rutas }: { t: Textos["atlas"]["niveles"]; actual: Nivel; rutas: Partial<Record<Nivel, string>> }) {
  return (
    <ul className="niveles" aria-label={t.etiqueta}>
      {ORDEN.map((nivel, i) => {
        const cuerpo = (
          <>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            {t[nivel]}
          </>
        );
        const ruta = rutas[nivel];
        return (
          <li key={nivel}>
            {ruta ? (
              <Link href={ruta} aria-current={nivel === actual ? "page" : undefined}>
                {cuerpo}
              </Link>
            ) : (
              <span className="pend">{cuerpo}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
