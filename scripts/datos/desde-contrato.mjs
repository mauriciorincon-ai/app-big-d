// Datos de la app que NACEN del contrato del diagramador: la gramática `plataformas-datos` y el mapa de la
// Plataforma Ejemplo (el sujeto del gate de FIDELIDAD). El contrato los trae en JSON dentro de su copia
// fijada (packages/diagramador/, con huella en CONTRATO.lock); el dato de la app es YAML 1.2, un archivo
// por entidad (la regla «el conocimiento es dato»). Este script los escribe; regenerar da los mismos bytes,
// y el test `datos-desde-contrato` exige que el YAML versionado sea lo que sale de aquí y que diga lo mismo
// que su JSON, campo por campo.
//
// Uso: node scripts/datos/desde-contrato.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const PARES = [
  { desde: "packages/diagramador/gramaticas/plataformas-datos.json", hacia: "data/gramaticas/plataformas-datos.gramatica.yaml" },
  { desde: "packages/diagramador/ejemplos/plataforma-ejemplo.mapa.json", hacia: "data/mapas/plataforma-ejemplo.mapa.yaml" },
];

/** El YAML que corresponde a un par: cabecera de origen + el JSON del contrato, sin cortar líneas. */
export function generar(par) {
  const dato = JSON.parse(readFileSync(join(RAIZ, par.desde), "utf8"));
  const cabecera =
    `# GENERADO por scripts/datos/desde-contrato.mjs desde ${par.desde}\n` +
    "# (copia fijada del contrato del diagramador). No se edita a mano: el cambio va al contrato.\n";
  return cabecera + stringify(dato, { lineWidth: 0, version: "1.2" });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const par of PARES) {
    writeFileSync(join(RAIZ, par.hacia), generar(par));
    console.log(`desde-contrato: ${par.hacia}`);
  }
}
