import { notFound } from "next/navigation";
import { CampoPlataforma } from "@/components/atlas/CampoPlataforma";
import { opcionesPlataforma } from "@/lib/atlas";
import { datos } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

// Portada: el título y, debajo, el mismo campo «Plataforma» del atlas, sin elección (D-S1-35).
export default async function Inicio({ params }: PageProps<"/[idioma]">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const t = textos(idioma);
  return (
    <div className="encabezado">
      <div>
        <span className="ojo">{t.inicio.ojo}</span>
        <h1>{t.inicio.titulo}</h1>
        <p className="sub">{t.inicio.sub}</p>
        <div className="abrir">
          <CampoPlataforma
            opciones={opcionesPlataforma(datos(), idioma, "general")}
            etiqueta={t.atlas.plataforma.etiqueta}
            pronto={t.atlas.plataforma.pronto}
            elegir={t.atlas.plataforma.elegir}
            nota={t.atlas.plataforma.notaInicio}
          />
        </div>
      </div>
    </div>
  );
}
