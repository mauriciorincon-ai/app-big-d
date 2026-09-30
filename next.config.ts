import type { NextConfig } from "next";

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
