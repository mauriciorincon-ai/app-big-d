// @vitest-environment node
// Regla 18 (kit v1.32.0): ningún paquete queda por debajo de `main`. La excepción (PR #6 de dependabot, 2026-10-04):
// una bajada que un paquete del PR FIJA exacta es la intención del bump, no pnpm degradando. Se acepta solo así; con un
// rango que admite la versión de main, sin dependiente o sin registro, sigue en rojo.
import { describe, expect, it } from "vitest";
import { comparar, dependientes } from "../../scripts/verificar-dependencias.mjs";

/** Un lockfile v9 mínimo: `vitest@<v>` usa `why-is-node-running@<w>`. */
const lock = (vitest: string, why: string) => `lockfileVersion: '9.0'

importers:

  .:
    devDependencies:
      vitest:
        specifier: ${vitest}
        version: ${vitest}(@types/node@22.20.4)

packages:

  vitest@${vitest}:
    resolution: {integrity: sha512-x}

  why-is-node-running@${why}:
    resolution: {integrity: sha512-y}

snapshots:

  vitest@${vitest}(@types/node@22.20.4):
    dependencies:
      tinyglobby: 0.2.17
      why-is-node-running: ${why}

  why-is-node-running@${why}: {}
`;

const MAIN = lock("5.0.2", "3.2.2");
const PR = lock("5.0.3", "3.2.1");
const registro = (rango: string | null) => (dep: string, ver: string, nombre: string) =>
  dep === "vitest" && ver === "5.0.3" && nombre === "why-is-node-running" ? rango : null;

describe("regla 18 — ningún paquete por debajo de main", () => {
  it("encuentra quién usa la versión que bajó, sin el sufijo de pares", () => {
    expect(dependientes(PR, "why-is-node-running", "3.2.1")).toEqual([{ nombre: "vitest", version: "5.0.3" }]);
    expect(dependientes(PR, "why-is-node-running", "3.2.2")).toEqual([]);
  });
  it("acepta la bajada que un paquete del PR fija exacta, y dice cuál", () => {
    expect(comparar(MAIN, PR, "origin/main", registro("3.2.1"))).toMatchObject({
      degradados: [],
      forzados: ["why-is-node-running: 3.2.2 (origin/main) → 3.2.1, porque vitest@5.0.3 la fija exacta"],
    });
  });
  it("una bajada que el rango declarado admite sigue en rojo: es pnpm degradando", () => {
    expect(comparar(MAIN, PR, "origin/main", registro("^3.2.1")).degradados).toEqual(["why-is-node-running: 3.2.2 (origin/main) → 3.2.1 (este árbol)"]);
  });
  it("sin registro (la consulta falla) no hay prueba de la intención: rojo", () => {
    const falla = () => {
      throw new Error("sin red");
    };
    expect(comparar(MAIN, PR, "origin/main", falla).degradados).toHaveLength(1);
  });
  it("sin bajada no consulta nada, y un paquete quitado no cuenta", () => {
    const nunca = () => {
      throw new Error("no debía consultar");
    };
    expect(comparar(MAIN, lock("5.0.3", "3.2.2"), "origin/main", nunca)).toMatchObject({ degradados: [], forzados: [] });
    expect(comparar(MAIN, lock("5.0.3", "3.2.2").replace(/why-is-node-running/g, "otro"), "origin/main", nunca).degradados).toEqual([]);
  });
});
