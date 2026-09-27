// APROBAR una propuesta del investigador — SOLO UNA PERSONA (la regla «la IA propone, el humano aprueba»).
// Ningún agente puede correr este script: un hook de Claude Code lo bloquea (scripts/investigar/hooks/
// candado.mjs). La pantalla de revisión del investigador arma el comando con las decisiones.
//
// Con la propuesta verificada y la decisión por afirmación escribe:
//   data/mapas/<plataforma>.mapa.yaml   el mapa aprobado (solo lo aprobado; valida en modo publicación)
//   data/plataformas/<plataforma>.yaml  estado «publicada»
//   data/revisiones/<plataforma>.jsonl  una línea con la decisión (también «sin novedades»)
// Antes de escribir, carga una copia de data/ con los cambios (el mismo cargador del build): si algo no
// pasa, no escribe nada.
//
// Uso: node scripts/aprobar.mjs propuestas/<carpeta> --aprobar A-1,A-2 --rechazar A-3   («-» = ninguna)
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { stringify } from "yaml";
import { cargarTs, RAIZ_REPO } from "./lib/cargar-ts.mjs";
import { carpetaPropuesta, gramaticaDe, hoy, leerYaml, RAIZ, rangos } from "./investigar/comun.mjs";

function escribir(raiz, id, mapa, revision, carpeta, fecha) {
  const cabecera = `# APROBADO por una persona el ${fecha} desde ${carpeta} (scripts/aprobar.mjs).\n# Solo contiene afirmaciones aprobadas. No se edita a mano: se vuelve a investigar.\n`;
  writeFileSync(join(raiz, "data/mapas", `${id}.mapa.yaml`), cabecera + stringify(mapa, { lineWidth: 0, version: "1.2" }));
  const rutaPlat = join(raiz, "data/plataformas", `${id}.yaml`);
  const plat = readFileSync(rutaPlat, "utf8");
  writeFileSync(rutaPlat, plat.replace(/^estado: proximamente$/m, "estado: publicada"));
  mkdirSync(join(raiz, "data/revisiones"), { recursive: true });
  appendFileSync(join(raiz, "data/revisiones", `${id}.jsonl`), `${JSON.stringify(revision)}\n`);
}

try {
  console.log(`aprobar: raíz ${RAIZ}`);
  const inv = await cargarTs("src/lib/investigador/index.ts");
  const { cargarDatos } = await cargarTs("src/lib/datos/index.ts");
  const d = inv.leerDecisiones(process.argv.slice(2));
  const dir = carpetaPropuesta(d.carpeta);
  const carpeta = relative(RAIZ, dir);
  const bytes = readFileSync(join(dir, "propuesta.json"));
  const propuesta = inv.esquemaPropuesta.parse(JSON.parse(bytes.toString("utf8")));
  if (!existsSync(join(dir, "verificacion.json"))) throw new Error("falta verificacion.json: corre antes scripts/verificar-citas.mjs");
  const verificacion = inv.esquemaVerificacion.parse(JSON.parse(readFileSync(join(dir, "verificacion.json"), "utf8")));
  const id = propuesta.plataforma;
  if (!existsSync(join(RAIZ, "data/plataformas", `${id}.yaml`))) throw new Error(`no existe data/plataformas/${id}.yaml`);
  const rutaAnterior = join(RAIZ, "data/mapas", `${id}.mapa.yaml`);
  const fecha = hoy("BIGD_FECHA_APROBACION");
  const { mapa, revision } = inv.aprobar({
    carpeta,
    propuesta,
    propuestaSha256: inv.sha256(bytes),
    verificacion,
    aprobadas: d.aprobadas,
    rechazadas: d.rechazadas,
    gramatica: gramaticaDe(propuesta.mapa),
    rangos: rangos(),
    anterior: existsSync(rutaAnterior) ? leerYaml(rutaAnterior) : undefined,
    fecha,
  });
  // Ensayo: los mismos cambios sobre una copia de data/, cargada con el cargador del build.
  const ensayo = mkdtempSync(join(tmpdir(), "bigd-aprobar-"));
  cpSync(join(RAIZ, "data"), join(ensayo, "data"), { recursive: true });
  escribir(ensayo, id, mapa, revision, carpeta, fecha);
  cargarDatos(join(ensayo, "data"), RAIZ_REPO);
  escribir(RAIZ, id, mapa, revision, carpeta, fecha);
  console.log(
    `aprobar: ${id} ${revision.resultado} · mapa v${mapa.version} · ${mapa.nodos.length} componentes · ${mapa.flujos.length} flujos · ` +
      `${revision.aprobadas.length} aprobadas · ${revision.rechazadas.length} rechazadas → data/mapas/${id}.mapa.yaml`,
  );
} catch (e) {
  console.error(`aprobar: ${e.fallas ? e.message : e.message ?? e}`);
  process.exit(1);
}
