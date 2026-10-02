// @vitest-environment node
// Deriva del dato que nace del contrato: el YAML versionado en data/ es exactamente lo que genera
// scripts/datos/desde-contrato.mjs, y dice lo mismo que su JSON en la copia fijada del contrato, campo por
// campo. Un contrato cambiado sin regenerar, o un YAML editado a mano, lo pone en rojo.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { PARES, RAIZ, generar } from "../../scripts/datos/desde-contrato.mjs";

describe("datos generados desde el contrato del diagramador", () => {
  it.each(PARES)("$hacia es lo que genera el script (regenera con node scripts/datos/desde-contrato.mjs)", (par) => {
    expect(readFileSync(join(RAIZ, par.hacia), "utf8") === generar(par)).toBe(true);
  });

  it.each(PARES)("$hacia dice lo mismo que $desde", (par) => {
    const yaml = parse(readFileSync(join(RAIZ, par.hacia), "utf8"));
    const json = JSON.parse(readFileSync(join(RAIZ, par.desde), "utf8"));
    expect(yaml).toEqual(json);
  });
});
