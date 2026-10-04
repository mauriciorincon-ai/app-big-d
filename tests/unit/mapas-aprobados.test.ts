// @vitest-environment node
// M-16 de la auditoría del S1: el mapa publicado de cada plataforma real es EXACTAMENTE el que aprobó una
// persona (huella y versión de la última línea de data/revisiones/). Una palabra cambiada a mano lo rompe.
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
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
    writeFileSync(ruta, texto.slice(0, i) + texto.slice(i).replace(/(es: "?)(\S)/, "$1Casi $2"));
    const f = mapasSinAprobacion(cargarDatos(copia), copia);
    expect(f).toEqual([expect.stringMatching(/^data\/mapas\/fabric\.mapa\.yaml · su huella no es la que aprobó una persona/)]);
  });
  // D-S2-09: una versión archivada también es la que aprobó una persona, y ninguna aprobada falta del archivo.
  it("una versión archivada que no aprobó nadie, o una aprobada que falta del archivo, lo rompe", () => {
    const otra = mkdtempSync(join(tmpdir(), "bigd-versiones-"));
    try {
      cpSync("data", otra, { recursive: true });
      // Fabric ya tiene archivadas las versiones que reemplazó: la vigente se lee del dato.
      mkdirSync(join(otra, "mapas/versiones"), { recursive: true });
      const texto = readFileSync(join(otra, "mapas/fabric.mapa.yaml"), "utf8");
      const vigente = (parse(texto) as { version: string }).version;
      writeFileSync(join(otra, "mapas/versiones/fabric-0.0.1.mapa.yaml"), texto.replace(`\nversion: ${vigente}\n`, "\nversion: 0.0.1\n"));
      appendFileSync(join(otra, "revisiones/fabric.jsonl"), readFileSync(join(otra, "revisiones/fabric.jsonl"), "utf8").trim().split("\n").at(-1)!.replace(`"mapa_version":"${vigente}"`, '"mapa_version":"0.0.5"') + "\n");
      const f = mapasSinAprobacion(cargarDatos(otra), otra);
      expect(f).toEqual([
        `data/mapas/fabric.mapa.yaml · versión ${vigente}; la aprobada es 0.0.5`,
        expect.stringMatching(/^data\/mapas\/versiones\/fabric-0\.0\.1\.mapa\.yaml · no es la versión 0\.0\.1 que aprobó una persona/),
        "data/mapas/versiones/fabric-0.0.5.mapa.yaml · falta: la versión 0.0.5 se aprobó y no está archivada",
      ]);
    } finally {
      rmSync(otra, { recursive: true, force: true });
    }
  });
  // S2-AUD-09: la prueba anterior falla por la versión (0.0.1 no está en ninguna revisión); esta, solo por la huella.
  it("una palabra cambiada a mano en una versión archivada lo rompe (la huella, no la versión)", () => {
    const otra = mkdtempSync(join(tmpdir(), "bigd-archivada-"));
    try {
      cpSync("data", otra, { recursive: true });
      const v = [...cargarDatos().versiones.values()].flat()[0]!;
      const ruta = join(otra, "mapas/versiones", v.archivo.split("/").at(-1)!);
      const texto = readFileSync(ruta, "utf8");
      const i = texto.indexOf("lider:");
      // «Casi» va dentro de las comillas si el texto las lleva: delante de ellas rompería el YAML, no la huella.
      writeFileSync(ruta, texto.slice(0, i) + texto.slice(i).replace(/(es: "?)(\S)/, "$1Casi $2"));
      expect(mapasSinAprobacion(cargarDatos(otra), otra)).toEqual([expect.stringContaining(`${v.archivo} · no es la versión ${v.version} que aprobó una persona`)]);
    } finally {
      rmSync(otra, { recursive: true, force: true });
    }
  });
  // S2-AUD-10: una archivada que las reglas de hoy no validan pasa a histórica; su huella se sigue comprobando.
  it("una versión histórica carga, se lista con su motivo y su huella sigue contando", () => {
    const otra = mkdtempSync(join(tmpdir(), "bigd-historica-"));
    try {
      cpSync("data", otra, { recursive: true });
      const v = [...cargarDatos().versiones.values()].flat()[0]!;
      const ruta = join(otra, "mapas/versiones", v.archivo.split("/").at(-1)!);
      const texto = readFileSync(ruta, "utf8");
      const antes = (parse(texto) as { contrato_version: string }).contrato_version;
      writeFileSync(ruta, texto.replace(`contrato_version: ${antes}`, "contrato_version: 0.2.0"));
      const d = cargarDatos(otra);
      const id = v.archivo.split("/").at(-1)!.replace(`-${v.version}.mapa.yaml`, "");
      expect(d.historicas.get(id)!.map((h) => [h.version, h.motivos.some((m) => / · V1 · /.test(m))])).toEqual([[v.version, true]]);
      // Al cambiar sus bytes ya no es la versión aprobada: la integridad cubre también a las históricas.
      expect(mapasSinAprobacion(d, otra)).toEqual([expect.stringContaining(`${v.archivo} · no es la versión ${v.version} que aprobó una persona`)]);
    } finally {
      rmSync(otra, { recursive: true, force: true });
    }
  });
});
