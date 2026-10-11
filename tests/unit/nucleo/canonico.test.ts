// @vitest-environment node
// JSON canónico estricto (RFC 8785) y los racionales y fechas enteros del núcleo.
import { describe, expect, it } from "vitest";
import { canonicoEstricto, comparar, diasEntre, estadoVigencia, racional } from "@/engine";
import { pisoA, seguro, techoA } from "@/engine/racional";

describe("canonicoEstricto (RFC 8785)", () => {
  it("ordena las claves por unidades de código UTF-16 (§ 3.2.3, el vector del RFC)", () => {
    const entrada = {
      "€": "Euro Sign",
      "\r": "Carriage Return",
      "דּ": "Hebrew Letter Dalet With Dagesh",
      "1": "One",
      "😀": "Emoji: Grinning Face",
      "\u0080": "Control",
      "ö": "Latin Small Letter O With Diaeresis",
    };
    expect(canonicoEstricto(entrada)).toBe(
      '{"\\r":"Carriage Return","1":"One","\u0080":"Control","ö":"Latin Small Letter O With Diaeresis","€":"Euro Sign","😀":"Emoji: Grinning Face","דּ":"Hebrew Letter Dalet With Dagesh"}',
    );
  });

  it("escapa los textos como el RFC (§ 3.2.2.2)", () => {
    const texto = JSON.parse('"\\u20ac$\\u000F\\u000aA\'\\u0042\\u0022\\u005c\\\\\\"\\/"') as string;
    expect(canonicoEstricto(texto)).toBe('"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"');
  });

  it("escribe enteros, booleanos, null, listas y objetos anidados sin espacios; −0 es 0; omite las claves sin valor", () => {
    expect(canonicoEstricto({ b: [1, -0, true, null, { z: "x", a: 0 }], a: Number.MAX_SAFE_INTEGER, c: undefined })).toBe('{"a":9007199254740991,"b":[1,0,true,null,{"a":0,"z":"x"}]}');
  });

  it.each([
    ["un número con decimales", { x: 1.5 }, "/x no es un entero exacto: 1.5"],
    ["NaN", [Number.NaN], "/0 no es un entero exacto: NaN"],
    ["infinito", Infinity, "/ no es un entero exacto: Infinity"],
    ["un entero fuera del rango exacto", 2 ** 53, "no es un entero exacto: 9007199254740992"],
    ["un hueco en una lista", [1, , 3], "/1 es un hueco"],
    ["un valor sin forma JSON en una lista", [undefined], "/0 no es serializable (undefined)"],
    ["un objeto que no es plano", { f: new Map() }, "/f no es un objeto plano"],
    ["un sustituto suelto", { t: "a\ud800b" }, "/t trae un sustituto UTF-16 suelto"],
  ])("rechaza %s con su ruta", (_que, valor, mensaje) => {
    expect(() => canonicoEstricto(valor)).toThrow(mensaje);
  });
});

describe("racionales", () => {
  it("se reducen con el denominador positivo y sin −0", () => {
    expect(racional(6, -4)).toEqual({ n: -3, d: 2 });
    expect(Object.is(racional(-0, 5).n, 0)).toBe(true);
    expect(() => racional(1, 0)).toThrow("denominador cero");
  });

  it("se comparan en cruz y se llevan a la rejilla sin coma flotante", () => {
    expect(comparar(racional(1, 3), racional(2, 6))).toBe(0);
    expect(comparar(racional(16250, 11), racional(1477))).toBe(1);
    expect(techoA(racional(16250, 11), 10)).toBe(1480);
    expect(pisoA(racional(16250, 11), 10)).toBe(1470);
    expect(techoA(racional(1470), 10)).toBe(1470);
    expect(Object.is(techoA(racional(-3, 2), 10), 0)).toBe(true);
    expect(pisoA(racional(-3, 2), 10)).toBe(-10);
  });

  it("un entero que deja de ser exacto lanza", () => {
    expect(() => seguro(2 ** 53)).toThrow("ya no es exacto");
  });
});

describe("vigencia contra la fecha de evaluación", () => {
  it("cuenta días civiles enteros, también sobre años bisiestos y meses cortos", () => {
    expect(diasEntre("2026-09-20", "2026-10-20")).toBe(30);
    expect(diasEntre("2028-02-28", "2028-03-01")).toBe(2);
    expect(diasEntre("2026-03-01", "2026-02-28")).toBe(-1);
    expect(() => diasEntre("26-1-1", "2026-01-01")).toThrow("fecha no civil");
  });

  it("vigente hasta el día 29, por revisar desde el 30, vencida desde el 60", () => {
    const u = { revisar_dias: 30, vencido_dias: 60 };
    expect([29, 30, 59, 60].map((d) => estadoVigencia(d, u))).toEqual(["vigente", "por-revisar", "por-revisar", "vencida"]);
  });
});
