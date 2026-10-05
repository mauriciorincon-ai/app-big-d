import { createHash } from "node:crypto";
import { canonicoEstricto, type Entrada } from "@/engine";
import type { Caso, ContenidoInstantanea, Evidencia, Instantanea } from "./conocimiento";
import { VERSION_INSTANTANEA } from "./conocimiento";
import type { Plataforma } from "./esquemas";

// Instantáneas de conocimiento (RF-01.4, D-S3-13) y la huella del caso. Una instantánea CONGELA la base aprobada en
// un archivo que se basta solo: el caso la evalúa a ella, no a la base viva, y cualquiera reproduce el cálculo. La
// huella es SHA-256 del JSON canónico estricto (RFC 8785) del contenido ya validado: semántica, no de bytes (un
// comentario no la cambia; un dato sí). Crearla es una derivación del dato aprobado, no una aprobación.

export const sha256 = (texto: string): string => createHash("sha256").update(texto, "utf8").digest("hex");
export const huellaDe = (valor: unknown): string => sha256(canonicoEstricto(valor));

const porId = <T extends { id: string }>(xs: readonly T[]) => [...xs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export interface Base {
  plataformas: Plataforma[];
  capacidades: ContenidoInstantanea["capacidades"];
  criterios: ContenidoInstantanea["criterios"];
  escalas: ContenidoInstantanea["escalas"];
  convenciones: ContenidoInstantanea["convenciones"];
  evidencias: Evidencia[];
}

/** El contenido que se congela: todo ordenado por id y solo las evidencias aprobadas (RF-01.3). */
export function contenidoDe(b: Base): ContenidoInstantanea {
  return {
    plataformas: porId(b.plataformas).map(({ id, nombre, ficticia }) => ({ id, nombre, ficticia })),
    capacidades: porId(b.capacidades),
    criterios: porId(b.criterios),
    escalas: porId(b.escalas),
    convenciones: b.convenciones,
    evidencias: porId(b.evidencias.filter((e) => e.estado_aprobacion === "aprobada")),
  };
}

/** Las evidencias nuevas, modificadas y retiradas de `actual` frente a `anterior` (todas nuevas si no hay anterior). */
export function cambiosEntre(anterior: ContenidoInstantanea | null, actual: ContenidoInstantanea): Instantanea["cambios"] {
  const antes = new Map((anterior?.evidencias ?? []).map((e) => [e.id, huellaDe(e)]));
  const ahora = new Map(actual.evidencias.map((e) => [e.id, huellaDe(e)]));
  const ids = [...new Set([...antes.keys(), ...ahora.keys()])].sort();
  return ids.flatMap((id): Instantanea["cambios"] => {
    if (!antes.has(id)) return [{ evidencia_id: id, tipo: "nueva" }];
    if (!ahora.has(id)) return [{ evidencia_id: id, tipo: "retirada" }];
    return antes.get(id) === ahora.get(id) ? [] : [{ evidencia_id: id, tipo: "modificada" }];
  });
}

/** Orden de versiones `AAAA-MM-DD.N`: por fecha y luego por el ordinal del día. */
export function compararInstantanea(a: string, b: string): number {
  const [, fa, na] = VERSION_INSTANTANEA.exec(a)!;
  const [, fb, nb] = VERSION_INSTANTANEA.exec(b)!;
  return fa! < fb! ? -1 : fa! > fb! ? 1 : Number(na) - Number(nb);
}

/** La instantánea que sigue a las existentes, con la fecha dada (una entrada: nada lee el reloj aquí). */
export function nuevaInstantanea(b: Base, fecha: string, existentes: readonly Instantanea[]): Instantanea {
  const ordenadas = [...existentes].sort((x, y) => compararInstantanea(x.version, y.version));
  const ultima = ordenadas.at(-1) ?? null;
  if (ultima && ultima.fecha > fecha) throw new Error(`la última instantánea (${ultima.version}) es posterior a ${fecha}`);
  const delDia = ordenadas.filter((x) => x.fecha === fecha).length;
  const contenido = contenidoDe(b);
  return { version: `${fecha}.${delDia + 1}`, fecha, huella: huellaDe(contenido), anterior: ultima?.version ?? null, cambios: cambiosEntre(ultima?.contenido ?? null, contenido), contenido };
}

/** La huella del perfil del caso, sin su sello ni su estado: la que el comando de aprobación escribe y el cargador comprueba. */
export function huellaCaso(c: Caso): string {
  const { aprobacion: _a, estado_aprobacion: _e, ...perfil } = c;
  void _a;
  void _e;
  return huellaDe(perfil);
}

/** La entrada del núcleo: el caso y la base congelada en su instantánea. */
export function entradaDe(caso: Caso, inst: Instantanea): Entrada {
  const c = inst.contenido;
  const escalas = new Set(c.criterios.map((x) => x.escala_id));
  const escala = c.escalas.find((e) => escalas.has(e.id));
  if (!escala || escalas.size !== 1) throw new Error(`la instantánea ${inst.version} no tiene una sola escala para todos sus criterios`);
  return {
    caso: {
      id: caso.id,
      estado: caso.estado_aprobacion,
      acepta_vista_previa: caso.acepta_vista_previa,
      fecha_evaluacion: caso.fecha_evaluacion,
      pesos: caso.criterios.map((x) => ({ criterio_id: x.criterio_id, peso: x.peso_centesimas, esencial: x.esencial, rango_pct: x.rango_relativo_pct })),
      restricciones: caso.restricciones.map((r) => ({ id: r.id, elimina: r.elimina.map((x) => x.plataforma_id) })),
    },
    base: {
      instantanea: { version: inst.version, huella: inst.huella },
      plataformas: c.plataformas.map((p) => ({ id: p.id })),
      criterios: c.criterios.map((x) => ({ id: x.id, tipo: x.tipo, ...(x.capacidad_id ? { capacidad_id: x.capacidad_id } : {}) })),
      evidencias: c.evidencias.map((e) => ({
        id: e.id,
        plataforma_id: e.plataforma_id,
        ...(e.capacidad_id ? { capacidad_id: e.capacidad_id } : { criterio_id: e.criterio_id! }),
        puntaje: e.puntaje,
        madurez: e.madurez,
        esencial: e.esencial,
        estado: e.estado_aprobacion,
        fecha_verificacion: e.fecha_verificacion,
      })),
      escala: { max: escala.niveles.at(-1)!.valor, topes: escala.tope_por_madurez },
      convenciones: { umbral_empate_centesimas: c.convenciones.umbral_empate_centesimas, vigencia: c.convenciones.vigencia, pros_contras: c.convenciones.pros_contras, sensibilidad: c.convenciones.sensibilidad },
    },
  };
}
