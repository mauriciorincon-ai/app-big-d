// Valida una propuesta del investigador por código (esquema + diagramador + coherencia; ver
// src/lib/investigador/validar.ts). La corre la skill al terminar su borrador y la vuelve a correr el hook
// de fin de la skill. Sale con 1 y la lista de fallas si no pasa; no escribe nada.
//
// Uso: node scripts/investigar/validar.mjs propuestas/<fecha>-<plataforma>[-<capa>]
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { cargarTs } from "../lib/cargar-ts.mjs";
import { carpetaPropuesta, gramaticaDe, RAIZ, rangos } from "./comun.mjs";

try {
  const dir = carpetaPropuesta(process.argv[2]);
  const { validarPropuesta } = await cargarTs("src/lib/investigador/index.ts");
  const dato = JSON.parse(readFileSync(join(dir, "propuesta.json"), "utf8"));
  const r = validarPropuesta(dato, gramaticaDe(dato.mapa), rangos());
  if (!r.ok) {
    console.error(`propuesta inválida: ${relative(RAIZ, dir)} (${r.fallas.length})\n${r.fallas.join("\n")}`);
    process.exit(1);
  }
  console.log(`propuesta válida: ${relative(RAIZ, dir)} · ${r.propuesta.afirmaciones.length} afirmaciones`);
} catch (e) {
  console.error(`validar: ${e.message}`);
  process.exit(1);
}
