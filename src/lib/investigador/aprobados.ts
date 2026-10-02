import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Datos } from "@/lib/datos";
import { esquemaRevision } from "./esquema";
import { huella } from "./huella";

/**
 * ¿Cada mapa publicado de una plataforma real es el que aprobó una persona? Su huella y su versión deben
 * coincidir con la última línea de data/revisiones/<id>.jsonl (M-16 de la auditoría del S1: una edición a
 * mano del YAML pasaba el build). Las ficticias no pasan por el investigador. Devuelve las fallas.
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
  }
  return fallas;
}
