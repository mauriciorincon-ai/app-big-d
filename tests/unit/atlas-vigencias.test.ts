// @vitest-environment node
// C-1 de la auditoría del S1: el build dibuja con la fecha del día y se niega a publicar un dibujo con avisos,
// así que un mapa que se dibuja bien hoy podía romper el build el día en que pasaba a «por revisar» (Fabric,
// el 2026-10-27), sin cambiar una línea. Aquí cada atlas publicado se dibuja en cada fecha en que algo de su
// mapa cambia de estado —cada `fecha_verificacion` distinta más 0 días, los dos umbrales de SU gramática (el día
// antes y el día), 100 y 400 días— en todas sus vistas y en todos los idiomas. Ninguna puede lanzar. El lado a lado (S2) junta todas las plataformas en una página:
// se dibuja en la unión de esas fechas. Las versiones de un mapa (S2, D-S2-08) dibujan también sus versiones
// archivadas: sus fechas entran a la matriz de su plataforma. Y las cuatro edades del motor (`agingDates`) caen todas
// dentro de la matriz: si la gramática mueve un umbral, la matriz se mueve con ella.
import { agingDates, type Gramatica } from "diagramador";
import { describe, expect, it } from "vitest";
import { vistaLado, vistaNivel1, vistaNivel2, vistaRecorrido, vistaVersiones } from "@/lib/atlas";
import { cargarDatos, sumarDias } from "@/lib/datos";
import { IDIOMAS } from "@/lib/i18n";

/** Días después de cada verificación en que algo cambia de estado, según los umbrales de la gramática. */
const despuesDe = (g: Gramatica) => {
  const { umbral_revisar_dias: r, umbral_vencido_dias: v } = g.vigencia;
  return [0, r - 1, r, v - 1, v, 100, 400];
};
const d = cargarDatos();

const casos = [...d.atlas.values()].flatMap((atlas) => {
  const verificadas = [...new Set(atlas.mapa.nodos.map((n) => n.fecha_verificacion))].sort();
  const fechas = [...new Set(verificadas.flatMap((f) => despuesDe(atlas.gramatica).map((k) => sumarDias(f, k))))].sort();
  return fechas.map((fecha) => [atlas.plataforma.id, fecha, atlas] as const);
});

describe("los atlas publicados se dibujan en toda fecha en que algo cambia de estado", () => {
  it("hay casos: cada atlas publicado, con sus fechas", () => {
    expect(new Set(casos.map(([id]) => id))).toEqual(new Set(d.atlas.keys()));
  });
  it("cada mapa: sus cuatro edades del motor (agingDates) están en la matriz", () => {
    for (const atlas of d.atlas.values()) {
      const mias = new Set(casos.filter(([id]) => id === atlas.plataforma.id).map(([, f]) => f));
      for (const f of agingDates(atlas.mapa, atlas.gramatica)) expect(mias.has(f), `${atlas.plataforma.id} ${f}`).toBe(true);
    }
  });
  it.each(casos.map(([id, fecha, atlas]) => [`${id} · ${fecha}`, fecha, atlas] as const))("%s", (_nombre, fecha, atlas) => {
    for (const idioma of IDIOMAS) {
      expect(() => vistaNivel1(atlas, idioma, fecha)).not.toThrow();
      expect(() => vistaNivel2(atlas, idioma, fecha)).not.toThrow();
      if (atlas.mapa.recorridos.length) expect(() => vistaRecorrido(atlas, idioma, fecha)).not.toThrow();
    }
  });
});

describe("el lado a lado se dibuja en toda fecha en que algo de cualquier plataforma cambia de estado", () => {
  const fechas = [...new Set(casos.map(([, fecha]) => fecha))].sort();
  it.each(fechas)("%s", (fecha) => {
    for (const idioma of IDIOMAS) expect(() => vistaLado(d, idioma, fecha)).not.toThrow();
  });
});

describe("las versiones de cada mapa se dibujan en toda fecha en que algo de cualquiera de sus versiones cambia de estado", () => {
  const porPlataforma = [...d.atlas.keys()].flatMap((id) => {
    const mapas = [d.atlas.get(id)!.mapa, ...(d.versiones.get(id) ?? []).map((v) => v.mapa)];
    const verificadas = [...new Set(mapas.flatMap((m) => m.nodos.map((n) => n.fecha_verificacion)))].sort();
    const despues = despuesDe(d.atlas.get(id)!.gramatica);
    return [...new Set(verificadas.flatMap((f) => despues.map((k) => sumarDias(f, k))))].sort().map((fecha) => [`${id} · ${fecha}`, id, fecha] as const);
  });
  it("hay casos con versiones archivadas (la matriz no es decorado)", () => {
    expect(porPlataforma.some(([, id]) => d.versiones.has(id))).toBe(true);
  });
  it.each(porPlataforma)("%s", (_nombre, id, fecha) => {
    for (const idioma of IDIOMAS) expect(() => vistaVersiones(d, id, idioma, fecha)).not.toThrow();
  });
});
