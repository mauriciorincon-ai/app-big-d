import type { Respuesta } from "@/engine/protocolo";

// La guarda con que la UI lee un mensaje del Worker (D-S3-08): estructural y pequeña, sin Zod (en el navegador Zod prueba
// `new Function` y dispara la CSP). El tipo viene del núcleo con `import type`; el esquema Zod que valida el fixture
// vive en contrato-worker.ts y solo lo usan las pruebas.

const entero = (x: unknown): x is number => Number.isSafeInteger(x);
const lista = (x: unknown): x is unknown[] => Array.isArray(x);
const objeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

const texto = (x: unknown): x is string => typeof x === "string";
const clase = (x: unknown) => x === null || x === "robusta" || x === "moderada" || x === "fragil";
const estado = (x: unknown) => x === "completa" || x === "tope-de-intentos";

/** Una semilla con TODOS los campos que la pantalla lee (AU-S3-07): una malformada no llega a `BigInt(NaN)` en el render. */
const semillaValida = (s: unknown): boolean =>
  objeto(s) &&
  entero(s.semilla) &&
  estado(s.estado) &&
  entero(s.aceptadas) &&
  entero(s.intentos) &&
  lista(s.aceptabilidad) &&
  s.aceptabilidad.every((f) => lista(f) && f.every(entero)) &&
  lista(s.central) &&
  s.central.every((c) => c === null || (lista(c) && c.every(entero))) &&
  entero(s.cerca) &&
  clase(s.clase) &&
  typeof s.zona_gris === "boolean" &&
  (s.semiamplitud_centesimas === null || entero(s.semiamplitud_centesimas));

export function esRespuesta(x: unknown): x is Respuesta {
  if (!objeto(x) || !entero(x.id)) return false;
  if (x.tipo === "progreso") return [x.semilla, x.indice, x.semillas, x.aceptadas, x.objetivo, x.intentos].every(entero);
  if (x.tipo === "error") return typeof x.mensaje === "string";
  if (x.tipo !== "resultado" || !objeto(x.resultado)) return false;
  const r = x.resultado;
  return (
    estado(r.estado) &&
    lista(r.plataformas) &&
    r.plataformas.every(texto) &&
    lista(r.criterios) &&
    r.criterios.every(texto) &&
    entero(r.L) &&
    entero(r.objetivo) &&
    (r.ganadora === null || texto(r.ganadora)) &&
    lista(r.semillas) &&
    r.semillas.every(semillaValida) &&
    clase(r.clase) &&
    typeof r.estable === "boolean" &&
    typeof r.frontera === "boolean"
  );
}
