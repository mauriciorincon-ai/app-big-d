import type { Respuesta } from "@/engine/protocolo";

// La guarda con que la UI lee un mensaje del Worker (D-S3-08): estructural y pequeña, sin Zod (en el navegador Zod prueba
// `new Function` y dispara la CSP). El tipo viene del núcleo con `import type`; el esquema Zod que valida el fixture
// vive en contrato-worker.ts y solo lo usan las pruebas.

const entero = (x: unknown): x is number => Number.isSafeInteger(x);
const lista = (x: unknown): x is unknown[] => Array.isArray(x);
const objeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export function esRespuesta(x: unknown): x is Respuesta {
  if (!objeto(x) || !entero(x.id)) return false;
  if (x.tipo === "progreso") return [x.semilla, x.indice, x.semillas, x.aceptadas, x.objetivo, x.intentos].every(entero);
  if (x.tipo === "error") return typeof x.mensaje === "string";
  if (x.tipo !== "resultado" || !objeto(x.resultado)) return false;
  const r = x.resultado;
  return (
    (r.estado === "completa" || r.estado === "tope-de-intentos") &&
    lista(r.plataformas) &&
    lista(r.criterios) &&
    entero(r.L) &&
    entero(r.objetivo) &&
    lista(r.semillas) &&
    r.semillas.every((s) => objeto(s) && lista(s.aceptabilidad) && s.aceptabilidad.every((f) => lista(f) && f.every(entero)) && lista(s.central) && entero(s.cerca)) &&
    typeof r.estable === "boolean" &&
    typeof r.frontera === "boolean"
  );
}
