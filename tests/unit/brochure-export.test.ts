// El export que consume la vitrina de hoja-de-vida (contrato brochure-export v1.0.0). Se valida con el esquema de la
// vitrina (copia fijada en tests/unit/lib/brochure-export-schema.ts) y se recuenta contra el repo todo lo que el repo
// puede recontar: un «medido» que nadie recuenta se desincroniza en silencio la primera vez que cambia el dato.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { brochureExportSchema } from "./lib/brochure-export-schema";

const leer = (ruta: string) => readFileSync(ruta, "utf8");
const TEXTO = leer("docs/brochure-export.json");
const exportado = JSON.parse(TEXTO) as {
  app: { version_repo: string; sprints_cerrados: number };
  funcionalidades: {
    total: number;
    fuente_del_conteo: string;
    grupos: { features: { seccion_manual: string }[] }[];
  };
  metricas: { clave: string; valor: number }[];
};
const valor = (clave: string) =>
  exportado.metricas.find((m) => m.clave === clave)?.valor;

/** Huella SHA-256 de lo que sigue a la marca en la copia del esquema (la del archivo de la vitrina, byte a byte). */
const HUELLA_ESQUEMA =
  "3663f8a717e74c113f5edb65a2746b0b8f6c7004fc15bec3417385f3d2a3cb05";
const MARCA = "// --- copia literal desde aquí ---\n";

/** Las funciones numeradas del manual en español: «#### N. Nombre · desde el Sprint N» → «N. Nombre». */
function seccionesDelManual(): string[] {
  const manual = leer("docs/MANUAL-DE-USO.md");
  const espanol = manual.slice(
    manual.indexOf("## Español"),
    manual.indexOf("## English"),
  );
  return [...espanol.matchAll(/^#### (\d+\. .+?)(?: · .*)?$/gm)].map(
    (m) => m[1],
  );
}

/** Las plataformas reales con mapa aprobado: la ficticia (la carnada de «N plataformas») no se cuenta. */
function plataformasReales(): string[] {
  return readdirSync("data/plataformas")
    .filter((f) => f.endsWith(".yaml"))
    .map(
      (f) =>
        parse(leer(`data/plataformas/${f}`)) as {
          id: string;
          ficticia: boolean;
        },
    )
    .filter((p) => !p.ficticia && existsSync(`data/mapas/${p.id}.mapa.yaml`))
    .map((p) => p.id);
}

describe("docs/brochure-export.json", () => {
  it("cumple el esquema de la vitrina (brochure-export v1.0.0)", () => {
    const r = brochureExportSchema.safeParse(exportado);
    expect(
      r.success,
      r.success ? "" : JSON.stringify(r.error.issues, null, 2),
    ).toBe(true);
  });

  it("la copia del esquema es la de la vitrina, byte a byte", () => {
    const copia = leer("tests/unit/lib/brochure-export-schema.ts");
    expect(copia).toContain(MARCA);
    expect(
      createHash("sha256").update(copia.split(MARCA)[1]).digest("hex"),
    ).toBe(HUELLA_ESQUEMA);
  });

  it("trae las métricas obligatorias, una vez cada una", () => {
    const claves = exportado.metricas.map((m) => m.clave);
    for (const c of [
      "funcionalidades",
      "plataformas_en_el_atlas",
      "evidencias_fechadas",
      "pruebas_automaticas",
      "costo_operacion_mensual",
    ])
      expect(claves, c).toContain(c);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("cuenta las funciones del manual: el total, la métrica y cada sección citada existen", () => {
    const secciones = seccionesDelManual();
    expect(exportado.funcionalidades.fuente_del_conteo).toBe(
      "docs/MANUAL-DE-USO.md",
    );
    expect(exportado.funcionalidades.total).toBe(secciones.length);
    expect(valor("funcionalidades")).toBe(secciones.length);
    const citadas = exportado.funcionalidades.grupos.flatMap((g) =>
      g.features.map((f) => f.seccion_manual),
    );
    for (const s of citadas) expect(secciones, s).toContain(s);
    expect(new Set(citadas).size).toBe(citadas.length);
  });

  it("recuenta contra el repo lo que el repo puede recontar", () => {
    const reales = plataformasReales();
    expect(valor("plataformas_en_el_atlas")).toBe(reales.length);
    const evidencias = reales.flatMap((p) =>
      readdirSync(`data/evidencias/${p}`).filter((f) => f.endsWith(".yaml")),
    );
    expect(valor("evidencias_fechadas")).toBe(evidencias.length);
    const nodos = reales.map(
      (p) =>
        (parse(leer(`data/mapas/${p}.mapa.yaml`)) as { nodos: unknown[] }).nodos
          .length,
    );
    expect(valor("componentes_en_el_atlas")).toBe(
      nodos.reduce((a, b) => a + b, 0),
    );
    const adrs = readdirSync("decisions").filter(
      (f) => f.endsWith(".md") && !f.startsWith("PLANTILLA"),
    );
    expect(valor("decisiones_registradas")).toBe(adrs.length);
    const pkg = JSON.parse(leer("package.json")) as {
      version: string;
      dependencies: Record<string, string>;
    };
    expect(valor("dependencias_runtime")).toBe(
      Object.keys(pkg.dependencies).length,
    );
    expect(exportado.app.version_repo).toBe(pkg.version);
    const cerrados = readdirSync("sprints")
      .filter((f) => /^SPRINT_\d{3}-summary\.md$/.test(f))
      .filter((f) => /^status: closed$/m.test(leer(`sprints/${f}`)));
    expect(exportado.app.sprints_cerrados).toBe(cerrados.length);
  });

  it("no lleva ningún enlace (cero enlaces publicados)", () => {
    expect(TEXTO).not.toMatch(/:\/\/|www\./);
  });
});
