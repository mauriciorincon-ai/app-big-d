// Una base de conocimiento COMPLETA y ficticia en disco: las cuatro plataformas de la maqueta (Ejemplo, Norte, Sur y
// Este), una evidencia aprobada por plataforma y criterio con los puntajes de la maqueta, la instantánea que las congela
// y el caso del Hospital Ficticio del Futuro aprobado con su sello. Toma de data/ lo que es común (gramática,
// capacidades, criterios, escala, convenciones) para no copiarlo a mano. Fuentes example.org (regla 12).
import { cpSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Caso } from "@/lib/datos/conocimiento";
import { huellaCaso, nuevaInstantanea } from "@/lib/datos/instantanea";
import { CRITERIOS, PESOS, PUNTAJES } from "../nucleo/lib/futuro";

const NOMBRES: Record<string, [string, string]> = {
  "plataforma-ejemplo": ["Plataforma Ejemplo (ficticia)", "Example Platform (fictional)"],
  norte: ["Plataforma Norte (ficticia)", "North Platform (fictional)"],
  sur: ["Plataforma Sur (ficticia)", "South Platform (fictional)"],
  este: ["Plataforma Este (ficticia)", "East Platform (fictional)"],
};
const CAPACIDAD: Record<string, string> = { "crit-ingesta": "cap-ingesta", "crit-almacenamiento": "cap-almacenamiento", "crit-transformacion": "cap-transformacion", "crit-gobierno": "cap-gobierno", "crit-consumo": "cap-consumo", "crit-ia": "cap-ia" };
export const FECHA_INSTANTANEA = "2026-09-26";
const escribir = (ruta: string, dato: unknown) => writeFileSync(ruta, stringify(dato));

export function evidenciaFicticia(p: string, c: string, puntaje: number): Record<string, unknown> {
  const [es, en] = NOMBRES[p]!;
  const corto = c.slice(5);
  return {
    id: `evi-${p}-${corto}`,
    plataforma_id: p,
    ...(CAPACIDAD[c] ? { capacidad_id: CAPACIDAD[c] } : { criterio_id: c }),
    afirmacion: { es: `${es}: resuelve «${corto}» como lo describe su documentación ficticia.`, en: `${en}: covers “${corto}” as its fictional documentation describes.` },
    componentes: [`${es.split(" (")[0]} · ${corto}`],
    madurez: p === "plataforma-ejemplo" && c === "crit-ia" ? "vista-previa-publica" : "disponible-general",
    puntaje,
    justificacion_puntaje: { es: `${puntaje} y no el adyacente: así lo fija el caso de la maqueta.`, en: `${puntaje} and not the adjacent level: the mockup case sets it.` },
    esencial: true,
    fuentes: [
      {
        url: `https://example.org/${p}/${corto}`,
        titulo: `${es} · ${corto}`,
        tipo: "oficial",
        conflicto_de_interes: "propio-fabricante",
        cita: `${en} is fictional: this page exists to test the Big-D knowledge base.`,
        verificacion: { resultado: "no-verificable", fecha: "2026-09-20", http: null, sha256: null },
      },
    ],
    fecha_verificacion: "2026-09-20",
    origen: "curador",
    estado_aprobacion: "aprobada",
    aprobada_por: "curador",
    fecha_aprobacion: "2026-09-21",
  };
}

const t = (es: string, en: string) => ({ es, en });

export function casoFuturo(version: string): Caso {
  const esenciales = new Set(["crit-almacenamiento", "crit-gobierno", "crit-cumplimiento"]);
  const caso: Caso = {
    id: "hospital-futuro",
    nombre: t("Hospital Ficticio del Futuro", "Fictional Hospital of the Future"),
    descripcion: t("El caso de la maqueta: un hospital ficticio que elige su plataforma de datos.", "The mockup case: a fictional hospital choosing its data platform."),
    contexto: [
      { elemento: t("Organización", "Organization"), descripcion: t("Hospital sin ánimo de lucro, de tamaño medio, parte de un grupo corporativo.", "Mid-sized non-profit hospital, part of a corporate group.") },
      { elemento: t("Equipo", "Team"), descripcion: t("Muy pequeño, con fuerte experiencia en inteligencia de negocio.", "Very small, with strong business intelligence experience.") },
    ],
    requisitos: [{ descripcion: t("Los datos clínicos se protegen por fila y por columna.", "Clinical data is protected by row and by column."), criterio_id: "crit-gobierno", tipo: "obligatorio" }],
    criterios: CRITERIOS.map((criterio_id, i) => ({ criterio_id, peso_centesimas: PESOS[i]!, rango_relativo_pct: 20, origen: "declarado-por-usuario" as const, esencial: esenciales.has(criterio_id) })),
    restricciones: [
      { id: "res-residencia", descripcion: t("Los datos clínicos residen en el país.", "Clinical data resides in the country."), criterio_id: "crit-cumplimiento", elimina: [{ plataforma_id: "este", razon: t("No ofrece residencia en el país.", "It offers no in-country residency.") }] },
      { id: "res-servicio-gestionado", descripcion: t("Sin operación propia 24 × 7: el servicio debe ser gestionado.", "No in-house 24 × 7 operation: the service must be managed."), criterio_id: "crit-habilidades", elimina: [] },
    ],
    decisiones_implicitas: [
      { id: "una-o-combinacion", pregunta: t("¿Una plataforma o una combinación?", "One platform or a combination?"), opciones: [{ id: "una", texto: t("Una sola plataforma", "A single platform") }, { id: "combinacion", texto: t("Combinación de dos", "A combination of two") }], respuesta: "una" },
      { id: "quien-opera", pregunta: t("¿Quién opera la plataforma?", "Who operates the platform?"), opciones: [{ id: "gestionado", texto: t("Servicio gestionado por el fabricante", "Vendor-managed service") }, { id: "propio", texto: t("Equipo propio", "In-house team") }], respuesta: "gestionado" },
    ],
    acepta_vista_previa: false,
    fecha_evaluacion: "2026-09-26",
    instantanea: version,
    estado_aprobacion: "aprobado",
  };
  return { ...caso, aprobacion: { fecha: "2026-09-26", huella: huellaCaso(caso) } };
}

/**
 * Arma la base en `dir` (vacío) y devuelve la versión de su instantánea. Con `atlas`, el árbol sirve también para
 * construir el sitio (BIGD_DATOS): la Plataforma Ejemplo queda publicada con su mapa y sus versiones archivadas de
 * data/mapas, y las demás ficticias, «próximamente».
 */
export function armarBaseFuturo(dir: string, { atlas = false, raiz = process.cwd() }: { atlas?: boolean; raiz?: string } = {}): string {
  for (const d of ["gramaticas", "capacidades", "criterios", "escalas", "convenciones"]) cpSync(join(raiz, "data", d), join(dir, d), { recursive: true });
  mkdirSync(join(dir, "plataformas"));
  for (const [id, [es, en]] of Object.entries(NOMBRES)) escribir(join(dir, "plataformas", `${id}.yaml`), { id, nombre: { es, en }, estado: atlas && id === "plataforma-ejemplo" ? "publicada" : "proximamente", ficticia: true });
  if (atlas) {
    mkdirSync(join(dir, "mapas", "versiones"), { recursive: true });
    cpSync(join(raiz, "data/mapas/plataforma-ejemplo.mapa.yaml"), join(dir, "mapas/plataforma-ejemplo.mapa.yaml"));
    for (const f of readdirSync(join(raiz, "data/mapas/versiones")).filter((x) => x.startsWith("plataforma-ejemplo-"))) cpSync(join(raiz, "data/mapas/versiones", f), join(dir, "mapas/versiones", f));
  }
  for (const [p, ss] of Object.entries(PUNTAJES)) {
    mkdirSync(join(dir, "evidencias", p), { recursive: true });
    CRITERIOS.forEach((c, i) => escribir(join(dir, "evidencias", p, `evi-${p}-${c.slice(5)}.yaml`), evidenciaFicticia(p, c, ss[i]!)));
  }
  const inst = nuevaInstantanea(cargarConocimiento(dir), FECHA_INSTANTANEA, []);
  mkdirSync(join(dir, "instantaneas"));
  writeFileSync(join(dir, "instantaneas", `${inst.version}.json`), `${JSON.stringify(inst, null, 2)}\n`);
  mkdirSync(join(dir, "casos"));
  escribir(join(dir, "casos", "hospital-futuro.yaml"), casoFuturo(inst.version));
  return inst.version;
}
