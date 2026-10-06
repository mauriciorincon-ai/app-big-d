// APROBAR una propuesta del investigador — SOLO UNA PERSONA (la regla «la IA propone, el humano aprueba»).
// La frontera está aquí dentro: sobre el repo real, el script se niega a correr dentro de una sesión de Claude
// Code o sin una terminal interactiva (`puedeAprobar`, M-15 de la auditoría del S1). Además, un hook de Claude
// Code bloquea a los agentes que intentan lanzarlo (scripts/investigar/hooks/candado.mjs): defensa contra el
// accidente. La pantalla de revisión del investigador arma el comando con las decisiones.
//
// Con la propuesta verificada y la decisión por afirmación escribe:
//   data/mapas/versiones/<plataforma>-<versión>.mapa.yaml   el mapa que había, byte a byte, si la versión cambia
//                                       (D-S2-09: nada aprobado se pierde; la página de diferencias lo dibuja)
//   data/mapas/<plataforma>.mapa.yaml   el mapa aprobado (solo lo aprobado; valida en modo publicación)
//   data/plataformas/<plataforma>.yaml  estado «publicada»
//   data/revisiones/<plataforma>.jsonl  una línea con la decisión (también «sin novedades»), la última
// Con una propuesta de EVIDENCIAS (D-S3-10, `tipo: "evidencias"`) escribe, en cambio:
//   data/evidencias/<plataforma>/<id>.yaml           cada evidencia aprobada, con la verificación de cada fuente
//   data/revisiones/evidencias/<plataforma>.jsonl    una línea con la decisión y la huella de cada evidencia
// Antes de escribir, carga una copia de data/ con los cambios (el mismo cargador del build): si algo no
// pasa, no escribe nada. Cada archivo se escribe entero a un temporal y se renombra (B-34).
//
// Uso: node scripts/aprobar.mjs propuestas/<carpeta> --aprobar A-1,A-2 --rechazar A-3 --retirar -   («-» = ninguna)
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { parse, stringify } from "yaml";
import { cargarTs, RAIZ_REPO } from "./lib/cargar-ts.mjs";
import { carpetaPropuesta, gramaticaDe, hoy, leerYaml, puedeAprobar, RAIZ, rangos } from "./investigar/comun.mjs";

/** Escribe entero o no escribe: temporal al lado y `rename` (atómico en el mismo disco). */
function escribirEntero(ruta, texto) {
  writeFileSync(`${ruta}.tmp`, texto);
  renameSync(`${ruta}.tmp`, ruta);
}

/**
 * Antes de sobrescribir un mapa con otra versión, la que había se archiva con sus mismos bytes (su huella es la que
 * aprobó una persona). Si el archivo ya existe con otros bytes, no se toca nada.
 */
function archivarAnterior(raiz, id, mapa) {
  const ruta = join(raiz, "data/mapas", `${id}.mapa.yaml`);
  if (!existsSync(ruta)) return;
  const bytes = readFileSync(ruta);
  const version = parse(bytes.toString("utf8")).version;
  if (version === mapa.version) return;
  const dir = join(raiz, "data/mapas/versiones");
  const destino = join(dir, `${id}-${version}.mapa.yaml`);
  if (existsSync(destino)) {
    if (!readFileSync(destino).equals(bytes)) throw new Error(`data/mapas/versiones/${id}-${version}.mapa.yaml ya existe con otro contenido: no se sobrescribe una versión aprobada`);
    return;
  }
  mkdirSync(dir, { recursive: true });
  escribirEntero(destino, bytes);
}

function escribir(raiz, id, mapa, revision, carpeta, fecha) {
  archivarAnterior(raiz, id, mapa);
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

/** Las evidencias aprobadas, cada una en su archivo, y la línea de la revisión al final (B-34: entero o nada). */
function escribirEvidencias(raiz, id, evidencias, revision, carpeta, fecha) {
  const dirEv = join(raiz, "data/evidencias", id);
  mkdirSync(dirEv, { recursive: true });
  const cabecera = `# APROBADA por una persona el ${fecha} (UTC) desde ${carpeta}.\n# No se edita a mano: se vuelve a investigar (su huella está en data/revisiones/evidencias/${id}.jsonl).\n`;
  for (const e of evidencias) escribirEntero(join(dirEv, `${e.id}.yaml`), cabecera + stringify(e, { lineWidth: 0, version: "1.2" }));
  mkdirSync(join(raiz, "data/revisiones/evidencias"), { recursive: true });
  const rutaRev = join(raiz, "data/revisiones/evidencias", `${id}.jsonl`);
  escribirEntero(rutaRev, `${existsSync(rutaRev) ? readFileSync(rutaRev, "utf8") : ""}${JSON.stringify(revision)}\n`);
}

/** Una propuesta de evidencias: se aprueba evidencia por evidencia contra la base de conocimiento de hoy. */
async function aprobarEvidencias(inv, d, dir, carpeta, bytes, verificacion, fecha) {
  const propuesta = inv.esquemaPropuestaEvidencias.parse(JSON.parse(bytes.toString("utf8")));
  const id = propuesta.plataforma;
  if (!existsSync(join(RAIZ, "data/plataformas", `${id}.yaml`))) throw new Error(`no existe data/plataformas/${id}.yaml`);
  const { cargarConocimiento } = await cargarTs("src/lib/datos/cargar-conocimiento.ts");
  const { cargarDatos } = await cargarTs("src/lib/datos/index.ts");
  const { evidenciasSinAprobacion } = await cargarTs("src/lib/investigador/aprobados.ts");
  const rutaRev = join(RAIZ, "data/revisiones/evidencias", `${id}.jsonl`);
  const ultima = existsSync(rutaRev)
    ? readFileSync(rutaRev, "utf8").split("\n").filter(Boolean).map((l) => inv.esquemaRevisionEvidencias.parse(JSON.parse(l)).propuesta).sort().at(-1)
    : undefined;
  const { evidencias, revision } = inv.aprobarEvidencias({
    carpeta,
    propuesta,
    propuestaSha256: inv.sha256(bytes),
    verificacion,
    aprobadas: d.aprobadas,
    rechazadas: d.rechazadas,
    retiradas: d.retiradas,
    contexto: inv.contextoDe(cargarConocimiento(join(RAIZ, "data")), inv.componentesDeMapas(join(RAIZ, "data"))),
    ...(ultima ? { ultimaPropuesta: ultima } : {}),
    fecha,
  });
  inv.esquemaRevisionEvidencias.parse(revision);
  // Ensayo: los mismos cambios sobre una copia de data/, cargada con los cargadores del build, y cada evidencia con la
  // huella que guarda su revisión.
  const ensayo = mkdtempSync(join(tmpdir(), "bigd-aprobar-"));
  try {
    cpSync(join(RAIZ, "data"), join(ensayo, "data"), { recursive: true });
    escribirEvidencias(ensayo, id, evidencias, revision, carpeta, fecha);
    cargarConocimiento(join(ensayo, "data"));
    cargarDatos(join(ensayo, "data"), RAIZ_REPO);
    const fallas = evidenciasSinAprobacion(join(ensayo, "data"));
    if (fallas.length) throw new Error(`el ensayo no pasa:\n${fallas.join("\n")}`);
  } finally {
    rmSync(ensayo, { recursive: true, force: true });
  }
  escribirEvidencias(RAIZ, id, evidencias, revision, carpeta, fecha);
  console.log(`aprobar: evidencias de ${id} el ${fecha} (UTC) · ${revision.aprobadas.length} aprobadas · ${revision.rechazadas.length} rechazadas → data/evidencias/${id}/`);
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
  if (!existsSync(join(dir, "verificacion.json"))) throw new Error("falta verificacion.json: corre antes scripts/verificar-citas.mjs");
  const verificacion = inv.esquemaVerificacion.parse(JSON.parse(readFileSync(join(dir, "verificacion.json"), "utf8")));
  const fecha = hoy("BIGD_FECHA_APROBACION");
  if (inv.esPropuestaDeEvidencias(JSON.parse(bytes.toString("utf8")))) {
    await aprobarEvidencias(inv, d, dir, carpeta, bytes, verificacion, fecha);
    process.exit(0);
  }
  const propuesta = inv.esquemaPropuesta.parse(JSON.parse(bytes.toString("utf8")));
  const id = propuesta.plataforma;
  if (!existsSync(join(RAIZ, "data/plataformas", `${id}.yaml`))) throw new Error(`no existe data/plataformas/${id}.yaml`);
  const rutaAnterior = join(RAIZ, "data/mapas", `${id}.mapa.yaml`);
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
