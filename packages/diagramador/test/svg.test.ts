// @vitest-environment node
// Canon del SVG (G1, D8, D9, D12, D13, V15 sobre la salida): lo que todo SVG del motor cumple, verificado
// sobre todos los golden files.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { coberturaDeRangos, toSVG } from "../src/index";
import { atributos } from "../src/svg/serializar";
import { leerJson } from "./lib/contrato";
import { CASOS, disponer } from "./lib/casos";

const DIR = new URL("./golden/", import.meta.url);
const SVGS = readdirSync(DIR)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => ({ f, svg: readFileSync(new URL(f, DIR), "utf8") }));
const cob = leerJson<{ fuentes: Record<string, { rangos: [number, number][] }> }>("metricas/cobertura.json").fuentes;
const SANS = coberturaDeRangos(cob["space-grotesk"]!.rangos);
const MONO = coberturaDeRangos(cob["jetbrains-mono"]!.rangos);
const MONOS = ["dg-t-num", "dg-t-insignia", "dg-t-paso"];
const desescapar = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

describe("canon de todos los SVG del motor", () => {
  it("hay golden files que revisar", () => expect(SVGS.length).toBeGreaterThan(20));
  for (const { f, svg } of SVGS)
    describe(f, () => {
      const cuerpo = svg.replace(/<defs>.*?<\/defs>/, "");
      it("UTF-8 sin BOM, LF y un solo salto final (G1)", () => {
        expect(svg.charCodeAt(0)).not.toBe(0xfeff);
        expect(svg).not.toContain("\r");
        expect(svg.endsWith("</svg>\n")).toBe(true);
        expect(svg.endsWith("\n\n")).toBe(false);
      });
      it("números cuantizados: sin -0, a lo sumo un decimal, sin NaN ni exponentes (G1)", () => {
        expect(cuerpo).not.toMatch(/(?<![\d.])-0(?![.\d])/);
        expect(cuerpo).not.toMatch(/(?<![\w-])\d+\.\d{2,}(?![\w-])/);
        expect(cuerpo).not.toMatch(/NaN|Infinity|\de[+-]?\d/);
      });
      it("ids únicos y todo href apunta a un id del mismo SVG (D8)", () => {
        const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
        expect(new Set(ids).size).toBe(ids.length);
        for (const [, ref] of svg.matchAll(/ href="#([^"]+)"/g)) expect(ids).toContain(ref);
      });
      it("raíz accesible: graphics-document con title y desc en su idioma, nunca role=img (D9)", () => {
        expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" id="[^"]+" class="dg-svg dg-[a-z0-9-]+" lang="(es|en)" viewBox="0 0 [\d.]+ [\d.]+" width="[\d.]+" height="[\d.]+" role="graphics-document document"/);
        const titulo = svg.match(/aria-labelledby="([^"]+)"/)![1];
        expect(svg).toContain(`<title id="${titulo}">`);
        expect(svg).toMatch(/<desc id="[^"]+">[^<]+<\/desc>/);
      });
      it("todo activable es graphics-symbol img con nombre; flujos y etiquetas ocultos al lector (D9)", () => {
        for (const [g] of svg.matchAll(/<g [^>]*tabindex="0"[^>]*>/g)) {
          expect(g).toContain('role="graphics-symbol img"');
          expect(g).toMatch(/aria-label="[^"]+"/);
        }
        for (const [g] of svg.matchAll(/<g class="dg-(flujo|etiqueta)[^"]*"[^>]*>/g)) expect(g).toContain('aria-hidden="true"');
      });
      it("todo grupo de primer nivel declara su dueño (D12)", () => {
        const primer = cuerpo.split("\n").filter((l) => l.startsWith("<g "));
        for (const l of primer) expect(l.slice(0, l.indexOf(">"))).toMatch(/data-dueno="[^"]+"/);
      });
      it("todo carácter dibujado está en la cobertura de su fuente (V15, G15)", () => {
        for (const [, clase, contenido] of svg.matchAll(/<text class="([^"]+)"[^>]*>(.*?)<\/text>/g)) {
          const cob = MONOS.some((c) => clase!.split(" ").includes(c)) ? MONO : SANS;
          const texto = desescapar(contenido!.replace(/<[^>]+>/g, ""));
          const fuera = [...texto].filter((c) => !cob.has(c.codePointAt(0)!));
          expect(fuera, `${clase}: ${texto}`).toEqual([]);
        }
      });
    });
});

describe("serializador", () => {
  const s = { idioma: "es", prefijo: "x" };
  it("escribe los atributos en su orden fijo, sin importar el orden de construcción", () => {
    expect(atributos("rect", { rx: 60, x: 10, class: "c", y: 20 }, s)).toBe(' class="c" x="1" y="2" rx="6"');
  });
  it("un atributo fuera de la tabla es un error, no se escribe en otro orden", () => {
    expect(() => atributos("rect", { x: 0, fill: "red" }, s)).toThrow(/fuera del orden fijo/);
  });
  it("dos lienzos de una misma página no comparten ids (D8, F-010)", () => {
    const c = CASOS[0]!;
    const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    const geo = disponer(c.mapa, c.vista);
    const es = ids(toSVG(geo, { language: "es" }));
    const en = ids(toSVG(geo, { language: "en" }));
    const otro = ids(toSVG(disponer(c.mapa, "nivel-2"), { language: "es" }));
    expect(es.filter((i) => en.includes(i) || otro.includes(i))).toEqual([]);
  });
  it("con la pista A-29, todo activable la declara en aria-describedby (D-S1-07)", () => {
    const c = CASOS[0]!;
    const svg = toSVG(disponer(c.mapa, c.vista), { language: "es", hintId: "pista-ficha" });
    for (const [g] of svg.matchAll(/<g [^>]*tabindex="0"[^>]*>/g)) expect(g).toContain('aria-describedby="pista-ficha"');
  });
});
