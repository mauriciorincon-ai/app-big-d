// El caso de la maqueta (docs/diseno/comparacion.html, scripts/maqueta/pantallas/caso.mjs) como entrada del núcleo:
// el Hospital Ficticio de la Sabana con cuatro plataformas ficticias (Este sale por la residencia de datos). Los
// criterios son los de la especificación § 10.2–10.3: los tres de la maqueta que no existen allí se leen como su par
// más cercano (equipo → habilidades, apertura → dependencia, operación → ecosistema). Pesos y puntajes, los de la
// maqueta, en centésimas.
import type { BaseMotor, CasoMotor, Entrada, EvidenciaMotor, TopeMadurez } from "@/engine";

export const CRITERIOS = ["crit-ingesta", "crit-almacenamiento", "crit-transformacion", "crit-gobierno", "crit-consumo", "crit-ia", "crit-costo", "crit-cumplimiento", "crit-habilidades", "crit-dependencia", "crit-ecosistema"];
const CAPACIDAD: Record<string, string> = { "crit-ingesta": "cap-ingesta", "crit-almacenamiento": "cap-almacenamiento", "crit-transformacion": "cap-transformacion", "crit-gobierno": "cap-gobierno", "crit-consumo": "cap-consumo", "crit-ia": "cap-ia" };
export const PESOS = [800, 1000, 1200, 2500, 1000, 500, 1200, 800, 500, 300, 200];
const ESENCIALES = new Set(["crit-almacenamiento", "crit-gobierno", "crit-cumplimiento"]);
export const PUNTAJES: Record<string, number[]> = {
  "plataforma-ejemplo": [3, 4, 3, 3, 3, 2, 3, 3, 2, 4, 3],
  norte: [4, 3, 3, 4, 3, 0, 3, 3, 3, 2, 3],
  sur: [3, 3, 4, 2, 2, 1, 2, 3, 3, 3, 3],
  este: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
};

export const TOPES: TopeMadurez[] = [
  { madurez: "disponible-general", disponible: true, tope: 4, tope_aceptando_vista_previa: 4 },
  { madurez: "vista-previa-publica", disponible: false, tope: 2, tope_aceptando_vista_previa: 4 },
  { madurez: "vista-previa-privada", disponible: false, tope: 2, tope_aceptando_vista_previa: 4 },
  { madurez: "beta", disponible: false, tope: 2, tope_aceptando_vista_previa: 4 },
  { madurez: "anunciado", disponible: false, tope: 2, tope_aceptando_vista_previa: 2 },
  { madurez: "retirado", disponible: false, tope: 2, tope_aceptando_vista_previa: 2 },
];

function evidencias(): EvidenciaMotor[] {
  return Object.entries(PUNTAJES).flatMap(([p, ss]) =>
    CRITERIOS.map((c, i) => ({
      id: `evi-${p}-${c.slice(5)}`,
      plataforma_id: p,
      ...(CAPACIDAD[c] ? { capacidad_id: CAPACIDAD[c] } : { criterio_id: c }),
      puntaje: ss[i]!,
      // La IA de Ejemplo es un agente en vista previa: su 2 ya es el tope (la maqueta lo marca).
      madurez: p === "plataforma-ejemplo" && c === "crit-ia" ? "vista-previa-publica" : "disponible-general",
      esencial: true,
      estado: "aprobada" as const,
      fecha_verificacion: "2026-09-20",
    })),
  );
}

export function base(): BaseMotor {
  return {
    instantanea: { version: "2026-09-26.1", huella: "8d2c4e".padEnd(64, "0") },
    plataformas: Object.keys(PUNTAJES).sort().map((id) => ({ id })),
    criterios: CRITERIOS.map((id) => (CAPACIDAD[id] ? { id, tipo: "capacidad" as const, capacidad_id: CAPACIDAD[id] } : { id, tipo: "transversal" as const })),
    evidencias: evidencias(),
    escala: { max: 4, topes: TOPES },
    convenciones: {
      umbral_empate_centesimas: 500,
      vigencia: { revisar_dias: 30, vencido_dias: 60 },
      pros_contras: { ancla_destaca: 4, ancla_corta: 2, max_por_lista: 3 },
      sensibilidad: { paso_centesimas: 10 },
    },
  };
}

export function caso(): CasoMotor {
  return {
    id: "hospital-sabana",
    estado: "aprobado",
    acepta_vista_previa: false,
    fecha_evaluacion: "2026-09-26",
    pesos: CRITERIOS.map((criterio_id, i) => ({ criterio_id, peso: PESOS[i]!, esencial: ESENCIALES.has(criterio_id), rango_pct: 20 })),
    restricciones: [
      { id: "res-residencia", elimina: ["este"] },
      { id: "res-servicio-gestionado", elimina: [] },
    ],
  };
}

export const sabana = (): Entrada => ({ caso: caso(), base: base() });
