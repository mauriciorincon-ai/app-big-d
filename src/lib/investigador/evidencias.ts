import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { esDominioDeEjemplo } from "../datos/cargar";
import { esquemaEvidencia, esquemaEvidenciaCampos, esquemaFuente, type Criterio, type Escala, type Evidencia } from "../datos/conocimiento";
import { id, textoIdioma } from "../datos/esquemas";
import { vocabularioVetado } from "../datos/vocabulario";
import { ErrorDeAprobacion } from "./aprobar";
import type { Resultado, Verificacion } from "./esquema";
import { huella } from "./huella";

// El modo EVIDENCIAS del investigador (D-S3-10): `/investigar <plataforma> evidencias` propone una evidencia por
// criterio, con su puntaje de 0 a 4 contra el ancla de la escala y una cita textual por fuente; el código la valida,
// verifica cada cita y una persona aprueba evidencia por evidencia en su terminal, con el comando que arma la pantalla
// de revisión (boceto M1 aprobado el 2026-10-05: ninguna viene aprobada de entrada, porque el código comprueba la cita,
// no el puntaje). La propuesta de MAPA no cambia: esta vive aparte, con `tipo: "evidencias"`, y su historial va a
// data/revisiones/evidencias/<plataforma>.jsonl.

const fecha = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "fecha AAAA-MM-DD");
const unoDeLosDos = "una evidencia evalúa una capacidad o un criterio transversal: exactamente uno de los dos";

/** Una evidencia como la propone el investigador: sin verificación (la escribe el código) ni aprobación (la persona). */
export const esquemaEvidenciaPropuesta = esquemaEvidenciaCampos
  .omit({ fuentes: true, fecha_verificacion: true, origen: true, estado_aprobacion: true, aprobada_por: true, fecha_aprobacion: true })
  .extend({
    /** Ids de los componentes del mapa aprobado de la plataforma que la respaldan: el nombre se lee del mapa, en cada idioma. */
    componentes: z.array(id).min(1, "al menos un componente"),
    fuentes: z.array(esquemaFuente.omit({ verificacion: true })).min(1, "al menos una fuente"),
  })
  .superRefine((e, ctx) => {
    if (!!e.capacidad_id === !!e.criterio_id) ctx.addIssue({ code: "custom", path: [e.capacidad_id ? "criterio_id" : "capacidad_id"], message: unoDeLosDos });
  });

export const esquemaPropuestaEvidencias = z.strictObject({
  version: z.literal(1),
  tipo: z.literal("evidencias"),
  plataforma: id,
  fecha,
  /** Quién la propone: el investigador (/investigar) o, en el ensayo con la plataforma ficticia, el curador (D-S3-11). */
  origen: z.enum(["agente-investigador", "curador"]),
  ejecucion: z.strictObject({
    herramienta: z.literal("claude-code"),
    modelo: z.string().trim().min(1),
    reintentos: z.number().int().min(0).max(2),
  }),
  evidencias: z.array(z.strictObject({ id: z.string().regex(/^A-[1-9]\d*$/, "id A-1, A-2…"), evidencia: esquemaEvidenciaPropuesta })).min(1, "al menos una evidencia"),
  preguntas_guia: z.array(z.strictObject({ pregunta: textoIdioma, respondida: z.boolean() })),
});

/** Una línea de data/revisiones/evidencias/<plataforma>.jsonl, con la huella de cada evidencia que escribió. */
export const esquemaRevisionEvidencias = z.strictObject({
  fecha,
  propuesta: z.string(),
  aprobadas: z.array(z.string()),
  rechazadas: z.array(z.string()),
  evidencias: z.array(z.strictObject({ id: z.string(), huella: z.string().regex(/^[0-9a-f]{64}$/) })),
});

export type PropuestaEvidencias = z.infer<typeof esquemaPropuestaEvidencias>;
export type EvidenciaPropuesta = z.infer<typeof esquemaEvidenciaPropuesta>;
export type RevisionEvidencias = z.infer<typeof esquemaRevisionEvidencias>;

/** ¿Es una propuesta de evidencias? Las de mapa no llevan `tipo`. */
export const esPropuestaDeEvidencias = (dato: unknown): boolean => typeof dato === "object" && dato !== null && (dato as { tipo?: unknown }).tipo === "evidencias";

/** Quién aprueba, en el dato: el autor del proyecto, el mismo que declara su conflicto de interés al pie. */
export const APROBADA_POR = "autor";

/** Lo que la validación necesita de la base de conocimiento. */
export interface ContextoEvidencias {
  plataformas: readonly { id: string; ficticia: boolean }[];
  capacidades: readonly { id: string }[];
  criterios: readonly Criterio[];
  escala: Escala;
  /** Las evidencias que ya están en la base. */
  evidencias: readonly Evidencia[];
  /** Los ids de los componentes del mapa aprobado de cada plataforma que lo tiene. */
  componentes: Readonly<Record<string, readonly string[]>>;
}

/** Los ids de los componentes de cada mapa aprobado de data/mapas/ (`dir` = la carpeta de datos). */
export function componentesDeMapas(dir: string): Record<string, string[]> {
  const mapas = join(dir, "mapas");
  if (!existsSync(mapas)) return {};
  return Object.fromEntries(
    readdirSync(mapas)
      .filter((f) => f.endsWith(".mapa.yaml"))
      .sort()
      .map((f) => {
        const m = parse(readFileSync(join(mapas, f), "utf8")) as { sujeto_id: string; nodos: { id: string }[] };
        return [m.sujeto_id, m.nodos.map((n) => n.id)];
      }),
  );
}

/** El contexto, de la base cargada (cargarConocimiento): todos los criterios usan una sola escala (lo exige el cargador). */
export function contextoDe(
  c: { plataformas: readonly { id: string; ficticia: boolean }[]; capacidades: readonly { id: string }[]; criterios: readonly Criterio[]; escalas: readonly Escala[]; evidencias: readonly Evidencia[] },
  componentes: Readonly<Record<string, readonly string[]>>,
): ContextoEvidencias {
  const escala = c.escalas.find((x) => x.id === c.criterios[0]?.escala_id) ?? c.escalas[0];
  if (!escala) throw new Error("la base no tiene escala de evidencia (data/escalas/)");
  return { plataformas: c.plataformas, capacidades: c.capacidades, criterios: c.criterios, escala, evidencias: c.evidencias, componentes };
}

/** Cada cita de la propuesta, una por fuente de cada evidencia: lo que baja verificar-citas. */
export const citasDe = (p: PropuestaEvidencias) => p.evidencias.flatMap(({ id: a, evidencia }) => evidencia.fuentes.map((f, k) => ({ id: a, fuente: k, url: f.url, texto: f.cita })));

/** La clave de una cita en verificacion.json: la evidencia y el número de su fuente. */
export const claveCita = (a: string, fuente = 0) => `${a}#${fuente}`;

type ResultadoV = Verificacion["resultados"][number];

/** El resultado de una evidencia: el peor de sus fuentes; `null` si alguna no se verificó. */
export function resultadoDe(rs: readonly (ResultadoV | undefined)[]): Resultado | null {
  if (rs.some((r) => !r)) return null;
  if (rs.some((r) => r!.resultado === "no-encontrada")) return "no-encontrada";
  return rs.some((r) => r!.resultado === "no-verificable") ? "no-verificable" : "verificada";
}

export function validarPropuestaEvidencias(dato: unknown, ctx: ContextoEvidencias): { ok: boolean; fallas: string[]; propuesta?: PropuestaEvidencias } {
  const forma = esquemaPropuestaEvidencias.safeParse(dato);
  if (!forma.success) return { ok: false, fallas: forma.error.issues.map((i) => `${i.path.join(".") || "/"} · ${i.message}`) };
  const p = forma.data;
  const fallas: string[] = [];
  const plataforma = ctx.plataformas.find((x) => x.id === p.plataforma);
  if (!plataforma) fallas.push(`plataforma · «${p.plataforma}» no está en data/plataformas`);
  const nodos = ctx.componentes[p.plataforma];
  if (plataforma && !nodos) fallas.push(`plataforma · «${p.plataforma}» no tiene mapa aprobado: una evidencia nombra los componentes de ese mapa`);
  const caps = new Set(ctx.capacidades.map((c) => c.id));
  const criterios = new Map(ctx.criterios.map((c) => [c.id, c]));
  const madurez = new Set(ctx.escala.tope_por_madurez.map((t) => t.madurez));
  const aIds = new Set<string>();
  const eIds = new Set<string>();
  p.evidencias.forEach(({ id: a, evidencia: e }, i) => {
    const donde = `evidencias.${i} · ${a} · ${e.id}`;
    if (aIds.has(a)) fallas.push(`${donde} · ${a} repetida`);
    aIds.add(a);
    if (eIds.has(e.id)) fallas.push(`${donde} · la evidencia ${e.id} aparece dos veces`);
    eIds.add(e.id);
    if (e.plataforma_id !== p.plataforma) fallas.push(`${donde} · plataforma_id «${e.plataforma_id}» no es la investigada («${p.plataforma}»)`);
    if (!e.id.startsWith(`evi-${p.plataforma}-`)) fallas.push(`${donde} · el id empieza por «evi-${p.plataforma}-»`);
    if (e.capacidad_id && !caps.has(e.capacidad_id)) fallas.push(`${donde} · «${e.capacidad_id}» no es una capacidad de la base`);
    if (e.criterio_id) {
      const c = criterios.get(e.criterio_id);
      if (!c) fallas.push(`${donde} · «${e.criterio_id}» no es un criterio de la base`);
      else if (c.tipo !== "transversal") fallas.push(`${donde} · ${c.id} es de tipo capacidad: la evidencia va a su capacidad (${c.capacidad_id})`);
    }
    for (const c of e.componentes) if (nodos && !nodos.includes(c)) fallas.push(`${donde} · componente «${c}» no está en el mapa aprobado de ${p.plataforma}`);
    if (!madurez.has(e.madurez)) fallas.push(`${donde} · madurez «${e.madurez}» no está en la escala de madurez de la gramática`);
    if (plataforma?.ficticia) e.fuentes.forEach((f, k) => !esDominioDeEjemplo(f.url) && fallas.push(`${donde} · fuentes.${k}.url · una plataforma ficticia solo cita dominios reservados (example.org, *.invalid…)`));
    for (const v of vocabularioVetado({ afirmacion: e.afirmacion, justificacion_puntaje: e.justificacion_puntaje, limitaciones: e.limitaciones })) fallas.push(`${donde} · vocabulario · ${v.ruta} · ${v.que}`);
  });
  // Una celda con varias evidencias necesita una esencial (RF-04.1): con lo aprobado que esta propuesta no reemplaza.
  const celdas = new Map<string, { id: string; esencial: boolean }[]>();
  const sumar = (e: { id: string; plataforma_id: string; capacidad_id?: string; criterio_id?: string; esencial: boolean }) => {
    const k = `${e.plataforma_id} · ${e.capacidad_id ?? e.criterio_id}`;
    celdas.set(k, [...(celdas.get(k) ?? []), { id: e.id, esencial: e.esencial }]);
  };
  ctx.evidencias.filter((e) => e.estado_aprobacion === "aprobada" && !eIds.has(e.id)).forEach(sumar);
  p.evidencias.forEach(({ evidencia }) => sumar(evidencia));
  for (const [k, xs] of celdas)
    if (xs.length > 1 && !xs.some((x) => x.esencial)) fallas.push(`celda ${k} · ${xs.length} evidencias (${xs.map((x) => x.id).join(", ")}) y ninguna esencial: el mínimo no tiene sobre qué calcularse (RF-04.1)`);
  return { ok: fallas.length === 0, fallas, propuesta: p };
}

export interface EntradaEvidencias {
  carpeta: string;
  propuesta: PropuestaEvidencias;
  /** Huella de los bytes de propuesta.json. */
  propuestaSha256: string;
  verificacion: Verificacion;
  aprobadas: readonly string[];
  rechazadas: readonly string[];
  /** Una propuesta de evidencias no retira nada: el comando dice «--retirar -». */
  retiradas: readonly string[];
  contexto: ContextoEvidencias;
  /** La carpeta de la última propuesta de evidencias cerrada de esta plataforma, si hay. */
  ultimaPropuesta?: string;
  /** Día de la aprobación (AAAA-MM-DD, UTC). */
  fecha: string;
}

/**
 * Núcleo de la aprobación de evidencias (la corre el mismo script que aprueba los mapas, solo una persona). Reglas:
 * la propuesta es posterior a la última cerrada; la verificación es de ESTOS bytes y de la URL de cada fuente; cada
 * evidencia tiene exactamente una decisión; una con alguna cita «no encontrada» no se aprueba; la propuesta vuelve a
 * validar contra la base de hoy. Lo aprobado sale como evidencia de la base (`aprobada`, con su verificación por
 * fuente, quién y cuándo); la línea de la revisión guarda la huella de cada una.
 */
export function aprobarEvidencias(e: EntradaEvidencias): { evidencias: Evidencia[]; revision: RevisionEvidencias } {
  const fallas: string[] = [];
  if (e.ultimaPropuesta !== undefined && e.carpeta <= e.ultimaPropuesta)
    fallas.push(`${e.carpeta} no es posterior a la última propuesta de evidencias cerrada (${e.ultimaPropuesta}): no se aprueba dos veces ni se vuelve a una vieja`);
  if (e.verificacion.propuesta_sha256 !== e.propuestaSha256) fallas.push("verificacion.json es de otra versión de la propuesta: vuelve a correr scripts/verificar-citas.mjs");
  if (e.retiradas.length) fallas.push(`una propuesta de evidencias no retira nada: el comando dice --retirar - (dice ${e.retiradas.join(",")})`);
  fallas.push(...validarPropuestaEvidencias(e.propuesta, e.contexto).fallas);
  const ids = e.propuesta.evidencias.map((x) => x.id);
  const decididas = [...e.aprobadas, ...e.rechazadas];
  for (const x of decididas) if (!ids.includes(x)) fallas.push(`${x} no es una evidencia de esta propuesta`);
  for (const x of ids) {
    const veces = decididas.filter((d) => d === x).length;
    if (veces === 0) fallas.push(`${x} no tiene decisión: va en --aprobar o en --rechazar`);
    if (veces > 1) fallas.push(`${x} tiene más de una decisión`);
  }
  const resultados = new Map(e.verificacion.resultados.map((r) => [claveCita(r.afirmacion, r.fuente), r]));
  for (const c of citasDe(e.propuesta)) {
    const r = resultados.get(claveCita(c.id, c.fuente));
    if (!r) fallas.push(`${c.id}: la fuente ${c.fuente + 1} no fue verificada`);
    else if (r.url !== c.url) fallas.push(`${c.id}: la verificación de la fuente ${c.fuente + 1} es de otra URL (${r.url}), no de su cita`);
  }
  for (const x of e.aprobadas) {
    const ev = e.propuesta.evidencias.find((y) => y.id === x);
    if (ev && ev.evidencia.fuentes.some((_, k) => resultados.get(claveCita(x, k))?.resultado === "no-encontrada"))
      fallas.push(`${x}: una de sus citas no aparece en la fuente; el código la rechazó y no se puede aprobar`);
  }
  if (fallas.length) throw new ErrorDeAprobacion(fallas);

  const evidencias = e.propuesta.evidencias
    .filter((x) => e.aprobadas.includes(x.id))
    .map(({ id: a, evidencia: p }): Evidencia => {
      const { fuentes, limitaciones, capacidad_id, criterio_id, ...resto } = p;
      const final = {
        id: resto.id,
        plataforma_id: resto.plataforma_id,
        ...(capacidad_id ? { capacidad_id } : {}),
        ...(criterio_id ? { criterio_id } : {}),
        afirmacion: resto.afirmacion,
        componentes: resto.componentes,
        madurez: resto.madurez,
        puntaje: resto.puntaje,
        justificacion_puntaje: resto.justificacion_puntaje,
        esencial: resto.esencial,
        fuentes: fuentes.map((f, k) => {
          const r = resultados.get(claveCita(a, k))!;
          return { ...f, verificacion: { resultado: r.resultado as "verificada" | "no-verificable", fecha: e.verificacion.fecha, http: r.http, sha256: r.sha256 } };
        }),
        fecha_verificacion: e.verificacion.fecha,
        ...(limitaciones?.length ? { limitaciones } : {}),
        origen: e.propuesta.origen,
        estado_aprobacion: "aprobada" as const,
        aprobada_por: APROBADA_POR,
        fecha_aprobacion: e.fecha,
      };
      const v = esquemaEvidencia.safeParse(final);
      if (!v.success) fallas.push(...v.error.issues.map((i) => `${resto.id} · ${i.path.join(".")} · ${i.message}`));
      return final;
    });
  if (fallas.length) throw new ErrorDeAprobacion(fallas);
  return {
    evidencias,
    revision: {
      fecha: e.fecha,
      propuesta: e.carpeta,
      aprobadas: [...e.aprobadas].sort(),
      rechazadas: [...e.rechazadas].sort(),
      evidencias: evidencias.map((x) => ({ id: x.id, huella: huella(x) })),
    },
  };
}
