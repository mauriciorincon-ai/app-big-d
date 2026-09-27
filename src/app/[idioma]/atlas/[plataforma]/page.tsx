import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { MarcaVigencia } from "@/components/atlas/MarcaVigencia";
import { Niveles } from "@/components/atlas/Niveles";
import { ID_LECTURA, ID_PISTA, ID_SECCION_LECTURA, plantilla, vistaNivel1 } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

// Atlas · nivel 1 (visión general) de una plataforma publicada: una página estática por idioma y plataforma.
// El SVG, la leyenda y la lectura en texto salen del diagramador en el build; la página solo los coloca
// como la maqueta aprobada (docs/diseno/atlas-nivel-1.html) y engancha la capa interactiva.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...datos().atlas.keys()].map((plataforma) => ({ plataforma }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/atlas/[plataforma]">): Promise<Metadata> {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) return {};
  return { title: `${atlas.plataforma.nombre[idioma]} · ${textos(idioma).atlas.tituloNivel1}` };
}

export default async function AtlasNivel1({ params }: PageProps<"/[idioma]/atlas/[plataforma]">) {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) notFound();
  const t = textos(idioma).atlas;
  const fecha = fechaDeConsulta();
  const v = vistaNivel1(atlas, idioma, fecha);
  const punto = (
    <span className="punto" aria-hidden="true">
      ·
    </span>
  );

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojoNivel1}</span>
          <h1>{atlas.plataforma.nombre[idioma]}</h1>
          <p className="sub">{plantilla(t.sub, { capas: v.capas, franjas: v.franjas })}</p>
          <p className="meta">
            <b data-vigencia={v.pildora.estado}>
              <MarcaVigencia estado={v.pildora.estado} />
              {v.pildora.resumen}
            </b>
            {punto}
            <span>{v.pildora.detalle}</span>
            {punto}
            <span>{plantilla(t.consultado, { fecha })}</span>
            {punto}
            <span>{plantilla(t.version, { version: atlas.mapa.version })}</span>
          </p>
        </div>
      </div>

      <Niveles t={t.niveles} actual="general" rutas={{ general: `/${idioma}/atlas/${plataforma}` }} />
      <p className="guia">
        <b>{t.guia.entrada}</b> {t.guia.resto}
      </p>

      <section className="mapa" id="mapa" aria-label={t.mapa}>
        <ul className="indice" aria-label={t.indice}>
          {v.columnas.map((c) => (
            <li key={c.banda}>
              <button type="button" data-col={c.banda} data-x={c.x}>
                <span className="n">{c.numero}</span>
                {c.nombre}
              </button>
            </li>
          ))}
        </ul>
        <p className="pista">
          <svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path d="M-6,0 H5 M1.5,-3.8 L5.5,0 L1.5,3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {plantilla(t.pista, { n: v.capas })}
        </p>
        <a className="saltar-diagrama" href={`#${ID_SECCION_LECTURA}`}>
          {t.saltarDiagrama}
        </a>
        <div className="lienzo-marco">
          {/* El SVG lo generó el diagramador en el build (serializador propio, sin datos del visitante). */}
          <div className="lienzo" tabIndex={0} role="region" aria-label={t.lienzo} dangerouslySetInnerHTML={{ __html: v.svg }} />
        </div>
        <p className="solo-lector" id={ID_PISTA}>
          {t.pistaActivar}
        </p>
        <ControlLienzo mapa="mapa" lectura={ID_LECTURA} />
      </section>

      <section className="leyenda">
        <div className="leyenda-motor" dangerouslySetInnerHTML={{ __html: v.leyenda }} />
        <p className="lg-nota">{t.notaModos}</p>
      </section>

      <details className="lectura-seccion" id={ID_SECCION_LECTURA}>
        <summary>{t.lectura}</summary>
        <div dangerouslySetInnerHTML={{ __html: v.lectura }} />
      </details>
    </>
  );
}
