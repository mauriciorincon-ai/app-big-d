// @vitest-environment node
// S10 (F1, 026-4): el modo «Portafolio» de las capturas toma los 15 encuadres del pedido 026 (la portada y 14 piezas, F1…F14;
// F15-F20 no tienen pantalla pedida) con el tamaño que manda el sprint: 1024×640, DPR 1,5, solo el área visible.
import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ENCUADRES,
  ESCALA,
  VENTANA,
} from "../../scripts/capturas-portafolio.mjs";

type Encuadre = { id: string; archivo: string; ruta: string };
const encuadres = ENCUADRES as Encuadre[];

describe("scripts/capturas-portafolio.mjs", () => {
  it("son 15 encuadres: la portada y las 14 piezas, sin repetir, todos en español", () => {
    expect(encuadres).toHaveLength(15);
    expect(new Set(encuadres.map((e) => e.id)).size).toBe(15);
    expect(new Set(encuadres.map((e) => e.archivo)).size).toBe(15);
    expect(encuadres.map((e) => e.id).sort()).toEqual(
      [
        "F1",
        "F10",
        "F11",
        "F12",
        "F13",
        "F14",
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "portada",
      ].sort(),
    );
    for (const e of encuadres) expect(e.ruta.startsWith("/es")).toBe(true);
  });

  it("el tamaño es el del sprint: 1024×640 a DPR 1,5", () => {
    expect(VENTANA).toEqual({ width: 1024, height: 640 });
    expect(ESCALA).toBe(1.5);
  });

  it("cada ruta existe como página de la app", () => {
    const hay = (partes: string[]) => {
      let dir = "src/app/[idioma]";
      for (const p of partes) {
        const nombres = readdirSync(dir);
        const sig = nombres.includes(p)
          ? p
          : nombres.find((n) => n.startsWith("["));
        if (!sig) return false;
        dir = `${dir}/${sig}`;
      }
      return existsSync(`${dir}/page.tsx`);
    };
    for (const e of encuadres)
      expect(
        hay(e.ruta.split("?")[0]!.split("/").slice(2).filter(Boolean)),
        e.ruta,
      ).toBe(true);
  });
});
