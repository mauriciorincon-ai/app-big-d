// Símbolos sueltos en HTML (fuera del lienzo): el glifo de un tipo y el medidor de madurez, con los MISMOS
// paths del diagrama (§ 5.4, D13). Los usan la leyenda y la ficha; el color entra por clase (G13).
import type { Glifo } from "../tipos";
import { GLIFOS } from "./glifos";
import { escapar } from "./serializar";

const svg = (caja: string, w: number, h: number, cuerpo: string) => `<svg class="dg-svg" viewBox="${caja}" width="${w}" height="${h}" aria-hidden="true">${cuerpo}</svg>`;

export function glifoSVG(glifo: Glifo, token: string, lado = 18): string {
  const gl = GLIFOS[glifo];
  const path = gl.trazo ? `<path d="${gl.d}" fill="none" stroke="currentColor" stroke-width="${gl.trazo}"/>` : `<path d="${gl.d}" fill="currentColor"/>`;
  return svg("-9 -9 18 18", lado, lado, `<g class="dg-c-${escapar(token)}">${path}</g>`);
}

/** Medidor por `nivel` (D13): −1 vacío y tachado · 0 vacío discontinuo · 1–4 cuartos llenos. */
export function medidorSVG(nivel: number): string {
  const lleno = nivel > 0 ? Math.floor((2 * 11 * nivel + 4) / 8) : 0;
  let s = `<rect class="${nivel === 0 ? "dg-madurez-caja dg-madurez-anunciado" : "dg-madurez-caja"}" x="-3.5" y="-5.5" width="7" height="11" rx="1.5"/>`;
  if (lleno > 0) s += `<rect class="dg-madurez-nivel" x="-3.5" y="${5.5 - lleno}" width="7" height="${lleno}" rx="1"/>`;
  if (nivel < 0) s += `<path class="dg-madurez-tachado" d="M-3.5,5.5 L3.5,-5.5"/>`;
  return svg("-7 -7 14 14", 14, 14, s);
}
