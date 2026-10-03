// `layout(map, grammar, view, options)` (CONTRATO § 8): geometría pura e independiente del idioma.
// Supone un mapa ya validado (G14: sin dato válido no hay dibujo; la app valida antes de disponer).
import type { Gramatica, Mapa } from "../tipos";
import { bloque } from "./bloque";
import { carriles } from "./carriles";
import { avisar, contexto, type Contexto } from "./contexto";
import { crossings, lejanas, pegados, puntas } from "./d11";
import { nivel1 } from "./nivel1";
import { nivel2 } from "./nivel2";
import type { Geometria, OpcionesLayout, Vista } from "./tipos";
import { fmt } from "../util/numeros";

export function layout(map: Mapa, grammar: Gramatica, view: Vista, options: OpcionesLayout): Geometria {
  const ctx = contexto(map, grammar, options, view);
  const geo = disponer(ctx, view, options);
  // Las comprobaciones de § 5.6 sobre la geometría terminada, como avisos (M-1 de la auditoría del S1): quien solo
  // mira los avisos —el build de la app, el validador del investigador, la aprobación— las ve sin llamar a nada más.
  geo.cruces = crossings(geo);
  for (const c of geo.cruces) avisar(ctx, "D11", c.flujo, `${c.flujo} atraviesa la caja de ${c.caja}`);
  // El aire de las pistas (pasada de capturas del S1): un tramo vertical a menos de 5 u de una tarjeta a su lado.
  for (const p of pegados(geo)) avisar(ctx, "pistas", p.flujo, `${p.flujo} corre a ${fmt(p.distancia)} u del borde de ${p.caja}`);
  // P13: ninguna pista ajena bajo la punta de una flecha de llegada (el ruteo lo repara; si no puede, se dice).
  for (const p of puntas(geo)) avisar(ctx, "pistas", p.pista, `${p.pista} corre bajo la punta de ${p.flujo}`);
  for (const e of lejanas(geo)) avisar(ctx, "etiqueta", e.flujo, `${e.flujo} a ${fmt(e.distancia)} u de su trazo`);
  geo.avisos = ctx.avisos;
  return geo;
}

function disponer(ctx: Contexto, view: Vista, options: OpcionesLayout): Geometria {
  if (view === "bloque") return bloque(ctx, options.group);
  if (ctx.carriles.length > 0) return carriles(ctx, view === "nivel1" ? 1 : 2, view === "recorrido" ? (options.recorrido ?? true) : undefined);
  switch (view) {
    case "nivel1":
      return nivel1(ctx);
    case "nivel2":
      return nivel2(ctx, undefined);
    case "recorrido":
      return nivel2(ctx, options.recorrido ?? true);
  }
}
