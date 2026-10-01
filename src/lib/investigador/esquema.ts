import { z } from "zod";
import { id, textoIdioma } from "../datos/esquemas";

// Contrato de salida del investigador (la regla «la IA propone, el humano aprueba»): lo que la skill deja en
// propuestas/<fecha>-<plataforma>[-<capa>]/ y lo que el código escribe al verificar y al aprobar. Zod es la
// fuente del esquema; el mapa propuesto lo valida además el diagramador (esquema del contrato + reglas).
// Nada de esto importa rutas con alias: los scripts lo empaquetan con esbuild.

const fecha = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "fecha AAAA-MM-DD");

/** Una cita textual: el pasaje EXACTO de la página, en su idioma, que respalda la afirmación. */
export const esquemaCita = z.strictObject({
  url: z.string().url().startsWith("https://", "solo fuentes https"),
  // 40 y no 12: una cita de doce caracteres aparece en casi cualquier página (B-31 de la auditoría del S1).
  // Vale para las propuestas nuevas: la de Fabric (2026-09-27, ya cerrada) trae una de 35 que el código verificó.
  texto: z.string().trim().min(40, "una cita de al menos 40 caracteres").max(600, "una cita de 600 caracteres como máximo"),
  /** Título de la página tal como se publica. */
  titulo: z.string().trim().min(1),
  tipo: z.enum(["oficial", "tercero"]),
  /** Declarado por fuente (regla de neutralidad): quién publica y qué interés tiene. */
  conflicto_de_interes: textoIdioma,
});

/** Una afirmación es sobre un componente o un flujo del mapa propuesto; rechazarla lo saca del mapa. */
export const esquemaAfirmacion = z.strictObject({
  id: z.string().regex(/^A-[1-9]\d*$/, "id A-1, A-2…"),
  sobre: z.strictObject({ entidad: z.enum(["nodo", "flujo"]), id }),
  enunciado: textoIdioma,
  cita: esquemaCita,
});

/**
 * Un retiro: algo que el mapa aprobado tiene y esta propuesta ya no trae, con su argumento (pedido de la persona al
 * mirar la lista de retiros, 2026-09-30: «que no queden dudas de por qué sale»). El motivo dice qué pasó (el
 * fabricante lo retiró, lo fusionó en otro, lo reemplazó) y la cita, de su documentación, lo prueba; el código la
 * verifica como a toda cita. Un flujo que sale porque sale uno de sus extremos no lo necesita (src/lib/investigador/
 * retiros.ts).
 */
export const esquemaRetiro = z.strictObject({
  id: z.string().regex(/^R-[1-9]\d*$/, "id R-1, R-2…"),
  sobre: z.strictObject({ entidad: z.enum(["nodo", "flujo"]), id }),
  motivo: textoIdioma,
  cita: esquemaCita,
});

export const esquemaPropuesta = z.strictObject({
  version: z.literal(1),
  plataforma: id,
  /** Banda investigada; sin ella, la plataforma entera. */
  capa: id.optional(),
  fecha,
  ejecucion: z.strictObject({
    herramienta: z.literal("claude-code"),
    /** El modelo que declara la sesión; no se verifica. */
    modelo: z.string().trim().min(1),
    /** Reintentos del validador (máximo 2). */
    reintentos: z.number().int().min(0).max(2),
  }),
  /** El mapa propuesto completo (estado «propuesta»); lo valida el diagramador. */
  mapa: z.record(z.string(), z.unknown()),
  afirmaciones: z.array(esquemaAfirmacion),
  /** Sin la clave, ninguno: la propuesta de Fabric (2026-09-27, la primera) no la trae. */
  retiros: z.array(esquemaRetiro).default([]),
  preguntas_guia: z.array(z.strictObject({ pregunta: textoIdioma, respondida: z.boolean() })),
  sin_novedades: z.boolean(),
});

export const RESULTADOS = ["verificada", "no-encontrada", "no-verificable"] as const;
export type Resultado = (typeof RESULTADOS)[number];

/** Lo que escribe scripts/verificar-citas.mjs junto a la propuesta. */
export const esquemaVerificacion = z.strictObject({
  version: z.literal(1),
  fecha,
  /** Huella de propuesta.json verificada: si la propuesta cambia, la verificación deja de valer. */
  propuesta_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  resultados: z.array(
    z.strictObject({
      /** El id de la afirmación (A-n) o del retiro (R-n) cuya cita se verificó. */
      afirmacion: z.string(),
      url: z.string(),
      resultado: z.enum(RESULTADOS),
      http: z.number().int().nullable(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
      motivo: z.string().optional(),
    }),
  ),
});

/** Una línea de data/revisiones/<plataforma>.jsonl: cada decisión humana queda registrada. */
export const esquemaRevision = z.strictObject({
  fecha,
  propuesta: z.string(),
  resultado: z.enum(["aprobada", "sin-novedades"]),
  aprobadas: z.array(z.string()),
  rechazadas: z.array(z.string()),
  mapa_version: z.string(),
  huella: z.string().regex(/^[0-9a-f]{64}$/),
});

export type Propuesta = z.infer<typeof esquemaPropuesta>;
export type Afirmacion = z.infer<typeof esquemaAfirmacion>;
export type Retiro = z.infer<typeof esquemaRetiro>;
export type Verificacion = z.infer<typeof esquemaVerificacion>;
export type Revision = z.infer<typeof esquemaRevision>;
