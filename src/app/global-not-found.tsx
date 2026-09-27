import type { Metadata } from "next";
import { scriptTema } from "@/components/scriptTema";
import { IDIOMAS, NOMBRE_PROPIO } from "@/lib/i18n";
import { jetbrainsMono, spaceGrotesk } from "./fuentes";
import "./globals.css";

// 404 global: la app tiene layouts raíz por idioma, así que no hay uno solo desde el cual componerlo
// (Next 16, `experimental.globalNotFound`). Bilingüe: cada texto con su `lang`.
export const metadata: Metadata = { title: "404 · Big-D" };

const TEXTO = {
  es: { titulo: "Esta página no existe", volver: "Volver al atlas" },
  en: { titulo: "This page does not exist", volver: "Back to the atlas" },
} as const;

export default function GlobalNotFound() {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <main className="pagina" id="contenido">
          <div className="encabezado">
            <div>
              <span className="ojo">404</span>
              <h1 lang="es">{TEXTO.es.titulo}</h1>
              <p className="sub" lang="en">
                {TEXTO.en.titulo}
              </p>
            </div>
          </div>
          <ul className="entradas">
            {IDIOMAS.map((idioma) => (
              <li key={idioma}>
                <a href={`/${idioma}`} hrefLang={idioma} lang={idioma}>
                  <b>{NOMBRE_PROPIO[idioma]}</b>
                  <span>{TEXTO[idioma].volver}</span>
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
