// @vitest-environment node
// La skill /investigar le dice al modelo qué versión del contrato escribe. En el S2 el paquete subió a 0.4.0 y la
// skill siguió diciendo 0.3.0: el validador rechazó la primera propuesta de Databricks y gastó sus dos reintentos
// en eso (2026-10-03). Toda versión del contrato que nombren la skill y su agente es la de CONTRATO.lock.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lock = readFileSync("packages/diagramador/CONTRATO.lock", "utf8").match(/^version: (\S+)$/m)![1];
const ARCHIVOS = [".claude/skills/investigar/SKILL.md", ".claude/agents/investigador.md"];

describe("la skill /investigar nombra la versión vigente del contrato", () => {
  it("cada «contrato X.Y.Z» es la versión de CONTRATO.lock", () => {
    const menciones = ARCHIVOS.flatMap((a) =>
      readFileSync(a, "utf8")
        .split("\n")
        .flatMap((l, i) => [...l.matchAll(/contrato (\d+\.\d+\.\d+)/g)].map((m) => ({ donde: `${a}:${i + 1}`, version: m[1] }))),
    );
    expect(menciones.length).toBeGreaterThan(0);
    expect(menciones.filter((m) => m.version !== lock)).toEqual([]);
  });
});
