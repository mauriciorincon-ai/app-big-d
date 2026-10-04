import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTRATO_VERSION } from "diagramador";
import { describe, expect, it } from "vitest";
import { FUENTES_MAQUETA, PAQUETE, huellasDeLaCopia, leerLock, sha256, versionDelContrato } from "../../scripts/contrato/huellas.mjs";

// Gate de la COPIA FIJADA del contrato del diagramador (regla del reusable: el paquete cumple el
// CONTRATO y lleva CONTRATO.lock con su huella). Recalcula cada huella: un byte cambiado en la copia
// (un formateador, una edición «de paso») la pone en rojo. Contra la planeadora compara
// `scripts/contrato/verificar.mjs` (local) y `/cierre-sprint` (desde la planeadora).
describe("CONTRATO.lock", () => {
  const { version, huellas } = leerLock() as { version: string; huellas: Map<string, string> };
  const copia = huellasDeLaCopia() as [string, string][];

  it("declara la versión del CONTRATO.md copiado, que es la que implementa el paquete", () => {
    expect(version).toBe(versionDelContrato());
    expect(version).toBe(CONTRATO_VERSION);
  });

  it("cubre exactamente los archivos de la copia", () => {
    expect([...huellas.keys()]).toEqual(copia.map(([ruta]) => ruta));
  });

  it.each(copia)("%s coincide byte a byte con su huella", (ruta, h) => {
    expect(huellas.get(ruta), ruta).toBe(h);
  });

  it("la tabla de métricas y las fuentes son las mismas que sirve la maqueta (G15)", () => {
    for (const f of ["metricas.json", "cobertura.json", "space-grotesk.woff2", "jetbrains-mono.woff2"]) {
      expect(sha256(join(PAQUETE, "metricas", f)), f).toBe(sha256(join(FUENTES_MAQUETA, f)));
    }
    const metricas = JSON.parse(readFileSync(join(PAQUETE, "metricas/metricas.json"), "utf8"));
    expect(metricas.fuentes["space-grotesk"].sha256).toBe(sha256(join(PAQUETE, "metricas/space-grotesk.woff2")));
    expect(metricas.fuentes["jetbrains-mono"].sha256).toBe(sha256(join(PAQUETE, "metricas/jetbrains-mono.woff2")));
  });
});
