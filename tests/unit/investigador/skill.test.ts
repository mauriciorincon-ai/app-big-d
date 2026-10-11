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

describe("la skill /investigar dice las reglas que el código aplica", () => {
  const skill = readFileSync(".claude/skills/investigar/SKILL.md", "utf8");
  it("S2-AUD-06: la madurez sale de una cita; no se hereda del mapa aprobado", () => {
    expect(skill).toContain("no la heredes");
  });
  it("S2-AUD-35: V16 dibuja en cuatro edades, también la fila del lado a lado", () => {
    expect(skill).toContain("cuatro edades");
    expect(skill).toContain("lado a lado");
  });
  it("D-S3-10: el modo evidencias dice su forma y sus reglas (una por criterio, puntaje contra el ancla, madurez con cita)", () => {
    expect(skill).toContain("argument-hint: <plataforma> [capa | evidencias]");
    expect(skill).toContain('"tipo": "evidencias"');
    expect(skill).toContain("-evidencias/propuesta.json");
    expect(skill.replace(/\s+/g, " ")).toContain("por qué ese nivel y no el de al lado");
    expect(skill).toContain("El tope por madurez lo aplica el motor");
  });
});
