import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Barra } from "@/components/Barra";
import { scriptTema } from "@/components/scriptTema";
import { IDIOMAS, esIdioma, textos } from "@/lib/i18n";
import { jetbrainsMono, spaceGrotesk } from "../fuentes";
import "../globals.css";

// Layout raíz por idioma: `<html lang>` sale de la ruta (/es/…, /en/…), un HTML estático por idioma.
export const dynamicParams = false;

export function generateStaticParams() {
  return IDIOMAS.map((idioma) => ({ idioma }));
}

export async function generateMetadata({ params }: LayoutProps<"/[idioma]">): Promise<Metadata> {
  const { idioma } = await params;
  if (!esIdioma(idioma)) return {};
  const t = textos(idioma).sitio;
  return { title: { default: t.nombre, template: `%s · ${t.nombre}` }, description: t.descripcion };
}

export default async function LayoutIdioma({ children, params }: LayoutProps<"/[idioma]">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const t = textos(idioma);
  return (
    // El script de tema puede poner data-theme antes de hidratar: solo ese atributo difiere.
    <html lang={idioma} className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <a className="saltar" href="#contenido">
          {t.saltarContenido}
        </a>
        <Barra idioma={idioma} />
        <main className="pagina" id="contenido">
          {children}
        </main>
        <footer className="pie">
          <p>{t.pie}</p>
        </footer>
      </body>
    </html>
  );
}
