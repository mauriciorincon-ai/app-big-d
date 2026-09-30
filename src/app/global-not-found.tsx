import type { Metadata } from "next";
import { scriptTema } from "@/components/scriptTema";
import { IDIOMAS, textos } from "@/lib/i18n";
import { jetbrainsMono, spaceGrotesk } from "./fuentes";
import "./globals.css";

// 404 global: la app tiene layouts raíz por idioma, así que no hay uno solo desde el cual componerlo
// (Next 16, `experimental.globalNotFound`). En todos los idiomas de la interfaz, cada texto con su `lang` y
// desde el diccionario (B-17 a de la auditoría del S1: eran dos idiomas fijos escritos aquí).
export const metadata: Metadata = { title: "404 · Big-D" };

const [PRIMERO, ...RESTO] = IDIOMAS;

export default function GlobalNotFound() {
  return (
    <html lang={PRIMERO} className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <main className="pagina" id="contenido">
          <div className="encabezado">
            <div>
              <span className="ojo">404</span>
              <h1 lang={PRIMERO}>{textos(PRIMERO).noEncontrada.titulo}</h1>
              {RESTO.map((idioma) => (
                <p key={idioma} className="sub" lang={idioma}>
                  {textos(idioma).noEncontrada.titulo}
                </p>
              ))}
            </div>
          </div>
          <ul className="regresos">
            {IDIOMAS.map((idioma) => (
              <li key={idioma}>
                <a href={`/${idioma}`} hrefLang={idioma} lang={idioma}>
                  {textos(idioma).noEncontrada.volver}
                </a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
