import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { coberturaDeRangos, validate, validateGrammar, type Cobertura, type Entrada, type Gramatica, type Mapa } from "diagramador";
import { parse } from "yaml";
import { IDIOMAS, textos } from "@/lib/i18n";
import { esquemaPlataforma, type Plataforma } from "./esquemas";
import { fechaDeConsulta } from "./fecha";
import { migrarContrato } from "./migrar";

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

/** Una versión anterior de un mapa publicado, archivada byte a byte al aprobar la siguiente (D-S2-09). */
export interface VersionArchivada {
  version: string;
  mapa: Mapa;
  /** `data/mapas/versiones/<id>-<versión>.mapa.yaml`. */
  archivo: string;
}

/**
 * Una versión archivada que las reglas de HOY ya no validan (un contrato o una gramática posteriores): no se edita
 * (son bytes aprobados), no se reinvestiga (es historia) y no se borra (la aprobación exige que esté). Se lista, su
 * huella se sigue comprobando y no se dibuja (ADR `map-versioning`, decisión 6).
 */
export interface VersionHistorica {
  version: string;
  /** `data/mapas/versiones/<id>-<versión>.mapa.yaml`. */
  archivo: string;
  /** Por qué ya no valida: las líneas del validador. */
  motivos: string[];
}

export interface Datos {
  /** Todas las plataformas, publicadas o no, ordenadas por id (el mismo orden en todos los idiomas). */
  plataformas: Plataforma[];
  /** Las publicadas, con su mapa y su gramática ya validados. */
  atlas: Map<string, Atlas>;
  /** Las versiones anteriores de cada mapa publicado, de la más vieja a la más nueva (sin la vigente). */
  versiones: Map<string, VersionArchivada[]>;
  /** Las versiones archivadas que las reglas de hoy ya no validan, de la más vieja a la más nueva (una prueba exige que hoy no haya ninguna). */
  historicas: Map<string, VersionHistorica[]>;
}

export class ErrorDeDatos extends Error {
  constructor(readonly fallas: string[]) {
    super(`data/ no pasa la validación (${fallas.length}):\n${fallas.join("\n")}`);
    this.name = "ErrorDeDatos";
  }
}

const porId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
/** Orden de versiones X.Y.Z por sus números (0.10.0 va después de 0.9.0). */
export function compararVersion(a: string, b: string): number {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}
const VERSIONADO = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d+\.\d+\.\d+)\.mapa\.yaml$/;
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

/** Regla 12 (cero datos reales): una plataforma ficticia solo cita dominios reservados para ejemplos (B-46). */
function fuentesDeFicticia(mapa: Mapa, archivo: string, fallas: string[]): void {
  mapa.nodos.forEach((n, i) =>
    n.fuentes.forEach((f, k) => {
      if (!esDominioDeEjemplo(f.url)) fallas.push(`${archivo} · /nodos/${i}/fuentes/${k}/url · ${n.id} · una plataforma ficticia solo cita dominios reservados (example.org, *.invalid…)`);
    }),
  );
}

/** Un YAML que no se puede leer: la falla ya quedó anotada con su archivo (M-10 de la auditoría del S1). */
const ROTO = Symbol("yaml roto");
const linea = (archivo: string, e: Entrada) => `${archivo} · ${e.regla} · ${e.ruta || "/"} · ${e.id} · ${e.mensaje}`;

/** Cobertura de la fuente del diagrama (V15): la de la copia fijada de la tabla de métricas. */
function cobertura(raiz: string): Cobertura {
  const tabla = JSON.parse(readFileSync(join(raiz, "packages/diagramador/metricas/cobertura.json"), "utf8"));
  return coberturaDeRangos(tabla.fuentes["space-grotesk"].rangos);
}

/**
 * `dir` = la carpeta de datos; `raiz` = la del repo (para la cobertura de la fuente); `fecha` = el «hoy» de las
 * cuatro edades en que V16 dibuja cada mapa (la fecha de consulta del build).
 */
export function cargarDatos(dir = join(process.cwd(), "data"), raiz = process.cwd(), fecha = fechaDeConsulta()): Datos {
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
      const leida = leerYaml(join(dir, "gramaticas", `${id}.gramatica.yaml`), archivo);
      const dato = leida === ROTO ? ROTO : migrarContrato(leida);
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
  const motor = Object.fromEntries(IDIOMAS.map((i) => [i, textos(i).motor]));
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
    const dato = migrarContrato(leido) as Record<string, unknown> | null;
    const gid = dato?.gramatica_id;
    if (typeof gid !== "string") {
      fallas.push(`${archivo} · /gramatica_id · falta`);
      continue;
    }
    const g = gramatica(gid);
    if (!g) continue;
    // V16 (0.4.0): en publicación el validador dibuja el mapa a cuatro edades y todo aviso de geometría es error.
    const inf = validate(dato, g, { mode: "publicacion", coverage: cob, texts: motor, queryDate: fecha });
    for (const e of [...inf.errores, ...inf.alertas]) fallas.push(linea(archivo, e));
    if (!inf.ok || inf.alertas.length) continue;
    const mapa = dato as unknown as Mapa;
    if (mapa.sujeto_id !== p.id) fallas.push(`${archivo} · /sujeto_id · «${mapa.sujeto_id}» no es el id de su plataforma («${p.id}»)`);
    for (const i of IDIOMAS)
      if (mapa.sujeto_nombre[i] !== p.nombre[i]) fallas.push(`${archivo} · /sujeto_nombre/${i} · no coincide con el nombre de la plataforma («${p.nombre[i]}»)`);
    if (p.ficticia) fuentesDeFicticia(mapa, archivo, fallas);
    // La vista «recorrido» dibuja un recorrido por mapa (B-17 c): uno de más no se publicaría en silencio.
    if (mapa.recorridos.length > 1) fallas.push(`${archivo} · /recorridos · ${mapa.sujeto_id} · el atlas dibuja un recorrido por mapa y este trae ${mapa.recorridos.length}`);
    atlas.set(p.id, { plataforma: p, mapa, gramatica: g });
  }

  // Versiones archivadas (D-S2-09): cada una es de una plataforma publicada, anterior a su mapa vigente, de la
  // misma gramática, y se valida y dibuja como un mapa publicado (la página de diferencias la dibuja). Que sea
  // EXACTAMENTE la que aprobó una persona lo comprueba `mapasSinAprobacion`, con las huellas de data/revisiones/.
  // Una de una plataforma real que las reglas de hoy ya no validan pasa a HISTÓRICA (decisión 6 del ADR): se lista
  // y no se dibuja. Una de una ficticia no tiene aprobación que la ancle: si no valida, rompe la carga.
  const versiones = new Map<string, VersionArchivada[]>();
  const historicas = new Map<string, VersionHistorica[]>();
  const dirVersiones = join(dir, "mapas", "versiones");
  // Todo lo que hay en la carpeta, salvo lo oculto (.DS_Store…): un archivo con otro nombre es una falla, no silencio.
  const archivadas = existsSync(dirVersiones) ? readdirSync(dirVersiones).filter((x) => !x.startsWith(".")).sort() : [];
  for (const f of archivadas) {
    const archivo = `data/mapas/versiones/${f}`;
    const m = VERSIONADO.exec(f);
    if (!m) {
      fallas.push(`${archivo} · nombre · se llama <plataforma>-<versión>.mapa.yaml (p. ej. plataforma-ejemplo-0.1.0.mapa.yaml)`);
      continue;
    }
    const [, id, version] = m as unknown as [string, string, string];
    const vigente = atlas.get(id);
    if (!vigente) {
      // Si su mapa vigente existe y no cargó, esa falla ya está en la lista: decir que no hay mapa sería falso.
      if (!existsSync(join(dir, "mapas", `${id}.mapa.yaml`))) fallas.push(`${archivo} · versión archivada de «${id}», que no tiene un mapa publicado`);
      continue;
    }
    const leido = leerYaml(join(dirVersiones, f), archivo);
    if (leido === ROTO) continue;
    const dato = migrarContrato(leido) as Record<string, unknown> | null;
    const inf = validate(dato, vigente.gramatica, { mode: "publicacion", coverage: cob, texts: motor, queryDate: fecha });
    const motivos = [...inf.errores, ...inf.alertas].map((e) => linea(archivo, e));
    if (motivos.length && !vigente.plataforma.ficticia) {
      historicas.set(id, [...(historicas.get(id) ?? []), { version, archivo, motivos }].sort((a, b) => compararVersion(a.version, b.version)));
      continue;
    }
    fallas.push(...motivos);
    if (motivos.length) continue;
    const mapa = dato as unknown as Mapa;
    if (mapa.sujeto_id !== id) fallas.push(`${archivo} · /sujeto_id · «${mapa.sujeto_id}» no es la plataforma del nombre («${id}»)`);
    if (mapa.version !== version) fallas.push(`${archivo} · /version · dice ${mapa.version} y el nombre ${version}`);
    if (compararVersion(version, vigente.mapa.version) >= 0) fallas.push(`${archivo} · /version · ${version} no es anterior a la vigente (${vigente.mapa.version})`);
    if (vigente.plataforma.ficticia) fuentesDeFicticia(mapa, archivo, fallas);
    versiones.set(id, [...(versiones.get(id) ?? []), { version, mapa, archivo }].sort((a, b) => compararVersion(a.version, b.version)));
  }

  if (fallas.length) throw new ErrorDeDatos(fallas);
  return { plataformas, atlas, versiones, historicas };
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
