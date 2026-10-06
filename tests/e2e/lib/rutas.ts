// Las rutas del export, sacadas del dato (N plataformas, jamás una lista a mano): la raíz de cada idioma, las
// vistas del atlas de cada plataforma publicada y el investigador de todas. Si una plataforma se publica,
// sus rutas entran solas a las pruebas que recorren el sitio entero (g11, reduced-motion). El recorrido solo
// si su mapa trae uno (B-17 d de la auditoría del S1: se suponía en toda plataforma publicada). El lado a lado
// (S2), una por idioma; las versiones de cada mapa publicado (S2, D-S2-08). La base de conocimiento y, por cada caso
// de data/casos, su perfil y su comparación (S3, D-S3-16).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { IDIOMAS } from "../../../src/lib/i18n";

const DATOS = join(__dirname, "../../../data");
const plataformas = readdirSync(join(DATOS, "plataformas"))
  .filter((f) => f.endsWith(".yaml"))
  .sort()
  .map((f) => parse(readFileSync(join(DATOS, "plataformas", f), "utf8")) as { id: string; estado: string; nombre: { es: string; en: string } });

export const PUBLICADAS = plataformas.filter((p) => p.estado === "publicada").map((p) => p.id);
/** Las que todavía no tienen mapa (estado vacío del investigador), con su nombre. */
export const PROXIMAS = plataformas.filter((p) => p.estado === "proximamente");
/** Todas las plataformas, en orden de id (el del lado a lado). */
export const PLATAFORMAS = plataformas.map((p) => p.id);
export const VISTAS_ATLAS = ["", "/componentes", "/recorrido"] as const;
/** Las vistas que existen para una plataforma publicada: el recorrido, si su mapa trae uno. */
export function vistasDe(id: string): string[] {
  const mapa = join(DATOS, "mapas", `${id}.mapa.yaml`);
  const recorridos = existsSync(mapa) ? ((parse(readFileSync(mapa, "utf8")) as { recorridos?: unknown[] }).recorridos ?? []) : [];
  return VISTAS_ATLAS.filter((v) => v !== "/recorrido" || recorridos.length > 0);
}
/** Las publicadas con al menos una versión archivada (D-S2-09): su página de versiones dibuja; las demás, estado vacío. */
const DIR_VERSIONES = join(DATOS, "mapas", "versiones");
export const VERSIONADAS = PUBLICADAS.filter((p) => existsSync(DIR_VERSIONES) && readdirSync(DIR_VERSIONES).some((f) => f.startsWith(`${p}-`)));
/** Los casos de data/casos (el nombre del archivo es el id). */
export const CASOS = readdirSync(join(DATOS, "casos"))
  .filter((f) => f.endsWith(".yaml"))
  .sort()
  .map((f) => f.slice(0, -5));
export { IDIOMAS };
export const RUTAS = IDIOMAS.flatMap((i) => [
  `/${i}`,
  `/${i}/comparar`,
  ...PUBLICADAS.flatMap((p) => vistasDe(p).map((v) => `/${i}/atlas/${p}${v}`)),
  ...PUBLICADAS.map((p) => `/${i}/atlas/${p}/versiones`),
  ...plataformas.map((p) => `/${i}/investigador/${p.id}`),
  `/${i}/base`,
  ...CASOS.flatMap((c) => [`/${i}/casos/${c}`, `/${i}/casos/${c}/comparacion`]),
]);
/** ¿La ruta dibuja un lienzo? Toda vista del atlas, salvo las versiones de un mapa que tiene una sola. */
export const conDibujo = (ruta: string): boolean =>
  ruta.includes("/atlas/") && (!ruta.endsWith("/versiones") || VERSIONADAS.some((p) => ruta.includes(`/atlas/${p}/`)));
