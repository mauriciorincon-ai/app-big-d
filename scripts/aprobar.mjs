// APROBAR una propuesta del investigador — SOLO UNA PERSONA (la regla «la IA propone, el humano aprueba»).
// La frontera está aquí dentro: sobre el repo real, el script se niega a correr dentro de una sesión de Claude
// Code o sin una terminal interactiva (`puedeAprobar`, M-15 de la auditoría del S1). Además, un hook de Claude
// Code bloquea a los agentes que intentan lanzarlo (scripts/investigar/hooks/candado.mjs): defensa contra el
// accidente. La pantalla de revisión del investigador arma el comando con las decisiones.
//
// Con la propuesta verificada y la decisión por afirmación escribe:
//   data/mapas/<plataforma>.mapa.yaml   el mapa aprobado (solo lo aprobado; valida en modo publicación)
//   data/plataformas/<plataforma>.yaml  estado «publicada»
//   data/revisiones/<plataforma>.jsonl  una línea con la decisión (también «sin novedades»), la última
// Antes de escribir, carga una copia de data/ con los cambios (el mismo cargador del build): si algo no
// pasa, no escribe nada. Cada archivo se escribe entero a un temporal y se renombra (B-34).
//
// Uso: node scripts/aprobar.mjs propuestas/<carpeta> --aprobar A-1,A-2 --rechazar A-3 --retirar -   («-» = ninguna)
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { stringify } from "yaml";
import { cargarTs, RAIZ_REPO } from "./lib/cargar-ts.mjs";
import { carpetaPropuesta, gramaticaDe, hoy, leerYaml, puedeAprobar, RAIZ, rangos } from "./investigar/comun.mjs";

/** Escribe entero o no escribe: temporal al lado y `rename` (atómico en el mismo disco). */
function escribirEntero(ruta, texto) {
  writeFileSync(`${ruta}.tmp`, texto);
  renameSync(`${ruta}.tmp`, ruta);
}

function escribir(raiz, id, mapa, revision, carpeta, fecha) {
  // La fecha es la del día en UTC (B-32): en otra zona horaria puede no ser la de la persona.
  const cabecera = `# APROBADO por una persona el ${fecha} (UTC) desde ${carpeta} (scripts/aprobar.mjs).\n# Solo contiene afirmaciones aprobadas. No se edita a mano: se vuelve a investigar.\n`;
  escribirEntero(join(raiz, "data/mapas", `${id}.mapa.yaml`), cabecera + stringify(mapa, { lineWidth: 0, version: "1.2" }));
  const rutaPlat = join(raiz, "data/plataformas", `${id}.yaml`);
  escribirEntero(rutaPlat, readFileSync(rutaPlat, "utf8").replace(/^estado: proximamente$/m, "estado: publicada"));
  // La revisión, al final: si algo de lo anterior fallara, no queda registrada una aprobación sin su mapa.
  mkdirSync(join(raiz, "data/revisiones"), { recursive: true });
  const rutaRev = join(raiz, "data/revisiones", `${id}.jsonl`);
  escribirEntero(rutaRev, `${existsSync(rutaRev) ? readFileSync(rutaRev, "utf8") : ""}${JSON.stringify(revision)}\n`);
}

/** La carpeta de la última propuesta cerrada de la plataforma, según su historial. */
function ultimaPropuesta(inv, id) {
  const ruta = join(RAIZ, "data/revisiones", `${id}.jsonl`);
  if (!existsSync(ruta)) return undefined;
  const lineas = readFileSync(ruta, "utf8").split("\n").filter(Boolean);
  return lineas.map((l) => inv.esquemaRevision.parse(JSON.parse(l)).propuesta).sort().at(-1);
}

try {
  const guarda = puedeAprobar({ raiz: RAIZ, repo: RAIZ_REPO, env: process.env, tty: Boolean(process.stdin.isTTY && process.stdout.isTTY) });
  if (!guarda.ok) throw new Error(`solo una persona aprueba: ${guarda.motivo}`);
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
  const ultima = ultimaPropuesta(inv, id);
  const { mapa, revision } = inv.aprobar({
    carpeta,
    propuesta,
    propuestaSha256: inv.sha256(bytes),
    verificacion,
    aprobadas: d.aprobadas,
    rechazadas: d.rechazadas,
    retiradas: d.retiradas,
    gramatica: gramaticaDe(propuesta.mapa),
    rangos: rangos(),
    anterior: existsSync(rutaAnterior) ? leerYaml(rutaAnterior) : undefined,
    ...(ultima ? { ultimaPropuesta: ultima } : {}),
    fecha,
  });
  // La línea de la revisión pasa por su esquema antes de escribirse (B-33).
  inv.esquemaRevision.parse(revision);
  // Ensayo: los mismos cambios sobre una copia de data/, cargada con el cargador del build.
  const ensayo = mkdtempSync(join(tmpdir(), "bigd-aprobar-"));
  try {
    cpSync(join(RAIZ, "data"), join(ensayo, "data"), { recursive: true });
    escribir(ensayo, id, mapa, revision, carpeta, fecha);
    cargarDatos(join(ensayo, "data"), RAIZ_REPO);
  } finally {
    rmSync(ensayo, { recursive: true, force: true });
  }
  escribir(RAIZ, id, mapa, revision, carpeta, fecha);
  console.log(
    `aprobar: ${id} ${revision.resultado} el ${fecha} (UTC) · mapa v${mapa.version} · ${mapa.nodos.length} componentes · ${mapa.flujos.length} flujos · ` +
      `${revision.aprobadas.length} aprobadas · ${revision.rechazadas.length} rechazadas → data/mapas/${id}.mapa.yaml`,
  );
} catch (e) {
  console.error(`aprobar: ${e.fallas ? e.message : e.message ?? e}`);
  process.exit(1);
}
