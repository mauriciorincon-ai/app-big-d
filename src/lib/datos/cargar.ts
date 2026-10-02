import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { coberturaDeRangos, validate, validateGrammar, type Cobertura, type Entrada, type Gramatica, type Mapa } from "diagramador";
import { parse } from "yaml";
import { IDIOMAS } from "@/lib/i18n";
import { esquemaPlataforma, type Plataforma } from "./esquemas";

// Cargador del dato en el BUILD (el sitio es estático: el navegador no valida). Lee data/ — YAML 1.2, un
// archivo por entidad — y lo valida entero antes de dibujar nada: plataformas con Zod, gramáticas y mapas
// con el diagramador en modo `publicacion` (G14: sin dato válido no hay dibujo). Cualquier falla rompe el
// build con archivo, regla, ruta e id; jamás se completa un dato por inferencia. La app es más estricta que
// el contrato: una ALERTA también rompe el build, porque un mapa publicado sale sin alertas.

export interface Atlas {
  plataforma: Plataforma;
  mapa: Mapa;
  gramatica: Gramatica;
}

export interface Datos {
  /** Todas las plataformas, publicadas o no, ordenadas por id (el mismo orden en todos los idiomas). */
  plataformas: Plataforma[];
  /** Las publicadas, con su mapa y su gramática ya validados. */
  atlas: Map<string, Atlas>;
}

export class ErrorDeDatos extends Error {
  constructor(readonly fallas: string[]) {
    super(`data/ no pasa la validación (${fallas.length}):\n${fallas.join("\n")}`);
    this.name = "ErrorDeDatos";
  }
}

const porId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
/**
 * ¿La URL es de un dominio reservado para ejemplos (RFC 2606 y 6761)? example.org/.com/.net y los dominios de
 * primer nivel .example, .invalid y .test: ninguno puede ser el de una institución real.
 */
export function esDominioDeEjemplo(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return u.protocol === "https:" && (["example.org", "example.com", "example.net"].includes(h) || /\.(example|invalid|test)$/.test(h));
  } catch {
    return false;
  }
}

/** Un YAML que no se puede leer: la falla ya quedó anotada con su archivo (M-10 de la auditoría del S1). */
const ROTO = Symbol("yaml roto");
const linea = (archivo: string, e: Entrada) => `${archivo} · ${e.regla} · ${e.ruta || "/"} · ${e.id} · ${e.mensaje}`;

/** Cobertura de la fuente del diagrama (V15): la de la copia fijada de la tabla de métricas. */
function cobertura(raiz: string): Cobertura {
  const tabla = JSON.parse(readFileSync(join(raiz, "packages/diagramador/metricas/cobertura.json"), "utf8"));
  return coberturaDeRangos(tabla.fuentes["space-grotesk"].rangos);
}

/** `dir` = la carpeta de datos; `raiz` = la del repo (para la cobertura de la fuente). */
export function cargarDatos(dir = join(process.cwd(), "data"), raiz = process.cwd()): Datos {
  const fallas: string[] = [];
  // Un YAML mal formado rompía la carga con «Map keys must be unique at line 2», sin decir qué archivo.
  const leerYaml = (ruta: string, archivo: string): unknown => {
    try {
      return parse(readFileSync(ruta, "utf8"));
    } catch (e) {
      fallas.push(`${archivo} · yaml · ${(e as Error).message.split("\n")[0]}`);
      return ROTO;
    }
  };

  const plataformas: Plataforma[] = [];
  for (const f of readdirSync(join(dir, "plataformas")).filter((x) => x.endsWith(".yaml")).sort()) {
    const archivo = `data/plataformas/${f}`;
    const dato = leerYaml(join(dir, "plataformas", f), archivo);
    if (dato === ROTO) continue;
    const r = esquemaPlataforma.safeParse(dato);
    if (!r.success) {
      for (const i of r.error.issues) fallas.push(`${archivo} · ${i.path.join(".") || "/"} · ${i.message}`);
      continue;
    }
    if (f !== `${r.data.id}.yaml`) fallas.push(`${archivo} · id · el archivo se llama como su id: «${r.data.id}.yaml»`);
    plataformas.push(r.data);
  }
  plataformas.sort(porId);

  const gramaticas = new Map<string, Gramatica | null>();
  function gramatica(id: string): Gramatica | null {
    if (gramaticas.has(id)) return gramaticas.get(id)!;
    const archivo = `data/gramaticas/${id}.gramatica.yaml`;
    let g: Gramatica | null = null;
    if (!existsSync(join(dir, "gramaticas", `${id}.gramatica.yaml`))) fallas.push(`${archivo} · no existe`);
    else {
      const dato = leerYaml(join(dir, "gramaticas", `${id}.gramatica.yaml`), archivo);
      const inf = dato === ROTO ? undefined : validateGrammar(dato);
      if (!inf) {
        gramaticas.set(id, null);
        return null;
      }
      for (const e of [...inf.errores, ...inf.alertas]) fallas.push(linea(archivo, e));
      if (inf.ok && !inf.alertas.length) {
        g = dato as Gramatica;
        for (const i of IDIOMAS) if (!g.idiomas.includes(i)) fallas.push(`${archivo} · /idiomas · no declara «${i}», que la interfaz sí tiene`);
      }
    }
    gramaticas.set(id, g);
    return g;
  }

  const cob = cobertura(raiz);
  const atlas = new Map<string, Atlas>();
  const conPlataforma = new Set(plataformas.map((p) => `${p.id}.mapa.yaml`));
  for (const f of readdirSync(join(dir, "mapas")).filter((x) => x.endsWith(".mapa.yaml")).sort())
    if (!conPlataforma.has(f)) fallas.push(`data/mapas/${f} · mapa sin plataforma: falta data/plataformas/${f.replace(".mapa.yaml", ".yaml")}`);

  for (const p of plataformas) {
    const archivo = `data/mapas/${p.id}.mapa.yaml`;
    const hay = existsSync(join(dir, "mapas", `${p.id}.mapa.yaml`));
    if (p.estado === "proximamente") {
      if (hay) fallas.push(`data/plataformas/${p.id}.yaml · estado · «proximamente» pero ya hay ${archivo}: publícala o retira el mapa`);
      continue;
    }
    if (!hay) {
      fallas.push(`data/plataformas/${p.id}.yaml · estado · publicada sin mapa: falta ${archivo}`);
      continue;
    }
    const leido = leerYaml(join(dir, "mapas", `${p.id}.mapa.yaml`), archivo);
    if (leido === ROTO) continue;
    const dato = leido as Record<string, unknown> | null;
    const gid = dato?.gramatica_id;
    if (typeof gid !== "string") {
      fallas.push(`${archivo} · /gramatica_id · falta`);
      continue;
    }
    const g = gramatica(gid);
    if (!g) continue;
    const inf = validate(dato, g, { mode: "publicacion", coverage: cob });
    for (const e of [...inf.errores, ...inf.alertas]) fallas.push(linea(archivo, e));
    if (!inf.ok || inf.alertas.length) continue;
    const mapa = dato as unknown as Mapa;
    if (mapa.sujeto_id !== p.id) fallas.push(`${archivo} · /sujeto_id · «${mapa.sujeto_id}» no es el id de su plataforma («${p.id}»)`);
    for (const i of IDIOMAS)
      if (mapa.sujeto_nombre[i] !== p.nombre[i]) fallas.push(`${archivo} · /sujeto_nombre/${i} · no coincide con el nombre de la plataforma («${p.nombre[i]}»)`);
    // Regla 12 (cero datos reales): una plataforma ficticia solo cita dominios reservados para ejemplos (B-46).
    if (p.ficticia)
      mapa.nodos.forEach((n, i) =>
        n.fuentes.forEach((f, k) => {
          if (!esDominioDeEjemplo(f.url)) fallas.push(`${archivo} · /nodos/${i}/fuentes/${k}/url · ${n.id} · una plataforma ficticia solo cita dominios reservados (example.org, *.invalid…)`);
        }),
      );
    // La vista «recorrido» dibuja un recorrido por mapa (B-17 c): uno de más no se publicaría en silencio.
    if (mapa.recorridos.length > 1) fallas.push(`${archivo} · /recorridos · ${mapa.sujeto_id} · el atlas dibuja un recorrido por mapa y este trae ${mapa.recorridos.length}`);
    atlas.set(p.id, { plataforma: p, mapa, gramatica: g });
  }

  if (fallas.length) throw new ErrorDeDatos(fallas);
  return { plataformas, atlas };
}

let memoria: Datos | undefined;

/** Ruta del atlas por defecto: la primera plataforma publicada en orden de id (ninguna tiene trato especial). */
export function rutaAtlas(d: Datos, idioma: string): string {
  const primera = d.plataformas.find((p) => p.estado === "publicada");
  return primera ? `/${idioma}/atlas/${primera.id}` : `/${idioma}`;
}

/** Ruta del investigador por defecto: la primera plataforma por id (B-5); sin plataformas, la portada. */
export function rutaInvestigador(d: Datos, idioma: string): string {
  const primera = d.plataformas[0];
  return primera ? `/${idioma}/investigador/${primera.id}` : `/${idioma}`;
}

/** Los datos del build, cargados y validados una sola vez por proceso. */
export function datos(): Datos {
  return (memoria ??= cargarDatos());
}
