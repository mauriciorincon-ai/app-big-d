import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PanelDeValidacion } from "@/components/instrumento/Validacion";
import { Meta } from "@/components/Meta";
import { Alerta } from "@/components/caso/Iconos";
import { plantilla } from "@/lib/atlas/plantilla";
import { esIdioma, textos } from "@/lib/i18n";
import { leerValidacion } from "@/lib/instrumento/leer";
import "@/styles/ruta-instrumento.css";

// 11 Instrumento (maqueta instrumento.html; C15, RF-09): el estado de la validación que `pnpm build` corre antes de construir.
// La página no valida: muestra el resultado. En el sitio publicado siempre es el verde (con rojo el build no llega aquí, RF-09.4);
// el rojo y el bloqueo existen en el componente y se prueban con un resultado de ejemplo.

export async function generateMetadata({ params }: PageProps<"/[idioma]/instrumento">): Promise<Metadata> {
  const { idioma } = await params;
  if (!esIdioma(idioma)) return {};
  return { title: textos(idioma).instrumento.titulo };
}

export default async function Instrumento({ params }: PageProps<"/[idioma]/instrumento">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const t = textos(idioma).instrumento;
  const v = leerValidacion();
  const instantaneas = v?.base.instantaneas.at(-1) ?? "—";
  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{t.titulo}</h1>
          <p className="sub">{t.sub}</p>
          {v && <Meta items={[plantilla(t.base, { casos: v.base.casos.join(", ") || "—", instantaneas, evidencias: v.base.evidencias })]} />}
        </div>
      </div>
      {v ? (
        <PanelDeValidacion v={v} t={t} idioma={idioma} />
      ) : (
        <section className="seccion" data-estado="sin-validacion">
          <h2>{t.sinValidacion.titulo}</h2>
          <p className="campo-aviso">
            <Alerta />
            {t.sinValidacion.cuerpo}
          </p>
        </section>
      )}
    </>
  );
}
