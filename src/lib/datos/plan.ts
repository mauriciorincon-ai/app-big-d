import { z } from "zod";
import { fecha, entero, hex64, idCon } from "./conocimiento";
import { id, textoIdioma } from "./esquemas";

// El plan del caso (S5, C16–C18; especificación § 6.8–6.10): decisiones con reversibilidad y dependencias, modos de falla
// con prioridad de acción y mitigaciones, y supuestos con su prueba barata. Un archivo por entidad bajo
// data/casos/<caso>/plan/, redactado en `{es, en}`, validado entero antes de calcular nada. Lo que el contrato de
// instrumentos-de-plan v0.2.0 no trae (opciones por plataforma con su cita, residual, responsable, costo de la prueba,
// capacidad) lo añade esta capa sin tocar el paquete; las enmiendas van al cierre del sprint. Las reglas que cruzan
// archivos (citas que resuelven a evidencia aprobada de la plataforma, referencias, cobertura de plataformas, sello del
// plan) las aplica el cargador con el mismo formato de error que la base.

const origen = z.enum(["propuesto-por-agente", "declarado-por-usuario"]);
const unoADiez = entero(1, 10);

/** Una cita del plan: una evidencia aprobada y, si quiere, los componentes de esa evidencia en que se apoya. */
export const esquemaCita = z.strictObject({
  evidencia_id: idCon("evi"),
  componentes: z.array(id).min(1, "al menos un componente, o se omite el campo").optional(),
});

/** Cómo resuelve la decisión una plataforma. Sin cita no hay afirmación: o cita evidencia aprobada o dice `sin_fuente`. */
export const esquemaOpcionPlataforma = z
  .strictObject({
    plataforma_id: id,
    texto: textoIdioma,
    citas: z.array(esquemaCita),
    /** La base no sostiene esta opción: se muestra como alerta y entra a la lista para /investigar. */
    sin_fuente: z.boolean().optional(),
  })
  .superRefine((o, ctx) => {
    if (o.sin_fuente === true && o.citas.length > 0) ctx.addIssue({ code: "custom", path: ["sin_fuente"], message: "una opción con citas no es «sin fuente»" });
    if (o.sin_fuente !== true && o.citas.length === 0) ctx.addIssue({ code: "custom", path: ["citas"], message: "sin cita de evidencia aprobada no hay afirmación: cita una o marca `sin_fuente: true`" });
  });

export const REVERSIBILIDAD = ["una_via", "costosa", "dos_vias"] as const;
export const ESTADOS_DECISION = ["pendiente", "esperando-prueba", "decidida"] as const;

export const esquemaDecision = z
  .strictObject({
    id: idCon("dec"),
    pregunta: textoIdioma,
    /** De dónde sale la decisión: una capacidad de la base o un criterio transversal. Exactamente una. */
    capacidad_id: idCon("cap").optional(),
    criterio_id: idCon("crit").optional(),
    reversibilidad: z.enum(REVERSIBILIDAD),
    /** Por qué esa reversibilidad (§ 11.3): lo que costaría deshacerla. */
    razon_reversibilidad: textoIdioma,
    depende_de: z.array(idCon("dec")),
    /** Se suele tomar sin discutirla (riesgo de decisión implícita). */
    implicita: z.boolean(),
    estado: z.enum(ESTADOS_DECISION),
    /** Una entrada por plataforma del caso que se evalúa. */
    opciones_por_plataforma: z.array(esquemaOpcionPlataforma).min(1, "al menos una plataforma"),
  })
  .superRefine((d, ctx) => {
    const r = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (!d.capacidad_id === !d.criterio_id) r(["capacidad_id"], "exactamente una de `capacidad_id` o `criterio_id`");
    if (d.depende_de.includes(d.id)) r(["depende_de"], "una decisión no depende de sí misma");
    if (new Set(d.depende_de).size !== d.depende_de.length) r(["depende_de"], "una dependencia se repite");
    if (new Set(d.opciones_por_plataforma.map((o) => o.plataforma_id)).size !== d.opciones_por_plataforma.length) r(["opciones_por_plataforma"], "una plataforma aparece dos veces");
  });

const esquemaMitigacion = z.strictObject({
  accion: textoIdioma,
  /** Quién sugiere el plan que la lleve (un rol, no una persona: el equipo del caso decide). */
  responsable: textoIdioma,
  momento: z.enum(["antes", "durante", "despues"]),
  /** Los puntajes que se esperan tras aplicarla; el residual sale de ellos por la MISMA tabla de prioridad. */
  efecto: z
    .strictObject({ ocurrencia: unoADiez.optional(), deteccion: unoADiez.optional() })
    .refine((e) => e.ocurrencia !== undefined || e.deteccion !== undefined, "baja la ocurrencia, la detección o las dos"),
});

export const esquemaModoDeFalla = z.strictObject({
  id: idCon("rie"),
  decision_id: idCon("dec"),
  modo: textoIdioma,
  efecto: textoIdioma,
  causa: textoIdioma,
  severidad: unoADiez,
  ocurrencia: unoADiez,
  deteccion: unoADiez,
  /** El modo protege una obligación legal: prioridad efectiva alta y mitigación obligatoria (G8). */
  control_legal: z.boolean().optional(),
  /** Los números son juicio, no evidencia: de quién son y por qué (con la escala anclada del contrato). */
  origen,
  razon: textoIdioma,
  mitigaciones: z.array(esquemaMitigacion),
});

export const esquemaSupuesto = z.strictObject({
  id: idCon("sup"),
  enunciado: textoIdioma,
  criticidad: z.enum(["alta", "media", "baja"]),
  /** Una TAREA planificada para el equipo del caso (E-23): la app no la ejecuta ni se conecta a ninguna plataforma. */
  prueba_barata: textoIdioma,
  responsable: textoIdioma,
  costo_prueba: z.enum(["gratis", "bajo", "medio"]),
  estado: z.enum(["sin_probar", "confirmado", "refutado"]),
  /** Fecha límite de la prueba; se compara con la fecha de evaluación del caso, nunca con el reloj. */
  vence: fecha.optional(),
  decisiones: z.array(idCon("dec")).min(1, "al menos una decisión que sostiene"),
  origen,
});

/** La cabecera del plan: de qué caso es y si una persona lo aprobó. */
export const esquemaPlanCaso = z
  .strictObject({
    caso_id: id,
    estado_aprobacion: z.enum(["borrador", "aprobado"]),
    /** El sello que escribe el comando de aprobación: la fecha y la huella del plan aprobado. */
    aprobacion: z.strictObject({ fecha, huella: hex64 }).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.estado_aprobacion === "aprobado" && !p.aprobacion) ctx.addIssue({ code: "custom", path: ["aprobacion"], message: "obligatorio en un plan aprobado" });
    if (p.estado_aprobacion === "borrador" && p.aprobacion) ctx.addIssue({ code: "custom", path: ["aprobacion"], message: "solo un plan aprobado lleva sello" });
  });

export type Cita = z.infer<typeof esquemaCita>;
export type OpcionPlataforma = z.infer<typeof esquemaOpcionPlataforma>;
export type Decision = z.infer<typeof esquemaDecision>;
export type ModoDeFalla = z.infer<typeof esquemaModoDeFalla>;
export type Supuesto = z.infer<typeof esquemaSupuesto>;
export type PlanCaso = z.infer<typeof esquemaPlanCaso>;

/** El plan de un caso, cargado: su cabecera y sus tres listas, cada una ordenada por id. */
export interface Plan extends PlanCaso {
  decisiones: Decision[];
  modos_de_falla: ModoDeFalla[];
  supuestos: Supuesto[];
}
