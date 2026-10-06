// @vitest-environment node
// D-S3-10: cada evidencia aprobada de la base es EXACTAMENTE la que aprobó una persona (la huella que guardó la última
// revisión de data/revisiones/evidencias/ que la nombra). Hermana de mapas-aprobados.test.ts: una palabra cambiada a
// mano, una evidencia que nadie aprobó o una aprobada que falta lo rompen. La base de ensayo se aprueba con los scripts
// reales sobre una raíz temporal.
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evidenciasSinAprobacion } from "@/lib/investigador/aprobados";
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
