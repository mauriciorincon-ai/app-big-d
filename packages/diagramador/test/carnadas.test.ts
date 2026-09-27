// @vitest-environment node
// Carnadas del contrato (§ 7): cada una debe fallar POR SU REGLA, CON SU ID y EN SU FASE; A1–A3 y los dos
// mapas reales deben aceptarse sin errores ni alertas. Se reporta «detectó k de n» (D-S1-03: se exige
// que la entrada esperada EXISTA; los errores secundarios legítimos quedan documentados en la bitácora).
import { describe, expect, it } from "vitest";
import { validate, validateGrammar, type Informe } from "../src/index";
import { COBERTURA, GRAMATICAS, leerJson } from "./lib/contrato";

interface Caso {
  archivo: string;
  clase: "mapa" | "gramatica";
  gramatica?: string;
  modo: "privado" | "publicacion";
  tipo: "error" | "alerta" | "acepta";
  fase: 1 | 2 | null;
  regla: string | null;
  id: string | null;
  descripcion: string;
}
const { casos } = leerJson<{ casos: Caso[] }>("carnadas/esperado.json");

function correr(c: Caso): Informe {
  const doc = leerJson(`carnadas/${c.archivo}`);
  return c.clase === "gramatica" ? validateGrammar(doc) : validate(doc, GRAMATICAS[c.gramatica!], { mode: c.modo, coverage: COBERTURA });
}

function detecta(c: Caso, inf: Informe): boolean {
  if (c.tipo === "acepta") return inf.errores.length === 0 && inf.alertas.length === 0;
  const lista = c.tipo === "error" ? inf.errores : inf.alertas;
  return lista.some((e) => e.regla === c.regla && e.id === c.id && e.fase === c.fase);
}

describe("carnadas del contrato v0.3.0", () => {
  it("son 31: 21 de mapa, 5 de gramática, 3 de aceptación y 2 mapas reales", () => {
    expect(casos).toHaveLength(31);
  });

  for (const c of casos)
    it(`${c.archivo}: ${c.tipo === "acepta" ? "se acepta" : `${c.regla} · ${c.id} · fase ${c.fase}`}`, () => {
      const inf = correr(c);
      const resumen = JSON.stringify({ errores: inf.errores, alertas: inf.alertas }, null, 1);
      expect(detecta(c, inf), resumen).toBe(true);
      if (c.tipo === "alerta") expect(inf.errores, resumen).toEqual([]);
    });

  it("detectó 31 de 31", () => {
    const k = casos.filter((c) => detecta(c, correr(c))).length;
    expect(`detectó ${k} de ${casos.length}`).toBe("detectó 31 de 31");
  });
});
