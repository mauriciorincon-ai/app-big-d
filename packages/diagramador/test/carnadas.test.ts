// @vitest-environment node
// Carnadas del contrato (§ 7): cada una debe fallar POR SU REGLA, CON SU ID y EN SU FASE; A1–A3, P1 y los dos
// mapas reales deben aceptarse sin errores ni alertas. Se reporta «detectó k de n». Desde la v0.4.0 los
// errores secundarios legítimos viven en `esperado.json` (`secundarios`, D-S1-03): una carnada que falla puede
// reportar su entrada esperada y esos secundarios, y NADA MÁS. Con las cadenas de interfaz, V16 dibuja los que
// se aceptan a cuatro edades: P1 «se dibuja sin avisos» es parte de su aceptación. Desde la 0.6.0 no hay excepciones:
// A1 corre en modo privado y C10 declara sus cuatro V3 (S3, fase 0).
import { describe, expect, it } from "vitest";
import { CONTRATO_VERSION, validate, validateGrammar, type Informe } from "../src/index";
import { COBERTURA, GRAMATICAS, leerJson } from "./lib/contrato";
import { TEXTOS } from "./lib/textos";

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
  secundarios?: { regla: string; id: string; por_que: string }[];
}
const { casos } = leerJson<{ casos: Caso[] }>("carnadas/esperado.json");

function informeDe(c: Caso): Informe {
  const doc = leerJson(`carnadas/${c.archivo}`);
  return c.clase === "gramatica" ? validateGrammar(doc) : validate(doc, GRAMATICAS[c.gramatica!], { mode: c.modo, coverage: COBERTURA, texts: TEXTOS });
}

function detecta(c: Caso, inf: Informe): boolean {
  if (c.tipo === "acepta") return inf.errores.length === 0 && inf.alertas.length === 0;
  const lista = c.tipo === "error" ? inf.errores : inf.alertas;
  return lista.some((e) => e.regla === c.regla && e.id === c.id && e.fase === c.fase);
}

/** Lo que el informe trae además de lo esperado y de los secundarios declarados (debe ser nada). */
function sobrantes(c: Caso, inf: Informe): string[] {
  const permitidas = [`${c.regla} · ${c.id}`, ...(c.secundarios ?? []).map((s) => `${s.regla} · ${s.id}`)];
  return [...inf.errores, ...inf.alertas].map((e) => `${e.regla} · ${e.id}`).filter((x) => !permitidas.includes(x));
}

describe(`carnadas del contrato v${CONTRATO_VERSION}`, () => {
  it("son 34: 21 de mapa, 5 de gramática, 3 de aceptación, 3 del piloto y 2 mapas reales", () => {
    expect(casos).toHaveLength(34);
    expect(casos.filter((c) => c.archivo.startsWith("P"))).toHaveLength(3);
  });

  for (const c of casos)
    it(`${c.archivo}: ${c.tipo === "acepta" ? "se acepta" : `${c.regla} · ${c.id} · fase ${c.fase}`}`, () => {
      const inf = informeDe(c);
      const resumen = JSON.stringify({ errores: inf.errores, alertas: inf.alertas }, null, 1);
      expect(detecta(c, inf), resumen).toBe(true);
      if (c.tipo === "alerta") expect(inf.errores, resumen).toEqual([]);
      if (c.tipo !== "acepta") expect(sobrantes(c, inf), resumen).toEqual([]);
      for (const s of c.secundarios ?? [])
        expect([...inf.errores, ...inf.alertas].some((e) => e.regla === s.regla && e.id === s.id), `secundario ${s.regla} · ${s.id}`).toBe(true);
    });

  // 0.6.0: A1 pasa a modo privado (sus dos líneas de más en el nivel 1 eran la inconsistencia conocida de la 0.4.0) y
  // C10 declara sus cuatro V3 en `secundarios`: las dos excepciones del S2 se retiran.
  it("A1, en modo privado, se acepta y lo que no se dibuja llega como aviso V16, no como error", () => {
    const c = casos.find((x) => x.archivo === "A1-cinco-bloques.mapa.json")!;
    expect(c.modo).toBe("privado");
    const inf = informeDe(c);
    expect(inf.errores).toEqual([]);
    expect(inf.avisos.map((a) => a.mensaje).sort()).toEqual(["nivel1 · texto: nombre de _ia (en): 3 líneas; caben 2", "nivel1 · texto: nombre de _ia (es): 3 líneas; caben 2"]);
  });

  it("detectó 34 de 34", () => {
    const k = casos.filter((c) => detecta(c, informeDe(c))).length;
    expect(`detectó ${k} de ${casos.length}`).toBe("detectó 34 de 34");
  });
});
