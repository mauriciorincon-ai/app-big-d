// @vitest-environment node
// AU-S3-06: cualquier fallo del núcleo durante una simulación sale del Worker como un mensaje de error; antes solo se
// atrapaba el de `iniciar`, y un `avanzar` o un `resultadoDe` que lanzaba dejaba la robustez «en curso» sin mensaje.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/engine/simulacion", async (original) => {
  const real = await original<typeof import("@/engine/simulacion")>();
  return {
    ...real,
    avanzar: (...args: Parameters<typeof real.avanzar>) => {
      if (globalThis.__FALLAR === "avanzar") throw new Error("avanzar se rompió");
      return real.avanzar(...args);
    },
    resultadoDe: (...args: Parameters<typeof real.resultadoDe>) => {
      if (globalThis.__FALLAR === "resultado") throw new Error("el resultado no se pudo armar");
      return real.resultadoDe(...args);
    },
  };
});

import { evaluar } from "@/engine/evaluar";
import { atender } from "@/engine/protocolo";
import { entradaSimulacion } from "@/engine/simulacion";
import { futuro } from "../nucleo/lib/futuro";

declare global {
  var __FALLAR: "avanzar" | "resultado" | undefined;
}

const peticion = () => {
  const e = futuro();
  const r = evaluar(e);
  if (r.tipo !== "evaluado") throw new Error("el caso de la maqueta debe evaluarse");
  const es = entradaSimulacion(e, r);
  if (!es) throw new Error("debe haber simulación");
  return { tipo: "simular" as const, id: 7, entrada: { ...es, aceptadas: 200, semillas: es.semillas.slice(0, 1) }, paso: 100 };
};

describe("atender: todo fallo del núcleo es un mensaje de error", () => {
  it("sin fallos termina en un resultado", () => {
    globalThis.__FALLAR = undefined;
    const m = [...atender(peticion())];
    expect(m.at(-1)?.tipo).toBe("resultado");
  });
  it.each([
    ["avanzar", /avanzar se rompió/],
    ["resultado", /el resultado no se pudo armar/],
  ] as const)("si falla %s, el último mensaje es un error con el id de la petición", (donde, texto) => {
    globalThis.__FALLAR = donde;
    const m = [...atender(peticion())];
    const ultimo = m.at(-1)!;
    expect(ultimo).toMatchObject({ tipo: "error", id: 7 });
    expect((ultimo as { mensaje: string }).mensaje).toMatch(texto);
    globalThis.__FALLAR = undefined;
  });
});
