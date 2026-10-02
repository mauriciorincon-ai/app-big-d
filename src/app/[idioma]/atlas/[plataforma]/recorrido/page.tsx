import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabeceraAtlas } from "@/components/atlas/CabeceraAtlas";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { ControlRecorrido } from "@/components/atlas/ControlRecorrido";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Lectura, SeccionMapa } from "@/components/atlas/SeccionMapa";
import { vistaRecorrido } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";
// La capa de animación, solo en esta vista (y dentro de una media query de movimiento no reducido).
import "@/styles/recorrido-animacion.css";

// Atlas · nivel 3 (recorrido de un dato): el primer recorrido del mapa, paso a paso. El SVG no cambia entre
// pasos: el controlador cambia `data-paso` y el CSS generado del recorrido (en línea) hace el resto; la
// animación vive en su propia hoja, solo sin movimiento reducido. Fiel a docs/diseno/atlas-recorrido.html.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...datos().atlas.values()].filter((a) => a.mapa.recorridos.length > 0).map((a) => ({ plataforma: a.plataforma.id }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/atlas/[plataforma]/recorrido">): Promise<Metadata> {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas) return {};
  return { title: `${atlas.plataforma.nombre[idioma]} · ${textos(idioma).atlas.recorrido.titulo}` };
}

export default async function AtlasRecorrido({ params }: PageProps<"/[idioma]/atlas/[plataforma]/recorrido">) {
  const { idioma, plataforma } = await params;
  const atlas = datos().atlas.get(plataforma);
  if (!esIdioma(idioma) || !atlas || !atlas.mapa.recorridos.length) notFound();
  const t = textos(idioma).atlas;
  const fecha = fechaDeConsulta();
  const v = vistaRecorrido(atlas, idioma, fecha);

  return (
    <>
      {/* Reglas de cada paso, generadas del recorrido por el diagramador (§ 4.3). */}
      <style dangerouslySetInnerHTML={{ __html: v.css }} />
      <CabeceraAtlas idioma={idioma} atlas={atlas} nivel="recorrido" ojo={t.recorrido.ojo} sub={v.titulo} pildora={v.pildora} fecha={fecha} guia={t.recorrido.guia} />
      <ControlRecorrido pasos={v.pasos} t={t.recorrido}>
        <SeccionMapa idioma={idioma} vista={v} pista={t.pistaNodo}>
          <ControlLienzo mapa="mapa" />
        </SeccionMapa>
      </ControlRecorrido>
      <PanelFicha fichas={v.fichas} titulo={t.ficha.titulo} cerrar={t.ficha.cerrar} />
      <Lectura idioma={idioma} html={v.lectura} />
    </>
  );
}
