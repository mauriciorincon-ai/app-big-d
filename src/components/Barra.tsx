import Link from "next/link";
import { textos, type Idioma } from "@/lib/i18n";
import { ConmutadorIdioma } from "./ConmutadorIdioma";
import { ConmutadorTema } from "./ConmutadorTema";
import { SignoMarca } from "./Marca";

/** Barra de la app (maqueta: `.barra`). En S1 la única sección construida es el atlas. */
export function Barra({ idioma }: { idioma: Idioma }) {
  const t = textos(idioma).barra;
  return (
    <header className="barra">
      <Link className="marca" href={`/${idioma}`}>
        <SignoMarca />
        Big-D <span className="marca-sello">{t.sello}</span>
      </Link>
      <ul className="nav" aria-label={t.secciones}>
        <li>
          <Link href={`/${idioma}`} aria-current="page">
            {t.atlas}
          </Link>
        </li>
      </ul>
      <div className="ajustes">
        <ConmutadorIdioma actual={idioma} etiqueta={t.idioma} />
        <ConmutadorTema etiqueta={t.tema} oscuro={t.oscuro} claro={t.claro} />
      </div>
    </header>
  );
}
