// @vitest-environment node
// D3 (S8): duplicar un caso. La copia nace en borrador con su origen, su plan en borrador y sin las revisiones del original;
// el original queda byte a byte igual; un id existente, el mismo id o uno inválido fallan sin escribir. El script se niega
// sobre el repo real dentro de una sesión de Claude Code (lo corre una persona) y, sobre una raíz de ensayo, escribe la copia.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { comandoDuplicarCaso } from "@/lib/caso/comando-duplicar";
import { copiaDe, duplicarCaso, ErrorAlDuplicar, escribir } from "@/lib/caso/duplicar";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";
import { armarBaseFuturo } from "../lib/base-futuro";

const huellas = (d: string) =>
  Object.fromEntries(
    readdirSync(d, { recursive: true, encoding: "utf8" })
      .filter((f) => /\.(ya?ml|jsonl|json)$/.test(f))
      .sort()
      .map((f) => [
        f,
        createHash("sha256")
          .update(readFileSync(join(d, f)))
          .digest("hex"),
      ]),
  );

let raiz: string;
let dir: string;
beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "bigd-d3-"));
  dir = join(raiz, "data");
  mkdirSync(dir);
  armarBaseFuturo(dir);
}, 60_000);
afterEach(() => rmSync(raiz, { recursive: true, force: true }));

describe("duplicarCaso", () => {
  it("la copia nace en borrador, con su origen y su plan, y el original no se toca", () => {
    const antes = huellas(dir);
    const original = cargarConocimiento(dir).casos.find(
      (c) => c.id === "hospital-futuro",
    )!;
    expect(original.estado_aprobacion).toBe("aprobado");
    const escritos = duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b");
    expect(escritos[0]).toBe("casos/hospital-futuro-b.yaml");
    expect(escritos).toContain(
      join("casos", "hospital-futuro-b", "plan", "plan.yaml"),
    );
    // El original, byte a byte; lo único nuevo son los archivos de la copia.
    const despues = huellas(dir);
    for (const [f, h] of Object.entries(antes)) expect(despues[f], f).toBe(h);
    expect(
      Object.keys(despues)
        .filter((f) => !(f in antes))
        .sort(),
    ).toEqual([...escritos].sort());
    expect(
      existsSync(join(dir, "revisiones", "casos", "hospital-futuro-b.jsonl")),
    ).toBe(false);

    const k = cargarConocimiento(dir);
    const copia = k.casos.find((c) => c.id === "hospital-futuro-b")!;
    expect(copia).toMatchObject({
      estado_aprobacion: "borrador",
      origen: { duplicado_de: "hospital-futuro", huella: huellaCaso(original) },
      nombre: {
        es: `${original.nombre.es} (copia)`,
        en: `${original.nombre.en} (copy)`,
      },
    });
    expect(copia.aprobacion).toBeUndefined();
    expect(copia.criterios).toEqual(original.criterios);
    const plan = k.planes.find((p) => p.caso_id === "hospital-futuro-b")!;
    expect(plan.estado_aprobacion).toBe("borrador");
    expect(plan.decisiones.length).toBe(
      k.planes.find((p) => p.caso_id === "hospital-futuro")!.decisiones.length,
    );
  });

  it("un plan aprobado se copia en borrador, sin sello, con sus riesgos y supuestos otra vez propuestos", () => {
    const ruta = join(dir, "casos", "hospital-futuro", "plan", "plan.yaml");
    writeFileSync(
      ruta,
      `# un plan aprobado\ncaso_id: hospital-futuro\nestado_aprobacion: aprobado\naprobacion:\n  fecha: 2026-10-01\n  huella: ${"a".repeat(64)}\n`,
    );
    const modo = readdirSync(
      join(dir, "casos", "hospital-futuro", "plan", "modos-de-falla"),
    )[0]!;
    const rutaModo = join(
      dir,
      "casos",
      "hospital-futuro",
      "plan",
      "modos-de-falla",
      modo,
    );
    writeFileSync(
      rutaModo,
      readFileSync(rutaModo, "utf8").replace(
        /^origen: propuesto-por-agente$/m,
        "origen: declarado-por-usuario",
      ),
    );
    const copia = copiaDe(dir, "hospital-futuro", "hospital-futuro-b");
    expect(
      copia.get(join("casos", "hospital-futuro-b", "plan", "plan.yaml")),
    ).toBe(
      "# un plan aprobado\ncaso_id: hospital-futuro-b\nestado_aprobacion: borrador\n",
    );
    expect(
      copia.get(
        join("casos", "hospital-futuro-b", "plan", "modos-de-falla", modo),
      ),
    ).toMatch(/^origen: propuesto-por-agente$/m);
    expect(
      parse(copia.get("casos/hospital-futuro-b.yaml")!),
    ).not.toHaveProperty("aprobacion");
  });

  it("un id existente, el mismo id, uno inválido o un original que no existe fallan sin escribir nada", () => {
    const antes = huellas(dir);
    duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b");
    const conCopia = huellas(dir);
    expect(() =>
      duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b"),
    ).toThrow(/ya existe un caso «hospital-futuro-b»/);
    expect(() =>
      duplicarCaso(dir, "hospital-futuro", "hospital-futuro"),
    ).toThrow(/el id nuevo es el del original/);
    expect(() => duplicarCaso(dir, "hospital-futuro", "Hospital B")).toThrow(
      /no es válido/,
    );
    expect(() => duplicarCaso(dir, "no-existe", "otro")).toThrow(
      ErrorAlDuplicar,
    );
    for (const hostil of ["../x", "a/b", ".."])
      expect(() => duplicarCaso(dir, hostil, "otro")).toThrow(/no permitido/);
    expect(huellas(dir)).toEqual(conCopia);
    expect(Object.keys(antes).every((f) => conCopia[f] === antes[f])).toBe(
      true,
    );
  });

  it("un relato de fracaso humano del original no se copia, y la copia carga", () => {
    writeFileSync(
      join(dir, "casos", "hospital-futuro", "relato-de-fracaso.yaml"),
      "caso_id: hospital-futuro\ntexto:\n  es: Falló porque nadie era dueño de los datos.\n  en: It failed because nobody owned the data.\nescrito_por: el comité\nfecha: 2026-11-01\norigen: declarado-por-usuario\n",
    );
    const escritos = duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b");
    expect(escritos.some((f) => f.includes("relato-de-fracaso"))).toBe(false);
    expect(
      cargarConocimiento(dir).casos.map((c) => c.id),
    ).toContain("hospital-futuro-b");
  });

  it("si la escritura falla a medias, borra lo que creó (archivos y carpetas) y se puede reintentar", () => {
    const antes = huellas(dir);
    // El segundo archivo cuelga del primero, que es un archivo: su carpeta no puede crearse y `wx` falla tras el primero.
    expect(() =>
      escribir(
        dir,
        new Map([
          ["casos/nuevo/a.yaml", "1"],
          ["casos/nuevo/a.yaml/b.yaml", "2"],
        ]),
      ),
    ).toThrow();
    expect(existsSync(join(dir, "casos", "nuevo"))).toBe(false);
    expect(huellas(dir)).toEqual(antes);
    expect(() => duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b")).not.toThrow();
  });

  it("si la copia no carga en el ensayo, no escribe nada", () => {
    // Una base rota por otro lado (un tercer archivo de convenciones de más): el ensayo falla y el repo queda igual.
    writeFileSync(join(dir, "convenciones", "otro.yaml"), "id: metodo\n");
    const antes = huellas(dir);
    expect(() =>
      duplicarCaso(dir, "hospital-futuro", "hospital-futuro-b"),
    ).toThrow(/convenciones/);
    expect(huellas(dir)).toEqual(antes);
  });
});

describe("scripts/duplicar-caso.mjs", () => {
  const correr = (args: string[], env: NodeJS.ProcessEnv) => {
    try {
      return {
        codigo: 0,
        salida: execFileSync("node", ["scripts/duplicar-caso.mjs", ...args], {
          env,
          encoding: "utf8",
          stdio: "pipe",
        }),
      };
    } catch (e) {
      const x = e as { status: number; stderr: string };
      return { codigo: x.status, salida: x.stderr };
    }
  };

  it("sobre el repo real, dentro de una sesión de Claude Code, se niega: lo corre una persona", () => {
    const r = correr(["hospital-futuro", "hospital-futuro-b"], {
      ...process.env,
      BIGD_RAIZ: "",
      CLAUDECODE: "1",
    });
    expect(r.codigo).toBe(1);
    expect(r.salida).toMatch(/solo una persona duplica un caso/);
    expect(existsSync("data/casos/hospital-futuro-b.yaml")).toBe(false);
  });

  it("sobre una raíz de ensayo escribe la copia con el comando que arma la pantalla", () => {
    const [, , original, nuevo] = comandoDuplicarCaso(
      "hospital-futuro",
      "hospital-futuro-b",
      [],
    ).split(" ");
    const r = correr([original!, nuevo!], { ...process.env, BIGD_RAIZ: raiz });
    expect(r.codigo, r.salida).toBe(0);
    expect(r.salida).toMatch(
      /«hospital-futuro» → «hospital-futuro-b», en borrador/,
    );
    expect(cargarConocimiento(dir).casos.map((c) => c.id)).toEqual([
      "hospital-futuro",
      "hospital-futuro-b",
    ]);
    expect(
      correr(["hospital-futuro"], { ...process.env, BIGD_RAIZ: raiz }).salida,
    ).toMatch(/uso: node scripts\/duplicar-caso\.mjs <caso> <nuevo-id>/);
  });
});

describe("comandoDuplicarCaso", () => {
  it("arma el comando con un id nuevo válido y se niega con uno vacío, inválido, el mismo o existente", async () => {
    const { problemaDuplicar } = await import("@/lib/caso/comando-duplicar");
    expect(comandoDuplicarCaso("hospital-futuro", "hospital-b", ["hospital-futuro"])).toBe("node scripts/duplicar-caso.mjs hospital-futuro hospital-b");
    expect(problemaDuplicar("hospital-futuro", "", [])).toBe("vacio");
    expect(problemaDuplicar("hospital-futuro", "Hospital B; rm -rf", [])).toBe("invalido");
    expect(problemaDuplicar("hospital-futuro", "hospital-futuro", [])).toBe("mismo");
    expect(problemaDuplicar("hospital-futuro", "otro", ["otro"])).toBe("existe");
    expect(() => comandoDuplicarCaso("hospital-futuro", "a b", [])).toThrow(/invalido/);
    expect(() => comandoDuplicarCaso("x y", "otro", [])).toThrow(/no permitido/);
  });
});
