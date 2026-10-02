// Símbolos sueltos en HTML (fuera del lienzo): el glifo de un tipo y el medidor de madurez, con los MISMOS
// paths del diagrama (§ 5.4, D13). Los usan la leyenda y la ficha; el color entra por clase (G13).
import type { Glifo, ModoDeFlujo } from "../tipos";
import { GLIFOS, MARCADORES } from "./glifos";
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

const DASH: Record<string, string> = { discontinua: ' stroke-dasharray="8 5"', continua: "", punteada: ' stroke-dasharray="0.1 5.5" stroke-linecap="round"', doble: "" };

/** Un modo de flujo como en el dibujo: su trazo y su marcador (D3: el color nunca va solo). */
export function modoSVG(m: ModoDeFlujo): string {
  const linea =
    m.estilo_linea === "doble"
      ? `<path d="M2,7 H38" stroke="currentColor" stroke-width="6.5"/><path class="dg-doble-int" d="M2,7 H38"/>`
      : `<path d="M2,7 H38" stroke="currentColor" stroke-width="${m.estilo_linea === "punteada" ? "2.8" : "2"}"${DASH[m.estilo_linea]}/>`;
  const mk = m.marcador === "ninguno" ? undefined : MARCADORES[m.marcador];
  const marca = !mk
    ? ""
    : mk.mixto
      ? `<path d="${mk.d}" fill="currentColor" stroke="currentColor" stroke-width="1.2" transform="translate(52,7)"/>`
      : `<path d="${mk.d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(52,7)"/>`;
  return svg("0 0 62 14", 62, 14, `<g class="dg-marca" fill="none">${linea}${marca}</g>`);
}
