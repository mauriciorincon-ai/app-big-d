// @vitest-environment node
// Gate de contrato Worker ↔ UI (D-S3-08, regla 19): el fixture lo escribió el EMISOR real (`atender`, el mismo que
// recorre el Worker), el lado que LEE lo declara con Zod y lo acepta con su guarda, y el fixture no se separa del
// emisor. La costura de punta a punta (mover un peso → aceptabilidad pintada) la cruza el e2e de la comparación.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { esquemaRespuesta } from "@/lib/caso/contrato-worker";
import { esRespuesta } from "@/lib/caso/respuesta";
import { mensajes } from "../../../scripts/nucleo/emitir-simulacion";

const FIXTURE = JSON.parse(readFileSync(join(process.cwd(), "tests/fixtures/simulacion-worker.json"), "utf8")) as unknown[];

describe("el contrato de los mensajes del Worker", () => {
  it("el fixture es lo que emite hoy `atender` (regenerar: node scripts/nucleo/fixture-simulacion.mjs)", () => {
    expect(JSON.parse(JSON.stringify(mensajes()))).toEqual(FIXTURE);
  });

  it("cada mensaje del fixture cumple el esquema Zod del lado que lee, y trae los tres tipos", () => {
    for (const m of FIXTURE) expect(esquemaRespuesta.safeParse(m).error?.issues ?? []).toEqual([]);
    expect(new Set(FIXTURE.map((m) => (m as { tipo: string }).tipo))).toEqual(new Set(["progreso", "resultado", "error"]));
  });

  it("la guarda de la UI acepta cada mensaje del fixture", () => {
    expect(FIXTURE.filter((m) => !esRespuesta(m))).toEqual([]);
  });

  it.each([
    ["sin id", (m: Record<string, unknown>) => void delete m.id],
    ["un tipo desconocido", (m: Record<string, unknown>) => void (m.tipo = "otro")],
    ["un resultado sin semillas", (m: Record<string, unknown>) => void delete (m.resultado as Record<string, unknown>).semillas],
    ["una clase que no existe", (m: Record<string, unknown>) => void ((m.resultado as Record<string, unknown>).clase = "dudosa")],
    ["una ganadora que no es texto", (m: Record<string, unknown>) => void ((m.resultado as Record<string, unknown>).ganadora = 7)],
    ["una semilla sin zona_gris", (m: Record<string, unknown>) => void delete (m.resultado as { semillas: Record<string, unknown>[] }).semillas[0]!.zona_gris],
    ["una semilla con una clase que no existe", (m: Record<string, unknown>) => void ((m.resultado as { semillas: Record<string, unknown>[] }).semillas[0]!.clase = "x")],
    ["una semiamplitud como texto", (m: Record<string, unknown>) => void ((m.resultado as { semillas: Record<string, unknown>[] }).semillas[0]!.semiamplitud_centesimas = "ancha")],
    ["unos intentos que no son enteros", (m: Record<string, unknown>) => void ((m.resultado as { semillas: Record<string, unknown>[] }).semillas[0]!.intentos = 1.5)],
    ["una central con decimales", (m: Record<string, unknown>) => void ((m.resultado as { semillas: { central: unknown[] }[] }).semillas[0]!.central[0] = [0.5])],
    ["una plataforma que no es texto", (m: Record<string, unknown>) => void ((m.resultado as { plataformas: unknown[] }).plataformas[0] = 3)],
    ["una aceptabilidad con decimales", (m: Record<string, unknown>) => void (((m.resultado as { semillas: { aceptabilidad: number[][] }[] }).semillas[0]!.aceptabilidad[0]![0] = 0.5))],
  ])("la guarda y el esquema rechazan %s", (_que, romper) => {
    const m = structuredClone(FIXTURE.find((x) => (x as { tipo: string }).tipo === "resultado")) as Record<string, unknown>;
    romper(m);
    expect(esRespuesta(m)).toBe(false);
    expect(esquemaRespuesta.safeParse(m).success).toBe(false);
  });
});
