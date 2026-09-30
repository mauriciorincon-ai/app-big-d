// @vitest-environment node
// Reglas de validación que nacieron en el piloto (propuestas como enmiendas al contrato, «Enmiendas» del
// summary del S1). B-38: un flujo de un nodo hacia sí mismo es un error V4, en su flujo.
import { describe, expect, it } from "vitest";
import { validate } from "../src/index";
import { COBERTURA, EJEMPLOS, GRAMATICAS } from "./lib/contrato";

describe("B-38 — V4: un flujo une dos nodos distintos", () => {
  it("un flujo de un nodo hacia sí mismo da exactamente un error V4, con su id", () => {
    const m = structuredClone(EJEMPLOS.find((x) => x.sujeto_id === "plataforma-ejemplo")!);
    m.flujos.push({ ...m.flujos[0]!, id: "f-bucle", destino: m.flujos[0]!.origen });
    const inf = validate(m, GRAMATICAS[m.gramatica_id]!, { mode: "publicacion", coverage: COBERTURA });
    expect(inf.errores.map((x) => [x.regla, x.id, x.ruta])).toEqual([["V4", "f-bucle", `/flujos/${m.flujos.length - 1}/destino`]]);
  });
  it("los mapas del contrato no tienen ninguno", () => {
    for (const m of EJEMPLOS) expect(m.flujos.filter((f) => f.origen === f.destino), m.sujeto_id).toEqual([]);
  });
});
