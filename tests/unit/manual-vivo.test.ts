// @vitest-environment node
// Regla 9 del kit: «toda feature que llega a main tiene su sección en el mismo sprint» en el manual de uso, ES y EN. Hasta el S7
// nadie lo comprobaba. Cada pantalla del export (cada `page.tsx` bajo src/app/[idioma]) se asocia a la sección del manual que la
// explica; una pantalla nueva sin sección rompe esta prueba y dice qué agregar.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const manual = readFileSync("docs/MANUAL-DE-USO.md", "utf8");
const [es, en] = [manual.slice(manual.indexOf("\n## Español"), manual.indexOf("\n## English")), manual.slice(manual.indexOf("\n## English"))];
const secciones = (t: string) => [...t.matchAll(/^#### (\d+)\. (.+?) · (?:desde el|since) Sprint (\d+)\s*$/gm)].map((m) => ({ n: Number(m[1]), titulo: m[2]!, sprint: Number(m[3]) }));

/** La pantalla (ruta relativa a src/app/[idioma]) → lo que debe decir el título de su sección en español. */
const SECCION_DE_PANTALLA: Record<string, RegExp> = {
  "": /Visión general|Varias plataformas/, // portada
  "atlas/[plataforma]": /Visión general/,
  "atlas/[plataforma]/componentes": /Componentes/,
  "atlas/[plataforma]/recorrido": /Recorrido/,
  "atlas/[plataforma]/versiones": /Versiones del mapa/,
  comparar: /Lado a lado/,
  "investigador/[plataforma]": /investigador/i,
  base: /base de conocimiento/i,
  "casos/[caso]": /perfil del caso/i,
  "casos/[caso]/comparacion": /comparación/i,
  "casos/[caso]/decisiones": /decisiones del caso/i,
  "casos/[caso]/informe": /informe del caso/i,
  instrumento: /instrumento/i,
};

const paginas = (dir: string, rel = ""): string[] =>
  readdirSync(dir).flatMap((f) => {
    const ruta = join(dir, f);
    const relativa = rel ? `${rel}/${f}` : f;
    if (statSync(ruta).isDirectory()) return paginas(ruta, relativa);
    return f === "page.tsx" ? [rel] : [];
  });

describe("el manual de uso (regla 9)", () => {
  const pantallas = paginas("src/app/[idioma]");

  it("cada pantalla del export tiene su sección en el manual en español, y el mapa de esta prueba no sobra ni falta", () => {
    expect(pantallas.sort()).toEqual(Object.keys(SECCION_DE_PANTALLA).sort());
    const titulos = secciones(es).map((s) => s.titulo);
    for (const [pantalla, re] of Object.entries(SECCION_DE_PANTALLA))
      expect(titulos.some((t) => re.test(t)), `la pantalla «${pantalla || "portada"}» no tiene sección en el manual (agrega «#### N. … · desde el Sprint N» y su fila aquí)`).toBe(true);
  });

  it("el manual en inglés tiene las mismas secciones, en el mismo orden y del mismo sprint", () => {
    const [a, b] = [secciones(es), secciones(en)];
    expect(b.map((s) => [s.n, s.sprint])).toEqual(a.map((s) => [s.n, s.sprint]));
    expect(a.length).toBeGreaterThanOrEqual(14);
  });

  it("las secciones están numeradas de corrido y cada una dice desde qué sprint existe", () => {
    expect(secciones(es).map((s) => s.n)).toEqual(secciones(es).map((_, i) => i + 1));
    for (const s of secciones(es)) expect(s.sprint).toBeGreaterThanOrEqual(1);
  });
});
