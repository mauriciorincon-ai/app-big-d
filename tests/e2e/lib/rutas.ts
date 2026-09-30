// Las rutas del export, sacadas del dato (N plataformas, jamás una lista a mano): la raíz de cada idioma, las
// tres vistas del atlas de cada plataforma publicada y el investigador de todas. Si una plataforma se publica,
// sus rutas entran solas a las pruebas que recorren el sitio entero (g11, reduced-motion).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { IDIOMAS } from "../../../src/lib/i18n";

const DIR = join(__dirname, "../../../data/plataformas");
const plataformas = readdirSync(DIR)
  .filter((f) => f.endsWith(".yaml"))
  .sort()
  .map((f) => parse(readFileSync(join(DIR, f), "utf8")) as { id: string; estado: string });

export const PUBLICADAS = plataformas.filter((p) => p.estado === "publicada").map((p) => p.id);
export const VISTAS_ATLAS = ["", "/componentes", "/recorrido"] as const;
export { IDIOMAS };
export const RUTAS = IDIOMAS.flatMap((i) => [
  `/${i}`,
  ...PUBLICADAS.flatMap((p) => VISTAS_ATLAS.map((v) => `/${i}/atlas/${p}${v}`)),
  ...plataformas.map((p) => `/${i}/investigador/${p.id}`),
]);
