// Generador de la REFERENCIA de la Etapa de Diseño: escribe docs/diseno/*.html (las 13 páginas de la
// maqueta y sus SVG). No es el motor ni el paquete del diagramador: es la calculadora con la que la
// maqueta se trazó por reglas (regla 8), versionada para que un dibujo mal se corrija en el dato o en la
// regla y jamás en el SVG. Se congela tras G-Diseño; desde el S1 el renderizador reproduce sus páginas.
//
// Uso: pnpm maqueta                       → regenera docs/diseno/
//      MAQUETA_SALIDA=<dir temporal> …    → genera fuera del repo (gate de deriva)
//
// Árbol (regla 17-bis b): lee scripts/maqueta/entrada/ (copia fijada, con huella) y la tabla de métricas
// de docs/diseno/assets/fuentes/; escribe SOLO en docs/diseno/ o en un directorio temporal del sistema.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRADA, RAIZ, SALIDA } from "./rutas.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
export const PAGINAS = [
  ["atlas/pagina3.mjs", ["atlas-nivel-1.html"]],
  ["pantallas/pagina-nivel2.mjs", ["atlas-nivel-2.html"]],
  ["pantallas/pagina-recorrido.mjs", ["atlas-recorrido.html"]],
  ["pantallas/pagina-lado.mjs", ["lado-a-lado.html"]],
  ["pantallas/pagina-kit.mjs", ["kit.html"]],
  ["pantallas/pagina-m3.mjs", ["investigador.html", "base.html", "perfil.html", "comparacion.html"]],
  ["pantallas/pagina-m4.mjs", ["decisiones.html", "informe.html", "instrumento.html", "index.html"]],
];

const repo = resolve(RAIZ, "docs/diseno");
const tmp = [os.tmpdir(), fs.realpathSync(os.tmpdir())];
if (SALIDA !== repo && !tmp.some((t) => SALIDA.startsWith(t + "/"))) {
  console.error(`maqueta: salida fuera del árbol permitido: ${SALIDA} (solo docs/diseno/ o un temporal)`);
  process.exit(1);
}
const huellas = JSON.parse(fs.readFileSync(resolve(ENTRADA, "HUELLAS.json"), "utf8")).archivos;
for (const [archivo, { sha256 }] of Object.entries(huellas)) {
  const real = createHash("sha256").update(fs.readFileSync(resolve(ENTRADA, archivo))).digest("hex");
  if (real !== sha256) {
    console.error(`maqueta: la entrada ${archivo} no coincide con su huella (${real} ≠ ${sha256})`);
    process.exit(1);
  }
}
console.log(`maqueta: árbol de salida ${SALIDA}`);
fs.mkdirSync(SALIDA, { recursive: true });
for (const [script] of PAGINAS) {
  execFileSync(process.execPath, [resolve(AQUI, script)], { stdio: process.env.MAQUETA_SILENCIO ? "ignore" : "inherit", env: { ...process.env, MAQUETA_SALIDA: SALIDA } });
}
