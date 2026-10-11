// @vitest-environment node
// D-S3-10: cada evidencia aprobada de la base es EXACTAMENTE la que aprobó una persona (la huella que guardó la última
// revisión de data/revisiones/evidencias/ que la nombra). Hermana de mapas-aprobados.test.ts: una palabra cambiada a
// mano, una evidencia que nadie aprobó o una aprobada que falta lo rompen. La base de ensayo se aprueba con los scripts
// reales sobre una raíz temporal.
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { huellaDe } from "@/lib/datos/instantanea";
import { casosSinAprobacion, evidenciasSinAprobacion, instantaneasSinAprobacion } from "@/lib/investigador/aprobados";
import { PLATAFORMA } from "./investigador/lib/muestra";
import { raizDeEvidencias } from "./investigador/lib/muestra-evidencias";

const APROBAR = ["scripts", "apro" + "bar.mjs"].join("/");
const { raiz, carpeta, espejo } = raizDeEvidencias();
const datos = join(raiz, "data");
const archivo = (sufijo: string) => join(datos, "evidencias", PLATAFORMA, `evi-${PLATAFORMA}-${sufijo}.yaml`);
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
beforeAll(() => {
  const env = { ...process.env, BIGD_RAIZ: raiz, BIGD_VERIFICAR_ESPEJO: espejo, BIGD_FECHA_CONSULTA: "2026-10-05", BIGD_FECHA_APROBACION: "2026-10-06" };
  const v = spawnSync("node", ["scripts/verificar-citas.mjs", carpeta], { encoding: "utf8", env });
  if (v.status !== 0) throw new Error(v.stderr);
  const a = spawnSync("node", [APROBAR, carpeta, "--aprobar", Array.from({ length: 11 }, (_, i) => `A-${i + 1}`).join(","), "--rechazar", "-", "--retirar", "-"], { encoding: "utf8", env });
  if (a.status !== 0) throw new Error(a.stderr);
});

describe("las evidencias de la base son las aprobadas", () => {
  it("las de data/ del repo coinciden con su revisión", () => {
    expect(evidenciasSinAprobacion("data")).toEqual([]);
  });
  it("los perfiles de caso de data/ del repo: el aprobado coincide con su revisión y el borrador no la necesita (S4)", () => {
    expect(casosSinAprobacion("data")).toEqual([]);
  });
  it("recién aprobadas, todas coinciden", () => {
    expect(evidenciasSinAprobacion(datos)).toEqual([]);
  });
  it("una palabra cambiada a mano lo rompe", () => {
    const ruta = archivo("ingesta");
    const antes = readFileSync(ruta, "utf8");
    try {
      writeFileSync(ruta, antes.replace("La plataforma resuelve", "La plataforma casi resuelve"));
      expect(evidenciasSinAprobacion(datos)).toEqual([expect.stringMatching(/evi-plataforma-norte-ingesta\.yaml · su huella no es la que aprobó una persona el 2026-10-06/)]);
    } finally {
      writeFileSync(ruta, antes);
    }
  });
  it("una evidencia aprobada que nadie aprobó, o una aprobada que falta, lo rompe", () => {
    const ruta = archivo("ingesta");
    const antes = readFileSync(ruta, "utf8");
    try {
      writeFileSync(archivo("ingesta-2"), antes.replace(`id: evi-${PLATAFORMA}-ingesta`, `id: evi-${PLATAFORMA}-ingesta-2`));
      rmSync(ruta);
      expect(evidenciasSinAprobacion(datos)).toEqual([
        expect.stringMatching(/evi-plataforma-norte-ingesta-2\.yaml · ninguna revisión la aprueba/),
        `data/evidencias/${PLATAFORMA}/evi-${PLATAFORMA}-ingesta.yaml · falta: se aprobó y no está en la base`,
      ]);
    } finally {
      rmSync(archivo("ingesta-2"), { force: true });
      writeFileSync(ruta, antes);
    }
  });
});

// AU-S3-01: el caso evalúa la instantánea. Su huella solo prueba que no cambió después de congelarse; esta comprobación
// prueba que lo congelado es lo que aprobó una persona.
describe("las instantáneas congelan solo lo aprobado", () => {
  it("las de data/ del repo: cada evidencia congelada tiene la huella de una revisión", () => {
    expect(readdirSync("data/instantaneas").filter((f) => f.endsWith(".json")).length).toBeGreaterThan(0);
    expect(instantaneasSinAprobacion("data")).toEqual([]);
  });
  it("un puntaje cambiado en la instantánea, con su huella recalculada, pasa el cargador y no esta comprobación", () => {
    const copia = mkdtempSync(join(tmpdir(), "bigd-inst-aprob-"));
    try {
      cpSync("data", join(copia, "data"), { recursive: true });
      const [f] = readdirSync(join(copia, "data/instantaneas")).filter((x) => x.endsWith(".json")).sort();
      const ruta = join(copia, "data/instantaneas", f!);
      const inst = JSON.parse(readFileSync(ruta, "utf8"));
      const e = inst.contenido.evidencias[0];
      e.puntaje = e.puntaje === 4 ? 3 : e.puntaje + 1;
      inst.huella = huellaDe(inst.contenido);
      writeFileSync(ruta, `${JSON.stringify(inst, null, 2)}\n`);
      expect(() => cargarConocimiento(join(copia, "data"))).not.toThrow();
      expect(instantaneasSinAprobacion(join(copia, "data"))).toEqual([expect.stringContaining(`data/instantaneas/${f} · contenido.evidencias[0] · ${e.id} · no es una versión que aprobó una persona`)]);
    } finally {
      rmSync(copia, { recursive: true, force: true });
    }
  });
});
