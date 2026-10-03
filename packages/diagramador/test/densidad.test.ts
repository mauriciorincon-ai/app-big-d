// @vitest-environment node
// Carnadas del PILOTO (propuestas para el contrato, van a «Enmiendas» del summary): el primer mapa real con la
// forma de una plataforma de verdad —19 componentes, 19 flujos, 3 saltos en el nivel 1 y 4 en el nivel 2,
// 7 pistas en un canal, tres referencias largas en una misma fila de franja— re-etiquetado con nombres
// neutrales. Con el motor de la v0.3.0 daba cuatro avisos (carril exprés, «canal 2: más de 6 pistas», dos
// etiquetas encimadas, una referencia fuera del lienzo) y la app no lo habría publicado. Ahora: ninguno.
import { describe, expect, it } from "vitest";
import { crossings, layout, validate, type Caja, type Geometria, type Mapa } from "../src/index";
import { offsetsPista } from "../src/layout/rutas";
import { CASOS, disponer, FECHA, VISTAS } from "./lib/casos";
import { COBERTURA, EJEMPLOS, GRAMATICAS, leerJson } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

const P1 = leerJson<Mapa>("carnadas/P1-mapa-denso.mapa.json");
const G = GRAMATICAS[P1.gramatica_id]!;
const cruza = (p: Caja, q: Caja) => p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;

describe("P1 — mapa denso del piloto", () => {
  it("es un mapa válido para publicar (la carnada no es un mapa roto)", () => {
    const inf = validate(P1, G, { mode: "publicacion", coverage: COBERTURA });
    expect([...inf.errores, ...inf.alertas]).toEqual([]);
  });
  for (const vista of VISTAS)
    it(`${vista}: sin avisos, D11 = 0 y ninguna etiqueta ni referencia encima de otra`, () => {
      const geo = disponer(P1, vista);
      expect(geo.avisos).toEqual([]);
      expect(crossings(geo)).toEqual([]);
      const encimas = geo.rotulos.flatMap((r, i) => geo.rotulos.slice(i + 1).filter((s) => s.dueno !== r.dueno && cruza(r.caja, s.caja)).map((s) => `${r.id} × ${s.id}`));
      expect(encimas).toEqual([]);
    });
  it("el carril exprés crece: 3 pistas en el nivel 1 y 4 en el nivel 2, y las franjas bajan", () => {
    const y = (vista: "nivel1" | "nivel2") => {
      const geo = disponer(P1, vista);
      const saltos = geo.trazados.filter((t) => t.puntos.some(([, py], k) => k > 0 && py === t.puntos[k - 1]![1] && py > Math.max(...geo.cajas.filter((c) => c.clase !== "ficha").map((c) => c.caja.y + c.caja.h))));
      return new Set(saltos.map((t) => Math.max(...t.puntos.map(([, py]) => py)))).size;
    };
    expect(y("nivel1")).toBe(3);
    expect(y("nivel2")).toBe(4);
  });
  it("el canal con 7 pistas las reparte parejas, todas distintas y a 6 u o más de cada tarjeta", () => {
    const geo = disponer(P1, "nivel2");
    const verticales = new Set<number>();
    const izq = 80 + 2 * (1520 + 500) + 1520; // borde derecho de la columna 2
    for (const t of geo.trazados)
      for (let k = 1; k < t.puntos.length; k++) {
        const [x1, y1] = t.puntos[k - 1]!;
        const [x2, y2] = t.puntos[k]!;
        if (x1 === x2 && y1 !== y2 && x1 > izq && x1 < izq + 500) verticales.add(x1);
      }
    expect(verticales.size).toBe(7);
    for (const x of verticales) expect(x - izq >= 60 && izq + 500 - x >= 60).toBe(true);
  });
});

// La pasada final de capturas del S1 (2026-09-30) leyó en el primer mapa real una línea punteada que bajaba a 2 u
// del borde de dos tarjetas: en el recorrido parecía salir de la tarjeta atenuada, y la flecha que entraba a esa
// tarjeta quedaba montada sobre dos líneas. D11 no lo cuenta (no cruza), y el M-23 solo miraba «sobre el borde».
describe("aire de las pistas: ningún tramo vertical corre a menos de 5 u del borde de una tarjeta que pasa a su lado", () => {
  // El motor lo reporta como aviso (como D11), así el build y la aprobación lo ven en cualquier mapa.
  const casos: [string, () => Geometria][] = [
    ...CASOS.map((c) => [c.nombre, () => disponer(c.mapa, c.vista)] as [string, () => Geometria]),
    ...VISTAS.map((v) => [`P1 · ${v}`, () => disponer(P1, v)] as [string, () => Geometria]),
  ];
  it.each(casos)("%s", (_n, geo) => {
    expect(geo().avisos.filter((a) => a.tipo === "pistas")).toEqual([]);
  });
});

describe("cada etiqueta de modos va sobre su propio trazo (todos los mapas del contrato y P1)", () => {
  // Hallado en el primer mapa real: con saltos que no salen del mismo lado, la etiqueta de uno quedaba en el
  // tramo de otro (a 200 u de su línea). Tolerancia: 30 u (la etiqueta de un flujo dentro de una columna va
  // al lado de su línea vertical, a 24 u).
  const distancia = ([px, py]: readonly [number, number], pts: readonly (readonly [number, number])[]) =>
    Math.min(
      ...pts.slice(1).map(([x2, y2], k) => {
        const [x1, y1] = pts[k]!;
        const cx = Math.max(Math.min(x1, x2), Math.min(px, Math.max(x1, x2)));
        const cy = Math.max(Math.min(y1, y2), Math.min(py, Math.max(y1, y2)));
        return Math.max(Math.abs(px - cx), Math.abs(py - cy));
      }),
    );
  const casos = [...CASOS.map((c) => ({ nombre: c.nombre, mapa: c.mapa, vista: c.vista })), ...VISTAS.map((vista) => ({ nombre: `P1 · ${vista}`, mapa: P1, vista }))];
  for (const c of casos)
    it(c.nombre, () => {
      const geo = disponer(c.mapa, c.vista);
      const lejos = geo.rotulos
        .filter((r) => r.id.startsWith("etiqueta "))
        .map((r) => ({ r, d: distancia([r.caja.x + r.caja.w / 2, r.caja.y + r.caja.h / 2], geo.trazados.find((t) => t.id === r.dueno)!.puntos) }))
        .filter(({ d }) => d > 300)
        .map(({ r, d }) => `${r.id}: a ${d / 10} u de su trazo`);
      expect(lejos).toEqual([]);
    });
});

describe("referencias de una fila de franja (enmienda del piloto)", () => {
  const fila = (m: Mapa) => {
    const geo = disponer(m, "nivel2");
    const refs = geo.rotulos.filter((r) => r.id.startsWith("r-f-canalizaciones")).sort((a, b) => a.caja.x - b.caja.x);
    return { geo, refs, aire: refs.slice(1).map((r, i) => r.caja.x - refs[i]!.caja.x - refs[i]!.caja.w) };
  };
  it("tres referencias largas en una fila justa: caben achicando el aire entre ellas (de 8 u hasta 4)", () => {
    const { geo, refs, aire } = fila(P1);
    expect(refs).toHaveLength(3);
    expect(geo.avisos).toEqual([]);
    expect(aire.every((a) => a >= 40 && a < 80)).toBe(true);
  });
  it("apiñadas bajo las últimas columnas: se corren hacia adentro sin salirse ni encimarse", () => {
    // Las tres referencias de la canalización apuntan a las dos últimas capas: centradas, se saldrían por la
    // derecha; antes solo se corría la última y la del medio quedaba fuera del lienzo.
    const destino: Record<string, string> = { "copia-tareas": "informes", cuadernos: "agente", "flujos-visuales": "modelo-semantico" };
    const m: Mapa = { ...P1, flujos: P1.flujos.map((f) => (f.origen === "canalizaciones" ? { ...f, destino: destino[f.destino]! } : f)) };
    const { geo, refs, aire } = fila(m);
    expect(geo.avisos).toEqual([]);
    expect(aire.every((a) => a >= 40)).toBe(true);
    expect(refs.at(-1)!.caja.x + refs.at(-1)!.caja.w).toBeLessThanOrEqual(geo.ancho - 80 - 40);
  });
});

describe("pistas de un canal (§ 5.3 con la enmienda del piloto)", () => {
  it("hasta 6, las posiciones fijas, a 6 u de las tarjetas como mínimo (M-23: ±25 u caía sobre su borde; a 2 u, la pasada de capturas la vio pegada)", () => {
    for (let n = 1; n <= 6; n++) expect(offsetsPista(n)).toEqual([-50, 50, 120, 190, -120, -190]);
  });
  it("ningún tramo vertical corre sobre el borde de una tarjeta (nube-ejemplo: el balanceador y cuatro nodos más)", () => {
    const nube = EJEMPLOS.find((x) => x.sujeto_id === "nube-ejemplo")!;
    const m = structuredClone(nube);
    const base = m.nodos.find((n) => n.id === "cola")!;
    for (let i = 1; i <= 4; i++) {
      m.nodos.push({ ...base, id: `extra-${i}`, orden: 10 + i, nombre: { es: `Extra ${i}`, en: `Extra ${i}` } });
      m.flujos.push({ ...m.flujos.find((f) => f.id === "f1")!, id: `fx${i}`, destino: `extra-${i}` });
    }
    for (const vista of ["nivel1", "nivel2"] as const) {
      const geo = layout(m, GRAMATICAS[m.gramatica_id]!, vista, { texts: TEXTOS, queryDate: FECHA });
      const sobreBorde = geo.trazados.flatMap((t) =>
        t.puntos.slice(1).flatMap((b, k) => {
          const a = t.puntos[k]!;
          if (a[0] !== b[0]) return [];
          const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
          return geo.cajas.filter((c) => (a[0] === c.caja.x || a[0] === c.caja.x + c.caja.w) && y1 < c.caja.y + c.caja.h && y2 > c.caja.y).map((c) => `${vista}: ${t.id} sobre el borde de ${c.id}`);
        }),
      );
      expect(sobreBorde).toEqual([]);
    }
  });
  it("con 7, siete posiciones parejas en el mismo orden (centro, derecha, izquierda) y dentro del canal", () => {
    const o = offsetsPista(7);
    expect(o).toEqual([0, 63, 126, 189, -63, -126, -189]);
  });
  it("no reparte por debajo de 4 u: con 13 ofrece 10 y el que sobra lo reporta el motor", () => {
    const o = offsetsPista(13);
    expect(o).toHaveLength(10);
    const orden = [...o].sort((a, b) => a - b);
    expect(orden.slice(1).map((x, i) => x - orden[i]!).every((d) => d >= 40)).toBe(true);
    expect(Math.max(...o.map(Math.abs))).toBeLessThanOrEqual(190);
  });
});
