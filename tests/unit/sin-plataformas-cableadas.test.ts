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

// S7-B10: la regla 4 vale para CUALQUIER arreglo literal de tres ids de plataforma, no solo los que se llaman PLATAFORMAS_*.
// Dos formas: (a) un arreglo de tres elementos asignado o pasado con un nombre de plataforma (plataformas, platforms, elegidas,
// candidatas…), sean cuales sean sus elementos; (b) un arreglo de tres cadenas que son, cada una, un id del dato (data/plataformas,
// la ficticia incluida) o llevan el prefijo de los ids («plataforma-…», «platform-…»), con el nombre que tenga la variable.
const ELEMENTO = String.raw`(?:"[^"\n]*"|'[^'\n]*'|\`[^\`\n]*\`|[A-Za-z_$][\w$.]*)`;
const TRES = String.raw`\[\s*${ELEMENTO}\s*,\s*${ELEMENTO}\s*,\s*${ELEMENTO}\s*,?\s*\]`;
const IDS = plataformas.map((p) => p.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const CADENA_ID = String.raw`["'\`](?:${[...IDS, "plataforma-[\\w-]+", "platform-[\\w-]+"].join("|")})["'\`]`;
const TRES_IDS = String.raw`\[\s*${CADENA_ID}\s*,\s*${CADENA_ID}\s*,\s*${CADENA_ID}\s*,?\s*\]`;
const TRES_PLATAFORMAS = [
  new RegExp(String.raw`\b\w*(?:plataforma|platform|elegida|candidata|opcion)\w*\s*[:=]\s*${TRES}`, "gi"),
  new RegExp(TRES_IDS, "g"),
];

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
      const malos = [/\b(plataformas|platforms|elegidas|orden)\w*\.length\s*[=!]==?\s*3\b/g, /\b(plataformas|platforms)\w*\.length\s*[<>]=?\s*3\b/g, ...TRES_PLATAFORMAS];
      return malos.flatMap((re) => [...t.matchAll(re)].map((m) => `${f}: ${m[0]}`));
    });
    expect(hallazgos).toEqual([]);
  });

  it("S7-B10: la prueba muerde: ve un arreglo de tres ids de plataforma con cualquier nombre de variable, y no confunde un enum", () => {
    const hay = (codigo: string) => TRES_PLATAFORMAS.some((re) => ((re.lastIndex = 0), re.test(sinComentarios(codigo))));
    const [a, b, c] = plataformas.map((p) => p.id);
    expect(hay(`const ids = ["${a}", "${b}", "${c}"];`)).toBe(true); // variable sin nombre de plataforma
    expect(hay('const ids = ["plataforma-x", "plataforma-y", "plataforma-z"];')).toBe(true);
    expect(hay("const elegidas = [uno, dos, tres];")).toBe(true); // por el nombre de la variable
    expect(hay("lista({ platforms: ['a', 'b', 'c'] });")).toBe(true);
    expect(hay('const estados = ["nueva", "modificada", "retirada"];')).toBe(false); // un enum de tres, legítimo
    expect(hay(`const par = ["${a}", "${b}"];`)).toBe(false); // dos no son tres
  });

  it("la prueba muerde: ve un nombre y una cuenta de tres en un texto de muestra", () => {
    const muestra = sinComentarios('const x = "snowflake";\nif (plataformas.length === 3) {}\n// fabric en un comentario no cuenta');
    expect(NOMBRES.some((n) => new RegExp(`\\b${n}\\b`, "i").test(muestra))).toBe(true);
    expect(/\bplataformas\w*\.length\s*[=!]==?\s*3\b/.test(muestra)).toBe(true);
    expect(/fabric/i.test(muestra)).toBe(false); // el comentario se quitó
  });
});
