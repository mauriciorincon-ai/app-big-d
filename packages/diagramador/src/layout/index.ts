// `layout(map, grammar, view, options)` (CONTRATO § 8): geometría pura e independiente del idioma.
// Supone un mapa ya validado (G14: sin dato válido no hay dibujo; la app valida antes de disponer).
import type { Gramatica, Mapa } from "../tipos";
import { bloque } from "./bloque";
import { carriles } from "./carriles";
import { contexto } from "./contexto";
import { crossings, pegados } from "./d11";
import { nivel1 } from "./nivel1";
import { nivel2 } from "./nivel2";
import type { Geometria, OpcionesLayout, Vista } from "./tipos";
import { fmt } from "../util/numeros";

export function layout(map: Mapa, grammar: Gramatica, view: Vista, options: OpcionesLayout): Geometria {
  const geo = disponer(map, grammar, view, options);
  // D11 también como aviso (M-1 de la auditoría del S1): quien solo mira los avisos —el build de la app, el
  // validador del investigador, la aprobación— ve el cruce sin tener que llamar a `crossings`.
  for (const c of crossings(geo)) geo.avisos.push(`D11: ${c.flujo} atraviesa la caja de ${c.caja}`);
  // Y el aire de las pistas (pasada de capturas del S1): un tramo vertical a menos de 5 u de una tarjeta a su lado.
  for (const p of pegados(geo)) geo.avisos.push(`pistas: ${p.flujo} corre a ${fmt(p.distancia)} u del borde de ${p.caja}`);
  return geo;
}

function disponer(map: Mapa, grammar: Gramatica, view: Vista, options: OpcionesLayout): Geometria {
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
