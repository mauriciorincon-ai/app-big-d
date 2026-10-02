import localFont from "next/font/local";

// Las MISMAS fuentes de la tabla de métricas del diagramador (G15: el sitio sirve la fuente con que
// se midió el texto). Se leen de la maqueta aprobada, cuya huella guarda metricas.json; el e2e
// `fuentes` comprueba que el woff2 servido tiene esa huella. `display: block` como la maqueta: el
// texto medido jamás se pinta con otra fuente.
export const spaceGrotesk = localFont({
  src: "../../docs/diseno/assets/fuentes/space-grotesk.woff2",
  variable: "--letra",
  weight: "300 700",
  display: "block",
  fallback: ["system-ui", "sans-serif"],
});

export const jetbrainsMono = localFont({
  src: "../../docs/diseno/assets/fuentes/jetbrains-mono.woff2",
  variable: "--letra-mono",
  weight: "100 800",
  display: "block",
  fallback: ["ui-monospace", "monospace"],
});
