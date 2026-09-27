// Importa un módulo TypeScript de la app desde un script de Node, sin dependencias nuevas: esbuild (ya es
// dependencia de desarrollo) lo empaqueta con sus importaciones —el alias «@/» de la app y el paquete
// `diagramador` del workspace— en un archivo temporal, que se importa. Así los scripts usan EXACTAMENTE el
// mismo código que la app y que las pruebas.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

export const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export async function cargarTs(ruta) {
  const r = await build({
    entryPoints: [join(RAIZ_REPO, ruta)],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    write: false,
    logLevel: "silent",
    alias: { "@": join(RAIZ_REPO, "src") },
    // Paquetes CommonJS empaquetados en ESM necesitan un `require` real.
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  });
  const dir = mkdtempSync(join(tmpdir(), "bigd-ts-"));
  const archivo = join(dir, "modulo.mjs");
  writeFileSync(archivo, r.outputFiles[0].text);
  return import(pathToFileURL(archivo).href);
}
