import { CONTRATO_VERSION } from "diagramador";

// Migración del dato entre versiones del contrato del diagramador, EN MEMORIA (D-S2-01 del S2; ADR
// `map-versioning`). V1 exige la misma versión menor que el motor, y un mapa aprobado no se corrige a mano:
// su archivo y su huella quedan como los aprobó la persona. Al cargarlo, el documento sube de versión solo por
// la cadena de saltos que el contrato declara compatibles con el dato; la validación de la versión nueva decide lo
// demás (lo que la versión nueva rechaza, como un paso que se sigue a sí mismo en 0.4.0, sigue siendo error).

/** Saltos declarados por el CHANGELOG del contrato: menor de origen → menor de destino. */
const COMPATIBLES: Readonly<Record<string, string>> = {
  // [0.4.0] «MINOR de dato: ningún mapa ni gramática válidos de 0.3.0 se vuelven inválidos», salvo los pasos
  // que se siguen a sí mismos o a uno posterior y los flujos de un nodo a sí mismo, que V4 y V5 rechazan.
  "0.3": "0.4",
};

const menor = (v: string) => v.split(".").slice(0, 2).join(".");

/**
 * Sube el documento por la CADENA de saltos declarados hasta `destino` (0.3 → 0.4 → 0.5…): una versión archivada con
 * un contrato viejo sigue cargando cuando el motor sube otra vez. Si la cadena no llega, lo deja igual (V1 lo nombrará).
 */
export function migrar<T>(dato: T, compatibles: Readonly<Record<string, string>>, destino: string): T {
  const v = (dato as { contrato_version?: unknown } | null)?.contrato_version;
  if (typeof v !== "string" || menor(v) === menor(destino)) return dato;
  let m = menor(v);
  // A lo sumo un salto por entrada declarada: una cadena con un ciclo no da vueltas para siempre.
  for (let i = 0; i < Object.keys(compatibles).length && m !== menor(destino); i++) {
    const sig = compatibles[m];
    if (sig === undefined) return dato;
    m = sig;
  }
  return m === menor(destino) ? ({ ...(dato as object), contrato_version: destino } as T) : dato;
}

/** ¿De qué versión viene el documento, si hubo que migrarlo? `undefined` si ya estaba en la del motor o no hay cadena. */
export function migradoDesde(dato: unknown): string | undefined {
  return migrar(dato, COMPATIBLES, CONTRATO_VERSION) === dato ? undefined : (dato as { contrato_version: string }).contrato_version;
}

/** El documento en la versión del motor, si la cadena de saltos llega; si no, el mismo documento (V1 lo nombrará). */
export function migrarContrato<T>(dato: T): T {
  return migrar(dato, COMPATIBLES, CONTRATO_VERSION);
}
