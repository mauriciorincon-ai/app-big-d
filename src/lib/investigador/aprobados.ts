import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Datos } from "@/lib/datos";
import { esquemaCaso } from "@/lib/datos/conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";
import { esquemaRevisionCaso } from "./aprobar-caso";
import { esquemaRevision } from "./esquema";
import { esquemaRevisionEvidencias } from "./evidencias";
import { huella } from "./huella";

/**
 * ¿Cada mapa publicado de una plataforma real es el que aprobó una persona? Su huella y su versión deben
 * coincidir con la última línea de data/revisiones/<id>.jsonl (M-16 de la auditoría del S1: una edición a
 * mano del YAML pasaba el build). Y sus versiones anteriores (D-S2-09): cada archivada es, huella y versión, una
 * que aprobó una persona, y ninguna versión aprobada falta del archivo. Las históricas (las que las reglas de hoy
 * ya no validan) cuentan igual: no se dibujan, pero sus bytes siguen siendo los aprobados. Las ficticias no pasan
 * por el investigador. Devuelve las fallas.
 */
export function mapasSinAprobacion(d: Datos, dir: string): string[] {
  const fallas: string[] = [];
  for (const [id, atlas] of d.atlas) {
    if (atlas.plataforma.ficticia) continue;
    const ruta = join(dir, "revisiones", `${id}.jsonl`);
    if (!existsSync(ruta)) {
      fallas.push(`data/mapas/${id}.mapa.yaml · no hay revisión que lo apruebe (data/revisiones/${id}.jsonl)`);
      continue;
    }
    const lineas = readFileSync(ruta, "utf8").split("\n").filter(Boolean);
    const ultima = esquemaRevision.parse(JSON.parse(lineas[lineas.length - 1]!));
    const mapa = parse(readFileSync(join(dir, "mapas", `${id}.mapa.yaml`), "utf8"));
    if (huella(mapa) !== ultima.huella) fallas.push(`data/mapas/${id}.mapa.yaml · su huella no es la que aprobó una persona el ${ultima.fecha}: no se edita a mano, se vuelve a investigar`);
    if (mapa.version !== ultima.mapa_version) fallas.push(`data/mapas/${id}.mapa.yaml · versión ${mapa.version}; la aprobada es ${ultima.mapa_version}`);
    const revisiones = lineas.map((l) => esquemaRevision.parse(JSON.parse(l)));
    const archivadas = [...(d.versiones.get(id) ?? []), ...(d.historicas.get(id) ?? [])];
    for (const v of archivadas) {
      const h = huella(parse(readFileSync(join(dir, "mapas", "versiones", v.archivo.split("/").at(-1)!), "utf8")));
      if (!revisiones.some((r) => r.mapa_version === v.version && r.huella === h))
        fallas.push(`${v.archivo} · no es la versión ${v.version} que aprobó una persona: el archivo guarda los bytes aprobados, no se edita`);
    }
    for (const version of new Set(revisiones.map((r) => r.mapa_version)))
      if (version !== mapa.version && !archivadas.some((v) => v.version === version))
        fallas.push(`data/mapas/versiones/${id}-${version}.mapa.yaml · falta: la versión ${version} se aprobó y no está archivada`);
  }
  return fallas;
}

/**
 * ¿Cada evidencia aprobada de la base es la que aprobó una persona (D-S3-10)? Su huella es la que guardó la última
 * línea de data/revisiones/evidencias/<plataforma>.jsonl que la nombra, y ninguna evidencia aprobada falta de
 * data/evidencias/. Vale para todas las plataformas, también la ficticia del ensayo: sus evidencias pasan por la misma
 * aprobación. `dir` = la carpeta de datos. Devuelve las fallas.
 */
export function evidenciasSinAprobacion(dir: string): string[] {
  const fallas: string[] = [];
  const dirEv = join(dir, "evidencias");
  const dirRev = join(dir, "revisiones", "evidencias");
  const plataformas = new Set([
    ...(existsSync(dirEv) ? readdirSync(dirEv).filter((x) => !x.startsWith(".")) : []),
    ...(existsSync(dirRev) ? readdirSync(dirRev).filter((x) => x.endsWith(".jsonl")).map((x) => x.slice(0, -".jsonl".length)) : []),
  ]);
  for (const p of [...plataformas].sort()) {
    const rutaRev = join(dirRev, `${p}.jsonl`);
    const aprobadas = new Map<string, { huella: string; fecha: string }>();
    if (existsSync(rutaRev))
      for (const l of readFileSync(rutaRev, "utf8").split("\n").filter(Boolean)) {
        const r = esquemaRevisionEvidencias.parse(JSON.parse(l));
        for (const e of r.evidencias) aprobadas.set(e.id, { huella: e.huella, fecha: r.fecha });
      }
    const carpeta = join(dirEv, p);
    const archivos = existsSync(carpeta) ? readdirSync(carpeta).filter((f) => f.endsWith(".yaml")).sort() : [];
    for (const f of archivos) {
      const dato = parse(readFileSync(join(carpeta, f), "utf8")) as { id?: string; estado_aprobacion?: string };
      if (dato.estado_aprobacion !== "aprobada") continue;
      const r = aprobadas.get(String(dato.id));
      if (!r) fallas.push(`data/evidencias/${p}/${f} · ninguna revisión la aprueba (data/revisiones/evidencias/${p}.jsonl): una evidencia entra solo con la aprobación de una persona`);
      else if (huella(dato) !== r.huella) fallas.push(`data/evidencias/${p}/${f} · su huella no es la que aprobó una persona el ${r.fecha}: no se edita a mano, se vuelve a investigar`);
    }
    for (const id of aprobadas.keys()) if (!archivos.includes(`${id}.yaml`)) fallas.push(`data/evidencias/${p}/${id}.yaml · falta: se aprobó y no está en la base`);
  }
  return fallas;
}

/**
 * ¿Cada evidencia congelada en una instantánea es una versión que aprobó una persona (AU-S3-01)? El caso evalúa la
 * instantánea, no la base viva, y la huella de la instantánea solo prueba que su contenido no cambió después de
 * congelarse: no que lo congelado se aprobó. Cada evidencia de cada instantánea tiene que tener la huella que guardó
 * alguna línea de data/revisiones/evidencias/ (cualquiera: una instantánea vieja congela una versión ya reemplazada).
 * `dir` = la carpeta de datos. Devuelve las fallas.
 */
export function instantaneasSinAprobacion(dir: string): string[] {
  const aprobadas = new Set<string>();
  const dirRev = join(dir, "revisiones", "evidencias");
  if (existsSync(dirRev))
    for (const f of readdirSync(dirRev).filter((x) => x.endsWith(".jsonl")))
      for (const l of readFileSync(join(dirRev, f), "utf8").split("\n").filter(Boolean))
        for (const e of esquemaRevisionEvidencias.parse(JSON.parse(l)).evidencias) aprobadas.add(`${e.id} ${e.huella}`);
  const fallas: string[] = [];
  const dirInst = join(dir, "instantaneas");
  for (const f of existsSync(dirInst) ? readdirSync(dirInst).filter((x) => x.endsWith(".json")).sort() : []) {
    const inst = JSON.parse(readFileSync(join(dirInst, f), "utf8")) as { contenido?: { evidencias?: { id: string }[] } };
    (inst.contenido?.evidencias ?? []).forEach((e, i) => {
      if (!aprobadas.has(`${e.id} ${huella(e)}`)) fallas.push(`data/instantaneas/${f} · contenido.evidencias[${i}] · ${e.id} · no es una versión que aprobó una persona: una instantánea congela solo lo aprobado`);
    });
  }
  return fallas;
}

/**
 * ¿Cada perfil `aprobado` es el que aprobó una persona (S4, AU-S3-01 aplicado al caso)? El cargador ya comprueba que el
 * sello del YAML sea la huella de su contenido; pero quien edita el perfil a mano y recalcula el sello pasaría. Aquí el sello
 * tiene que ser, además, el de la ÚLTIMA línea de data/revisiones/casos/<id>.jsonl, que solo escribe el comando de
 * aprobación. `dir` = la carpeta de datos. Un borrador no necesita revisión. Devuelve las fallas.
 */
export function casosSinAprobacion(dir: string): string[] {
  const fallas: string[] = [];
  const dirCasos = join(dir, "casos");
  for (const f of existsSync(dirCasos) ? readdirSync(dirCasos).filter((x) => x.endsWith(".yaml")).sort() : []) {
    const caso = esquemaCaso.parse(parse(readFileSync(join(dirCasos, f), "utf8")));
    if (caso.estado_aprobacion !== "aprobado" || !caso.aprobacion) continue;
    const donde = `data/casos/${f}`;
    const ruta = join(dir, "revisiones", "casos", `${caso.id}.jsonl`);
    if (!existsSync(ruta)) {
      fallas.push(`${donde} · no hay revisión que lo apruebe (data/revisiones/casos/${caso.id}.jsonl): un perfil aprobado lo aprueba una persona con su comando`);
      continue;
    }
    const lineas = readFileSync(ruta, "utf8").split("\n").filter(Boolean);
    const ultima = esquemaRevisionCaso.parse(JSON.parse(lineas[lineas.length - 1]!));
    if (huellaCaso(caso) !== ultima.huella || caso.aprobacion.huella !== ultima.huella)
      fallas.push(`${donde} · su huella no es la que aprobó una persona el ${ultima.fecha}: un perfil aprobado no se edita a mano, se vuelve a aprobar`);
    if (caso.aprobacion.fecha !== ultima.fecha) fallas.push(`${donde} · su sello dice ${caso.aprobacion.fecha} y la revisión ${ultima.fecha}`);
  }
  return fallas;
}
