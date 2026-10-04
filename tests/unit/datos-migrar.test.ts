// @vitest-environment node
// D-S2-01: el dato de una versión menor anterior del contrato sube EN MEMORIA solo por los saltos que el
// contrato declara compatibles; el archivo aprobado no se toca y su huella sigue siendo la que aprobó la persona.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTRATO_VERSION } from "diagramador";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { cargarDatos, ErrorDeDatos } from "@/lib/datos";
import { migradoDesde, migrarContrato } from "@/lib/datos/migrar";

const temporales: string[] = [];
afterEach(() => temporales.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

/** Una copia de data/ con el mapa de Fabric cambiado por `cambio`; devuelve las fallas de la carga. */
function fallasCon(cambio: (mapa: Record<string, unknown>) => void): string[] {
  const dir = mkdtempSync(join(tmpdir(), "bigd-migrar-"));
  temporales.push(dir);
  cpSync("data", dir, { recursive: true });
  const ruta = join(dir, "mapas/fabric.mapa.yaml");
  const mapa = parse(readFileSync(ruta, "utf8"));
  cambio(mapa);
  writeFileSync(ruta, stringify(mapa, { lineWidth: 0, version: "1.2" }));
  try {
    cargarDatos(dir);
    return [];
  } catch (e) {
    if (!(e instanceof ErrorDeDatos)) throw e;
    return e.fallas;
  }
}

describe("migración del dato entre versiones del contrato", () => {
  it("sube 0.3.x a la versión del motor sin tocar nada más ni el objeto original", () => {
    const viejo = { contrato_version: "0.3.0", sujeto_id: "x", nodos: [{ id: "a" }] };
    const nuevo = migrarContrato(viejo);
    expect(nuevo).toEqual({ ...viejo, contrato_version: CONTRATO_VERSION });
    expect(viejo.contrato_version).toBe("0.3.0");
    expect(migradoDesde(viejo)).toBe("0.3.0");
  });
  it("deja igual lo que ya está en la versión del motor y lo que no tiene salto declarado", () => {
    const actual = { contrato_version: CONTRATO_VERSION };
    expect(migrarContrato(actual)).toBe(actual);
    const muyViejo = { contrato_version: "0.2.0" };
    expect(migrarContrato(muyViejo)).toBe(muyViejo);
    expect(migradoDesde(muyViejo)).toBeUndefined();
    expect(migrarContrato(null)).toBeNull();
  });
  // Fabric v0.1.0 se aprobó con el contrato 0.3.0; desde el 2026-10-04 vive archivada con sus bytes aprobados.
  it("la versión archivada de Fabric (v0.1.0) sigue en 0.3.0 en el disco y carga en la versión del motor", () => {
    expect(parse(readFileSync("data/mapas/versiones/fabric-0.1.0.mapa.yaml", "utf8")).contrato_version).toBe("0.3.0");
    expect(cargarDatos().versiones.get("fabric")?.find((v) => v.version === "0.1.0")?.mapa.contrato_version).toBe(CONTRATO_VERSION);
  });
  it("una versión sin salto declarado sigue fallando en V1", () => {
    expect(fallasCon((m) => (m.contrato_version = "0.2.0"))).toEqual([expect.stringMatching(/^data\/mapas\/fabric\.mapa\.yaml · V1 · \/contrato_version/)]);
  });
  it("lo que la versión nueva rechaza sigue siendo error tras migrar: un flujo de un nodo a sí mismo (V4)", () => {
    const f = fallasCon((m) => {
      const flujo = (m.flujos as { origen: string; destino: string }[])[0]!;
      flujo.destino = flujo.origen;
    });
    expect(f.some((x) => / · V4 · /.test(x)), f.join("\n")).toBe(true);
  });
});
