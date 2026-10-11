// Valida una propuesta del investigador por código (esquema + diagramador + coherencia; ver
// src/lib/investigador/validar.ts, y para las de evidencias src/lib/investigador/evidencias.ts). La corre la skill al
// terminar su borrador y la vuelve a correr el hook de fin de la skill. Sale con 1 y la lista de fallas si no pasa; no
// escribe nada.
//
// Uso: node scripts/investigar/validar.mjs propuestas/<fecha>-<plataforma>[-<capa>|-evidencias]
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { cargarTs } from "../lib/cargar-ts.mjs";
import { carpetaPropuesta, gramaticaDe, leerYaml, RAIZ, rangos } from "./comun.mjs";

try {
  const dir = carpetaPropuesta(process.argv[2]);
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const dato = JSON.parse(readFileSync(join(dir, "propuesta.json"), "utf8"));
  if (inv.esPropuestaDeEvidencias(dato)) {
    // Evidencias: contra la base de conocimiento de hoy (criterios, escala, madurez, lo ya aprobado).
    const { cargarConocimiento } = await cargarTs("src/lib/datos/cargar-conocimiento.ts");
    const r = inv.validarPropuestaEvidencias(dato, inv.contextoDe(cargarConocimiento(join(RAIZ, "data")), inv.componentesDeMapas(join(RAIZ, "data"))));
    if (!r.ok) {
      console.error(`propuesta inválida: ${relative(RAIZ, dir)} (${r.fallas.length})\n${r.fallas.join("\n")}`);
      process.exit(1);
    }
    console.log(`propuesta válida: ${relative(RAIZ, dir)} · ${r.propuesta.evidencias.length} evidencias`);
    process.exit(0);
  }
  // El mapa aprobado, si lo hay: lo que la propuesta retira de él tiene que traer su argumento.
  // Solo con un id de plataforma bien formado se arma la ruta (el dato lo escribió el modelo).
  const aprobado = /^[a-z0-9][a-z0-9-]*$/.test(String(dato?.plataforma)) ? join(RAIZ, "data/mapas", `${dato.plataforma}.mapa.yaml`) : null;
  const r = inv.validarPropuesta(dato, gramaticaDe(dato.mapa), rangos(), aprobado && existsSync(aprobado) ? leerYaml(aprobado) : undefined);
  if (!r.ok) {
    console.error(`propuesta inválida: ${relative(RAIZ, dir)} (${r.fallas.length})\n${r.fallas.join("\n")}`);
    process.exit(1);
  }
  console.log(`propuesta válida: ${relative(RAIZ, dir)} · ${r.propuesta.afirmaciones.length} afirmaciones`);
} catch (e) {
  console.error(`validar: ${e.message}`);
  process.exit(1);
}
