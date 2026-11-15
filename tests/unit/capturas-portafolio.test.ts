// @vitest-environment node
// S10 (F1, 026-4) y S11 (F2): el modo «Portafolio» de las capturas toma la portada y un encuadre por funcionalidad del export (F1…F21),
// salvo las que se declaran «sin pantalla» (F19, un comando), con el tamaño que manda el sprint: 1024×640, DPR 1,5, solo el área
// visible. Una funcionalidad del export sin encuadre y sin declaración rompe este test.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ENCUADRES,
  ESCALA,
  SIN_PANTALLA,
  VENTANA,
} from "../../scripts/capturas-portafolio.mjs";

type Encuadre = { id: string; archivo: string; ruta: string; arbol?: string; contiene?: string };
const encuadres = ENCUADRES as Encuadre[];
const sinPantalla = SIN_PANTALLA as { id: string; razon: string }[];
const funcionalidades = (
  JSON.parse(readFileSync("docs/brochure-export.json", "utf8")) as {
    funcionalidades: { grupos: { features: { id: string }[] }[] };
  }
).funcionalidades.grupos.flatMap((g) => g.features.map((f) => f.id));

describe("scripts/capturas-portafolio.mjs", () => {
  it("cada funcionalidad del export tiene su encuadre o su declaración «sin pantalla», y ninguna sobra", () => {
    const conPantalla = encuadres.map((e) => e.id).filter((i) => i !== "portada");
    expect(funcionalidades.length).toBeGreaterThan(0);
    for (const id of funcionalidades)
      expect(
        conPantalla.includes(id) || sinPantalla.some((x) => x.id === id),
        `${id} no tiene encuadre ni declaración «sin pantalla»`,
      ).toBe(true);
    for (const id of conPantalla) expect(funcionalidades, `encuadre ${id} sin funcionalidad`).toContain(id);
    for (const x of sinPantalla) {
      expect(funcionalidades, `sin pantalla ${x.id} no existe en el export`).toContain(x.id);
      expect(conPantalla, `${x.id} no puede tener encuadre y declaración a la vez`).not.toContain(x.id);
      expect(x.razon.length).toBeGreaterThan(20);
    }
  });

  it("hay una portada y un encuadre por funcionalidad con pantalla, sin repetir, todos en español", () => {
    expect(encuadres).toHaveLength(1 + funcionalidades.length - sinPantalla.length);
    expect(encuadres.filter((e) => e.id === "portada")).toHaveLength(1);
    expect(new Set(encuadres.map((e) => e.id)).size).toBe(encuadres.length);
    expect(new Set(encuadres.map((e) => e.archivo)).size).toBe(encuadres.length);
    for (const e of encuadres) expect(e.ruta.startsWith("/es")).toBe(true);
  });

  it("F11 y F15 se toman de la base sembrada, F21 de la demo y el resto del árbol real", () => {
    const de = (id: string) => encuadres.find((e) => e.id === id)!;
    expect(de("F11").arbol).toBe("out-sembrada");
    expect(de("F11").contiene).toBe("Empate técnico");
    expect(de("F15").arbol).toBe("out-sembrada");
    expect(de("F15").ruta).toBe("/es/base");
    expect(de("F21").arbol).toBe("out-demo");
    expect(de("F21").ruta).toBe("/es.html");
    for (const e of encuadres)
      if (!["F11", "F15", "F21"].includes(e.id)) expect(e.arbol).toBeUndefined();
    for (const e of encuadres) if (e.arbol !== undefined) expect(["out", "out-sembrada", "out-demo"]).toContain(e.arbol);
  });

  it("los encuadres con un paso (abrir, juzgar, responder, bajar) declaran qué debe verse", () => {
    for (const id of ["F15", "F16", "F17", "F18", "F20", "F21"])
      expect(encuadres.find((e) => e.id === id)!.contiene, id).toBeTruthy();
    expect(encuadres.find((e) => e.id === "F20")!.ruta).toBe(
      "/es/comparar?plataformas=bigquery,databricks,snowflake",
    );
    for (const id of ["F16", "F17", "F18"])
      expect(encuadres.find((e) => e.id === id)!.ruta).toBe("/es/casos/hospital-futuro");
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
    // La demo es un archivo del paquete (out-demo/es.html), no una ruta de la app.
    for (const e of encuadres.filter((x) => x.arbol !== "out-demo"))
      expect(
        hay(e.ruta.split("?")[0]!.split("/").slice(2).filter(Boolean)),
        e.ruta,
      ).toBe(true);
  });
});
