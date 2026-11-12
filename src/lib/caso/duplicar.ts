// D3 (S8): duplicar un caso. Lo que escribe `scripts/duplicar-caso.mjs`, que solo una persona corre (`puedeAprobar`) con el
// comando que arma la pantalla del caso. La copia nace en BORRADOR: el perfil sin sello y con su `origen` (de qué caso y con qué
// huella), el plan sin sello y con sus riesgos y supuestos otra vez propuestos; las revisiones del original no se copian. El
// original no se toca. Antes de escribir, la copia se carga en un ensayo con el cargador del build: si no carga, no escribe nada.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { parse, stringify } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { esquemaCaso, type Caso } from "@/lib/datos/conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class ErrorAlDuplicar extends Error {}

function archivosDe(d: string): string[] {
  return readdirSync(d, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".yaml"))
    .sort();
}

/** Lo que la copia escribe, por ruta relativa a la carpeta de datos. No escribe nada. */
export function copiaDe(dir: string, original: string, nuevo: string): Map<string, string> {
  if (!ID.test(original)) throw new ErrorAlDuplicar(`id de caso no permitido: «${original}»`);
  if (!ID.test(nuevo)) throw new ErrorAlDuplicar(`el id nuevo «${nuevo}» no es válido: minúsculas, números y guiones (como «${original}-b»)`);
  if (nuevo === original) throw new ErrorAlDuplicar("el id nuevo es el del original: elige otro");
  const ruta = join(dir, "casos", `${original}.yaml`);
  if (!existsSync(ruta)) throw new ErrorAlDuplicar(`no existe el caso «${original}» (data/casos/${original}.yaml)`);
  if (existsSync(join(dir, "casos", `${nuevo}.yaml`)) || existsSync(join(dir, "casos", nuevo))) throw new ErrorAlDuplicar(`ya existe un caso «${nuevo}»: una copia nunca pisa otro caso`);

  const caso: Caso = esquemaCaso.parse(parse(readFileSync(ruta, "utf8")));
  const { aprobacion: _a, ...sinSello } = caso;
  void _a;
  const copia: Caso = esquemaCaso.parse({
    ...sinSello,
    id: nuevo,
    nombre: { es: `${caso.nombre.es} (copia)`, en: `${caso.nombre.en} (copy)` },
    estado_aprobacion: "borrador",
    origen: { duplicado_de: original, huella: huellaCaso(caso) },
  });
  const out = new Map<string, string>();
  out.set(
    `casos/${nuevo}.yaml`,
    `# Copia de «${original}» (scripts/duplicar-caso.mjs): nace en borrador; solo una persona la aprueba, con el comando de su pantalla.\n${stringify(copia, { version: "1.2" })}`,
  );

  const carpeta = join(dir, "casos", original);
  if (existsSync(carpeta))
    for (const f of archivosDe(carpeta)) {
      // El relato de fracaso es un texto humano sobre el ORIGINAL (origen declarado-por-usuario, que el esquema exige): no se copia.
      if (f === "relato-de-fracaso.yaml") continue;
      let texto = readFileSync(join(carpeta, f), "utf8").replace(new RegExp(`^caso_id: ${original}$`, "gm"), `caso_id: ${nuevo}`);
      if (f === join("plan", "plan.yaml")) {
        texto = texto.replace(/^estado_aprobacion: aprobado$/m, "estado_aprobacion: borrador").replace(/^aprobacion:\n(?:[ \t]+.*\n?)*/m, "");
        if (/^aprobacion:/m.test(texto) || !/^estado_aprobacion: borrador$/m.test(texto)) throw new ErrorAlDuplicar(`data/casos/${original}/plan/plan.yaml: no se pudo dejar el plan de la copia en borrador`);
      } else texto = texto.replace(/^origen: declarado-por-usuario$/gm, "origen: propuesto-por-agente");
      out.set(join("casos", nuevo, f), texto);
    }
  return out;
}

/** Escribe cada archivo con `wx` (jamás pisa). Si uno falla, borra solo los que ESTA llamada creó: no queda una copia a medias. */
export const escribir = (dir: string, archivos: Map<string, string>) => {
  const creados: string[] = [];
  const carpetas: string[] = [];
  try {
    for (const [r, texto] of archivos) {
      const nueva = mkdirSync(dirname(join(dir, r)), { recursive: true });
      if (nueva) carpetas.push(nueva);
      writeFileSync(join(dir, r), texto, { flag: "wx" });
      creados.push(join(dir, r));
    }
  } catch (e) {
    for (const c of creados) rmSync(c, { force: true });
    for (const c of carpetas) rmSync(c, { recursive: true, force: true });
    throw e;
  }
};

/** Duplica `original` como `nuevo` en la carpeta de datos `dir`, tras cargar la copia en un ensayo. Devuelve lo escrito. */
export function duplicarCaso(dir: string, original: string, nuevo: string): string[] {
  const archivos = copiaDe(dir, original, nuevo);
  const ensayo = mkdtempSync(join(tmpdir(), "bigd-duplicar-"));
  try {
    cpSync(dir, ensayo, { recursive: true });
    escribir(ensayo, archivos);
    cargarConocimiento(ensayo);
  } finally {
    rmSync(ensayo, { recursive: true, force: true });
  }
  escribir(dir, archivos);
  return [...archivos.keys()].map((r) => relative(dir, join(dir, r)));
}
