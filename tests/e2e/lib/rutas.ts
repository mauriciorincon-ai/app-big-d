// Las rutas del export, sacadas del dato (N plataformas, jamás una lista a mano): la raíz de cada idioma, las
// vistas del atlas de cada plataforma publicada y el investigador de todas. Si una plataforma se publica,
// sus rutas entran solas a las pruebas que recorren el sitio entero (g11, reduced-motion). El recorrido solo
// si su mapa trae uno (B-17 d de la auditoría del S1: se suponía en toda plataforma publicada).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { IDIOMAS } from "../../../src/lib/i18n";

const DATOS = join(__dirname, "../../../data");
const plataformas = readdirSync(join(DATOS, "plataformas"))
  .filter((f) => f.endsWith(".yaml"))
  .sort()
  .map((f) => parse(readFileSync(join(DATOS, "plataformas", f), "utf8")) as { id: string; estado: string });

export const PUBLICADAS = plataformas.filter((p) => p.estado === "publicada").map((p) => p.id);
export const VISTAS_ATLAS = ["", "/componentes", "/recorrido"] as const;
/** Las vistas que existen para una plataforma publicada: el recorrido, si su mapa trae uno. */
export function vistasDe(id: string): string[] {
  const mapa = join(DATOS, "mapas", `${id}.mapa.yaml`);
  const recorridos = existsSync(mapa) ? ((parse(readFileSync(mapa, "utf8")) as { recorridos?: unknown[] }).recorridos ?? []) : [];
  return VISTAS_ATLAS.filter((v) => v !== "/recorrido" || recorridos.length > 0);
}
export { IDIOMAS };
export const RUTAS = IDIOMAS.flatMap((i) => [
  `/${i}`,
  ...PUBLICADAS.flatMap((p) => vistasDe(p).map((v) => `/${i}/atlas/${p}${v}`)),
  ...plataformas.map((p) => `/${i}/investigador/${p.id}`),
]);
