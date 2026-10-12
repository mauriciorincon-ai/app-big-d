// @vitest-environment node
// Los gates PROPIOS se demuestran fallando (regla 15 del kit), de forma repetible y sin tocar el repo (S7: S4-M2, S5-B-10, S6-B5).
// Cada demo muta una COPIA o un texto en memoria, exige que el gate falle NOMBRANDO lo esperado y que la copia limpia pase:
//   · RF-09.4, la publicación: una base rota no deja `out/` (scripts/instrumento/validar.mjs).
//   · planes-aprobados: un plan aprobado sin la revisión que lo aprobó.
//   · informe-legible: un presupuesto de lectura que el resumen no cumple.
//   · contrato-lock: un byte cambiado en la copia de un reusable.
//   · lint G2/G3 del paquete: el reloj, el azar, el I/O y los SDK de plataformas no entran.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";
import {
  huellasDeLaCopia,
  leerLock,
  OBJETOS,
  objetoDe,
} from "../../scripts/contrato/huellas.mjs";

const REPO = process.cwd();
const dirs: string[] = [];
afterAll(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true })),
);
const temporal = (prefijo: string) => {
  const d = mkdtempSync(join(tmpdir(), prefijo));
  dirs.push(d);
  return d;
};

/** Una copia de data/ (con el perfil y el plan aprobados, como los dejaría una persona) que el gate de publicación valida. */
function copiaAprobada(): { datos: string; salida: string } {
  const destino = temporal("bigd-rojo-");
  const r = spawnSync(
    "node",
    ["scripts/datos/copia-aprobada.mjs", "--destino", join(destino, "c")],
    { cwd: REPO, encoding: "utf8" },
  );
  expect(r.status, r.stderr).toBe(0);
  return { datos: join(destino, "c", "data"), salida: join(destino, "out") };
}

/** Corre el gate de publicación sobre una base. `out/` de prueba con un archivo dentro, para ver que el gate lo borra. */
function validar(datos: string, salida: string) {
  mkdirSync(salida, { recursive: true });
  writeFileSync(join(salida, "index.html"), "publicable");
  const r = spawnSync("node", ["scripts/instrumento/validar.mjs"], {
    cwd: REPO,
    encoding: "utf8",
    env: { ...process.env, BIGD_DATOS: datos, BIGD_SALIDA: salida },
  });
  return {
    ...r,
    salida: `${r.stdout}\n${r.stderr}`,
    hayOut: existsSync(salida),
  };
}

describe("RF-09.4: sin validación en verde no hay out/", () => {
  it("la base limpia pasa y se puede publicar", () => {
    const { datos, salida } = copiaAprobada();
    const r = validar(datos, salida);
    expect(r.status, r.salida).toBe(0);
    expect(r.salida).toContain("validación en verde: se puede publicar");
  });

  it("S4-M2: un perfil cuyos pesos no suman 100 puntos deja el gate en rojo, que dice «no se publica» y borra out/", () => {
    const { datos, salida } = copiaAprobada();
    const ruta = join(datos, "casos/hospital-futuro.yaml");
    const texto = readFileSync(ruta, "utf8");
    expect(texto).toContain("peso_centesimas: 1800");
    writeFileSync(
      ruta,
      texto.replace("peso_centesimas: 1800", "peso_centesimas: 1801"),
    );
    const r = validar(datos, salida);
    expect(r.status, r.salida).not.toBe(0);
    expect(r.salida).toContain("no se publica");
    expect(r.hayOut).toBe(false);
  });
});

describe("S5-B-10: planes-aprobados", () => {
  it("un plan aprobado sin la línea de revisión que lo aprobó deja el gate en rojo y lo nombra", () => {
    const { datos, salida } = copiaAprobada();
    rmSync(join(datos, "revisiones/planes/hospital-futuro.jsonl"));
    const r = validar(datos, salida);
    expect(r.status, r.salida).not.toBe(0);
    expect(r.salida).toContain("planes-aprobados");
    expect(r.salida).toContain("no se publica");
    expect(r.hayOut).toBe(false);
  });
});

describe("S6-B5: informe-legible", () => {
  it("un presupuesto de lectura que el resumen no cumple deja el gate en rojo y nombra la fila", () => {
    const { datos, salida } = copiaAprobada();
    const ruta = join(datos, "convenciones/informe.yaml");
    const texto = readFileSync(ruta, "utf8");
    expect(texto).toMatch(/palabras_max: 50/);
    writeFileSync(
      ruta,
      texto
        .replace(/palabras_max: 50/, "palabras_max: 3")
        .replace(/silabas_max: \d+/, "silabas_max: 3"),
    );
    const r = validar(datos, salida);
    expect(r.status, r.salida).not.toBe(0);
    expect(r.salida).toContain("informe-legible");
    expect(r.salida).toContain("no se publica");
    expect(r.hayOut).toBe(false);
  });
});

describe("S5-B-10: contrato-lock", () => {
  for (const nombre of Object.keys(OBJETOS))
    it(`${nombre}: un byte cambiado en la copia deja exactamente ese archivo fuera de su huella`, () => {
      const o = objetoDe(nombre);
      const lock = leerLock(undefined, o) as { huellas: Map<string, string> };
      const copia = join(temporal("bigd-lock-"), nombre);
      cpSync(o.paquete, copia, { recursive: true });
      const distintos = () =>
        (huellasDeLaCopia({ ...o, paquete: copia }) as [string, string][])
          .filter(([ruta, h]) => lock.huellas.get(ruta) !== h)
          .map(([ruta]) => ruta);
      expect(distintos()).toEqual([]);
      const [ruta] = [...lock.huellas.keys()];
      writeFileSync(
        join(copia, ruta!),
        `${readFileSync(join(copia, ruta!), "utf8")} `,
      );
      expect(distintos()).toEqual([ruta]);
    });
});

describe("S5-B-10: lint G2/G3 de los reusables", () => {
  const eslint = new ESLint({ cwd: REPO });
  const mensajes = async (codigo: string, paquete: string) => {
    const [r] = await eslint.lintText(codigo, {
      filePath: join(REPO, "packages", paquete, "src/demo-rojo.ts"),
    });
    return r!.messages.map((m) => m.message);
  };

  for (const paquete of ["diagramador", "instrumentos-de-plan"]) {
    it(`${paquete}: sin reloj, sin azar, sin I/O, sin la app y sin SDK de plataformas`, async () => {
      expect(
        await mensajes("export const ok = (a: number) => a + 1;\n", paquete),
      ).toEqual([]);
      expect(
        (await mensajes("export const r = Math.random();\n", paquete)).join(),
      ).toContain("G2");
      expect(
        (await mensajes("export const t = Date.now();\n", paquete)).join(),
      ).toContain("G2: sin reloj");
      expect(
        (await mensajes("export const p = 2 ** 3;\n", paquete)).join(),
      ).toContain("G2");
      expect(
        (
          await mensajes(
            'import { readFileSync } from "node:fs";\nexport const f = readFileSync;\n',
            paquete,
          )
        ).join(),
      ).toContain("no hace I/O");
      expect(
        (
          await mensajes(
            'import { x } from "@/lib/algo";\nexport const y = x;\n',
            paquete,
          )
        ).join(),
      ).toContain("no importa nada de la app");
      expect(
        (
          await mensajes(
            'import { x } from "@databricks/sdk";\nexport const y = x;\n',
            paquete,
          )
        ).join(),
      ).toContain("Planea, no opera");
    });
  }
});
