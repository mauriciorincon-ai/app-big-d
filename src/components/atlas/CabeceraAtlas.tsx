import type { ReactNode } from "react";
import { opcionesPlataforma, plantilla, rutaLado, rutasAtlas, type Nivel, type Pildora } from "@/lib/atlas";
import { datos, type Atlas } from "@/lib/datos";
import { textos, type Idioma } from "@/lib/i18n";
import { CampoPlataforma } from "./CampoPlataforma";
import { Meta } from "@/components/Meta";
import { MarcaVigencia } from "./MarcaVigencia";
import { Niveles } from "./Niveles";

/**
 * Encabezado común de las vistas del atlas (maqueta: `.encabezado` + `.niveles` + `.guia`): ojo, nombre de la
 * plataforma, subtítulo, píldora de vigencia y fechas, el campo «Plataforma», las pestañas de nivel y la guía.
 */
export function CabeceraAtlas({
  idioma,
  atlas,
  nivel,
  ojo,
  sub,
  pildora,
  fecha,
  guia,
}: {
  idioma: Idioma;
  atlas: Atlas;
  nivel: Nivel;
  ojo: string;
  sub: string;
  pildora: Pildora;
  fecha: string;
  guia: { entrada: string; resto: ReactNode };
}) {
  const t = textos(idioma).atlas;
  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{ojo}</span>
          <h1>{atlas.plataforma.nombre[idioma]}</h1>
          <p className="sub">{sub}</p>
          <Meta
            items={[
              <b key="v" data-vigencia={pildora.estado}>
                <MarcaVigencia estado={pildora.estado} />
                {pildora.resumen}
              </b>,
              pildora.detalle,
              plantilla(t.consultado, { fecha }),
              plantilla(t.version, { version: atlas.mapa.version }),
            ]}
          />
        </div>
        <CampoPlataforma opciones={opcionesPlataforma(datos(), idioma, nivel)} actual={atlas.plataforma.id} etiqueta={t.plataforma.etiqueta} pronto={t.plataforma.pronto} nota={t.plataforma.nota} />
      </div>
      <Niveles t={t.niveles} actual={nivel} rutas={{ ...rutasAtlas(atlas, idioma), lado: rutaLado(idioma) }} />
      <p className="guia">
        <b>{guia.entrada}</b> {guia.resto}
      </p>
    </>
  );
}
