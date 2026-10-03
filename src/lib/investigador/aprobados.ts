import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Datos } from "@/lib/datos";
import { esquemaRevision } from "./esquema";
import { huella } from "./huella";

/**
 * ¿Cada mapa publicado de una plataforma real es el que aprobó una persona? Su huella y su versión deben
 * coincidir con la última línea de data/revisiones/<id>.jsonl (M-16 de la auditoría del S1: una edición a
 * mano del YAML pasaba el build). Y sus versiones anteriores (D-S2-09): cada archivada es, huella y versión, una
 * que aprobó una persona, y ninguna versión aprobada falta del archivo. Las ficticias no pasan por el
 * investigador. Devuelve las fallas.
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
    const archivadas = d.versiones.get(id) ?? [];
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
