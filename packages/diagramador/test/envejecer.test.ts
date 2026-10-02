// @vitest-environment node
// C-1 de la auditoría del S1: el motor solo se había probado con mapas vigentes. Cuando un mapa envejece
// aparecen las insignias de vigencia, que ocupan lugar: la lateral de una ficha de franja empuja la fila de
// referencias, la de la vista «bloque» quedaba fuera del lienzo y la montada, con tres cifras, cruzaba la
// mitad de la tarjeta y la pisaba la línea que llega desde arriba. Aquí cada mapa del contrato, P1 y A3 se
// dibujan en todas sus vistas (y la vista «bloque» de cada grupo) en cuatro edades, y en ninguna puede haber
// avisos, cruces, rótulos fuera del lienzo ni una línea encima de una insignia.
import { describe, expect, it } from "vitest";
import {
  crossings,
  layout,
  type Caja,
  type Geometria,
  type Mapa,
  type Punto,
  type Vista,
} from "../src/index";
import { A3 } from "./lib/casos";
import { EJEMPLOS, GRAMATICAS, leerJson } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const P1 = leerJson<Mapa>("carnadas/P1-mapa-denso.mapa.json");
// Y un flujo entre dos fichas de una franja (A-6 a): con una ficha envejecida, sale del borde de la reserva.
const conFlujoEnFranja = structuredClone(EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!);
conFlujoEnFranja.flujos.push({ ...conFlujoEnFranja.flujos.find((f) => f.id === "f-catalogo-limpias")!, id: "f-catalogo-filtros", destino: "filtros-filas" });
const MAPAS: [string, Mapa][] = [
  ...EJEMPLOS.map((m) => [m.sujeto_id, m] as [string, Mapa]),
  ["P1", P1],
  ["A3", A3],
  ["flujo en una franja", conFlujoEnFranja],
];

/** Suma días a una fecha civil (solo en pruebas: el motor no usa `Date`). */
const sumar = (fecha: string, dias: number) =>
  new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000)
    .toISOString()
    .slice(0, 10);

function edades(m: Mapa): [string, string][] {
  const g = GRAMATICAS[m.gramatica_id]!;
  const vieja = m.nodos.map((n) => n.fecha_verificacion).sort()[0]!;
  return [
    ["vigente", vieja],
    ["por revisar", sumar(vieja, g.vigencia.umbral_revisar_dias)],
    ["vencido", sumar(vieja, g.vigencia.umbral_vencido_dias)],
    // Tres cifras: la insignia más ancha que un mapa real alcanza antes de reverificarse.
    ["2027-01-15", "2027-01-15"],
  ];
}

const dentro = (c: Caja, geo: Geometria) =>
  c.x >= 0 && c.y >= 0 && c.x + c.w <= geo.ancho && c.y + c.h <= geo.alto;
const corta = (a: Punto, b: Punto, c: Caja) =>
  Math.min(a[0], b[0]) < c.x + c.w &&
  Math.max(a[0], b[0]) > c.x &&
  Math.min(a[1], b[1]) < c.y + c.h &&
  Math.max(a[1], b[1]) > c.y;

/** Todo lo que la vista puede fallar al envejecer, en una lista (vacía = bien). */
function problemas(geo: Geometria): string[] {
  const out = [...geo.avisos];
  for (const c of crossings(geo))
    out.push(`D11: ${c.flujo} atraviesa ${c.caja}`);
  for (const r of geo.rotulos)
    if (!dentro(r.caja, geo)) out.push(`${r.id}: fuera del lienzo`);
  for (const c of geo.cajas)
    if (!dentro(c.caja, geo)) out.push(`caja ${c.id}: fuera del lienzo`);
  const insignias = geo.rotulos.filter((r) => r.id.startsWith("vigencia "));
  for (const t of geo.trazados)
    for (let i = 1; i < t.puntos.length; i++)
      for (const s of insignias)
        if (corta(t.puntos[i - 1]!, t.puntos[i]!, s.caja))
          out.push(`${t.id} pisa ${s.id}`);
  return out;
}

describe("C-1 — los mapas del contrato envejecen sin romper el dibujo", () => {
  for (const [nombre, m] of MAPAS) {
    const G = GRAMATICAS[m.gramatica_id]!;
    const disponer = (vista: Vista, fecha: string, grupo?: string) =>
      layout(m, G, vista, {
        texts: TEXTOS,
        queryDate: fecha,
        ...(grupo ? { group: grupo } : {}),
      });
    for (const [edad, fecha] of edades(m))
      it(`${nombre} · ${edad} (${fecha})`, () => {
        const grupos = disponer("nivel-1", fecha).vigencia.elementos.map(
          (e) => e.id,
        );
        const vistas: [string, Geometria][] = [
          ...(["nivel-1", "nivel-2", "recorrido"] as const).map(
            (v) => [v, disponer(v, fecha)] as [string, Geometria],
          ),
          ...grupos.map(
            (gr) =>
              [`bloque ${gr}`, disponer("bloque", fecha, gr)] as [
                string,
                Geometria,
              ],
          ),
        ];
        const todos = vistas.flatMap(([v, geo]) =>
          problemas(geo).map((p) => `${v}: ${p}`),
        );
        expect(todos).toEqual([]);
      });
  }
});
