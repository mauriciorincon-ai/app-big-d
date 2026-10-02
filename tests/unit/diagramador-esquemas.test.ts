// @vitest-environment node
// Deriva del validador generado (CONTRATO § 8: Ajv 8 standalone). El archivo versionado en el paquete debe
// ser exactamente lo que su generador produce hoy desde los esquemas del contrato: un esquema cambiado sin
// regenerar, o una edición a mano del generado, lo pone en rojo.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SALIDA, generar } from "../../scripts/diagramador/compilar-esquemas.mjs";

describe("validador generado de los esquemas del contrato", () => {
  it("coincide byte a byte con lo que genera scripts/diagramador/compilar-esquemas.mjs", async () => {
    const generado: string = await generar();
    const versionado = readFileSync(SALIDA, "utf8");
    expect(versionado === generado, "regenera con: node scripts/diagramador/compilar-esquemas.mjs").toBe(true);
  });
});
