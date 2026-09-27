import Link from "next/link";
import { datos, rutaAtlas } from "@/lib/datos";
import { textos, type Idioma } from "@/lib/i18n";
import { ConmutadorIdioma } from "./ConmutadorIdioma";
import { ConmutadorTema } from "./ConmutadorTema";
import { NavSecciones } from "./NavSecciones";
import { SignoMarca } from "./Marca";

/** Barra de la app (maqueta: `.barra`). En S1: el atlas y el investigador (Conocimiento). */
export function Barra({ idioma }: { idioma: Idioma }) {
  const t = textos(idioma).barra;
  return (
    <header className="barra">
      <Link className="marca" href={`/${idioma}`}>
        <SignoMarca />
        Big-D <span className="marca-sello">{t.sello}</span>
      </Link>
      <NavSecciones
        etiqueta={t.secciones}
        secciones={[
          { ruta: rutaAtlas(datos(), idioma), texto: t.atlas, prefijo: `/${idioma}/atlas` },
          { ruta: `/${idioma}/investigador/${datos().plataformas[0]!.id}`, texto: t.conocimiento, prefijo: `/${idioma}/investigador` },
        ]}
      />
      <div className="ajustes">
        <ConmutadorIdioma actual={idioma} etiqueta={t.idioma} />
        <ConmutadorTema etiqueta={t.tema} oscuro={t.oscuro} claro={t.claro} />
      </div>
    </header>
  );
}
