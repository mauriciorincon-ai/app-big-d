// Fase 1 de la validación (CONTRATO § 7): la forma, con el validador standalone generado de los JSON
// Schema. Cada error de Ajv se traduce a la regla del contrato que cubre ese campo y al id del elemento
// que lo contiene (C04, C05 y C14 se detectan aquí, por V3 y con el id del nodo).
import type { Entrada } from "./informe";
import { ruta as rutaDe } from "./informe";
import { validarGramaticaEsquema, validarMapaEsquema, type ErrorEsquema } from "./esquemas.generado.js";

type Registro = Record<string, unknown>;

const segmentos = (puntero: string): string[] =>
  puntero === "" ? [] : puntero.slice(1).split("/").map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));

const idEn = (lista: unknown, i: string | undefined): string | undefined => {
  if (!Array.isArray(lista) || i === undefined) return undefined;
  const e = lista[Number(i)] as Registro | undefined;
  return typeof e?.id === "string" ? e.id : undefined;
};

function mensaje(e: ErrorEsquema): string {
  const p = e.params;
  switch (e.keyword) {
    case "required":
      return `falta el campo «${String(p.missingProperty)}»`;
    case "additionalProperties":
      return `campo no permitido «${String(p.additionalProperty)}»`;
    case "type":
      return `debe ser de tipo ${String(p.type)}`;
    case "pattern":
      return `no cumple el patrón ${String(p.pattern)}`;
    case "enum":
      return `debe ser uno de: ${(p.allowedValues as unknown[]).map(String).join(", ")}`;
    case "minItems":
      return `debe tener al menos ${String(p.limit)} elemento(s)`;
    case "minLength":
      return `no puede estar vacío`;
    case "maxLength":
      return `admite como máximo ${String(p.limit)} caracteres`;
    case "minProperties":
      return `debe traer al menos ${String(p.limit)} idioma(s)`;
    case "propertyNames":
      return `clave no válida «${String(p.propertyName)}»`;
    case "minimum":
    case "maximum":
      return `fuera de rango (${e.keyword === "minimum" ? "mínimo" : "máximo"} ${String(p.limit)})`;
    case "uniqueItems":
      return `tiene elementos repetidos`;
    case "const":
      return `debe ser ${JSON.stringify(p.allowedValue)}`;
    case "anyOf":
      return `no cumple ninguna de las formas admitidas`;
    default:
      return `${e.keyword}: ${e.message ?? "no cumple el esquema"}`;
  }
}

/** Ruta del error: la del campo que falta cuando es `required`, la de la instancia en los demás casos. */
function rutaDelError(e: ErrorEsquema): string[] {
  const s = segmentos(e.instancePath);
  if (e.keyword === "required") s.push(String(e.params.missingProperty));
  if (e.keyword === "additionalProperties") s.push(String(e.params.additionalProperty));
  return s;
}

function reglaMapa(s: string[], e: ErrorEsquema, mapa: Registro): { regla: string; id: string } {
  const sujeto = typeof mapa.sujeto_id === "string" ? mapa.sujeto_id : "mapa";
  const [raiz, i, sub, j, campo] = s;
  const coleccion = raiz === "nodos" || raiz === "bloques" || raiz === "flujos" || raiz === "recorridos";
  if (coleccion && s.length === 1) return { regla: e.keyword === "type" ? "V6" : e.keyword === "minItems" ? "V3" : "V1", id: sujeto };
  if (raiz === "nodos" || raiz === "bloques") return { regla: "V3", id: idEn(mapa[raiz], i) ?? `${raiz}/${i}` };
  if (raiz === "flujos") return { regla: sub === "condicion" ? "V13" : "V4", id: idEn(mapa.flujos, i) ?? `flujos/${i}` };
  if (raiz === "recorridos") {
    const rec = idEn(mapa.recorridos, i) ?? `recorridos/${i}`;
    if (sub === "pasos" && j !== undefined) {
      const pasos = (Array.isArray(mapa.recorridos) ? (mapa.recorridos[Number(i)] as Registro | undefined)?.pasos : undefined) ?? [];
      return { regla: campo === "bifurca" ? "V12" : "V5", id: `${rec}/${idEn(pasos, j) ?? `pasos/${j}`}` };
    }
    if (sub === "pasos" && e.keyword === "type") return { regla: "V6", id: rec };
    return { regla: "V5", id: rec };
  }
  if (raiz === "glosario") return { regla: "V14", id: sujeto };
  // § 7 (0.4.0): el `enum` de `estado` es V8, la regla que mira el estado del mapa.
  if (raiz === "estado" && e.keyword === "enum") return { regla: "V8", id: sujeto };
  return { regla: "V1", id: sujeto };
}

const REGLA_GRAMATICA: Record<string, string> = {
  bandas: "G2",
  tipos_de_nodo: "G2",
  modos_de_flujo: "G2",
  escala_madurez: "G2",
  vigencia: "G6",
  limites: "G6",
  recorrido_referencia: "G5",
  idiomas: "G7",
  idioma_base: "G7",
  terminos_a_explicar: "G7",
};

function reglaGramatica(s: string[], gramatica: Registro): { regla: string; id: string } {
  const propio = typeof gramatica.id === "string" ? gramatica.id : "gramatica";
  const [raiz = "", i] = s;
  const regla = REGLA_GRAMATICA[raiz] ?? "G1";
  return { regla, id: (regla === "G2" ? idEn(gramatica[raiz], i) : undefined) ?? propio };
}

/**
 * Las formas alternativas (`anyOf`, 0.5.0: `fuente` url | código, `condicion` en tres formas): Ajv con `allErrors`
 * reporta el `anyOf` y los errores de CADA forma, y una fuente sin título daba cinco entradas. Se queda la forma más
 * cercana —la de menos errores; empate, la primera declarada— y se descartan las demás y el `anyOf` mismo.
 */
export function formaMasCercana(errores: ErrorEsquema[]): ErrorEsquema[] {
  let lista = errores;
  for (const alt of errores.filter((e) => e.keyword === "anyOf")) {
    const prefijo = `${alt.schemaPath}/`;
    const deRama = (e: ErrorEsquema) => (e.schemaPath.startsWith(prefijo) && e.instancePath.startsWith(alt.instancePath) ? Number(e.schemaPath.slice(prefijo.length).split("/")[0]) : -1);
    const porRama = new Map<number, number>();
    for (const e of lista) {
      const r = deRama(e);
      if (r >= 0) porRama.set(r, (porRama.get(r) ?? 0) + 1);
    }
    if (porRama.size === 0) continue;
    const elegida = [...porRama.entries()].sort((a, b) => a[1] - b[1] || a[0] - b[0])[0]![0];
    lista = lista.filter((e) => e !== alt && (deRama(e) < 0 || deRama(e) === elegida));
  }
  return lista;
}

function traducir(errores: ErrorEsquema[] | null | undefined, doc: "gramatica" | "mapa", datos: unknown): Entrada[] {
  const registro = (typeof datos === "object" && datos !== null ? datos : {}) as Registro;
  return formaMasCercana(errores ?? []).map((e) => {
    const s = rutaDelError(e);
    const { regla, id } = doc === "mapa" ? reglaMapa(s, e, registro) : reglaGramatica(s, registro);
    return { doc, fase: 1, regla, ruta: rutaDe(...s), id, mensaje: mensaje(e) };
  });
}

export function esquemaGramatica(gramatica: unknown): Entrada[] {
  return validarGramaticaEsquema(gramatica) ? [] : traducir(validarGramaticaEsquema.errors, "gramatica", gramatica);
}

export function esquemaMapa(mapa: unknown): Entrada[] {
  return validarMapaEsquema(mapa) ? [] : traducir(validarMapaEsquema.errors, "mapa", mapa);
}
