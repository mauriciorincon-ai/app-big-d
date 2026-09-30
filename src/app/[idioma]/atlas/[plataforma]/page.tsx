import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabeceraAtlas } from "@/components/atlas/CabeceraAtlas";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Lectura, SeccionMapa } from "@/components/atlas/SeccionMapa";
import { plantilla, vistaNivel1 } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

// Atlas · nivel 1 (visión general) de una plataforma publicada: una página estática por idioma y plataforma.
// El SVG, la leyenda y la lectura en texto salen del diagramador en el build; la página los coloca como la
// maqueta aprobada (docs/diseno/atlas-nivel-1.html, fidelidad aprobada en la parada A del S1). Al tocar un
// bloque se abre su ventana (sus componentes dibujados y sus tarjetas): pedido del usuario al mirar Fabric,
// en lugar de la ficha breve en texto.
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

  return (
    <>
      <CabeceraAtlas
        idioma={idioma}
        atlas={atlas}
        nivel="general"
        ojo={t.ojoNivel1}
        sub={plantilla(t.sub, { capas: v.capas, franjas: v.franjas })}
        pildora={v.pildora}
        fecha={fecha}
        guia={t.guia}
      />
      <SeccionMapa idioma={idioma} vista={v} pista={t.pistaActivar}>
        <ControlLienzo mapa="mapa" />
      </SeccionMapa>
      <PanelFicha fichas={v.ventanas} titulo={t.ventana.titulo} cerrar={t.ficha.cerrar} objetivo=".lienzo .dg-elem" clave="data-dueno" />
      <section className="leyenda">
        <div className="leyenda-motor" dangerouslySetInnerHTML={{ __html: v.leyenda }} />
        <p className="lg-nota">{t.notaModos}</p>
      </section>
      <Lectura idioma={idioma} html={v.lectura} />
    </>
  );
}
