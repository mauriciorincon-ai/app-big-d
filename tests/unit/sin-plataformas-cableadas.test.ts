// @vitest-environment node
// Reglas duras 4 y 5: N plataformas, jamás tres cableadas, y ninguna con tratamiento especial en el código. El código de la app
// (src/, menos el diccionario de textos) no nombra ninguna plataforma ni cuenta tres: lo que se sepa de una plataforma vive en
// data/. Se miran los ids y los nombres de data/plataformas, con los comentarios quitados (S7, D-S7-09).
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { archivosDeCodigo } from "./lib/codigo";

const plataformas = readdirSync("data/plataformas")
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => parse(readFileSync(`data/plataformas/${f}`, "utf8")) as { id: string; nombre: { es: string; en: string } });
// Los nombres de las plataformas reales; la ficticia (carnada permanente) puede aparecer: es la que prueba que nada se asume.
const REALES = plataformas.filter((p) => !/ejemplo/.test(p.id));
const NOMBRES = [...new Set(REALES.flatMap((p) => [p.id, p.nombre.es.replace(/\s*\(.*\)\s*$/, ""), p.nombre.en.replace(/\s*\(.*\)\s*$/, "")]))];

const sinComentarios = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const CODIGO = archivosDeCodigo("src", [".ts", ".tsx"]).filter((f) => !f.includes("src/lib/i18n/"));

describe("sin plataformas cableadas en el código", () => {
  it("hay plataformas reales en data/ y código que mirar", () => {
    expect(NOMBRES.length).toBeGreaterThanOrEqual(3);
    expect(CODIGO.length).toBeGreaterThan(50);
  });

  it("ningún archivo de src/ (fuera del diccionario) nombra una plataforma real", () => {
    const hallazgos = CODIGO.flatMap((f) => {
      const t = sinComentarios(readFileSync(f, "utf8"));
      return NOMBRES.filter((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t)).map((n) => `${f}: «${n}»`);
    });
    expect(hallazgos).toEqual([]);
  });

  it("ningún archivo de src/ cuenta tres plataformas (length === 3, arreglos de tres ids)", () => {
    const hallazgos = CODIGO.flatMap((f) => {
      const t = sinComentarios(readFileSync(f, "utf8"));
      const malos = [/\b(plataformas|platforms|elegidas|orden)\w*\.length\s*[=!]==?\s*3\b/g, /\b(plataformas|platforms)\w*\.length\s*[<>]=?\s*3\b/g, /\bPLATAFORMAS_\w*\s*=\s*\[[^\]]*,[^\]]*,[^\]]*\]/g];
      return malos.flatMap((re) => [...t.matchAll(re)].map((m) => `${f}: ${m[0]}`));
    });
    expect(hallazgos).toEqual([]);
  });

  it("la prueba muerde: ve un nombre y una cuenta de tres en un texto de muestra", () => {
    const muestra = sinComentarios('const x = "snowflake";\nif (plataformas.length === 3) {}\n// fabric en un comentario no cuenta');
    expect(NOMBRES.some((n) => new RegExp(`\\b${n}\\b`, "i").test(muestra))).toBe(true);
    expect(/\bplataformas\w*\.length\s*[=!]==?\s*3\b/.test(muestra)).toBe(true);
    expect(/fabric/i.test(muestra)).toBe(false); // el comentario se quitó
  });
});
