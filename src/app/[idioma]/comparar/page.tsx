import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { Lado } from "@/components/atlas/Lado";
import { Niveles } from "@/components/atlas/Niveles";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Lectura } from "@/components/atlas/SeccionMapa";
import { Meta } from "@/components/Meta";
import { ID_PISTA, ID_SECCION_LECTURA, plantilla, rutaLado, rutasAtlas, tituloLado, vistaLado } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";

// Atlas · lado a lado: todas las plataformas con el mismo mapa, una por fila y las bandas en columnas alineadas
// (CONTRATO § 4.4). Una página estática por idioma; qué plataformas y qué página se ven vive en la URL
// (`?plataformas=a,b&pagina=2`) y lo aplica el CSS generado, sin volver a dibujar. Fiel a
// docs/diseno/lado-a-lado.html, con la forma aprobada en la mirada M1 del S2: un solo botón, arriba a la derecha
// del recuadro del diagrama, despliega los componentes de todas las bandas en el mismo diagrama y los contrae.
export async function generateMetadata({ params }: PageProps<"/[idioma]/comparar">): Promise<Metadata> {
  const { idioma } = await params;
  if (!esIdioma(idioma)) return {};
  return { title: textos(idioma).atlas.lado.titulo };
}

export default async function LadoALado({ params }: PageProps<"/[idioma]/comparar">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const t = textos(idioma).atlas;
  const fecha = fechaDeConsulta();
  const d = datos();
  const v = vistaLado(d, idioma, fecha);
  // Las pestañas 01–03 son de una plataforma: las de la primera publicada en orden de id (la ruta por defecto del atlas).
  const primera = [...d.atlas.values()].sort((a, b) => (a.plataforma.id < b.plataforma.id ? -1 : 1))[0]!;
  const nombres = Object.fromEntries(d.plataformas.map((p) => [p.id, p.nombre[idioma]]));
  const versiones = Object.fromEntries(v.filas.flatMap((f) => (f.version ? [[f.id, `v${f.version}`]] : [])));

  return (
    <>
      {/* Qué fila muestra cada estado del <html>, generado de los datos (N plataformas). */}
      <style dangerouslySetInnerHTML={{ __html: v.css }} />
      {/* Antes de pintar: el estado de la URL en el <html> (estado-lado.ts; solo dos atributos). */}
      <script dangerouslySetInnerHTML={{ __html: v.script }} />
      <div className="encabezado">
        <div>
          <span className="ojo">{t.lado.ojo}</span>
          <h1>{tituloLado(idioma, v.ids.length)}</h1>
          <p className="sub">{t.lado.sub}</p>
          <Meta items={[plantilla(t.consultado, { fecha }), t.lado.vigenciaPorFila]} />
        </div>
      </div>
      <Niveles t={t.niveles} actual="lado" rutas={{ ...rutasAtlas(primera, idioma), lado: rutaLado(idioma) }} />
      <Lado
        ids={v.ids}
        porPagina={v.porPagina}
        nombres={nombres}
        versiones={versiones}
        t={t.lado}
        saltarDiagrama={t.saltarDiagrama}
        indice={t.indice}
        idLectura={ID_SECCION_LECTURA}
        idPista={ID_PISTA}
        cabecera={v.cabecera}
        filas={v.filas}
        columnas={v.columnas}
        angosto={v.angosto}
      >
        <p className="guia">
          <b>{t.lado.guia.entrada}</b> {t.lado.guia.resto}
        </p>
      </Lado>
      <ControlLienzo mapa="mapa" />
      <PanelFicha fichas={v.fichas} titulos={v.titulos} titulo={t.ficha.titulo} cerrar={t.ficha.cerrar} objetivo=".lado-ancho .dg-elem" clave="data-dueno" />
      <section className="leyenda">
        <div className="leyenda-motor" dangerouslySetInnerHTML={{ __html: v.leyenda }} />
      </section>
      <Lectura idioma={idioma} html={v.lectura} />
    </>
  );
}
