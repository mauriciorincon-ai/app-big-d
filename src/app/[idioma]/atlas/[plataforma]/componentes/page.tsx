import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabeceraAtlas } from "@/components/atlas/CabeceraAtlas";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Lectura, SeccionMapa } from "@/components/atlas/SeccionMapa";
import { vistaNivel2 } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

// Atlas · nivel 2 (componentes): cada componente con su tipo, su madurez y sus fuentes; al activarlo se abre
// su ficha (generada por el motor). Fiel a docs/diseno/atlas-nivel-2.html.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...datos().atlas.keys()].map((plataforma) => ({ plataforma }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/atlas/[plataforma]/componentes">): Promise<Metadata> {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) return {};
  return { title: `${atlas.plataforma.nombre[idioma]} · ${textos(idioma).atlas.nivel2.titulo}` };
}

export default async function AtlasNivel2({ params }: PageProps<"/[idioma]/atlas/[plataforma]/componentes">) {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) notFound();
  const t = textos(idioma).atlas;
  const fecha = fechaDeConsulta();
  const v = vistaNivel2(atlas, idioma, fecha);

  return (
    <>
      <CabeceraAtlas idioma={idioma} atlas={atlas} nivel="componentes" ojo={t.nivel2.ojo} sub={t.nivel2.sub} pildora={v.pildora} fecha={fecha} guia={t.nivel2.guia} />
      <SeccionMapa idioma={idioma} vista={v} pista={t.pistaNodo}>
        <ControlLienzo mapa="mapa" />
      </SeccionMapa>
      <PanelFicha fichas={v.fichas} titulo={t.ficha.titulo} cerrar={t.ficha.cerrar} />
      <Lectura idioma={idioma} html={v.lectura} />
    </>
  );
}
