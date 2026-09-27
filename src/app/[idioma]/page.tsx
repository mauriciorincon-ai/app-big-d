import { notFound } from "next/navigation";
import Link from "next/link";
import { datos, rutaAtlas } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

export default async function Inicio({ params }: PageProps<"/[idioma]">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const t = textos(idioma).inicio;
  return (
    <div className="encabezado">
      <div>
        <span className="ojo">{t.ojo}</span>
        <h1>{t.titulo}</h1>
        <p className="sub">{t.sub}</p>
        <p className="abrir">
          <Link className="enlace-boton" href={rutaAtlas(datos(), idioma)}>
            {t.abrirAtlas}
          </Link>
        </p>
      </div>
    </div>
  );
}
