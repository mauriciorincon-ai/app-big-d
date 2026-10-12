// @vitest-environment node
// S4-M7: la página /instrumento lee el archivo que escribió el build con un esquema, no con un cast. Un archivo de otra
// versión, con un campo roto o con uno de más falla al leerlo diciendo la ruta del campo.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { leerValidacion } from "@/lib/instrumento/leer";

const dir = mkdtempSync(join(tmpdir(), "bigd-leer-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const fila = { id: "x", descripcion: { es: "a", en: "a" }, ok: true, detalle: { es: "b", en: "b" } };
const valida = () => ({
  version: 1,
  base: { casos: ["c"], instantaneas: ["i"], evidencias: 3 },
  referencias: [fila],
  propiedades: [{ ...fila, corridas: 100, semilla: 7 }],
  sembrados: [fila],
  aprobaciones: [fila],
  huellaNucleo: null,
});
const escribir = (v: unknown) => {
  mkdirSync(join(dir, "instrumento"), { recursive: true });
  writeFileSync(join(dir, "instrumento", "validacion.json"), JSON.stringify(v));
};

describe("leerValidacion", () => {
  it("sin archivo devuelve null; con uno válido, lo devuelve entero (corridas y semilla incluidas)", () => {
    expect(leerValidacion(dir)).toBeNull();
    escribir(valida());
    expect(leerValidacion(dir)).toMatchObject({ version: 1, propiedades: [{ corridas: 100, semilla: 7 }] });
  });
  it.each<[string, (v: Record<string, unknown>) => void, RegExp]>([
    ["otra versión", (v) => void (v.version = 2), /version/],
    ["una propiedad sin corridas", (v) => void delete (v.propiedades as Record<string, unknown>[])[0]!.corridas, /propiedades\.0\.corridas/],
    ["una fila sin detalle en inglés", (v) => void delete ((v.referencias as { detalle: Record<string, unknown> }[])[0]!.detalle).en, /referencias\.0\.detalle\.en/],
    ["un campo de más", (v) => void (v.hora = "12:00"), /hora/],
    ["unas evidencias negativas", (v) => void ((v.base as Record<string, unknown>).evidencias = -1), /base\.evidencias/],
  ])("rechaza %s, y dice dónde", (_, romper, donde) => {
    const v = valida() as unknown as Record<string, unknown>;
    romper(v);
    escribir(v);
    expect(() => leerValidacion(dir)).toThrow(donde);
  });
});
