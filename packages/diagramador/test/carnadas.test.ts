// @vitest-environment node
// Carnadas del contrato (§ 7): cada una debe fallar POR SU REGLA, CON SU ID y EN SU FASE; A1–A3, P1 y los dos
// mapas reales deben aceptarse sin errores ni alertas. Se reporta «detectó k de n». Desde la v0.4.0 los
// errores secundarios legítimos viven en `esperado.json` (`secundarios`, D-S1-03): una carnada que falla puede
// reportar su entrada esperada y esos secundarios, y NADA MÁS. Con las cadenas de interfaz, V16 dibuja los que
// se aceptan a cuatro edades: P1 «se dibuja sin avisos» es parte de su aceptación.
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

/**
 * Inconsistencia conocida del contrato v0.4.0 (va a «Enmiendas»): A1 se declara «acepta» en publicación, pero su
 * nodo de `ia` queda solo en su banda (A1 no tiene bloque ahí) y su nombre ocupa 3 líneas donde caben 2, así que
 * V16 lo rechaza. Se fija EXACTO: si la planeadora corrige A1, esta lista deja de coincidir y la prueba lo dice.
 */
const DIBUJO_CONOCIDO: Record<string, string[]> = {
  "A1-cinco-bloques.mapa.json": ["nivel-1 · nombre de _ia (en): 3 líneas; caben 2", "nivel-1 · nombre de _ia (es): 3 líneas; caben 2"],
};

function informeDe(c: Caso): Informe {
  const doc = leerJson(`carnadas/${c.archivo}`);
  return c.clase === "gramatica" ? validateGrammar(doc) : validate(doc, GRAMATICAS[c.gramatica!], { mode: c.modo, coverage: COBERTURA, texts: TEXTOS });
}

/** El informe sin la inconsistencia conocida del contrato (que su propia prueba fija exacta). */
function correr(c: Caso): Informe {
  const inf = informeDe(c);
  const conocidos = DIBUJO_CONOCIDO[c.archivo];
  if (!conocidos) return inf;
  const errores = inf.errores.filter((e) => !(e.regla === "V16" && conocidos.includes(e.mensaje)));
  return { ...inf, errores, ok: errores.length === 0 };
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
      const inf = correr(c);
      const resumen = JSON.stringify({ errores: inf.errores, alertas: inf.alertas }, null, 1);
      expect(detecta(c, inf), resumen).toBe(true);
      if (c.tipo === "alerta") expect(inf.errores, resumen).toEqual([]);
      if (c.tipo !== "acepta") expect(sobrantes(c, inf), resumen).toEqual([]);
      for (const s of c.secundarios ?? [])
        expect([...inf.errores, ...inf.alertas].some((e) => e.regla === s.regla && e.id === s.id), `secundario ${s.regla} · ${s.id}`).toBe(true);
    });

  it("A1 no se dibuja en el nivel 1: exactamente la inconsistencia conocida del contrato, y nada más", () => {
    const inf = informeDe(casos.find((c) => c.archivo === "A1-cinco-bloques.mapa.json")!);
    expect(inf.errores.map((e) => `${e.regla} · ${e.mensaje}`)).toEqual(DIBUJO_CONOCIDO["A1-cinco-bloques.mapa.json"]!.map((m) => `V16 · ${m}`));
  });

  it("detectó 34 de 34", () => {
    const k = casos.filter((c) => detecta(c, correr(c))).length;
    expect(`detectó ${k} de ${casos.length}`).toBe("detectó 34 de 34");
  });
});
