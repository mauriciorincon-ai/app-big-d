// Compila los JSON Schema del contrato (packages/diagramador/esquema/) a un validador standalone de Ajv 8
// (CONTRATO § 8) y lo empaqueta con esbuild: el paquete no depende de Ajv en tiempo de ejecución y el mismo
// archivo corre en Node y en el navegador. El resultado se versiona; `tests` compara byte a byte lo que
// este script generaría con lo que está en el repo (prueba de deriva).
//
// Uso: node scripts/diagramador/compilar-esquemas.mjs          → escribe el archivo
//      node scripts/diagramador/compilar-esquemas.mjs --stdout → lo imprime (para la prueba de deriva)
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PAQUETE = join(RAIZ, "packages/diagramador");
export const SALIDA = join(PAQUETE, "src/validar/esquemas.generado.js");

const CABECERA = `// GENERADO por scripts/diagramador/compilar-esquemas.mjs desde esquema/*.schema.json (Ajv 8 standalone +
// esbuild). No se edita a mano: se regenera. La prueba de deriva compara este archivo con su generador.
/* eslint-disable */
`;

export async function generar() {
  const ajv = new Ajv2020({ code: { source: true, esm: true }, allErrors: true, strict: true, inlineRefs: false });
  for (const nombre of ["gramatica", "mapa"]) {
    ajv.addSchema(JSON.parse(readFileSync(join(PAQUETE, `esquema/${nombre}.schema.json`), "utf8")));
  }
  const fuente = standaloneCode(ajv, {
    validarGramaticaEsquema: "diagramador/gramatica.schema.json",
    validarMapaEsquema: "diagramador/mapa.schema.json",
  });
  const salida = await build({
    stdin: { contents: fuente, resolveDir: RAIZ, loader: "js", sourcefile: "esquemas.js" },
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2017",
    write: false,
    legalComments: "none",
    logLevel: "silent",
  });
  return CABECERA + salida.outputFiles[0].text;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const codigo = await generar();
  if (process.argv.includes("--stdout")) process.stdout.write(codigo);
  else {
    writeFileSync(SALIDA, codigo);
    console.log(`compilar-esquemas: ${SALIDA.slice(RAIZ.length + 1)} (${codigo.length} bytes)`);
  }
}
