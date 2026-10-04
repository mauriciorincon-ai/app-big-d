// @vitest-environment node
// A-5 de la auditoría del S1: un paso del recorrido que se sigue a sí mismo, o que sigue a uno que está
// DESPUÉS en la lista, validaba bien. Con el primero, `layout(…, "recorrido")` y `toText` se quedaban sin
// memoria sin decir regla ni id (G14); con el segundo, la numeración salía con dos «1» y un 6b sin 6a.
// Carnadas del piloto P2 y P3 (carnadas/, contrato v0.4.0): cada una da exactamente un V5, en su paso.
import { describe, expect, it } from "vitest";
import { validate, type Mapa, type Recorrido } from "../src/index";
import { numerarPasos } from "../src/layout/nivel2";
import { COBERTURA, GRAMATICAS, leerJson } from "./lib/contrato";

const carnada = (archivo: string) => leerJson<Mapa>(`carnadas/${archivo}`);
const CASOS = [
  ["P2-paso-que-se-sigue.mapa.json", "admision-paciente/px"],
  ["P3-paso-que-sigue-a-uno-posterior.mapa.json", "admision-paciente/p7"],
] as const;

describe("V5 — un paso sigue a uno que está ANTES en la lista", () => {
  it.each(CASOS)("%s: exactamente un error, V5 en %s", (archivo, id) => {
    const m = carnada(archivo);
    const inf = validate(m, GRAMATICAS[m.gramatica_id]!, { mode: "publicacion", coverage: COBERTURA });
    expect(inf.errores.map((e) => [e.regla, e.id])).toEqual([["V5", id]]);
    expect(inf.errores[0]!.mensaje).toMatch(/que no está antes en la lista/);
  });
});

describe("numerarPasos no se queda sin memoria ante un ciclo", () => {
  it("un paso que se sigue a sí mismo lanza un error con el recorrido y el paso", () => {
    const r = carnada(CASOS[0][0]).recorridos[0] as Recorrido;
    expect(() => numerarPasos(r)).toThrow(/admision-paciente.*px/);
  });
  it("dos pasos que se siguen entre sí también", () => {
    const r: Recorrido = structuredClone(carnada(CASOS[0][0]).recorridos[0]!);
    r.pasos = r.pasos.filter((p) => p.id !== "px");
    r.pasos.find((p) => p.id === "p6")!.sigue_de = "p7";
    expect(() => numerarPasos(r)).toThrow(/admision-paciente/);
  });
});
