// @vitest-environment node
// M-16 de la auditoría del S1: el mapa publicado de cada plataforma real es EXACTAMENTE el que aprobó una
// persona (huella y versión de la última línea de data/revisiones/). Una palabra cambiada a mano lo rompe.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarDatos } from "@/lib/datos";
import { mapasSinAprobacion } from "@/lib/investigador/aprobados";

const copia = mkdtempSync(join(tmpdir(), "bigd-aprobados-"));
afterAll(() => rmSync(copia, { recursive: true, force: true }));

describe("los mapas publicados son los aprobados", () => {
  it("hay al menos una plataforma real publicada, y todas coinciden con su última revisión", () => {
    const d = cargarDatos();
    expect([...d.atlas.values()].some((a) => !a.plataforma.ficticia)).toBe(true);
    expect(mapasSinAprobacion(d, "data")).toEqual([]);
  });
  it("una palabra editada a mano en una copia lo rompe", () => {
    cpSync("data", copia, { recursive: true });
    const ruta = join(copia, "mapas/fabric.mapa.yaml");
    const texto = readFileSync(ruta, "utf8");
    const i = texto.indexOf("lider:");
    writeFileSync(ruta, texto.slice(0, i) + texto.slice(i).replace(/(es: )(\S)/, "$1Casi $2"));
    const f = mapasSinAprobacion(cargarDatos(copia), copia);
    expect(f).toEqual([expect.stringMatching(/^data\/mapas\/fabric\.mapa\.yaml · su huella no es la que aprobó una persona/)]);
  });
});
