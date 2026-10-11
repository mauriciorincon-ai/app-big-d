// @vitest-environment node
// Gate de los avisos de seguridad aceptados (`auditConfig.ignoreGhsas` en pnpm-workspace.yaml, S2 2026-10-02): el
// audit de la CI los salta, así que alguien tiene que vigilar que el permiso no crezca en silencio. Cada aviso
// ignorado (1) está en esta tabla con el paquete que afecta, y (2) ese paquete NO se alcanza desde ninguna
// dependencia de producción del lockfile (solo de desarrollo: no viaja al sitio exportado), y (3) tiene su ADR
// (kit v1.34.0: `decisions/audit-exception-*.md` con el id, la ruta de dependencias, la fecha y la condición de retiro).
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

/** Aviso → paquete. Agregar una fila exige el mismo razonamiento escrito en pnpm-workspace.yaml. */
const ACEPTADOS: Record<string, string> = {
  "GHSA-vfj7-8cjw-p6xm": "braces",
};

type Importador = Record<
  "dependencies" | "optionalDependencies" | "devDependencies",
  Record<string, { version: string }> | undefined
>;
interface Lock {
  importers: Record<string, Importador>;
  snapshots: Record<
    string,
    {
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    }
  >;
}

/** Nombres de paquete alcanzables desde las dependencias de producción de todos los importadores del lockfile. */
function alcanzablesEnProduccion(
  lock: Lock,
  campos: readonly (keyof Importador)[] = [
    "dependencies",
    "optionalDependencies",
  ],
): Set<string> {
  const vistos = new Set<string>();
  const nombres = new Set<string>();
  const pendientes: string[] = [];
  for (const imp of Object.values(lock.importers))
    for (const campo of campos)
      for (const [nombre, { version }] of Object.entries(imp[campo] ?? {}))
        if (!version.startsWith("link:"))
          pendientes.push(`${nombre}@${version}`);
  while (pendientes.length) {
    const clave = pendientes.pop()!;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    nombres.add(clave.slice(0, clave.indexOf("@", 1)));
    const snap = lock.snapshots[clave];
    for (const deps of [snap?.dependencies, snap?.optionalDependencies])
      for (const [nombre, version] of Object.entries(deps ?? {}))
        pendientes.push(`${nombre}@${version}`);
  }
  return nombres;
}

describe("avisos de seguridad ignorados en el audit", () => {
  const ws = parse(readFileSync("pnpm-workspace.yaml", "utf8")) as {
    auditConfig?: { ignoreGhsas?: string[] };
  };
  const ignorados = ws.auditConfig?.ignoreGhsas ?? [];
  const lock = parse(readFileSync("pnpm-lock.yaml", "utf8")) as Lock;

  it("cada aviso ignorado está documentado aquí con su paquete", () => {
    expect(ignorados.filter((g) => !(g in ACEPTADOS))).toEqual([]);
  });

  it("cada aviso ignorado tiene su ADR con la ruta, la fecha y la condición de retiro (kit v1.34.0)", () => {
    const adrs = readdirSync("decisions")
      .filter((f) => f.startsWith("audit-exception-"))
      .map((f) => readFileSync(`decisions/${f}`, "utf8"));
    const sinAdr = ignorados.filter(
      (g) =>
        !adrs.some(
          (t) =>
            t.includes(g) &&
            t.includes(ACEPTADOS[g]!) &&
            /\*\*Date:\*\*/.test(t) &&
            /## Retirement condition/.test(t),
        ),
    );
    expect(sinAdr).toEqual([]);
  });

  it("ningún paquete de un aviso ignorado se alcanza desde producción", () => {
    const prod = alcanzablesEnProduccion(lock);
    expect(prod.size).toBeGreaterThan(10);
    expect(prod.has("next")).toBe(true);
    expect(
      ignorados.map((g) => ACEPTADOS[g]!).filter((p) => prod.has(p)),
    ).toEqual([]);
  });

  it("la caminata sí ve el paquete cuando entra por desarrollo (la prueba puede fallar)", () => {
    const todo = alcanzablesEnProduccion(lock, [
      "dependencies",
      "optionalDependencies",
      "devDependencies",
    ]);
    for (const g of ignorados) expect(todo.has(ACEPTADOS[g]!), g).toBe(true);
  });
});
