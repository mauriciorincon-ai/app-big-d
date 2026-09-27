import type { Metadata } from "next";
import { scriptTema } from "@/components/scriptTema";
import { es } from "@/lib/i18n/es";
import { jetbrainsMono, spaceGrotesk } from "../fuentes";
import "../globals.css";

// Layout raíz de `/`: la portada que ofrece los dos idiomas. Cada entrada lleva su propio `lang`.
export const metadata: Metadata = { title: es.sitio.nombre, description: es.sitio.descripcion };

export default function LayoutRaiz({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
