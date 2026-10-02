// @vitest-environment node
// El cargador del build (G14 y la regla «el conocimiento es dato»): los datos reales pasan, y cada forma de
// dato roto rompe la carga con su archivo, su regla y su id — jamás se completa por inferencia. Cada caso
// trabaja sobre una copia de data/ en un directorio temporal; el data/ del repo no se toca.
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { cargarDatos, datos, ErrorDeDatos, esDominioDeEjemplo, esFechaCivil, fechaDeConsulta, rutaAtlas, rutaInvestigador, sumarDias } from "@/lib/datos";

const RAIZ = process.cwd();
const copias: string[] = [];
afterEach(() => {
  for (const d of copias.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Una copia de data/ en un temporal, con un cambio aplicado. */
function copia(cambio: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "bigd-datos-"));
  copias.push(dir);
  cpSync(join(RAIZ, "data"), dir, { recursive: true });
  cambio(dir);
  return dir;
}
const editarYaml = (archivo: string, f: (d: Record<string, unknown>) => void) => {
  const d = parse(readFileSync(archivo, "utf8"));
  f(d);
  writeFileSync(archivo, stringify(d));
};
function fallas(dir: string): string[] {
  try {
    cargarDatos(dir, RAIZ);
  } catch (e) {
    if (e instanceof ErrorDeDatos) return e.fallas;
    throw e;
  }
  return [];
}

describe("los datos del repo", () => {
  it("cargan: todas las plataformas ordenadas por id, y en el atlas solo las publicadas", () => {
    const d = cargarDatos();
    expect(d.plataformas.map((p) => p.id)).toEqual([...d.plataformas.map((p) => p.id)].sort());
    const publicadas = d.plataformas.filter((p) => p.estado === "publicada").map((p) => p.id);
    expect([...d.atlas.keys()]).toEqual(publicadas);
    expect(publicadas).toContain("plataforma-ejemplo");
    expect(d.atlas.get("plataforma-ejemplo")!.gramatica.id).toBe("plataformas-datos");
  });

  it("se cargan una sola vez por proceso, y el atlas por defecto es la primera publicada por id", () => {
    expect(datos()).toBe(datos());
    const d = cargarDatos();
    const primera = d.plataformas.find((p) => p.estado === "publicada")!.id;
    expect(rutaAtlas(d, "en")).toBe(`/en/atlas/${primera}`);
    expect(rutaAtlas({ plataformas: d.plataformas.map((p) => ({ ...p, estado: "proximamente" as const })), atlas: new Map() }, "es")).toBe("/es");
  });

  it("B-5: el investigador por defecto es la primera plataforma por id; sin plataformas, la portada", () => {
    const d = cargarDatos();
    expect(rutaInvestigador(d, "es")).toBe(`/es/investigador/${d.plataformas[0]!.id}`);
    expect(rutaInvestigador({ plataformas: [], atlas: new Map() }, "en")).toBe("/en");
  });
});

describe("un dato roto rompe la carga con archivo, regla e id", () => {
  it("una plataforma sin nombre en un idioma", () => {
    const dir = copia((d) => editarYaml(join(d, "plataformas/databricks.yaml"), (x) => delete (x.nombre as Record<string, string>).en));
    expect(fallas(dir)).toEqual([expect.stringMatching(/^data\/plataformas\/databricks\.yaml · nombre\.en · /)]);
  });

  it("un archivo que no se llama como su id", () => {
    const dir = copia((d) => editarYaml(join(d, "plataformas/snowflake.yaml"), (x) => (x.id = "nieve")));
    expect(fallas(dir)).toEqual(["data/plataformas/snowflake.yaml · id · el archivo se llama como su id: «nieve.yaml»"]);
  });

  it("una plataforma publicada sin mapa, y una «próximamente» que ya tiene mapa", () => {
    const sinMapa = copia((d) => editarYaml(join(d, "plataformas/databricks.yaml"), (x) => (x.estado = "publicada")));
    expect(fallas(sinMapa)).toEqual(["data/plataformas/databricks.yaml · estado · publicada sin mapa: falta data/mapas/databricks.mapa.yaml"]);
    const conMapa = copia((d) => editarYaml(join(d, "plataformas/plataforma-ejemplo.yaml"), (x) => (x.estado = "proximamente")));
    expect(fallas(conMapa)).toEqual([expect.stringContaining("data/plataformas/plataforma-ejemplo.yaml · estado · «proximamente» pero ya hay")]);
  });

  it("un mapa sin plataforma", () => {
    const dir = copia((d) => unlinkSync(join(d, "plataformas/plataforma-ejemplo.yaml")));
    expect(fallas(dir)).toEqual(["data/mapas/plataforma-ejemplo.mapa.yaml · mapa sin plataforma: falta data/plataformas/plataforma-ejemplo.yaml"]);
  });

  it("un nodo sin fuentes: lo rechaza el diagramador, con su regla y su id", () => {
    const dir = copia((d) =>
      editarYaml(join(d, "mapas/plataforma-ejemplo.mapa.yaml"), (x) => {
        (x.nodos as Record<string, unknown>[])[0]!.fuentes = [];
      }),
    );
    const f = fallas(dir);
    expect(f.length).toBeGreaterThan(0);
    expect(f[0]).toMatch(/^data\/mapas\/plataforma-ejemplo\.mapa\.yaml · V\d+ · \/nodos\/0\/fuentes · /);
  });

  it("un mapa que no está aprobado no se publica", () => {
    const dir = copia((d) => editarYaml(join(d, "mapas/plataforma-ejemplo.mapa.yaml"), (x) => (x.estado = "propuesta")));
    expect(fallas(dir).join("\n")).toMatch(/^data\/mapas\/plataforma-ejemplo\.mapa\.yaml · V\d+ · \/estado · /m);
  });

  it("un mapa cuyo nombre no coincide con el de su plataforma", () => {
    const dir = copia((d) => editarYaml(join(d, "plataformas/plataforma-ejemplo.yaml"), (x) => ((x.nombre as Record<string, string>).es = "Otra")));
    expect(fallas(dir)).toEqual([expect.stringContaining("/sujeto_nombre/es · no coincide con el nombre de la plataforma («Otra»)")]);
  });

  it("M-10: un YAML mal formado nombra su archivo (plataforma, mapa y gramática) y no aborta la carga", () => {
    const repetir = (archivo: string, clave: string) => (d: string) => writeFileSync(join(d, archivo), `${clave}: a\n${clave}: b\n${readFileSync(join(d, archivo), "utf8")}`);
    expect(fallas(copia(repetir("plataformas/databricks.yaml", "id")))).toEqual([expect.stringMatching(/^data\/plataformas\/databricks\.yaml · yaml · Map keys must be unique/)]);
    expect(fallas(copia(repetir("mapas/fabric.mapa.yaml", "version")))).toEqual([expect.stringMatching(/^data\/mapas\/fabric\.mapa\.yaml · yaml · Map keys must be unique/)]);
    expect(fallas(copia(repetir("gramaticas/plataformas-datos.gramatica.yaml", "id")))).toEqual([expect.stringMatching(/^data\/gramaticas\/plataformas-datos\.gramatica\.yaml · yaml · /)]);
  });

  it("B-46: una plataforma ficticia que cita una fuente fuera de example.org (regla 12)", () => {
    const dir = copia((d) =>
      editarYaml(join(d, "mapas/plataforma-ejemplo.mapa.yaml"), (x) => {
        ((x.nodos as { fuentes: { url: string }[] }[])[0]!.fuentes[0]!).url = "https://learn.microsoft.com/x";
      }),
    );
    expect(fallas(dir)).toEqual([expect.stringMatching(/^data\/mapas\/plataforma-ejemplo\.mapa\.yaml · \/nodos\/0\/fuentes\/0\/url · .+ · una plataforma ficticia solo cita dominios reservados/)]);
  });
  it("B-46: dominios reservados para ejemplos, sí; uno real o parecido, no", () => {
    for (const u of ["https://example.org/x", "https://example.com/", "https://ejemplo.invalid/a", "https://docs.plataforma.example/b", "https://a.test/"]) expect(esDominioDeEjemplo(u), u).toBe(true);
    for (const u of ["https://learn.microsoft.com/x", "https://example.org.evil.com/", "http://example.org/x", "https://notexample.org/", "no es url"]) expect(esDominioDeEjemplo(u), u).toBe(false);
  });

  it("B-17 c: un mapa con dos recorridos (el atlas dibuja uno por mapa)", () => {
    const dir = copia((d) =>
      editarYaml(join(d, "mapas/plataforma-ejemplo.mapa.yaml"), (x) => {
        const r = x.recorridos as { id: string }[];
        r.push({ ...structuredClone(r[0]!), id: "otro-recorrido" });
      }),
    );
    expect(fallas(dir)).toEqual(["data/mapas/plataforma-ejemplo.mapa.yaml · /recorridos · plataforma-ejemplo · el atlas dibuja un recorrido por mapa y este trae 2"]);
  });

  it("una gramática que falta o que está rota", () => {
    const falta = copia((d) => unlinkSync(join(d, "gramaticas/plataformas-datos.gramatica.yaml")));
    expect(fallas(falta)).toEqual(["data/gramaticas/plataformas-datos.gramatica.yaml · no existe"]);
    const rota = copia((d) => editarYaml(join(d, "gramaticas/plataformas-datos.gramatica.yaml"), (x) => (x.idiomas = ["es"])));
    expect(fallas(rota).join("\n")).toContain("data/gramaticas/plataformas-datos.gramatica.yaml · G");
  });
});

describe("fecha de consulta", () => {
  it("es el día del build, o la que fija BIGD_FECHA_CONSULTA", () => {
    expect(fechaDeConsulta({}, new Date("2026-09-27T23:59:00Z"))).toBe("2026-09-27");
    expect(fechaDeConsulta({ BIGD_FECHA_CONSULTA: "2026-10-20" })).toBe("2026-10-20");
    expect(() => fechaDeConsulta({ BIGD_FECHA_CONSULTA: "20/10/2026" })).toThrow(/AAAA-MM-DD/);
  });
  it("B-6: un día que no existe no es una fecha, aunque tenga la forma", () => {
    expect(esFechaCivil("2026-02-28")).toBe(true);
    expect(esFechaCivil("2028-02-29")).toBe(true);
    expect(esFechaCivil("2026-02-31")).toBe(false);
    expect(esFechaCivil("2026-02-29")).toBe(false);
    expect(() => fechaDeConsulta({ BIGD_FECHA_CONSULTA: "2026-02-31" })).toThrow(/AAAA-MM-DD/);
  });
  it("sumarDias cruza meses y años, y rechaza lo que no es fecha", () => {
    expect(sumarDias("2026-09-27", 30)).toBe("2026-10-27");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(() => sumarDias("2026-13-01", 1)).toThrow(/AAAA-MM-DD/);
  });
});
