// Informe de validación (CONTRATO § 7): cada entrada `{ doc, fase, regla, ruta, id, idioma?, mensaje }`,
// ordenado por `(doc, ruta, regla)` por unidades de código. D-S1-02: el informe separa errores (bloquean),
// alertas (V9, V10: no bloquean) y avisos (lo que no corrió y por qué, p. ej. V15 sin cobertura).
import { compararCodigo } from "../util/orden";

export type Documento = "gramatica" | "mapa";

export interface Entrada {
  doc: Documento;
  fase: 1 | 2;
  regla: string;
  ruta: string;
  id: string;
  idioma?: string;
  mensaje: string;
}

export interface Informe {
  /** true si no hay errores (las alertas no bloquean). */
  ok: boolean;
  errores: Entrada[];
  alertas: Entrada[];
  avisos: Entrada[];
}

export function ordenar(entradas: Entrada[]): Entrada[] {
  return [...entradas].sort(
    (a, b) =>
      compararCodigo(a.doc, b.doc) ||
      compararCodigo(a.ruta, b.ruta) ||
      compararCodigo(a.regla, b.regla) ||
      compararCodigo(a.id, b.id) ||
      compararCodigo(a.idioma ?? "", b.idioma ?? "") ||
      compararCodigo(a.mensaje, b.mensaje),
  );
}

export function informe(errores: Entrada[], alertas: Entrada[] = [], avisos: Entrada[] = []): Informe {
  return { ok: errores.length === 0, errores: ordenar(errores), alertas: ordenar(alertas), avisos: ordenar(avisos) };
}

/** Escapa un segmento de JSON Pointer (RFC 6901). */
export const segmento = (s: string | number): string => String(s).replace(/~/g, "~0").replace(/\//g, "~1");
export const ruta = (...segmentos: (string | number)[]): string => segmentos.map((s) => `/${segmento(s)}`).join("");
