// El instrumento (C15, RF-09): el resultado de validar la herramienta ANTES de publicarla. Puro: solo los tipos de la
// validación y el veredicto («detectados k de n»); quien la corre es scripts/instrumento/validar.mjs, que usa los casos de
// referencia, las propiedades y los sembrados de src/lib/instrumento/. Sin reloj: el resultado no lleva hora, así que la misma
// base produce el mismo archivo.

/** Un texto en los dos idiomas (el dato nace `{ es, en }`). */
export interface Bilingue {
  es: string;
  en: string;
}

/** Una fila de la validación: lo que se comprobó, si pasó y, en una línea, esperado y obtenido. */
export interface FilaValidacion {
  id: string;
  descripcion: Bilingue;
  ok: boolean;
  /** Esperado y obtenido, o la razón del fallo; ya en los dos idiomas. */
  detalle: Bilingue;
}

export interface Validacion {
  version: 1;
  /** Qué base se validó: la instantánea de los casos y cuánto trae. */
  base: {
    casos: readonly string[];
    instantaneas: readonly string[];
    evidencias: number;
  };
  /** RF-09.1: casos con la respuesta evidente por construcción. */
  referencias: readonly FilaValidacion[];
  /** RF-09.2: propiedades con semilla. */
  propiedades: readonly (FilaValidacion & {
    corridas: number;
    semilla: number;
  })[];
  /** RF-09.3: errores sembrados a propósito; todos deben detectarse. */
  sembrados: readonly FilaValidacion[];
  /** Lo aprobado es lo que aprobó una persona: evidencias, instantáneas, perfiles de caso y mapas. */
  aprobaciones: readonly FilaValidacion[];
  /** La huella del núcleo que la integración continua compara en cada motor (tests/determinismo/NUCLEO.SHA256SUMS). */
  huellaNucleo: string | null;
}

export interface Conteo {
  ok: number;
  total: number;
}

export const contar = (filas: readonly { ok: boolean }[]): Conteo => ({
  ok: filas.filter((f) => f.ok).length,
  total: filas.length,
});

/** «Detectados k de n»: lo que el instrumento reporta de los sembrados. */
export const sembradosDetectados = (v: Validacion): Conteo =>
  contar(v.sembrados);

/** Se publica solo si cada fila de cada bloque pasó y hay algo que validar: un instrumento vacío no es verde (RF-09.4). */
export function publicable(v: Validacion): boolean {
  const bloques = [v.referencias, v.propiedades, v.sembrados, v.aprobaciones];
  return (
    v.referencias.length > 0 &&
    v.propiedades.length > 0 &&
    v.sembrados.length > 0 &&
    bloques.every((b) => b.every((f) => f.ok))
  );
}

/** Las filas que no pasaron, con el bloque al que pertenecen: lo que el bloqueo de publicación nombra. */
export function falladas(
  v: Validacion,
): {
  bloque: "referencias" | "propiedades" | "sembrados" | "aprobaciones";
  fila: FilaValidacion;
}[] {
  const out: {
    bloque: "referencias" | "propiedades" | "sembrados" | "aprobaciones";
    fila: FilaValidacion;
  }[] = [];
  for (const bloque of [
    "referencias",
    "propiedades",
    "sembrados",
    "aprobaciones",
  ] as const)
    for (const fila of v[bloque]) if (!fila.ok) out.push({ bloque, fila });
  return out;
}
