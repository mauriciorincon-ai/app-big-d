import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Meta } from "@/components/Meta";
import {
  ID_PISTA,
  plantilla,
  plural,
  rutasAtlas,
  vistaVersiones,
} from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";
import { revisiones } from "@/lib/investigador/revision";
// Estilos solo de esta pantalla: no bloquean el pintado del atlas.
import "@/styles/versiones.css";

// Atlas · versiones de un mapa (D-S2-08): por cada versión aprobada y la siguiente, las dos filas del lado a lado
// con sus diferencias marcadas (arriba la anterior, abajo la nueva) y la lista que las explica, como el estado
// «diferencias entre versiones» de docs/diseno/lado-a-lado.html. Aparte, lo que cambió sin cambiar el dibujo (el
// texto de los componentes, sus fuentes). Una plataforma con una sola versión muestra su estado vacío.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...datos().atlas.keys()].map((plataforma) => ({ plataforma }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[idioma]/atlas/[plataforma]/versiones">): Promise<Metadata> {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) return {};
  return {
    title: `${atlas.plataforma.nombre[idioma]} · ${textos(idioma).atlas.versiones.titulo}`,
  };
}

export default async function Versiones({
  params,
}: PageProps<"/[idioma]/atlas/[plataforma]/versiones">) {
  const { idioma, plataforma } = await params;
  const d = datos();
  const atlas = d.atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) notFound();
  const t = textos(idioma).atlas;
  const tv = t.versiones;
  const fecha = fechaDeConsulta();
  // La fecha de la primera aprobación de cada versión (las siguientes «sin novedades» solo renuevan fechas).
  const aprobaciones: Record<string, string> = {};
  for (const r of revisiones(process.cwd(), plataforma))
    aprobaciones[r.mapa_version] ??= r.fecha;
  const v = vistaVersiones(d, plataforma, idioma, fecha, aprobaciones);
  const nombre = atlas.plataforma.nombre[idioma];
  const bandas = atlas.gramatica.bandas.length;

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{tv.ojo}</span>
          <h1>{plantilla(tv.h1, { plataforma: nombre })}</h1>
          <p className="sub">{tv.sub}</p>
          <Meta
            items={[
              plantilla(tv.vigente, { version: v.vigente }),
              plural(tv.anteriores, v.pares.length),
              plantilla(t.consultado, { fecha }),
            ]}
          />
        </div>
      </div>
      <p className="volver">
        <Link href={rutasAtlas(atlas, idioma).general!}>
          {plantilla(tv.volver, { plataforma: nombre })}
        </Link>
      </p>
      {v.pares.length === 0 ? (
        <section className="version-vacio" aria-labelledby="vacio-t">
          <h2 id="vacio-t">
            {plantilla(tv.vacio.titulo, { plataforma: nombre })}
          </h2>
          <p>{tv.vacio.texto}</p>
        </section>
      ) : (
        v.pares.map((p, i) => (
          <section
            key={`${p.antes}-${p.despues}`}
            id={`version-${i}`}
            className="version-par"
            aria-labelledby={`par-${i}`}
          >
            <h2 id={`par-${i}`}>
              {plantilla(tv.par, { antes: p.antes, despues: p.despues })}
            </h2>
            {p.aprobada && (
              <Meta
                items={[
                  plantilla(tv.aprobada, {
                    version: p.despues,
                    fecha: p.aprobada,
                  }),
                ]}
              />
            )}
            {p.historica ? (
              <p className="version-historica">
                {plantilla(tv.historica, { version: p.historica })}
              </p>
            ) : (
              <>
                <p className="guia">
                  <b>{tv.guia.entrada}</b> {tv.guia.resto}
                </p>
                <p className="pista">
                  <svg
                    viewBox="-8 -8 16 16"
                    width="14"
                    height="14"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M-6,0 H5 M1.5,-3.8 L5.5,0 L1.5,3.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {plantilla(tv.pista, { n: bandas })}
                </p>
                <div className="lienzo-marco">
                  {/* El SVG lo generó el diagramador en el build (serializador propio, sin datos del visitante). */}
                  <div
                    className="lienzo version-lienzo"
                    tabIndex={0}
                    role="region"
                    aria-label={plantilla(tv.lienzo, {
                      antes: p.antes,
                      despues: p.despues,
                    })}
                    dangerouslySetInnerHTML={{ __html: p.svg }}
                  />
                </div>
                <div
                  className="version-dif"
                  dangerouslySetInnerHTML={{ __html: p.diferencias }}
                />
                <div className="version-dice">
                  <h3>{tv.dice.titulo}</h3>
                  <p>
                    {p.textos.length
                      ? plantilla(
                          tv.dice.cambiaron[p.textos.length === 1 ? 0 : 1],
                          { n: p.textos.length, lista: p.textos.join(", ") },
                        )
                      : tv.dice.ninguno}
                  </p>
                  <p>
                    {p.fuentes
                      ? plural(tv.dice.fuentes, p.fuentes)
                      : tv.dice.sinFuentes}
                  </p>
                  <p className="kit-nota">{tv.dice.nota}</p>
                </div>
              </>
            )}
          </section>
        ))
      )}
      {/* Cada lienzo avisa cuando no cabe: la pista y las sombras de los bordes (como en las vistas del atlas). */}
      {v.pares.map((p, i) =>
        p.historica ? null : (
          <ControlLienzo
            key={`${p.antes}-${p.despues}`}
            mapa={`version-${i}`}
          />
        ),
      )}
      <p className="solo-lector" id={ID_PISTA}>
        {tv.pistaActivar}
      </p>
      <PanelFicha
        fichas={v.fichas}
        titulos={v.titulos}
        titulo={t.ventana.titulo}
        cerrar={t.ficha.cerrar}
        objetivo=".version-lienzo .dg-elem"
        clave="data-dueno"
      />
    </>
  );
}
