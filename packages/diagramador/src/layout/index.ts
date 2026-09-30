// `layout(map, grammar, view, options)` (CONTRATO § 8): geometría pura e independiente del idioma.
// Supone un mapa ya validado (G14: sin dato válido no hay dibujo; la app valida antes de disponer).
import type { Gramatica, Mapa } from "../tipos";
import { bloque } from "./bloque";
import { carriles } from "./carriles";
import { contexto } from "./contexto";
import { nivel1 } from "./nivel1";
import { nivel2 } from "./nivel2";
import type { Geometria, OpcionesLayout, Vista } from "./tipos";

export function layout(map: Mapa, grammar: Gramatica, view: Vista, options: OpcionesLayout): Geometria {
  const ctx = contexto(map, grammar, options);
  if (view === "bloque") return bloque(ctx, options.grupo);
  if (ctx.carriles.length > 0) return carriles(ctx, view === "nivel-1" ? 1 : 2, view === "recorrido" ? (options.recorrido ?? true) : undefined);
  switch (view) {
    case "nivel-1":
      return nivel1(ctx);
    case "nivel-2":
      return nivel2(ctx, undefined);
    case "recorrido":
      return nivel2(ctx, options.recorrido ?? true);
  }
}
