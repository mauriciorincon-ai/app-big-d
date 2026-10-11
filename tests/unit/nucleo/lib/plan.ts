// Entradas del plan para las pruebas del núcleo y para el gate de reproducibilidad entre motores: puras, sin leer
// archivos (el mismo código corre en Node y empaquetado en los tres navegadores). Plataformas y decisiones genéricas.
import type { Comparacion, DecisionDelPlan, EntradaPlan, ModoDelPlan, SupuestoDelPlan } from "../../../../src/engine";

/** El plan de ejemplo con sus listas editables: las pruebas lo rompen de a un dato. */
export interface PlanEditable extends EntradaPlan {
  decisiones: DecisionDelPlan[];
  modos_de_falla: ModoDelPlan[];
  supuestos: SupuestoDelPlan[];
  comparacion: Comparacion;
}

const PLATAFORMAS = ["plat-a", "plat-b", "plat-c"];
const opciones = (d: string, sinFuente: string[] = []) =>
  PLATAFORMAS.map((p) => (sinFuente.includes(p) ? { plataforma_id: p, citas: [], sin_fuente: true } : { plataforma_id: p, citas: [{ evidencia_id: `evi-${p}-${d}` }] }));

export function planEjemplo(): PlanEditable {
  const decisiones: DecisionDelPlan[] = [
    { id: "dec-a", reversibilidad: "una_via", depende_de: [], implicita: true, estado: "esperando-prueba", opciones_por_plataforma: opciones("a") },
    { id: "dec-b", reversibilidad: "una_via", depende_de: ["dec-a"], implicita: false, estado: "pendiente", opciones_por_plataforma: opciones("b") },
    { id: "dec-c", reversibilidad: "costosa", depende_de: ["dec-b"], implicita: false, estado: "pendiente", opciones_por_plataforma: opciones("c", ["plat-c"]) },
    { id: "dec-d", reversibilidad: "costosa", depende_de: ["dec-a"], implicita: true, estado: "pendiente", opciones_por_plataforma: opciones("d") },
    { id: "dec-e", reversibilidad: "dos_vias", depende_de: [], implicita: false, estado: "decidida", opciones_por_plataforma: opciones("e") },
    { id: "dec-f", reversibilidad: "una_via", depende_de: ["dec-d"], implicita: false, estado: "pendiente", opciones_por_plataforma: opciones("f") },
  ];
  const modos_de_falla: ModoDelPlan[] = [
    // Control legal: la tabla da baja tras mitigar, la prioridad efectiva sigue alta (G8).
    { id: "rie-1", decision_id: "dec-c", severidad: 9, ocurrencia: 4, deteccion: 6, control_legal: true, mitigaciones: [{ efecto: { deteccion: 3 } }, { efecto: { ocurrencia: 2 } }] },
    // C03-bis del contrato: S8·O3·D4 es baja aunque su RPN (96) iguale al de C03.
    { id: "rie-2", decision_id: "dec-b", severidad: 8, ocurrencia: 3, deteccion: 4, mitigaciones: [] },
    // C03: S8·O6·D2 es alta con RPN 96; con una mitigación baja de categoría.
    { id: "rie-3", decision_id: "dec-a", severidad: 8, ocurrencia: 6, deteccion: 2, mitigaciones: [{ efecto: { ocurrencia: 3 } }] },
    { id: "rie-4", decision_id: "dec-d", severidad: 7, ocurrencia: 5, deteccion: 5, mitigaciones: [{ efecto: { ocurrencia: 3, deteccion: 3 } }] },
    // Un RPN mayor (S6·O6·D8 = 288) que el de rie-4 (175) y que NO manda sobre la severidad: media, y va después.
    { id: "rie-5", decision_id: "dec-f", severidad: 6, ocurrencia: 6, deteccion: 8, mitigaciones: [{ efecto: { ocurrencia: 4 } }] },
  ];
  const supuestos: SupuestoDelPlan[] = [
    { id: "sup-1", criticidad: "alta", prueba_barata: { es: "Probar con una cuenta de prueba.", en: "Try with a trial account." }, estado: "sin_probar", vence: "2026-11-01", decisiones: ["dec-a"] },
    { id: "sup-2", criticidad: "media", prueba_barata: { es: "Medirlo una vez.", en: "Measure it once." }, estado: "confirmado", decisiones: ["dec-b"] },
    { id: "sup-3", criticidad: "baja", prueba_barata: { es: "Preguntar al equipo.", en: "Ask the team." }, estado: "sin_probar", vence: "2026-12-15", decisiones: ["dec-d", "dec-e"] },
  ];
  return { decisiones, modos_de_falla, supuestos, fecha_evaluacion: "2026-10-06", comparacion: { tipo: "empate-tecnico", plataformas: ["plat-b", "plat-a"] } };
}

type Cambio = (e: PlanEditable) => void;
export function planCon(cambio: Cambio): PlanEditable {
  const e = planEjemplo();
  cambio(e);
  return e;
}

/** Las variantes que entran al gate entre motores. */
export const VARIANTES_PLAN: [string, Cambio][] = [
  ["plan-empate", () => {}],
  ["plan-ganadora", (e) => void (e.comparacion = { tipo: "ganadora", plataformas: ["plat-c"] })],
  ["plan-sin-comparacion", (e) => void (e.comparacion = { tipo: "sin-comparacion", motivo: "perfil-en-borrador" })],
  // dec-a ← dec-d ← dec-f, y dec-a depende de dec-f: un ciclo que deja sin onda a lo que lo toca.
  ["plan-ciclo", (e) => void (e.decisiones[0] = { ...e.decisiones[0]!, depende_de: ["dec-f"] })],
  ["plan-alta-sin-mitigacion", (e) => void (e.modos_de_falla[0] = { ...e.modos_de_falla[0]!, mitigaciones: [] })],
  ["plan-supuestos-vencidos", (e) => void (e.fecha_evaluacion = "2026-12-31")],
];
