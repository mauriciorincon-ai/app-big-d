// @vitest-environment node
// D-S7-03: los dos sitios del e2e se construyen EN SECUENCIA (un arreglo de webServers los arranca a la vez y los dos builds
// escribían `.next/` y `out/` al mismo tiempo: caché dañada en el S6). S7-B5: antes esta prueba comparaba posiciones de cadenas
// del fuente y habría pasado con un script roto; ahora prueba el COMPORTAMIENTO de la orquestación (scripts/e2e/orquestar.mjs)
// con hijos simulados: el orden, la espera, y qué pasa cuando un servidor muere (S7-B6: incluida la ventana de la espera).
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { orquestar } from "../../scripts/e2e/orquestar.mjs";

const config = readFileSync("playwright.config.ts", "utf8");

class Hijo extends EventEmitter {
  killed = false;
  constructor(readonly nombre: string) {
    super();
  }
  kill() {
    this.killed = true;
    return true;
  }
}

function montar(esperar: (url: string) => Promise<void> = async () => {}) {
  const bitacora: string[] = [];
  const hijos: Hijo[] = [];
  const proceso = new EventEmitter();
  const salir = vi.fn();
  const args = {
    correr: (c: string, a: string[]) => void bitacora.push(`correr ${c} ${a.join(" ")}`),
    lanzar: (n: string) => {
      bitacora.push(`lanzar ${n}`);
      const h = new Hijo(n);
      hijos.push(h);
      return h;
    },
    esperar: async (u: string) => {
      bitacora.push(`esperar ${u}`);
      await esperar(u);
    },
    salir,
    proceso,
    urls: { sembrada: "http://127.0.0.1:3401", real: "http://127.0.0.1:3400" },
  };
  return { args, bitacora, hijos, proceso, salir };
}

describe("el servidor del e2e", () => {
  it("la config declara UN webServer (objeto), no un arreglo, y lo lanza servir.mjs", () => {
    expect(config).toMatch(/webServer:\s*\{/);
    expect(config).not.toMatch(/webServer:\s*\[/);
    expect(config).toContain("scripts/e2e/servir.mjs");
  });

  it("construye la sembrada, luego el dato real, y solo después sirve: primero la sembrada, y el real cuando ella responde", async () => {
    const { args, bitacora } = montar();
    await orquestar(args);
    expect(bitacora).toEqual([
      "correr node scripts/datos/construir-sembrada.mjs",
      "correr pnpm build",
      "lanzar sembrada",
      "esperar http://127.0.0.1:3401",
      "lanzar real",
    ]);
  });

  it("no lanza el dato real mientras la sembrada no responde", async () => {
    let responde!: () => void;
    const { args, bitacora } = montar(() => new Promise<void>((ok) => (responde = ok)));
    const corrida = orquestar(args);
    await Promise.resolve();
    await Promise.resolve();
    expect(bitacora.at(-1)).toBe("esperar http://127.0.0.1:3401");
    expect(bitacora).not.toContain("lanzar real");
    responde();
    await corrida;
    expect(bitacora.at(-1)).toBe("lanzar real");
  });

  it("S7-B6: un servidor que muere MIENTRAS se espera cierra todo y sale con su código, sin levantar el otro", async () => {
    let responde!: () => void;
    const { args, bitacora, hijos, salir } = montar(() => new Promise<void>((ok) => (responde = ok)));
    const corrida = orquestar(args);
    await Promise.resolve();
    await Promise.resolve();
    hijos[0]!.emit("exit", 7); // muere en la ventana de la espera
    expect(salir).toHaveBeenCalledExactlyOnceWith(7);
    expect(hijos[0]!.killed).toBe(true);
    responde();
    await corrida;
    expect(bitacora).not.toContain("lanzar real");
  });

  it("si muere el del dato real, cierra la sembrada y sale con su código; un código nulo cuenta como 1", async () => {
    const { args, hijos, salir } = montar();
    await orquestar(args);
    hijos[1]!.emit("exit", null);
    expect(hijos.map((h) => h.killed)).toEqual([true, true]);
    expect(salir).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("SIGTERM cierra los dos una sola vez y sale con 0; un exit posterior no sale otra vez", async () => {
    const { args, hijos, proceso, salir } = montar();
    await orquestar(args);
    proceso.emit("SIGTERM");
    expect(hijos.map((h) => h.killed)).toEqual([true, true]);
    hijos[0]!.emit("exit", 143);
    expect(salir).toHaveBeenCalledExactlyOnceWith(0);
  });
});
