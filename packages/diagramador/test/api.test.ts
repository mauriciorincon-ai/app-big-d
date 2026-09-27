// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTRATO_VERSION } from "../src/index";

// El paquete declara la versión del contrato que implementa, y es la de la copia fijada.
describe("API del diagramador", () => {
  it("implementa la versión del CONTRATO.lock", () => {
    const lock = readFileSync(new URL("../CONTRATO.lock", import.meta.url), "utf8");
    expect(lock).toMatch(new RegExp(`^version: ${CONTRATO_VERSION.split(".").join("\\.")}$`, "m"));
  });
});
