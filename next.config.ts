import type { NextConfig } from "next";

// D-S3-14 (regla 17-bis b): un build con la perilla BIGD_DATOS declara contra qué árbol corre, y en Vercel no corre.
if (process.env.BIGD_DATOS) {
  if (process.env.VERCEL) throw new Error("BIGD_DATOS está puesta en un build de Vercel: la publicación usa siempre data/");
  console.log(`Big-D: build con los datos de ${process.env.BIGD_DATOS} (perilla de prueba; este build no se publica)`);
}

const nextConfig: NextConfig = {
  // Perfil EXPORTADO ESTÁTICO (kit v1.29.0): un HTML por ruta en out/, sin servidor.
  // `pnpm start` sirve out/ con serve (versión exacta) porque `next start` falla con export (E375).
  output: "export",
  images: { unoptimized: true },
  // El diagramador es un paquete del workspace en TypeScript sin compilar (packages/diagramador).
  transpilePackages: ["diagramador"],
  // El indicador de desarrollo de Next tapa la navegación inferior móvil e intercepta taps en los
  // e2e (visto en nutri-kids S1) — apagado por default.
  devIndicators: false,
  // Layouts raíz por idioma (/es, /en); `/` redirige al primer idioma (D-S1-15). No hay un solo layout
  // desde el cual componer el 404, así que se declara uno global (Next 16, documentado como experimental).
  experimental: { globalNotFound: true },
};

export default nextConfig;
