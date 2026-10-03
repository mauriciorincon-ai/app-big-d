// @vitest-environment node
// C-1 de la auditoría del S1: el build dibuja con la fecha del día y se niega a publicar un dibujo con avisos,
// así que un mapa que se dibuja bien hoy podía romper el build el día en que pasaba a «por revisar» (Fabric,
// el 2026-10-27), sin cambiar una línea. Aquí cada atlas publicado se dibuja en cada fecha en que algo de su
// mapa cambia de estado —cada `fecha_verificacion` distinta más 0, 29, 30, 59, 60 y 400 días— en todas sus
// vistas y en todos los idiomas. Ninguna puede lanzar. El lado a lado (S2) junta todas las plataformas en una página:
// se dibuja en la unión de esas fechas.
import { describe, expect, it } from "vitest";
import { vistaLado, vistaNivel1, vistaNivel2, vistaRecorrido } from "@/lib/atlas";
import { cargarDatos, sumarDias } from "@/lib/datos";
import { IDIOMAS } from "@/lib/i18n";

const DESPUES = [0, 29, 30, 59, 60, 400];
const d = cargarDatos();

const casos = [...d.atlas.values()].flatMap((atlas) => {
  const verificadas = [...new Set(atlas.mapa.nodos.map((n) => n.fecha_verificacion))].sort();
  const fechas = [...new Set(verificadas.flatMap((f) => DESPUES.map((k) => sumarDias(f, k))))].sort();
  return fechas.map((fecha) => [atlas.plataforma.id, fecha, atlas] as const);
});

describe("los atlas publicados se dibujan en toda fecha en que algo cambia de estado", () => {
  it("hay casos: cada atlas publicado, con sus fechas", () => {
    expect(new Set(casos.map(([id]) => id))).toEqual(new Set(d.atlas.keys()));
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
