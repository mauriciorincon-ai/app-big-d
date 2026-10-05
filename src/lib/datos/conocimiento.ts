import { z } from "zod";
import { id, textoIdioma } from "./esquemas";
import { esFechaCivil } from "./fecha";

// Esquemas de la base de conocimiento y del caso (C9–C10; especificación § 6.2–6.6 con los cambios del brief: sin
// `verificada_en_practica` E-23, `conflicto_de_interes` por fuente E-18, rango relativo E-2, «¿una plataforma o
// combinación?» E-17). Zod es la fuente del esquema; los textos son mapas `{es, en}` redactados, un archivo por
// entidad. Las reglas que cruzan archivos (referencias, cobertura de la gramática, celdas con varias evidencias, sello
// del caso, huella de la instantánea) las aplica el cargador (cargar-conocimiento.ts) con el mismo formato de error.

const fecha = z.string().refine(esFechaCivil, "una fecha AAAA-MM-DD que exista");
const entero = (min: number, max: number) => z.number().int("un entero").min(min, `al menos ${min}`).max(max, `a lo sumo ${max}`);
const hex64 = z.string().regex(/^[0-9a-f]{64}$/, "una huella SHA-256 en hexadecimal");
/** Id con prefijo por tipo (técnica-núcleo § 3.3): `cap-`, `crit-`, `esc-`, `evi-`, `res-`. */
const idCon = (prefijo: string) => z.string().regex(new RegExp(`^${prefijo}-[a-z0-9]+(-[a-z0-9]+)*$`), `un id «${prefijo}-…» en minúsculas con guiones`);
/** Versión de una instantánea: su fecha y un ordinal del día (`2026-10-05.1`); texto, nunca número (E5). */
export const VERSION_INSTANTANEA = /^(\d{4}-\d{2}-\d{2})\.([1-9]\d*)$/;
const versionInstantanea = z.string().regex(VERSION_INSTANTANEA, "una versión AAAA-MM-DD.N entre comillas");

export const esquemaCapacidad = z.strictObject({
  id: idCon("cap"),
  nombre: textoIdioma,
  /** Qué problema resuelve, en lenguaje llano. */
  definicion: textoIdioma,
  /** Lo que una evidencia de esta capacidad tiene que responder. */
  preguntas_guia: z.array(textoIdioma).min(1, "al menos una pregunta guía"),
});

export const esquemaCriterio = z
  .strictObject({
    id: idCon("crit"),
    nombre: textoIdioma,
    que_evalua: textoIdioma,
    /** `capacidad`: se alimenta de las evidencias de su capacidad; `transversal`: de evidencias del propio criterio. */
    tipo: z.enum(["capacidad", "transversal"]),
    capacidad_id: idCon("cap").optional(),
    escala_id: idCon("esc"),
  })
  .superRefine((c, ctx) => {
    if (c.tipo === "capacidad" && !c.capacidad_id) ctx.addIssue({ code: "custom", path: ["capacidad_id"], message: "obligatorio en un criterio de tipo capacidad" });
    if (c.tipo === "transversal" && c.capacidad_id) ctx.addIssue({ code: "custom", path: ["capacidad_id"], message: "un criterio transversal no tiene capacidad" });
  });

export const esquemaEscala = z.strictObject({
  id: idCon("esc"),
  nombre: textoIdioma,
  /** § 11.1: cada nivel con una descripción observable (RF-02.2). */
  niveles: z
    .array(z.strictObject({ valor: entero(0, 4), nombre: textoIdioma, descripcion: textoIdioma }))
    .refine((ns) => ns.map((n) => n.valor).join(",") === "0,1,2,3,4", "los niveles 0, 1, 2, 3 y 4, en orden (§ 11.1)"),
  /** RF-04.2 en el dato: lo más que aporta una evidencia según su madurez, y si el caso acepta vista previa. */
  tope_por_madurez: z
    .array(z.strictObject({ madurez: id, disponible: z.boolean(), tope: entero(0, 4), tope_aceptando_vista_previa: entero(0, 4) }))
    .min(1, "al menos una madurez"),
});

export const esquemaConvenciones = z
  .strictObject({
    id: z.literal("metodo"),
    /** La gramática del atlas de la que salen las capacidades y la escala de madurez. */
    gramatica_id: id,
    /** RF-04.1: la regla de agregación cuando una celda tiene varias evidencias. */
    agregacion: z.literal("minimo-de-esenciales"),
    /** RF-04.4, en centésimas de punto (500 = 5 puntos). */
    umbral_empate_centesimas: entero(1, 10_000),
    /** RF-04.7: robusta desde `robusta_pct`, frágil por debajo de `fragil_pct`. */
    robustez: z.strictObject({ robusta_pct: entero(1, 100), fragil_pct: entero(0, 99) }),
    /** RF-01.5: por revisar desde `revisar_dias`, vencida desde `vencido_dias`. */
    vigencia: z.strictObject({ revisar_dias: entero(1, 3_650), vencido_dias: entero(1, 3_650) }),
    /** RF-04.8 (E-15). */
    pros_contras: z.strictObject({ ancla_destaca: entero(0, 4), ancla_corta: entero(0, 4), max_por_lista: entero(1, 20) }),
    /** La rejilla en que la pantalla muestra los eventos de la sensibilidad, en centésimas. */
    sensibilidad: z.strictObject({ paso_centesimas: entero(1, 1_000) }),
    /** RF-04.6 y E-7: semilla declarada, semillas de estabilidad, combinaciones aceptadas, tope de intentos y z del intervalo. */
    simulacion: z.strictObject({
      semilla: entero(0, 4_294_967_295),
      semillas_estabilidad: z.array(entero(0, 4_294_967_295)).min(1, "al menos una semilla de estabilidad"),
      aceptadas: entero(1, 1_000_000),
      tope_intentos: entero(1, 100_000_000),
      z_centesimas: entero(1, 1_000),
    }),
    /** E-7: los umbrales son convención, no ley; la pantalla y el informe lo dicen con estas palabras. */
    declaracion: textoIdioma,
  })
  .superRefine((c, ctx) => {
    const r = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (c.robustez.fragil_pct >= c.robustez.robusta_pct) r(["robustez", "fragil_pct"], "tiene que ser menor que robusta_pct");
    if (c.vigencia.vencido_dias <= c.vigencia.revisar_dias) r(["vigencia", "vencido_dias"], "tiene que ser mayor que revisar_dias");
    if (c.pros_contras.ancla_corta >= c.pros_contras.ancla_destaca) r(["pros_contras", "ancla_corta"], "tiene que ser menor que ancla_destaca");
    const semillas = [c.simulacion.semilla, ...c.simulacion.semillas_estabilidad];
    if (new Set(semillas).size !== semillas.length) r(["simulacion", "semillas_estabilidad"], "las semillas no se repiten ni repiten la principal");
  });

/** E-18: quién publica la fuente y qué interés tiene respecto de la plataforma de la evidencia. */
export const CONFLICTOS = ["propio-fabricante", "fabricante-competidor", "socio-comercial", "resena-incentivada", "independiente"] as const;

const esquemaFuente = z.strictObject({
  url: z.string().url("una dirección web").startsWith("https://", "solo fuentes https"),
  titulo: z.string().trim().min(1, "no puede ir vacío"),
  tipo: z.enum(["oficial", "tercero"]),
  fecha_publicacion: fecha.optional(),
  conflicto_de_interes: z.enum(CONFLICTOS),
  /** El pasaje EXACTO de la fuente, en su idioma, que respalda la afirmación (E-4). */
  cita: z.string().trim().min(40, "una cita de al menos 40 caracteres").max(600, "una cita de 600 caracteres como máximo"),
  /** Lo que comprobó el código (curl sobre la página cruda) o que no pudo comprobarlo. */
  verificacion: z.strictObject({ resultado: z.enum(["verificada", "no-verificable"]), fecha, http: z.number().int().nullable(), sha256: hex64.nullable() }),
});

export const esquemaEvidencia = z
  .strictObject({
    id: idCon("evi"),
    plataforma_id: id,
    /** Exactamente una de las dos: la capacidad o el criterio transversal que evalúa. */
    capacidad_id: idCon("cap").optional(),
    criterio_id: idCon("crit").optional(),
    afirmacion: textoIdioma,
    componentes: z.array(z.string().trim().min(1, "no puede ir vacío")).min(1, "al menos un componente"),
    madurez: id,
    puntaje: entero(0, 4),
    /** Por qué este puntaje y no el adyacente, contra el ancla de la escala (§ 11.1). */
    justificacion_puntaje: textoIdioma,
    /** Si cuenta para el mínimo cuando la celda tiene varias evidencias (RF-04.1). */
    esencial: z.boolean(),
    fuentes: z.array(esquemaFuente).min(1, "al menos una fuente"),
    fecha_verificacion: fecha,
    limitaciones: z.array(textoIdioma).optional(),
    origen: z.enum(["curador", "agente-investigador"]),
    estado_aprobacion: z.enum(["propuesta", "aprobada", "rechazada"]),
    aprobada_por: z.string().trim().min(1, "no puede ir vacío").optional(),
    fecha_aprobacion: fecha.optional(),
  })
  .superRefine((e, ctx) => {
    const r = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (!!e.capacidad_id === !!e.criterio_id) r(e.capacidad_id ? "criterio_id" : "capacidad_id", "una evidencia evalúa una capacidad o un criterio transversal: exactamente uno de los dos");
    const aprobada = e.estado_aprobacion === "aprobada";
    if (aprobada && !e.aprobada_por) r("aprobada_por", "obligatorio en una evidencia aprobada");
    if (aprobada && !e.fecha_aprobacion) r("fecha_aprobacion", "obligatorio en una evidencia aprobada");
    if (!aprobada && e.aprobada_por) r("aprobada_por", "solo una evidencia aprobada lo lleva");
    if (!aprobada && e.fecha_aprobacion) r("fecha_aprobacion", "solo una evidencia aprobada lo lleva");
  });

/** La decisión implícita que todo caso tiene que discutir (E-17). */
export const UNA_O_COMBINACION = "una-o-combinacion";

const sinRepetir = <T>(xs: readonly T[], clave: (x: T) => string) => new Set(xs.map(clave)).size === xs.length;

export const esquemaCaso = z
  .strictObject({
    id,
    nombre: textoIdioma,
    descripcion: textoIdioma,
    /** § 10.4: organización, situación, identidad, datos, equipo, presupuesto, objetivo (siempre ficticio). */
    contexto: z.array(z.strictObject({ elemento: textoIdioma, descripcion: textoIdioma })).min(1, "al menos un elemento de contexto"),
    requisitos: z.array(z.strictObject({ descripcion: textoIdioma, criterio_id: idCon("crit"), tipo: z.enum(["obligatorio", "preferente"]) })).min(1, "al menos un requisito"),
    criterios: z
      .array(
        z.strictObject({
          criterio_id: idCon("crit"),
          /** Centésimas: los del caso suman 10 000 (100 puntos). */
          peso_centesimas: entero(0, 10_000),
          /** Cuánto podría variar el peso, relativo a él (E-2: ±20 % de 30 = 24–36). */
          rango_relativo_pct: entero(0, 100),
          /** RF-03.3. */
          origen: z.enum(["declarado-por-usuario", "propuesto-por-agente"]),
          /** Quién lo fijó en el caso (p. ej., el comité clínico). */
          fijado_por: textoIdioma.optional(),
          /** Esencial para este caso: entra al leximin y a la evidencia limitante. */
          esencial: z.boolean(),
        }),
      )
      .min(1, "al menos un criterio"),
    restricciones: z.array(
      z.strictObject({
        id: idCon("res"),
        descripcion: textoIdioma,
        criterio_id: idCon("crit"),
        /** Las plataformas que no la cumplen, cada una con su razón (RF-03.4); vacía si todas la cumplen. */
        elimina: z.array(z.strictObject({ plataforma_id: id, razon: textoIdioma })),
        fijado_por: textoIdioma.optional(),
      }),
    ),
    decisiones_implicitas: z
      .array(
        z.strictObject({
          id,
          pregunta: textoIdioma,
          opciones: z.array(z.strictObject({ id, texto: textoIdioma, nota: textoIdioma.optional() })).min(2, "al menos dos opciones"),
          /** El id de la opción elegida; null mientras no se responda. */
          respuesta: id.nullable(),
        }),
      )
      .min(1, "al menos la decisión «¿una plataforma o combinación?»"),
    acepta_vista_previa: z.boolean(),
    /** La fecha contra la que se cuenta la vigencia de las evidencias: una entrada, nunca el reloj. */
    fecha_evaluacion: fecha,
    /** La instantánea contra la que se evalúa; un borrador puede no tenerla todavía (se mira contra la base viva). */
    instantanea: versionInstantanea.nullable(),
    estado_aprobacion: z.enum(["borrador", "aprobado"]),
    /** El sello que escribe el comando de aprobación: la fecha y la huella del perfil aprobado. */
    aprobacion: z.strictObject({ fecha, huella: hex64 }).optional(),
  })
  .superRefine((c, ctx) => {
    const r = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const suma = c.criterios.reduce((s, x) => s + x.peso_centesimas, 0);
    if (suma !== 10_000) r(["criterios"], `los pesos suman ${suma} centésimas y deben sumar 10 000 (100 puntos)`);
    if (!sinRepetir(c.criterios, (x) => x.criterio_id)) r(["criterios"], "un criterio aparece dos veces");
    if (!sinRepetir(c.restricciones, (x) => x.id)) r(["restricciones"], "un id de restricción se repite");
    if (!sinRepetir(c.decisiones_implicitas, (x) => x.id)) r(["decisiones_implicitas"], "un id de decisión se repite");
    if (!c.decisiones_implicitas.some((d) => d.id === UNA_O_COMBINACION)) r(["decisiones_implicitas"], `falta la decisión «${UNA_O_COMBINACION}» (¿una plataforma o combinación?, E-17)`);
    c.decisiones_implicitas.forEach((d, i) => {
      if (!sinRepetir(d.opciones, (o) => o.id)) r(["decisiones_implicitas", i, "opciones"], "un id de opción se repite");
      if (d.respuesta !== null && !d.opciones.some((o) => o.id === d.respuesta)) r(["decisiones_implicitas", i, "respuesta"], `«${d.respuesta}» no es una de sus opciones`);
    });
    const aprobado = c.estado_aprobacion === "aprobado";
    if (aprobado && !c.aprobacion) r(["aprobacion"], "obligatorio en un perfil aprobado");
    if (aprobado && c.instantanea === null) r(["instantanea"], "un perfil aprobado se evalúa contra una instantánea (RF-01.4)");
    if (!aprobado && c.aprobacion) r(["aprobacion"], "solo un perfil aprobado lleva sello");
    if (aprobado) c.decisiones_implicitas.forEach((d, i) => d.respuesta === null && r(["decisiones_implicitas", i, "respuesta"], "un perfil aprobado responde todas sus decisiones implícitas"));
  });

export const esquemaInstantanea = z.strictObject({
  version: versionInstantanea,
  fecha,
  /** SHA-256 del JSON canónico (RFC 8785) de `contenido`. */
  huella: hex64,
  /** La versión anterior, contra la que se calculan los cambios; null en la primera. */
  anterior: versionInstantanea.nullable(),
  cambios: z.array(z.strictObject({ evidencia_id: idCon("evi"), tipo: z.enum(["nueva", "modificada", "retirada"]) })),
  /** La base aprobada, congelada: lo que el caso evalúa (la instantánea se basta sola para reproducir el cálculo). */
  contenido: z.strictObject({
    plataformas: z.array(z.strictObject({ id, nombre: textoIdioma, ficticia: z.boolean() })),
    capacidades: z.array(esquemaCapacidad),
    criterios: z.array(esquemaCriterio),
    escalas: z.array(esquemaEscala),
    convenciones: esquemaConvenciones,
    evidencias: z.array(esquemaEvidencia),
  }),
});

export type Capacidad = z.infer<typeof esquemaCapacidad>;
export type Criterio = z.infer<typeof esquemaCriterio>;
export type Escala = z.infer<typeof esquemaEscala>;
export type Convenciones = z.infer<typeof esquemaConvenciones>;
export type Evidencia = z.infer<typeof esquemaEvidencia>;
export type Caso = z.infer<typeof esquemaCaso>;
export type Instantanea = z.infer<typeof esquemaInstantanea>;
export type ContenidoInstantanea = Instantanea["contenido"];
