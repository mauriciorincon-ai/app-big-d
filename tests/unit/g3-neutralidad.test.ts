import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { archivosDeCodigo, leer } from "./lib/codigo";

// G3 (CONTRATO del diagramador § 2 y regla del reusable): el paquete no contiene el nombre de ninguna
// gramática, mapa ni plataforma registrados. Se buscan los ids y los nombres (en todos sus idiomas,
// sin la aclaración entre paréntesis) en el código fuente del paquete. Los JSON copiados del contrato
// (gramáticas, ejemplos, carnadas) llevan esos nombres por diseño y quedan fuera.
const PAQUETE_SRC = "packages/diagramador/src";
// Plataformas reales del portafolio: fijas aquí además de en data/, para que el gate muerda desde el
// día en que no hay datos (S1, fase 0).
const PLATAFORMAS = ["Databricks", "Microsoft Fabric", "Fabric", "Snowflake"];

function nombresDe(obj: Record<string, unknown>, claveId: string, claveNombre: string): string[] {
  const nombre = obj[claveNombre];
  const textos = typeof nombre === "string" ? [nombre] : Object.values((nombre ?? {}) as Record<string, string>);
  return [String(obj[claveId]), ...textos.map((t) => t.replace(/\s*\(.*?\)\s*$/, ""))];
}

function registrados(): string[] {
  const dir = (d: string) => (existsSync(d) ? readdirSync(d) : []);
  const json = (f: string) => JSON.parse(readFileSync(f, "utf8"));
  const nombres = [
    ...dir("packages/diagramador/gramaticas").flatMap((f) => nombresDe(json(`packages/diagramador/gramaticas/${f}`), "id", "nombre")),
    ...dir("packages/diagramador/ejemplos").flatMap((f) => nombresDe(json(`packages/diagramador/ejemplos/${f}`), "sujeto_id", "sujeto_nombre")),
    ...dir("data/mapas").flatMap((f) => nombresDe(parse(readFileSync(`data/mapas/${f}`, "utf8")), "sujeto_id", "sujeto_nombre")),
    ...dir("data/plataformas").flatMap((f) => nombresDe(parse(readFileSync(`data/plataformas/${f}`, "utf8")), "id", "nombre")),
    ...PLATAFORMAS,
  ];
  return [...new Set(nombres.filter((n) => n.length >= 3))];
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("G3 — el diagramador no nombra ningún dominio", () => {
  const nombres = registrados();
  const archivos = archivosDeCodigo(PAQUETE_SRC);

  it("hay nombres registrados y código que revisar (el gate puede fallar)", () => {
    expect(nombres.length).toBeGreaterThan(10);
    expect(archivos.length).toBeGreaterThan(0);
  });

  it("ningún archivo del paquete contiene un nombre registrado", () => {
    const hallazgos: string[] = [];
    for (const archivo of archivos) {
      const texto = leer(archivo);
      for (const nombre of nombres) {
        const re = new RegExp(`(^|[^\\p{L}\\p{N}-])${escapar(nombre)}($|[^\\p{L}\\p{N}-])`, "iu");
        if (re.test(texto)) hallazgos.push(`${archivo}: «${nombre}»`);
      }
    }
    expect(hallazgos).toEqual([]);
  });
});
