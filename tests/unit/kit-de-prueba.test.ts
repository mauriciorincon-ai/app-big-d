import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { Gramatica } from "diagramador";
import { vistaVersiones } from "@/lib/atlas";
import { cargarDatos, ErrorDeDatos } from "@/lib/datos";
import { esquemaPlataforma } from "@/lib/datos/esquemas";
import { esquemaVerificacion, sha256, validarPropuesta } from "@/lib/investigador";

// El KIT DE PRUEBA de la guía (docs/kit-de-prueba/, regla 11 del CLAUDE.md) no se pudre: la propuesta de muestra
// sigue pasando la validación por código y su verificación es de ESA versión (si no, la pantalla la mostraría
// «sin verificar»), trae los tres destinos de una cita; y la base incompleta sigue rompiendo la carga con el
// campo y el id. Si el esquema, el contrato o el dibujo cambian, esta prueba avisa antes que la persona.
const KIT = "docs/kit-de-prueba";
const MUESTRA = `${KIT}/propuesta-de-muestra`;
const CARPETA = `${MUESTRA}/propuestas/2026-09-27-plataforma-norte`;
const G = parse(readFileSync("data/gramaticas/plataformas-datos.gramatica.yaml", "utf8")) as Gramatica;
const RANGOS = JSON.parse(readFileSync("packages/diagramador/metricas/cobertura.json", "utf8")).fuentes["space-grotesk"].rangos;
const temporales: string[] = [];
afterAll(() => temporales.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe("kit de prueba · propuesta de muestra", () => {
  const bytes = readFileSync(`${CARPETA}/propuesta.json`);
  it("pasa la validación por código (esquema, contrato, coherencia y dibujo)", () => {
    const r = validarPropuesta(JSON.parse(bytes.toString("utf8")), G, RANGOS);
    expect(r.ok ? [] : r.fallas).toEqual([]);
  });
  it("su verificación es de esta versión y trae las tres salidas: verificada, no verificable y no encontrada", () => {
    const v = esquemaVerificacion.parse(JSON.parse(readFileSync(`${CARPETA}/verificacion.json`, "utf8")));
    expect(v.propuesta_sha256).toBe(sha256(bytes));
    expect(new Set(v.resultados.map((r) => r.resultado))).toEqual(new Set(["verificada", "no-verificable", "no-encontrada"]));
  });
  it("su plataforma es ficticia y «próximamente»: no publica un atlas", () => {
    const p = esquemaPlataforma.parse(parse(readFileSync(`${MUESTRA}/data/plataformas/plataforma-norte.yaml`, "utf8")));
    expect(p).toMatchObject({ id: "plataforma-norte", estado: "proximamente", ficticia: true });
  });
});

describe("kit de prueba · receta (B-26 de la auditoría del S1)", () => {
  it("regenerar la muestra con scripts/kit-de-prueba/generar.mjs da los mismos bytes", () => {
    const salida = mkdtempSync(join(tmpdir(), "bigd-kit-"));
    temporales.push(salida);
    const r = spawnSync("node", ["scripts/kit-de-prueba/generar.mjs", salida], { encoding: "utf8" });
    expect(r.status, r.stderr).toBe(0);
    for (const f of ["propuestas/2026-09-27-plataforma-norte/propuesta.json", "propuestas/2026-09-27-plataforma-norte/verificacion.json", "data/plataformas/plataforma-norte.yaml"])
      expect(readFileSync(join(salida, f), "utf8") === readFileSync(join(MUESTRA, f), "utf8"), f).toBe(true);
  }, 60_000);
});

describe("kit de prueba · base incompleta", () => {
  it("la carga se niega y nombra el archivo, el campo y el id", () => {
    const dir = mkdtempSync(join(tmpdir(), "bigd-kit-"));
    temporales.push(dir);
    cpSync("data", dir, { recursive: true });
    cpSync(`${KIT}/base-incompleta/data`, dir, { recursive: true });
    let fallas: string[] = [];
    try {
      cargarDatos(dir, process.cwd());
    } catch (e) {
      if (!(e instanceof ErrorDeDatos)) throw e;
      fallas = e.fallas;
    }
    expect(fallas).toEqual(["data/mapas/plataforma-norte.mapa.yaml · V3 · /nodos/9/fecha_verificacion · tablero · falta el campo «fecha_verificacion»"]);
  });
});

// La versión anterior de muestra (S2, D-S2-08): con ella, `/[idioma]/atlas/plataforma-ejemplo/versiones` muestra las
// cuatro marcas de diferencia, que los datos reales no traen. Sale del mapa de ejemplo por código.
describe("kit de prueba · versión anterior de muestra", () => {
  const VERSIONES = `${KIT}/versiones-de-muestra`;
  const ARCHIVO = "data/mapas/versiones/plataforma-ejemplo-0.0.9.mapa.yaml";
  it("regenerarla con scripts/kit-de-prueba/versiones.mjs da los mismos bytes", () => {
    const salida = mkdtempSync(join(tmpdir(), "bigd-kit-"));
    temporales.push(salida);
    const r = spawnSync("node", ["scripts/kit-de-prueba/versiones.mjs", salida], { encoding: "utf8" });
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(salida, ARCHIVO), "utf8") === readFileSync(join(VERSIONES, ARCHIVO), "utf8")).toBe(true);
  });
  it("copiada a data/, carga en modo publicación y la página muestra las cuatro clases de cambio", () => {
    const dir = mkdtempSync(join(tmpdir(), "bigd-kit-"));
    temporales.push(dir);
    cpSync("data", dir, { recursive: true });
    cpSync(`${VERSIONES}/data`, dir, { recursive: true });
    const [par, ...resto] = vistaVersiones(cargarDatos(dir, process.cwd()), "plataforma-ejemplo", "es", "2026-10-04").pares;
    expect(resto).toEqual([]);
    expect([par!.antes, par!.despues]).toEqual(["0.0.9", "0.1.0"]);
    expect(new Set([...par!.svg.matchAll(/data-marca="([a-z]+)"/g)].map((m) => m[1]))).toEqual(new Set(["nuevo", "retirado", "renombrado", "madurez"]));
  });
});
