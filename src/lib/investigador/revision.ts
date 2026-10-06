import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { diff, layout, type Mapa, type Vigencia } from "diagramador";
import type { Atlas, Datos, Plataforma } from "@/lib/datos";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import { textos, type Idioma, type Textos } from "@/lib/i18n";
import { plantilla } from "@/lib/atlas/plantilla";
import { textosMotor } from "@/lib/atlas";
import { esquemaPropuesta, esquemaRevision, esquemaVerificacion, type Propuesta, type Resultado, type Revision, type Verificacion } from "./esquema";
import { claveCita, contextoDe, esPropuestaDeEvidencias, esquemaPropuestaEvidencias, esquemaRevisionEvidencias, resultadoDe, validarPropuestaEvidencias, type RevisionEvidencias } from "./evidencias";
import { argumentosDeRetiro } from "./retiros";
import { huella, sha256 } from "./huella";
import { validarPropuesta } from "./validar";

// La pantalla del investigador de una plataforma, preparada en el BUILD (el sitio es estático): la vigencia
// de cada banda del mapa aprobado (con la misma regla que dibuja las insignias), la propuesta pendiente de
// esa plataforma en propuestas/ con su validación, su verificación y el cambio de cada afirmación contra el
// mapa aprobado (calculado por código), y el historial de data/revisiones/. Nada se aprueba aquí.

export interface BandaVigencia {
  id: string;
  numero: string;
  nombre: string;
  componentes: number;
  dias: number;
  estado: Vigencia;
}

export type Cambio = "nuevo" | "renombrado" | "madurez" | "cambiado" | "igual";

/** La verificación de una cita, como la lee la pantalla. */
export type VerificacionVista = { resultado: Resultado; http: number | null; sha256: string | null; motivo?: string } | null;
export interface CitaVista {
  texto: string;
  url: string;
  titulo: string;
  tipo: "oficial" | "tercero";
  conflicto: string;
}

/**
 * Lo que el mapa aprobado tiene y la propuesta ya no trae (M-21), con su argumento (pedido de la persona,
 * 2026-09-30): sale por arrastre (pierde uno de sus extremos, que también sale) o con su motivo y su cita.
 */
export interface RetiroVista {
  id: string;
  entidad: "nodo" | "flujo";
  nombre: string;
  argumento: { tipo: "arrastre"; por: string[] } | { tipo: "cita"; id: string; motivo: string; cita: CitaVista; verificacion: VerificacionVista };
}

export interface AfirmacionVista {
  id: string;
  entidad: "nodo" | "flujo";
  sobre: string;
  /** De qué habla, como lo lee la persona: el nombre del componente, u «origen → destino» (M-20). */
  nombre: string;
  enunciado: string;
  cita: CitaVista;
  verificacion: VerificacionVista;
  cambio: Cambio;
}

export interface PropuestaVista {
  carpeta: string;
  fecha: string;
  capa?: string;
  modelo: string;
  /** Reintentos que CONTÓ el hook de fin (`.reintentos`), no los que declara el modelo (B-45). */
  reintentos: number;
  /** Reintentos que declara la corrida (`ejecucion.reintentos`). */
  reintentosDeclarados: number;
  fallas: string[];
  /** La verificación existe y es de esta versión de la propuesta. */
  verificada: boolean;
  fechaVerificacion?: string;
  fuentes: number;
  diff: { primera: boolean; nuevos: number; renombrados: number; retirados: number; madurez: number };
  afirmaciones: AfirmacionVista[];
  /** Lo que el mapa aprobado tiene y la propuesta ya no trae: no son afirmaciones, se retiran si se aprueba (M-21). */
  retiros: RetiroVista[];
  preguntas: { pregunta: string; respondida: boolean }[];
}

/** Una fuente de una evidencia propuesta, con su cita y lo que comprobó el código. */
export interface FuenteVista {
  cita: CitaVista;
  fecha?: string;
  verificacion: VerificacionVista;
}

/** Una evidencia de una propuesta de evidencias (D-S3-10), como la lee la pantalla de revisión (boceto M1). */
export interface EvidenciaVista {
  /** A-n: lo que nombra el comando. */
  id: string;
  /** El id con que entra a la base (evi-…). */
  evidencia: string;
  criterio: string;
  tipo: "capacidad" | "transversal";
  afirmacion: string;
  puntaje: number;
  madurez: string;
  /** Lo más que cuenta con su madurez, y si el caso acepta vista previa (tabla de topes de la escala). */
  tope: number;
  topeConVistaPrevia: number;
  justificacion: string;
  componentes: string[];
  limitaciones: string[];
  esencial: boolean;
  fuentes: FuenteVista[];
  /** El peor resultado de sus fuentes; `null` sin verificación. */
  resultado: Resultado | null;
  cambio: "nueva" | "cambiada" | "igual";
}

export interface PropuestaEvidenciasVista {
  carpeta: string;
  fecha: string;
  modelo: string;
  reintentos: number;
  reintentosDeclarados: number;
  fallas: string[];
  verificada: boolean;
  fechaVerificacion?: string;
  fuentes: number;
  /** Los niveles de la escala, con su nombre y su descripción en el idioma de la página. */
  niveles: { valor: number; nombre: string; descripcion: string }[];
  /** Lo más que cuenta lo que no está disponible de forma general. */
  topeNoDisponible: number;
  evidencias: EvidenciaVista[];
  preguntas: { pregunta: string; respondida: boolean }[];
}

export interface VistaInvestigador {
  plataforma: Plataforma;
  mapa?: Mapa;
  bandas?: BandaVigencia[];
  propuesta?: PropuestaVista;
  revisiones: Revision[];
  /** La propuesta de evidencias pendiente, si la hay, y el historial de sus revisiones. */
  evidencias?: PropuestaEvidenciasVista;
  revisionesEvidencias: RevisionEvidencias[];
}

const ORDEN: Record<Vigencia, number> = { vigente: 0, revisar: 1, vencido: 2 };

/** Vigencia por banda: su componente más viejo manda (el mismo cálculo del motor, nodo por nodo). */
export function vigenciaPorBanda(atlas: Atlas, idioma: Idioma, fecha: string): BandaVigencia[] {
  const geo = layout(atlas.mapa, atlas.gramatica, "nivel2", { texts: textosMotor(), queryDate: fecha });
  const porNodo = new Map(geo.vigencia.elementos.map((e) => [e.id, e]));
  const bandas = [...(["capa", "carril", "transversal"] as const)].flatMap((c) =>
    atlas.gramatica.bandas.filter((b) => b.clase === c).sort((a, b) => a.orden - b.orden),
  );
  return bandas.map((b, i) => {
    const nodos = atlas.mapa.nodos.filter((n) => n.banda_id === b.id);
    const v = nodos.map((n) => porNodo.get(n.id)!).filter(Boolean);
    const peor = v.reduce<Vigencia>((m, x) => (ORDEN[x.estado] > ORDEN[m] ? x.estado : m), "vigente");
    return { id: b.id, numero: String(i + 1).padStart(2, "0"), nombre: b.nombre[idioma]!, componentes: nodos.length, dias: Math.max(0, ...v.map((x) => x.dias)), estado: peor };
  });
}

/** El historial de revisiones de una plataforma (data/revisiones/<id>.jsonl), de la más vieja a la más nueva. */
export function revisiones(raiz: string, id: string): Revision[] {
  const archivo = join(raiz, "data/revisiones", `${id}.jsonl`);
  if (!existsSync(archivo)) return [];
  return readFileSync(archivo, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => esquemaRevision.parse(JSON.parse(l)));
}

/** El historial de las revisiones de evidencias de una plataforma (data/revisiones/evidencias/<id>.jsonl). */
export function revisionesEvidencias(raiz: string, id: string): RevisionEvidencias[] {
  const archivo = join(raiz, "data/revisiones/evidencias", `${id}.jsonl`);
  if (!existsSync(archivo)) return [];
  return readFileSync(archivo, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => esquemaRevisionEvidencias.parse(JSON.parse(l)));
}

/**
 * La propuesta más reciente de la plataforma POSTERIOR a la última que se cerró (M-19: una más vieja no
 * reaparece como pendiente), con un nombre de carpeta que ninguna terminal expande (A-2). Las de mapa y las de
 * evidencias se buscan por separado: cada una tiene su historial.
 */
function pendiente(raiz: string, id: string, ultima: string | undefined, evidencias = false): string | undefined {
  const base = join(raiz, "propuestas");
  if (!existsSync(base)) return undefined;
  return readdirSync(base)
    .filter((d) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(d) && existsSync(join(base, d, "propuesta.json")) && (ultima === undefined || `propuestas/${d}` > ultima))
    .filter((d) => {
      try {
        const dato = JSON.parse(readFileSync(join(base, d, "propuesta.json"), "utf8"));
        return dato.plataforma === id && esPropuestaDeEvidencias(dato) === evidencias;
      } catch {
        return d.includes(id) && d.endsWith("-evidencias") === evidencias;
      }
    })
    .sort()
    .at(-1);
}

/** El nombre de un componente, u «origen → destino» de un flujo, en el idioma pedido. */
function nombreDe(mapa: Mapa, entidad: "nodo" | "flujo", id: string, idioma: Idioma): string {
  const nodo = (x: string) => mapa.nodos.find((n) => n.id === x)?.nombre[idioma] ?? x;
  if (entidad === "nodo") return nodo(id);
  const f = mapa.flujos.find((x) => x.id === id);
  return f ? `${nodo(f.origen)} → ${nodo(f.destino)}` : id;
}

/** El contador del hook de fin; sin archivo, ningún reintento. */
function reintentosDe(dir: string): number {
  const f = join(dir, ".reintentos");
  return existsSync(f) ? Number(readFileSync(f, "utf8")) || 0 : 0;
}

/** Las fallas que dejó el hook de fin al rendirse (error-validacion.json), si las hay. */
function erroresDeValidacion(dir: string): string[] {
  const f = join(dir, "error-validacion.json");
  if (!existsSync(f)) return [];
  try {
    const d = JSON.parse(readFileSync(f, "utf8")) as { fallas?: unknown };
    return Array.isArray(d.fallas) ? d.fallas.map((x) => `error-validacion.json · ${String(x)}`) : [];
  } catch {
    return ["error-validacion.json no es JSON"];
  }
}

function cambioDe(entidad: "nodo" | "flujo", id: string, anterior: Mapa | undefined, propuesto: Mapa, d: ReturnType<typeof diff> | null): Cambio {
  if (!anterior || !d) return "nuevo";
  if (entidad === "flujo") return d.flujos.nuevos.includes(id) ? "nuevo" : d.flujos.cambiados.includes(id) ? "cambiado" : "igual";
  if (d.nodos.nuevos.includes(id)) return "nuevo";
  if (d.nodos.renombrados.some((r) => r.id === id)) return "renombrado";
  if (d.nodos.madurez.some((m) => m.id === id)) return "madurez";
  const a = anterior.nodos.find((n) => n.id === id);
  const b = propuesto.nodos.find((n) => n.id === id);
  return huella({ ...a, fecha_verificacion: 0, fuentes: 0 }) === huella({ ...b, fecha_verificacion: 0, fuentes: 0 }) ? "igual" : "cambiado";
}

export function vistaInvestigador(d: Datos, id: string, idioma: Idioma, fecha: string, raiz = process.cwd(), rangos?: readonly (readonly [number, number])[], con?: Conocimiento): VistaInvestigador {
  const plataforma = d.plataformas.find((p) => p.id === id)!;
  const atlas = d.atlas.get(id);
  const historial = revisiones(raiz, id);
  const historialEv = revisionesEvidencias(raiz, id);
  const ev = propuestaEvidencias(d, raiz, id, idioma, historialEv, con);
  const vista: VistaInvestigador = { plataforma, revisiones: historial, revisionesEvidencias: historialEv, ...(ev ? { evidencias: ev } : {}), ...(atlas ? { mapa: atlas.mapa, bandas: vigenciaPorBanda(atlas, idioma, fecha) } : {}) };
  const ultima = historial.map((r) => r.propuesta).sort().at(-1);
  const carpeta = pendiente(raiz, id, ultima);
  if (!carpeta) return vista;

  const dir = join(raiz, "propuestas", carpeta);
  const bytes = readFileSync(join(dir, "propuesta.json"));
  let dato: unknown;
  try {
    dato = JSON.parse(bytes.toString("utf8"));
  } catch (e) {
    vista.propuesta = { carpeta: `propuestas/${carpeta}`, fecha: "", modelo: "", reintentos: reintentosDe(dir), reintentosDeclarados: 0, fallas: [`propuesta.json no es JSON: ${(e as Error).message}`], verificada: false, fuentes: 0, diff: { primera: !atlas, nuevos: 0, renombrados: 0, retirados: 0, madurez: 0 }, afirmaciones: [], retiros: [], preguntas: [] };
    return vista;
  }
  const forma = esquemaPropuesta.safeParse(dato);
  const cob = rangos ?? JSON.parse(readFileSync(join(raiz, "packages/diagramador/metricas/cobertura.json"), "utf8")).fuentes["space-grotesk"].rangos;
  const gramatica = atlas?.gramatica ?? [...d.atlas.values()][0]?.gramatica;
  const fallas = [
    ...(!forma.success ? forma.error.issues.map((i) => `${i.path.join(".") || "/"} · ${i.message}`) : gramatica ? validarPropuesta(dato, gramatica, cob, atlas?.mapa).fallas : ["no hay gramática cargada"]),
    // Si el hook de fin se rindió, lo que dejó escrito también se muestra (B-45).
    ...erroresDeValidacion(dir),
  ];
  const rutaV = join(dir, "verificacion.json");
  const verif = existsSync(rutaV) ? esquemaVerificacion.safeParse(JSON.parse(readFileSync(rutaV, "utf8"))) : null;
  const verificada = Boolean(verif?.success && verif.data.propuesta_sha256 === sha256(bytes));
  const p = forma.success ? forma.data : undefined;
  const propuesto = p?.mapa as unknown as Mapa | undefined;
  const dif = atlas && propuesto && !fallas.length ? diff(atlas.mapa, propuesto) : null;
  const resultado = new Map(verificada && verif?.success ? verif.data.resultados.map((r) => [r.afirmacion, r]) : []);
  vista.propuesta = {
    carpeta: `propuestas/${carpeta}`,
    fecha: p?.fecha ?? "",
    ...(p?.capa ? { capa: p.capa } : {}),
    modelo: p?.ejecucion.modelo ?? "",
    reintentos: reintentosDe(dir),
    reintentosDeclarados: p?.ejecucion.reintentos ?? 0,
    fallas,
    verificada,
    ...(verificada && verif?.success ? { fechaVerificacion: verif.data.fecha } : {}),
    fuentes: new Set([...(p?.afirmaciones ?? []), ...(p?.retiros ?? [])].map((a) => a.cita.url)).size,
    diff: dif
      ? { primera: false, nuevos: dif.nodos.nuevos.length, renombrados: dif.nodos.renombrados.length, retirados: dif.nodos.retirados.length, madurez: dif.nodos.madurez.length }
      : { primera: !atlas, nuevos: propuesto?.nodos.length ?? 0, renombrados: 0, retirados: 0, madurez: 0 },
    afirmaciones:
      p && propuesto
        ? p.afirmaciones.map((a) => {
            const r = resultado.get(a.id);
            return {
              id: a.id,
              entidad: a.sobre.entidad,
              sobre: a.sobre.id,
              nombre: nombreDe(propuesto, a.sobre.entidad, a.sobre.id, idioma),
              enunciado: a.enunciado[idioma],
              cita: citaDe(a.cita, idioma),
              verificacion: verificacionDe(r),
              cambio: cambioDe(a.sobre.entidad, a.sobre.id, atlas?.mapa, propuesto, dif),
            };
          })
        : [],
    retiros: atlas && p && propuesto && !fallas.length ? retirosVista(atlas.mapa, propuesto, p.retiros, resultado, idioma) : [],
    preguntas: p?.preguntas_guia.map((q) => ({ pregunta: q.pregunta[idioma], respondida: q.respondida })) ?? [],
  };
  return vista;
}

/** Lo que una evidencia aprobada comparte con una propuesta: sin verificación ni aprobación. */
const comoPropuesta = (e: Conocimiento["evidencias"][number]) => {
  const x: Record<string, unknown> = {
    ...e,
    fuentes: e.fuentes.map((f) => {
      const g: Record<string, unknown> = { ...f };
      delete g.verificacion;
      return g;
    }),
  };
  for (const k of ["fecha_verificacion", "origen", "estado_aprobacion", "aprobada_por", "fecha_aprobacion"]) delete x[k];
  return x;
};

/** La propuesta de evidencias pendiente de una plataforma, validada contra la base y con su verificación. */
function propuestaEvidencias(d: Datos, raiz: string, id: string, idioma: Idioma, historial: RevisionEvidencias[], con?: Conocimiento): PropuestaEvidenciasVista | undefined {
  const carpeta = pendiente(raiz, id, historial.map((r) => r.propuesta).sort().at(-1), true);
  if (!carpeta) return undefined;
  const dir = join(raiz, "propuestas", carpeta);
  const bytes = readFileSync(join(dir, "propuesta.json"));
  const vacia = { carpeta: `propuestas/${carpeta}`, fecha: "", modelo: "", reintentos: reintentosDe(dir), reintentosDeclarados: 0, verificada: false, fuentes: 0, niveles: [], topeNoDisponible: 0, evidencias: [], preguntas: [] };
  let dato: unknown;
  try {
    dato = JSON.parse(bytes.toString("utf8"));
  } catch (e) {
    return { ...vacia, fallas: [`propuesta.json no es JSON: ${(e as Error).message}`] };
  }
  if (!con) return { ...vacia, fallas: ["la base de conocimiento no se cargó: sin ella no se valida la propuesta"] };
  const ctx = contextoDe(con, Object.fromEntries([...d.atlas].map(([k, a]) => [k, a.mapa.nodos.map((n) => n.id)])));
  const nombreNodo = new Map(d.atlas.get(id)?.mapa.nodos.map((n) => [n.id, n.nombre[idioma]]) ?? []);
  const forma = esquemaPropuestaEvidencias.safeParse(dato);
  const fallas = [...validarPropuestaEvidencias(dato, ctx).fallas, ...erroresDeValidacion(dir)];
  const rutaV = join(dir, "verificacion.json");
  const verif = existsSync(rutaV) ? esquemaVerificacion.safeParse(JSON.parse(readFileSync(rutaV, "utf8"))) : null;
  const verificada = Boolean(verif?.success && verif.data.propuesta_sha256 === sha256(bytes));
  const resultado = new Map(verificada && verif?.success ? verif.data.resultados.map((r) => [claveCita(r.afirmacion, r.fuente), r]) : []);
  const p = forma.success ? forma.data : undefined;
  const conflictos = textos(idioma).base.evidencias.conflictos;
  const madurez = new Map(con.gramatica.escala_madurez.map((m) => [m.id, m.nombre[idioma]]));
  const criterioDe = (e: { capacidad_id?: string; criterio_id?: string }) => (e.capacidad_id ? con.criterios.find((c) => c.capacidad_id === e.capacidad_id) : con.criterios.find((c) => c.id === e.criterio_id));
  return {
    ...vacia,
    fecha: p?.fecha ?? "",
    modelo: p?.ejecucion.modelo ?? "",
    reintentosDeclarados: p?.ejecucion.reintentos ?? 0,
    fallas,
    verificada,
    ...(verificada && verif?.success ? { fechaVerificacion: verif.data.fecha } : {}),
    fuentes: new Set(p?.evidencias.flatMap((x) => x.evidencia.fuentes.map((f) => f.url)) ?? []).size,
    niveles: ctx.escala.niveles.map((n) => ({ valor: n.valor, nombre: n.nombre[idioma], descripcion: n.descripcion[idioma] })),
    topeNoDisponible: Math.max(...ctx.escala.tope_por_madurez.filter((x) => !x.disponible).map((x) => x.tope)),
    evidencias: (p?.evidencias ?? []).map(({ id: a, evidencia: e }) => {
      const tope = ctx.escala.tope_por_madurez.find((x) => x.madurez === e.madurez);
      const criterio = criterioDe(e);
      const aprobada = con.evidencias.find((x) => x.id === e.id && x.estado_aprobacion === "aprobada");
      return {
        id: a,
        evidencia: e.id,
        criterio: criterio?.nombre[idioma] ?? e.capacidad_id ?? e.criterio_id ?? "",
        tipo: e.capacidad_id ? ("capacidad" as const) : ("transversal" as const),
        afirmacion: e.afirmacion[idioma],
        puntaje: e.puntaje,
        madurez: madurez.get(e.madurez) ?? e.madurez,
        tope: tope?.tope ?? e.puntaje,
        topeConVistaPrevia: tope?.tope_aceptando_vista_previa ?? e.puntaje,
        justificacion: e.justificacion_puntaje[idioma],
        componentes: e.componentes.map((c) => nombreNodo.get(c) ?? c),
        limitaciones: (e.limitaciones ?? []).map((l) => l[idioma]),
        esencial: e.esencial,
        fuentes: e.fuentes.map((f, k) => ({
          cita: { texto: f.cita, url: f.url, titulo: f.titulo, tipo: f.tipo, conflicto: conflictos[f.conflicto_de_interes] },
          ...(f.fecha_publicacion ? { fecha: f.fecha_publicacion } : {}),
          verificacion: verificacionDe(resultado.get(claveCita(a, k))),
        })),
        resultado: resultadoDe(e.fuentes.map((_, k) => resultado.get(claveCita(a, k)))),
        cambio: !aprobada ? ("nueva" as const) : huella(comoPropuesta(aprobada)) === huella(e) ? ("igual" as const) : ("cambiada" as const),
      };
    }),
    preguntas: p?.preguntas_guia.map((q) => ({ pregunta: q.pregunta[idioma], respondida: q.respondida })) ?? [],
  };
}

function citaDe(c: Propuesta["afirmaciones"][number]["cita"], idioma: Idioma): CitaVista {
  return { texto: c.texto, url: c.url, titulo: c.titulo, tipo: c.tipo, conflicto: c.conflicto_de_interes[idioma] };
}

function verificacionDe(r: Verificacion["resultados"][number] | undefined): VerificacionVista {
  return r ? { resultado: r.resultado, http: r.http, sha256: r.sha256, ...(r.motivo ? { motivo: r.motivo } : {}) } : null;
}

/** Los retiros con su argumento: primero los que prueba una cita, después los que salen por arrastre. */
function retirosVista(anterior: Mapa, propuesto: Mapa, retiros: Propuesta["retiros"], resultado: Map<string, Verificacion["resultados"][number]>, idioma: Idioma): RetiroVista[] {
  const { argumentos } = argumentosDeRetiro(anterior, propuesto, retiros);
  const vista = [...argumentos].map(([x, a]): RetiroVista => {
    const entidad = anterior.nodos.some((n) => n.id === x) ? ("nodo" as const) : ("flujo" as const);
    const nombre = nombreDe(anterior, entidad, x, idioma);
    if (a.tipo === "arrastre") return { id: x, entidad, nombre, argumento: { tipo: "arrastre", por: a.por.map((n) => nombreDe(anterior, "nodo", n, idioma)) } };
    const r = a.retiro;
    return { id: x, entidad, nombre, argumento: { tipo: "cita", id: r.id, motivo: r.motivo[idioma], cita: citaDe(r.cita, idioma), verificacion: verificacionDe(resultado.get(r.id)) } };
  });
  const clave = (r: RetiroVista) => (r.argumento.tipo === "cita" ? `0 ${r.argumento.id.padStart(8, "0")}` : `1 ${r.id}`);
  return vista.sort((a, b) => (clave(a) < clave(b) ? -1 : clave(a) > clave(b) ? 1 : 0));
}

/** Conteo de las afirmaciones por resultado de la verificación. */
export function conteo(afirmaciones: AfirmacionVista[], t: Textos["investigador"]): string {
  const c = (r: string) => afirmaciones.filter((a) => a.verificacion?.resultado === r).length;
  return plantilla(t.propuesta.conteo, { n: afirmaciones.length, v: c("verificada"), nv: afirmaciones.length - c("verificada") - c("no-encontrada"), ne: c("no-encontrada") });
}
