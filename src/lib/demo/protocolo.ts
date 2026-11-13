// Importa los módulos del núcleo uno por uno (no el índice): el paquete público lleva solo lo que evalúa.
import { canonicoEstricto } from "@/engine/canonico";
import { evaluar } from "@/engine/evaluar";
import type { Entrada, Veredicto } from "@/engine/tipos";

// S10 (F2): el contrato Worker ↔ página de la demo (regla 19). `atenderDemo` es PURA salvo por la huella, que la calcula quien
// la llama: el Worker con `crypto.subtle` y el script del fixture (scripts/demo/fixture-worker.mjs) con `node:crypto`. Los dos
// emiten los mismos mensajes; Vitest valida el fixture con Zod (src/lib/demo/contrato.ts) y la página los lee con `esRespuesta`.

export type PeticionDemo = { tipo: "evaluar"; id: number; entrada: Entrada };

export type FilaDemo = {
  plataforma_id: string;
  posicion: number;
  unidades: number;
};

export type RespuestaDemo =
  | {
      tipo: "evaluado";
      id: number;
      /** SHA-256 del JSON canónico (RFC 8785) del resultado ENTERO del núcleo. */
      huella: string;
      /** El orden en que llegaron las plataformas (para mostrar que la prueba de neutralidad sí las reordenó). */
      recibido: string[];
      max: number;
      filas: FilaDemo[];
      veredicto: Veredicto;
    }
  | { tipo: "no-evaluable"; id: number; motivos: string[] }
  | { tipo: "error"; id: number; mensaje: string };

export type Sha256 = (texto: string) => Promise<string>;

export async function atenderDemo(
  p: PeticionDemo,
  sha256: Sha256,
): Promise<RespuestaDemo> {
  try {
    const r = evaluar(p.entrada);
    if (r.tipo === "no-evaluable")
      return {
        tipo: "no-evaluable",
        id: p.id,
        motivos: r.motivos.map((m) => m.motivo),
      };
    return {
      tipo: "evaluado",
      id: p.id,
      huella: await sha256(canonicoEstricto(r)),
      recibido: p.entrada.base.plataformas.map((x) => x.id),
      max: p.entrada.base.escala.max,
      filas: r.orden.map((o) => ({
        plataforma_id: o.plataforma_id,
        posicion: o.posicion,
        unidades: o.unidades,
      })),
      veredicto: r.veredicto,
    };
  } catch (e) {
    return {
      tipo: "error",
      id: p.id,
      mensaje: e instanceof Error ? e.message : String(e),
    };
  }
}

const esEntero = (x: unknown): x is number =>
  typeof x === "number" && Number.isSafeInteger(x);
const esTextos = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((s) => typeof s === "string");

/** La guarda de la página (sin Zod en el navegador): solo lo que tiene la forma del contrato pasa. */
export function esRespuesta(x: unknown): x is RespuestaDemo {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  if (!esEntero(m.id)) return false;
  if (m.tipo === "error") return typeof m.mensaje === "string";
  if (m.tipo === "no-evaluable") return esTextos(m.motivos);
  if (m.tipo !== "evaluado") return false;
  const v = m.veredicto as Record<string, unknown> | undefined;
  return (
    typeof m.huella === "string" &&
    /^[0-9a-f]{64}$/.test(m.huella) &&
    esTextos(m.recibido) &&
    esEntero(m.max) &&
    Array.isArray(m.filas) &&
    m.filas.every(
      (f: Record<string, unknown>) =>
        typeof f?.plataforma_id === "string" &&
        esEntero(f.posicion) &&
        esEntero(f.unidades),
    ) &&
    !!v &&
    (v.tipo === "unica" ||
      v.tipo === "ganadora-clara" ||
      v.tipo === "empate-tecnico")
  );
}
