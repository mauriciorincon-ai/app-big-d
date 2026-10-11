// Una base de conocimiento COMPLETA y ficticia en disco: las cuatro plataformas de la maqueta (Ejemplo, Norte, Sur y
// Este), una evidencia aprobada por plataforma y criterio con los puntajes de la maqueta, la instantánea que las congela
// y el caso del Hospital Ficticio del Futuro aprobado con su sello. Toma de data/ lo que es común (gramática,
// capacidades, criterios, escala, convenciones) para no copiarlo a mano. Fuentes example.org (regla 12).
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Caso } from "@/lib/datos/conocimiento";
import { huellaCaso, nuevaInstantanea } from "@/lib/datos/instantanea";
import { huella } from "@/lib/investigador/huella";
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
 * El PLAN del caso sembrado (S5, D-S5-10): un borrador con los tres estados que el plan real no tiene y que la pantalla
 * debe mostrar: un CICLO (el catálogo pide la protección y la protección pide el catálogo, y lo que cuelga del catálogo
 * queda sin onda), una ACCIÓN ALTA SIN MITIGACIÓN (bloquea la aprobación) y SUPUESTOS CRÍTICOS SIN PROBAR. Cada opción cita
 * la evidencia aprobada de su plataforma en la base sembrada. Las plataformas que el caso evalúa son las que su restricción
 * no elimina (Ejemplo, Norte y Sur).
 */
export function escribirPlanFuturo(dir: string): void {
  const raiz = join(dir, "casos", "hospital-futuro", "plan");
  for (const d of ["decisiones", "modos-de-falla", "supuestos"]) mkdirSync(join(raiz, d), { recursive: true });
  const evaluables = ["norte", "plataforma-ejemplo", "sur"];
  const opciones = (crit: string) =>
    evaluables.map((p) => ({
      plataforma_id: p,
      texto: t(`${NOMBRES[p]![0]} resuelve «${crit}» como lo describe su documentación ficticia.`, `${NOMBRES[p]![1]} covers “${crit}” as its fictional documentation describes.`),
      citas: [{ evidencia_id: `evi-${p}-${crit}` }],
    }));
  const decision = (id: string, pregunta: [string, string], crit: string, reversibilidad: string, depende_de: string[], implicita: boolean, estado: string) =>
    escribir(join(raiz, "decisiones", `${id}.yaml`), {
      id,
      pregunta: t(...pregunta),
      ...(CAPACIDAD[`crit-${crit}`] ? {} : { criterio_id: `crit-${crit}` }),
      ...(CAPACIDAD[`crit-${crit}`] ? { capacidad_id: CAPACIDAD[`crit-${crit}`] } : {}),
      reversibilidad,
      razon_reversibilidad: t("Revertirla obliga a rehacer lo que depende de ella.", "Reversing it means redoing what depends on it."),
      depende_de,
      implicita,
      estado,
      opciones_por_plataforma: opciones(crit),
    });
  decision("dec-identidad", ["¿Cómo se relaciona con el directorio del grupo?", "How does it relate to the group directory?"], "ecosistema", "una_via", [], true, "esperando-prueba");
  decision("dec-catalogo", ["¿Cómo se organiza el catálogo?", "How is the catalog organised?"], "gobierno", "una_via", ["dec-proteccion"], false, "pendiente");
  decision("dec-proteccion", ["¿Cómo se protegen los datos clínicos?", "How is clinical data protected?"], "gobierno", "una_via", ["dec-catalogo"], false, "pendiente");
  decision("dec-ingesta", ["¿Cómo se traen los cambios del origen?", "How are changes brought in from the source?"], "ingesta", "costosa", ["dec-identidad"], false, "esperando-prueba");
  decision("dec-consumo", ["¿Se sigue con la herramienta de tableros del grupo?", "Does it stay with the group's dashboard tool?"], "consumo", "costosa", ["dec-catalogo"], true, "pendiente");
  const modo = (id: string, decision_id: string, s: number, o: number, d: number, mitigaciones: unknown[], extra: Record<string, unknown> = {}) =>
    escribir(join(raiz, "modos-de-falla", `${id}.yaml`), {
      id,
      decision_id,
      modo: t("Algo sale mal con esta decisión", "Something goes wrong with this decision"),
      efecto: t("Retrabajo de meses.", "Months of rework."),
      causa: t("Se decidió sin probarla.", "It was decided without testing it."),
      severidad: s,
      ocurrencia: o,
      deteccion: d,
      ...extra,
      origen: "propuesto-por-agente",
      razon: t("Los números de la base sembrada son de prueba.", "The seeded base numbers are for testing."),
      mitigaciones,
    });
  // Alta (S9 O4 D6, control legal) y SIN mitigación: bloquea la aprobación.
  modo("rie-fuga", "dec-proteccion", 9, 4, 6, [], { control_legal: true });
  modo("rie-ingesta", "dec-ingesta", 7, 5, 5, [{ accion: t("Conciliar cada carga contra el origen.", "Reconcile every load against the source."), responsable: t("Equipo de datos", "Data team"), momento: "durante", efecto: { deteccion: 2 } }]);
  const supuesto = (id: string, crit: string, estado: string, decisiones: string[], vence?: string) =>
    escribir(join(raiz, "supuestos", `${id}.yaml`), {
      id,
      enunciado: t(`El supuesto ${id} se cumple.`, `Assumption ${id} holds.`),
      criticidad: crit,
      prueba_barata: t("Probarlo una vez con datos ficticios.", "Test it once with fictitious data."),
      responsable: t("Equipo del caso", "Case team"),
      costo_prueba: "gratis",
      estado,
      ...(vence ? { vence } : {}),
      decisiones,
      origen: "propuesto-por-agente",
    });
  supuesto("sup-directorio", "alta", "sin_probar", ["dec-identidad"], "2026-10-15");
  supuesto("sup-origen", "alta", "sin_probar", ["dec-ingesta"], "2026-09-20");
  supuesto("sup-tableros", "media", "confirmado", ["dec-consumo"]);
  escribir(join(raiz, "plan.yaml"), { caso_id: "hospital-futuro", estado_aprobacion: "borrador" });
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
  // La revisión de cada plataforma: la huella de cada evidencia, como la escribe la aprobación (D-S3-10, AU-S3-01).
  mkdirSync(join(dir, "revisiones", "evidencias"), { recursive: true });
  for (const p of Object.keys(PUNTAJES)) {
    const evidencias = readdirSync(join(dir, "evidencias", p))
      .sort()
      .map((f) => parse(readFileSync(join(dir, "evidencias", p, f), "utf8")) as { id: string })
      .map((e) => ({ id: e.id, huella: huella(e) }));
    const linea = { fecha: "2026-09-21", propuesta: `propuestas/2026-09-20-${p}-evidencias`, aprobadas: evidencias.map((_, i) => `A-${i + 1}`), rechazadas: [], evidencias };
    writeFileSync(join(dir, "revisiones", "evidencias", `${p}.jsonl`), `${JSON.stringify(linea)}\n`);
  }
  const inst = nuevaInstantanea(cargarConocimiento(dir), FECHA_INSTANTANEA, []);
  mkdirSync(join(dir, "instantaneas"));
  writeFileSync(join(dir, "instantaneas", `${inst.version}.json`), `${JSON.stringify(inst, null, 2)}\n`);
  mkdirSync(join(dir, "casos"));
  const caso = casoFuturo(inst.version);
  escribir(join(dir, "casos", "hospital-futuro.yaml"), caso);
  // La revisión del perfil, como la escribe el comando de aprobación (S4): sin ella el perfil aprobado no carga en el build.
  mkdirSync(join(dir, "revisiones", "casos"), { recursive: true });
  const sello = caso.aprobacion!;
  writeFileSync(join(dir, "revisiones", "casos", "hospital-futuro.jsonl"), `${JSON.stringify({ fecha: sello.fecha, caso: caso.id, desde: sello.huella, huella: sello.huella })}\n`);
  escribirPlanFuturo(dir);
  return inst.version;
}
