import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTRATO_VERSION } from "diagramador";
import { informeDeInstrumentos } from "instrumentos-de-plan";
import { describe, expect, it } from "vitest";
import {
  FUENTES_MAQUETA,
  OBJETOS,
  huellasDeLaCopia,
  leerLock,
  objetoDe,
  sha256,
  versionDelContrato,
} from "../../scripts/contrato/huellas.mjs";

// Gate de las COPIAS FIJADAS de los reusables de la casa (regla del reusable: el paquete cumple el CONTRATO y lleva
// CONTRATO.lock con su huella): el diagramador y, desde el S5, los instrumentos de plan. Recalcula cada huella: un byte
// cambiado en la copia (un formateador, una edición «de paso») la pone en rojo. Contra la planeadora compara
// `scripts/contrato/verificar.mjs [--objeto <nombre>]` (local) y `/cierre-sprint` (desde la planeadora).
const VERSION_DEL_PAQUETE: Record<string, string> = {
  diagramador: CONTRATO_VERSION,
  // El informe de los instrumentos declara la versión del contrato que implementa.
  "instrumentos-de-plan": informeDeInstrumentos({
    decisiones: [],
    modos_de_falla: [],
    supuestos: [],
  }).version_contrato,
};

describe.each(Object.keys(OBJETOS))("CONTRATO.lock · %s", (nombre) => {
  const o = objetoDe(nombre);
  const { version, origen, huellas } = leerLock(undefined, o) as {
    version: string;
    origen: string | null;
    huellas: Map<string, string>;
  };
  const copia = huellasDeLaCopia(o) as [string, string][];

  it("declara la versión del CONTRATO.md copiado, que es la que implementa el paquete", () => {
    expect(version).toBe(versionDelContrato(o));
    expect(version).toBe(VERSION_DEL_PAQUETE[nombre]);
  });

  it("fija el commit de la planeadora del que sale la copia (`origen`, D-S3-04)", () => {
    expect(origen).toMatch(/^[0-9a-f]{40}$/);
  });

  it("cubre exactamente los archivos de la copia", () => {
    expect([...huellas.keys()]).toEqual(copia.map(([ruta]) => ruta));
  });

  it.each(copia)("%s coincide byte a byte con su huella", (ruta, h) => {
    expect(huellas.get(ruta), ruta).toBe(h);
  });
});

describe("CONTRATO.lock · diagramador · métricas de la maqueta", () => {
  const o = objetoDe("diagramador");

  it("la tabla de métricas y las fuentes son las mismas que sirve la maqueta (G15)", () => {
    for (const f of [
      "metricas.json",
      "cobertura.json",
      "space-grotesk.woff2",
      "jetbrains-mono.woff2",
    ]) {
      expect(sha256(join(o.paquete, "metricas", f)), f).toBe(
        sha256(join(FUENTES_MAQUETA, f)),
      );
    }
    const metricas = JSON.parse(
      readFileSync(join(o.paquete, "metricas/metricas.json"), "utf8"),
    );
    expect(metricas.fuentes["space-grotesk"].sha256).toBe(
      sha256(join(o.paquete, "metricas/space-grotesk.woff2")),
    );
    expect(metricas.fuentes["jetbrains-mono"].sha256).toBe(
      sha256(join(o.paquete, "metricas/jetbrains-mono.woff2")),
    );
  });
});

describe("CONTRATO.lock · instrumentos-de-plan · implementación congelada", () => {
  const o = objetoDe("instrumentos-de-plan");

  it("lleva el contrato, la implementación y sus carnadas, y nada más (package.json y el lock son de la app)", () => {
    const rutas = (huellasDeLaCopia(o) as [string, string][]).map(([r]) => r);
    expect(rutas).toContain("contrato/CONTRATO.md");
    expect(rutas.filter((r) => r.startsWith("carnadas/")).length).toBe(7);
    expect(rutas.filter((r) => r.startsWith("src/")).length).toBeGreaterThan(0);
    expect(rutas).not.toContain("package.json");
    expect(rutas).not.toContain("CONTRATO.lock");
  });
});
