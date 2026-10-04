// @vitest-environment node
// El cargador del build (G14 y la regla «el conocimiento es dato»): los datos reales pasan, y cada forma de
// dato roto rompe la carga con su archivo, su regla y su id — jamás se completa por inferencia. Cada caso
// trabaja sobre una copia de data/ en un directorio temporal; el data/ del repo no se toca.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
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
/**
 * Una plataforma «próximamente» sin mapa, propia de la prueba. Las reales cambian de estado con cada aprobación
 * (Databricks se publicó el 2026-10-04 y rompió cuatro casos que la usaban de ejemplo sin mapa).
 */
const PROXIMA = "nueva";
const conProxima = (d: string) =>
  writeFileSync(join(d, `plataformas/${PROXIMA}.yaml`), stringify({ id: PROXIMA, nombre: { es: "Nueva", en: "New" }, estado: "proximamente", ficticia: false }));
const con = (...fs: ((d: string) => void)[]) => (d: string) => fs.forEach((f) => f(d));

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
    expect(rutaAtlas({ plataformas: d.plataformas.map((p) => ({ ...p, estado: "proximamente" as const })), atlas: new Map(), versiones: new Map(), historicas: new Map() }, "es")).toBe("/es");
  });

  it("B-5: el investigador por defecto es la primera plataforma por id; sin plataformas, la portada", () => {
    const d = cargarDatos();
    expect(rutaInvestigador(d, "es")).toBe(`/es/investigador/${d.plataformas[0]!.id}`);
    expect(rutaInvestigador({ plataformas: [], atlas: new Map(), versiones: new Map(), historicas: new Map() }, "en")).toBe("/en");
  });
});

describe("un dato roto rompe la carga con archivo, regla e id", () => {
  it("una plataforma sin nombre en un idioma", () => {
    const dir = copia(con(conProxima, (d) => editarYaml(join(d, `plataformas/${PROXIMA}.yaml`), (x) => delete (x.nombre as Record<string, string>).en)));
    expect(fallas(dir)).toEqual([expect.stringMatching(/^data\/plataformas\/nueva\.yaml · nombre\.en · /)]);
  });

  it("un archivo que no se llama como su id", () => {
    const dir = copia(con(conProxima, (d) => editarYaml(join(d, `plataformas/${PROXIMA}.yaml`), (x) => (x.id = "nieve"))));
    expect(fallas(dir)).toEqual(["data/plataformas/nueva.yaml · id · el archivo se llama como su id: «nieve.yaml»"]);
  });

  it("una plataforma publicada sin mapa, y una «próximamente» que ya tiene mapa", () => {
    const sinMapa = copia(con(conProxima, (d) => editarYaml(join(d, `plataformas/${PROXIMA}.yaml`), (x) => (x.estado = "publicada"))));
    expect(fallas(sinMapa)).toEqual(["data/plataformas/nueva.yaml · estado · publicada sin mapa: falta data/mapas/nueva.mapa.yaml"]);
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
    expect(fallas(copia(con(conProxima, repetir(`plataformas/${PROXIMA}.yaml`, "id"))))).toEqual([expect.stringMatching(/^data\/plataformas\/nueva\.yaml · yaml · Map keys must be unique/)]);
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

// D-S2-09: las versiones anteriores de un mapa publicado viven en data/mapas/versiones/, con sus bytes aprobados. Se
// cargan como un mapa publicado (se dibujan en la página de diferencias) y cada forma rota nombra su archivo.
describe("versiones archivadas", () => {
  const archivar = (version: string, nombre = `fabric-${version}.mapa.yaml`, cambio?: (m: Record<string, unknown>) => void) => (d: string) => {
    mkdirSync(join(d, "mapas/versiones"), { recursive: true });
    const m = parse(readFileSync(join(d, "mapas/fabric.mapa.yaml"), "utf8"));
    m.version = version;
    cambio?.(m);
    writeFileSync(join(d, "mapas/versiones", nombre), stringify(m));
  };
  const dos = con;
  const vigente = parse(readFileSync(join(RAIZ, "data/mapas/fabric.mapa.yaml"), "utf8")).version as string;
  it("se cargan por plataforma, de la más vieja a la más nueva (0.0.10 va después de 0.0.9)", () => {
    const d = cargarDatos(copia(dos(archivar("0.0.10"), archivar("0.0.9"))), RAIZ);
    // Las dos de la prueba van primero: las archivadas de verdad, si las hay, son de 0.1.0 en adelante.
    expect(d.versiones.get("fabric")!.slice(0, 2).map((v) => [v.version, v.archivo])).toEqual([
      ["0.0.9", "data/mapas/versiones/fabric-0.0.9.mapa.yaml"],
      ["0.0.10", "data/mapas/versiones/fabric-0.0.10.mapa.yaml"],
    ]);
    // Las reales: una por archivo de data/mapas/versiones/.
    const archivos = existsSync(join(RAIZ, "data/mapas/versiones")) ? readdirSync(join(RAIZ, "data/mapas/versiones")).filter((f) => f.endsWith(".mapa.yaml")) : [];
    expect([...cargarDatos().versiones.values()].flat().length).toBe(archivos.length);
  });
  it("cada forma rota nombra su archivo: nombre, plataforma sin mapa, versión que no coincide o no es anterior, otra extensión", () => {
    expect(fallas(copia(archivar("0.0.1", "fabric.v0.0.1.mapa.yaml")))).toEqual([expect.stringMatching(/^data\/mapas\/versiones\/fabric\.v0\.0\.1\.mapa\.yaml · nombre · /)]);
    expect(fallas(copia(con(conProxima, archivar("0.0.1", `${PROXIMA}-0.0.1.mapa.yaml`))))).toEqual(["data/mapas/versiones/nueva-0.0.1.mapa.yaml · versión archivada de «nueva», que no tiene un mapa publicado"]);
    expect(fallas(copia(archivar("0.0.2", "fabric-0.0.1.mapa.yaml")))).toEqual(["data/mapas/versiones/fabric-0.0.1.mapa.yaml · /version · dice 0.0.2 y el nombre 0.0.1"]);
    expect(fallas(copia(archivar(vigente)))).toEqual([`data/mapas/versiones/fabric-${vigente}.mapa.yaml · /version · ${vigente} no es anterior a la vigente (${vigente})`]);
    // Un archivo con otra extensión no se ignora en silencio: es una falla de nombre (S2-AUD-40).
    expect(fallas(copia(archivar("0.0.1", "fabric-0.0.1.mapa.yml")))).toEqual([expect.stringMatching(/^data\/mapas\/versiones\/fabric-0\.0\.1\.mapa\.yml · nombre · /)]);
  });
  it("una archivada de una plataforma real que las reglas de hoy no validan pasa a histórica: se lista con sus motivos y no se dibuja", () => {
    const d = cargarDatos(copia(archivar("0.0.1", undefined, (m) => ((m.nodos as { fuentes: unknown[] }[])[0]!.fuentes = []))), RAIZ);
    const [h] = d.historicas.get("fabric")!;
    expect([h!.version, h!.archivo]).toEqual(["0.0.1", "data/mapas/versiones/fabric-0.0.1.mapa.yaml"]);
    expect(h!.motivos.length).toBeGreaterThan(0);
    for (const f of h!.motivos) expect(f).toMatch(/^data\/mapas\/versiones\/fabric-0\.0\.1\.mapa\.yaml · V\d+ · /);
    expect(d.versiones.get("fabric")?.some((v) => v.version === "0.0.1")).toBeFalsy();
  });
  it("hoy no hay ninguna histórica", () => {
    // Si una versión pasa a histórica, es una decisión que se registra en la bitácora y se cambia esta prueba en el
    // mismo commit: así nunca ocurre en silencio (ADR `map-versioning`, decisión 6).
    expect([...cargarDatos().historicas.values()].flat()).toEqual([]);
  });
  // Una ficticia no tiene aprobación que ancle sus versiones: la suya que no valida rompe la carga, y la regla 12
  // (solo dominios reservados) vale también para sus versiones archivadas (S2-AUD-33).
  const archivarEjemplo = (version: string, cambio: (m: Record<string, unknown>) => void) => (d: string) => {
    mkdirSync(join(d, "mapas/versiones"), { recursive: true });
    const m = parse(readFileSync(join(d, "mapas/plataforma-ejemplo.mapa.yaml"), "utf8"));
    m.version = version;
    cambio(m);
    writeFileSync(join(d, "mapas/versiones", `plataforma-ejemplo-${version}.mapa.yaml`), stringify(m));
  };
  it("en una ficticia: una archivada que no valida rompe la carga, y una que cita un dominio real también", () => {
    const sinFuentes = fallas(copia(archivarEjemplo("0.0.1", (m) => ((m.nodos as { fuentes: unknown[] }[])[0]!.fuentes = []))));
    expect(sinFuentes.length).toBeGreaterThan(0);
    for (const f of sinFuentes) expect(f).toMatch(/^data\/mapas\/versiones\/plataforma-ejemplo-0\.0\.1\.mapa\.yaml · V\d+ · /);
    const real = fallas(copia(archivarEjemplo("0.0.1", (m) => ((m.nodos as { fuentes: { url: string }[] }[])[0]!.fuentes[0]!.url = "https://docs.databricks.com/x"))));
    expect(real).toEqual([expect.stringMatching(/^data\/mapas\/versiones\/plataforma-ejemplo-0\.0\.1\.mapa\.yaml · \/nodos\/0\/fuentes\/0\/url · .*una plataforma ficticia solo cita dominios reservados/)]);
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
