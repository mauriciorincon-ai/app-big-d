// Genera la VERSIÓN ANTERIOR DE MUESTRA del kit de prueba (docs/kit-de-prueba/versiones-de-muestra/): una v0.0.9
// SINTÉTICA de la Plataforma Ejemplo (ficticia), para ver en el producto las cuatro marcas de diferencia de
// `/[idioma]/atlas/plataforma-ejemplo/versiones` (D-S2-08). Los datos reales no las traen: entre las dos versiones de
// Fabric no cambió el dibujo. Respecto del mapa de ejemplo publicado, la v0.0.9:
//   - llama «Conector JDBC» al conector de bases relacionales (→ renombrado);
//   - tiene «Cuadernos interactivos», que la versión vigente ya no trae (− retirado);
//   - no tiene los filtros por fila ni su flujo (+ nuevo en la vigente);
//   - tiene el agente de datos en beta (▮ madurez).
// Sale del mapa de ejemplo por código: no se edita a mano. `tests/unit/kit-de-prueba.test.ts` regenera y compara.
//
// Uso: node scripts/kit-de-prueba/versiones.mjs [carpeta de salida]   (por defecto, la del kit)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse, stringify } from "yaml";
import { RAIZ_REPO } from "../lib/cargar-ts.mjs";

const SALIDA = resolve(process.argv[2] ?? join(RAIZ_REPO, "docs/kit-de-prueba/versiones-de-muestra"));
export const ARCHIVO = "data/mapas/versiones/plataforma-ejemplo-0.0.9.mapa.yaml";

const m = parse(readFileSync(join(RAIZ_REPO, "data/mapas/plataforma-ejemplo.mapa.yaml"), "utf8"));
const v = structuredClone(m);
v.version = "0.0.9";
v.nodos = v.nodos.map((n) => {
  if (n.id === "conector-relacional") return { ...n, nombre: { es: "Conector JDBC", en: "JDBC connector" } };
  if (n.id === "agente-datos") return { ...n, madurez: "beta" };
  return n;
});
const base = m.nodos.find((n) => n.id === "canalizacion-declarativa");
// Con sus propios textos (S2-AUD-37): un clon con los de las canalizaciones diría algo que no es.
const sinTerminos = structuredClone(base);
delete sinTerminos.terminos;
v.nodos.push({
  ...sinTerminos,
  id: "cuadernos",
  orden: 3,
  nombre: { es: "Cuadernos interactivos", en: "Interactive notebooks" },
  lider: { es: "Hojas donde un equipo escribe y prueba código sobre los datos, paso a paso.", en: "Pages where a team writes and tries code on the data, step by step." },
  experto: {
    es: "Celdas de código y texto que se ejecutan una a una sobre el cómputo de la plataforma; sirven para explorar y probar antes de automatizar.",
    en: "Cells of code and text that run one at a time on the platform's compute; they are for exploring and testing before automating.",
  },
  por_que_importa: {
    es: "Explorar en un cuaderno es rápido, pero lo que se queda ahí no corre solo ni se revisa como el resto.",
    en: "Exploring in a notebook is quick, but what stays there does not run on its own or get reviewed like the rest.",
  },
});
v.nodos = v.nodos.filter((n) => n.id !== "filtros-filas");
v.flujos = v.flujos.filter((f) => f.origen !== "filtros-filas" && f.destino !== "filtros-filas");

const cabecera = "# SINTÉTICA (kit de prueba): versión anterior inventada de la Plataforma Ejemplo, para ver las cuatro marcas de\n# diferencia. No la aprobó nadie porque la plataforma es ficticia. Generada por scripts/kit-de-prueba/versiones.mjs.\n";
mkdirSync(join(SALIDA, "data/mapas/versiones"), { recursive: true });
writeFileSync(join(SALIDA, ARCHIVO), cabecera + stringify(v, { lineWidth: 0, version: "1.2" }));
console.log(`kit-de-prueba: versión de muestra en ${join(SALIDA, ARCHIVO)}`);
