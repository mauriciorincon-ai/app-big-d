import Link from "next/link";
import { rutaLado } from "@/lib/atlas";
import { idsDeCasos } from "@/lib/caso/casos";
import { rutaBase, rutaCaso } from "@/lib/caso/rutas";
import { datos, rutaAtlas, rutaInvestigador } from "@/lib/datos";
import { textos, type Idioma } from "@/lib/i18n";
import { ConmutadorIdioma } from "./ConmutadorIdioma";
import { ConmutadorTema } from "./ConmutadorTema";
import { NavSecciones } from "./NavSecciones";
import { SignoMarca } from "./Marca";

/**
 * Barra de la app (maqueta: `.barra`): las cuatro secciones de la maqueta (D-S3-16). Conocimiento lleva al investigador
 * y a la base; Caso, al primer caso por id (ninguno tiene trato especial); Instrumento queda pendiente hasta que exista.
 */
export function Barra({ idioma }: { idioma: Idioma }) {
  const t = textos(idioma).barra;
  const caso = idsDeCasos()[0];
  return (
    <header className="barra">
      <Link className="marca" href={`/${idioma}`}>
        <SignoMarca />
        Big-D <span className="marca-sello">{t.sello}</span>
      </Link>
      <NavSecciones
        etiqueta={t.secciones}
        secciones={[
          { ruta: rutaAtlas(datos(), idioma), texto: t.atlas, prefijos: [`/${idioma}/atlas`, rutaLado(idioma)] },
          { ruta: rutaInvestigador(datos(), idioma), texto: t.conocimiento, prefijos: [`/${idioma}/investigador`, rutaBase(idioma)] },
          { ruta: caso ? rutaCaso(idioma, caso) : undefined, texto: t.caso, prefijos: [`/${idioma}/casos/`] },
          { texto: t.instrumento, prefijos: [] },
        ]}
      />
      <div className="ajustes">
        <ConmutadorIdioma actual={idioma} etiqueta={t.idioma} />
        <ConmutadorTema etiqueta={t.tema} oscuro={t.oscuro} claro={t.claro} />
      </div>
    </header>
  );
}
