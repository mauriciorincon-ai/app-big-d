// @vitest-environment node
// Fase 1 de la validación: la traducción de cada error de esquema a la regla del contrato y al id del
// elemento que lo contiene (D-S1-16, a «Enmiendas»). Una fila por rama de la tabla.
import { describe, expect, it } from "vitest";
import { validate, validateGrammar, type Gramatica, type Mapa } from "../src/index";
import { EJEMPLOS, GRAMATICAS } from "./lib/contrato";

// Estas pruebas rompen la forma a propósito: el documento es JSON arbitrario, sin tipo posible (regla 1:
// `any` justificado, en un solo alias).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const G = GRAMATICAS["plataformas-datos"]!;
const M = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
const mapa = (f: (m: Json) => void) => {
  const m = structuredClone(M) as unknown as Json;
  f(m);
  return m;
};
const gram = (f: (g: Json) => void) => {
  const g = structuredClone(G) as unknown as Json;
  f(g);
  return g;
};
const fase1 = (m: unknown, g: unknown = G) => validate(m, g, { mode: "privado" }).errores.filter((e) => e.fase === 1);

describe("mapa: error de esquema → regla e id", () => {
  it.each<[string, (m: Json) => void, string, string, RegExp]>([
    ["nodos no es lista", (m) => (m.nodos = { a: 1 }), "V6", "plataforma-ejemplo", /tipo array/],
    ["sin nodos", (m) => (m.nodos = []), "V3", "plataforma-ejemplo", /al menos 1/],
    ["falta el estado", (m) => delete m.estado, "V1", "plataforma-ejemplo", /falta el campo «estado»/],
    ["campo desconocido en la raíz", (m) => (m.extra = 1), "V1", "plataforma-ejemplo", /campo no permitido «extra»/],
    ["estado fuera del enum (§ 7: V8)", (m) => (m.estado = "borrador"), "V8", "plataforma-ejemplo", /debe ser uno de/],
    ["nodo con madurez mal escrita", (m) => (m.nodos[0].madurez = "Disponible"), "V3", "sistema-admisiones", /patrón/],
    ["nombre vacío", (m) => (m.nodos[0].nombre = {}), "V3", "sistema-admisiones", /al menos 1 idioma/],
    ["clave de idioma inválida", (m) => (m.nodos[0].nombre = { ES: "x" }), "V3", "sistema-admisiones", /clave no válida|patrón/],
    ["bloque sin líder", (m) => delete m.bloques[0].lider, "V3", "origen", /falta el campo «lider»/],
    ["flujo sin qué viaja", (m) => delete m.flujos[0].que_viaja, "V4", "f-origen-cambios", /falta el campo «que_viaja»/],
    ["condición con operador inválido", (m) => (m.flujos[0].condicion = { senal: "x", operador: "~", valor: 1 }), "V13", "f-origen-cambios", /debe ser uno de/],
    ["paso con bifurca inválido", (m) => (m.recorridos[0].pasos[4].bifurca = "doble"), "V12", "admision-paciente/p5", /debe ser uno de/],
    ["paso sin qué pasa", (m) => delete m.recorridos[0].pasos[0].que_pasa, "V5", "admision-paciente/p1", /falta el campo/],
    ["pasos no es lista", (m) => (m.recorridos[0].pasos = {}), "V6", "admision-paciente", /tipo array/],
    ["recorrido sin título", (m) => delete m.recorridos[0].titulo, "V5", "admision-paciente", /falta el campo «titulo»/],
    ["glosario mal formado", (m) => (m.glosario = { es: "texto" }), "V14", "plataforma-ejemplo", /tipo object/],
  ])("%s → %s · %s", (_n, f, regla, id, msg) => {
    const errores = fase1(mapa(f));
    expect(errores.length).toBeGreaterThan(0);
    expect(errores.some((e) => e.regla === regla && e.id === id && msg.test(e.mensaje)), JSON.stringify(errores)).toBe(true);
  });
  it("un mapa que no pasa la forma no llega a la fase 2", () => {
    const inf = validate(mapa((m) => ((m.nodos[0].madurez = "X"), (m.gramatica_id = "otra"))), G, { mode: "privado" });
    expect(inf.errores.every((e) => e.fase === 1)).toBe(true);
    expect(inf.ok).toBe(false);
  });
  it("una colección cuyo elemento no trae id se nombra por su posición", () => {
    expect(fase1(mapa((m) => delete m.nodos[3].id)).some((e) => e.id === "nodos/3")).toBe(true);
  });
});

describe("gramática: error de esquema → regla e id", () => {
  it.each<[string, (g: Json) => void, string, string]>([
    ["banda con clase inventada", (g) => (g.bandas[0].clase = "columna"), "G2", "fuentes"],
    ["etiqueta corta de más de 4", (g) => (g.tipos_de_nodo[0].etiqueta_corta.es = "INGESTA"), "G2", "cap-ingesta"],
    ["nivel de madurez fuera de rango", (g) => (g.escala_madurez[0].nivel = 9), "G2", "disponible-general"],
    ["umbral no entero", (g) => (g.vigencia.umbral_revisar_dias = "treinta"), "G6", "plataformas-datos"],
    ["límite faltante", (g) => delete g.limites.nodos_por_banda_max, "G6", "plataformas-datos"],
    ["llegadas inválidas", (g) => (g.recorrido_referencia.llegadas = "ninguna"), "G5", "plataformas-datos"],
    ["idiomas repetidos", (g) => (g.idiomas = ["es", "es"]), "G7", "plataformas-datos"],
    ["versión mal escrita", (g) => (g.version = "v1"), "G1", "plataformas-datos"],
  ])("%s → %s · %s", (_n, f, regla, id) => {
    const inf = validateGrammar(gram(f));
    expect(inf.errores.some((e) => e.fase === 1 && e.regla === regla && e.id === id), JSON.stringify(inf.errores)).toBe(true);
  });
  it("una gramática inválida detiene la validación del mapa", () => {
    const inf = validate(M, gram((g) => (g.version = "v1")), { mode: "privado" });
    expect(inf.errores.map((e) => e.doc)).toEqual(["gramatica"]);
  });
  it("una gramática con errores de reglas también detiene el mapa", () => {
    const g = gram((x) => (x.vigencia.umbral_revisar_dias = 90)) as unknown as Gramatica;
    expect(validate(M, g, { mode: "privado" }).errores.map((e) => e.regla)).toEqual(["G6"]);
  });
});

describe("reglas de la fase 2 que las carnadas no ejercitan", () => {
  const privado = (m: unknown, g: unknown = G) => validate(m, g, { mode: "privado" });
  it("G1/V1: contrato de otra versión menor en 0.x; gramática de otro id", () => {
    expect(validateGrammar(gram((g) => (g.contrato_version = "0.2.0"))).errores[0]!.regla).toBe("G1");
    expect(privado(mapa((m) => (m.contrato_version = "0.2.0"))).errores[0]!.regla).toBe("V1");
    expect(privado(mapa((m) => (m.gramatica_id = "otra"))).errores[0]!.mensaje).toMatch(/es de la gramática «otra»/);
  });
  it("G2: ids y niveles repetidos; G6: bloques y madurez disponible; G7: texto sin un idioma", () => {
    const reglas = validateGrammar(
      gram((g) => {
        g.tipos_de_nodo[1].id = g.tipos_de_nodo[0].id;
        g.escala_madurez[1].nivel = g.escala_madurez[0].nivel;
        g.limites.bloques_min = 9;
        for (const m of g.escala_madurez) m.disponible = false;
        delete g.bandas[0].nombre.en;
        g.bandas[1].nombre.fr = "x";
      }),
    ).errores.map((e) => `${e.regla}:${e.id}${e.idioma ? ":" + e.idioma : ""}`);
    expect(reglas).toEqual(expect.arrayContaining(["G2:cap-ingesta", "G2:vista-previa-publica", "G6:plataformas-datos", "G7:fuentes:en", "G7:ingesta:fr"]));
  });
  it("V2 en bloques y flujos; V3 bloque inexistente; V5 nodo y paso previo inexistentes; V6 flujos y pasos repetidos", () => {
    const m = mapa((x) => {
      x.bloques[0].banda_id = "inventada";
      x.flujos[0].modo_id = "inventado";
      x.nodos[0].bloque_id = "no-existe";
      x.recorridos[0].pasos[1].nodo_id = "no-existe";
      x.recorridos[0].pasos[2].sigue_de = "p99";
      x.flujos.push(structuredClone(x.flujos[1]));
      x.recorridos[0].pasos.push(structuredClone(x.recorridos[0].pasos[7]));
    }) as unknown as Mapa;
    const r = privado(m).errores.map((e) => `${e.regla}:${e.id}`);
    expect(r).toEqual(expect.arrayContaining(["V2:origen", "V2:f-origen-cambios", "V3:sistema-admisiones", "V5:admision-paciente/p2", "V5:admision-paciente/p3", "V6:f-origen-conector", "V6:admision-paciente/p8"]));
  });
  it("V5 con llegadas «alguna»: basta una banda; ninguna es error", () => {
    const g = gram((x) => (x.recorrido_referencia.llegadas = "alguna"));
    expect(privado(M, g).ok).toBe(true);
    const m = mapa((x) => (x.recorridos[0].pasos = x.recorridos[0].pasos.slice(0, 5).map((p: Record<string, unknown>) => ({ ...p, bifurca: undefined }))));
    expect(privado(m, g).errores.some((e) => /no llega a ninguna/.test(e.mensaje))).toBe(true);
  });
  it("V15 sin cobertura y V16 sin cadenas de interfaz no corren, y lo declaran como avisos", () => {
    const inf = privado(M);
    expect(inf.avisos.map((a) => a.regla)).toEqual(["V15", "V16"]);
    expect(inf.ok).toBe(true);
  });
  it("V3 (alerta, 0.4.0, F-022): un bloque sin componentes valida, pero se dice", () => {
    const m = mapa((x) => x.bloques.push({ ...x.bloques[0], id: "vacio" }));
    const inf = privado(m);
    expect(inf.alertas.filter((a) => a.regla === "V3").map((a) => `${a.id} · ${a.mensaje}`)).toEqual(["vacio · el bloque no tiene componentes"]);
    expect(inf.errores).toEqual([]);
  });
  it("V14 en un diccionario: términos solo en un idioma", () => {
    const m = mapa((x) => (x.glosario = { es: { a: "b" } }));
    expect(privado(m).errores.some((e) => e.regla === "V14" && e.idioma === "en")).toBe(true);
  });
  it("el informe se ordena por (doc, ruta, regla) por unidades de código, con desempates estables", () => {
    const inf = privado(mapa((x) => ((x.nodos[1].tipo_id = "z"), (x.nodos[1].madurez = "z"), (x.nodos[0].tipo_id = "z"))));
    const claves = inf.errores.map((e) => `${e.doc}${e.ruta}${e.regla}`);
    expect(claves).toEqual([...claves].sort());
  });
});
