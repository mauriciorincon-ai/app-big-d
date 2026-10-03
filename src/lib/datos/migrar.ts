import { CONTRATO_VERSION } from "diagramador";

// Migración del dato entre versiones del contrato del diagramador, EN MEMORIA (D-S2-01 del S2; ADR
// `map-versioning`). V1 exige la misma versión menor que el motor, y un mapa aprobado no se corrige a mano:
// su archivo y su huella quedan como los aprobó la persona. Al cargarlo, el documento sube de versión solo por
// los saltos que el contrato declara compatibles con el dato; la validación de la versión nueva decide lo
// demás (lo que la versión nueva rechaza, como un paso que se sigue a sí mismo en 0.4.0, sigue siendo error).

/** Saltos declarados por el CHANGELOG del contrato: menor de origen → menor de destino. */
const COMPATIBLES: Readonly<Record<string, string>> = {
  // [0.4.0] «MINOR de dato: ningún mapa ni gramática válidos de 0.3.0 se vuelven inválidos», salvo los pasos
  // que se siguen a sí mismos o a uno posterior y los flujos de un nodo a sí mismo, que V4 y V5 rechazan.
  "0.3": "0.4",
};

const menor = (v: string) => v.split(".").slice(0, 2).join(".");

/** ¿De qué versión viene el documento, si hubo que migrarlo? `undefined` si ya estaba en la del motor. */
export function migradoDesde(dato: unknown): string | undefined {
  const v = (dato as { contrato_version?: unknown } | null)?.contrato_version;
  return typeof v === "string" && COMPATIBLES[menor(v)] === menor(CONTRATO_VERSION) ? v : undefined;
}

/** El documento en la versión del motor, si el salto es compatible; si no, el mismo documento (V1 lo nombrará). */
export function migrarContrato<T>(dato: T): T {
  if (migradoDesde(dato) === undefined) return dato;
  return { ...(dato as object), contrato_version: CONTRATO_VERSION } as T;
}
