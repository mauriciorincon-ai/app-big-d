// @vitest-environment node
// El instrumento (C15, S4): la validación corre los casos de referencia, las propiedades, los errores sembrados y la integridad
// de lo aprobado; cada sembrado se detecta SOLO porque el sistema real lo atrapa (con el dato limpio no hay alarma, con el
// defecto sí); y el script que abre `pnpm build` se niega a publicar, borra la salida y dice cuántos sembrados detectó.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { contar, falladas, publicable, sembradosDetectados, type Validacion } from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { sembrados } from "@/lib/instrumento/sembrados";
import { validar } from "@/lib/instrumento/validar";
import { armarBaseFuturo } from "../lib/base-futuro";

const RAIZ = process.cwd();
const temporales: string[] = [];
const temporal = () => {
  const d = mkdtempSync(join(tmpdir(), "bigd-instrumento-"));
  temporales.push(d);
  return d;
};
afterEach(() => {
  for (const d of temporales.splice(0)) rmSync(d, { recursive: true, force: true });
});

const fila = (id: string, ok: boolean) => ({ id, descripcion: { es: id, en: id }, ok, detalle: { es: "", en: "" } });
const verde: Validacion = {
  version: 1,
  base: { casos: ["c"], instantaneas: ["2026-10-06.1"], evidencias: 1 },
  referencias: [fila("r", true)],
  propiedades: [{ ...fila("p", true), corridas: 1, semilla: 1 }],
  sembrados: [fila("s", true)],
  aprobaciones: [fila("a", true)],
  huellaNucleo: null,
};

describe("el veredicto de publicación", () => {
  it("solo es publicable si cada fila de cada bloque pasó y hay algo que validar", () => {
    expect(publicable(verde)).toBe(true);
    expect(publicable({ ...verde, referencias: [] })).toBe(false);
    expect(publicable({ ...verde, propiedades: [] })).toBe(false);
    expect(publicable({ ...verde, sembrados: [] })).toBe(false);
    for (const bloque of ["referencias", "sembrados", "aprobaciones"] as const) expect(publicable({ ...verde, [bloque]: [fila("x", false)] })).toBe(false);
    expect(publicable({ ...verde, propiedades: [{ ...fila("p", false), corridas: 1, semilla: 1 }] })).toBe(false);
  });
  it("cuenta «detectados k de n» y nombra lo que falló con su bloque", () => {
    const rojo = { ...verde, sembrados: [fila("a", true), fila("b", false), fila("c", true)] };
    expect(sembradosDetectados(rojo)).toEqual({ ok: 2, total: 3 });
    expect(contar([{ ok: true }, { ok: false }])).toEqual({ ok: 1, total: 2 });
    expect(falladas(rojo).map((f) => `${f.bloque}:${f.fila.id}`)).toEqual(["sembrados:b"]);
  });
});

describe("la validación de la base real", () => {
  const v = validar({ dir: join(RAIZ, "data"), raiz: RAIZ });
  it("pasa: referencias, propiedades, siete sembrados detectados y lo aprobado es lo que aprobó una persona", () => {
    expect(falladas(v)).toEqual([]);
    expect(publicable(v)).toBe(true);
    expect([v.referencias.length, v.propiedades.length, v.sembrados.length, v.aprobaciones.length]).toEqual([9, 7, 7, 6]);
    expect(sembradosDetectados(v)).toEqual({ ok: 7, total: 7 });
    expect(v.huellaNucleo).toMatch(/^[0-9a-f]{64}$/);
  });
  it("no lleva ninguna hora: la misma base da el mismo archivo", () => {
    expect(JSON.stringify(validar({ dir: join(RAIZ, "data"), raiz: RAIZ }))).toBe(JSON.stringify(v));
    expect(JSON.stringify(v)).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe("cada error sembrado se detecta por el sistema real, y el control limpio no grita", () => {
  const ctx = { dir: join(RAIZ, "data"), caso: cargarConocimiento(join(RAIZ, "data")).casos[0] };
  for (const s of sembrados(ctx))
    it(`${s.id} (${s.referencia})`, () => {
      expect(s.limpio(), "el dato limpio no debe dar alarma").toBeNull();
      expect(s.sembrado(), "el defecto debe dar alarma").not.toBeNull();
    });
  it("el sembrado de la base incompleta dice archivo, id y campo", () => {
    const s = sembrados(ctx).find((x) => x.id === "base-incompleta")!;
    expect(s.sembrado()).toMatch(/justificacion_puntaje/);
  });
});

describe("scripts/instrumento/validar (el gate de publicación)", () => {
  const correr = (datos: string, salida: string) =>
    spawnSync("node", ["scripts/instrumento/validar.mjs"], { cwd: RAIZ, encoding: "utf8", env: { ...process.env, BIGD_DATOS: datos, BIGD_SALIDA: salida } });
  function baseSembrada() {
    const datos = temporal();
    armarBaseFuturo(datos, { atlas: true, raiz: RAIZ });
    const salida = join(temporal(), "out");
    mkdirSync(salida);
    writeFileSync(join(salida, "index.html"), "publicable");
    return { datos, salida };
  }
  it("en verde escribe validacion.json en la carpeta de datos y sale 0", () => {
    const { datos, salida } = baseSembrada();
    const r = correr(datos, salida);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("detectados 7 de 7 sembrados");
    expect(r.stdout).toContain("validación en verde: se puede publicar");
    const v = JSON.parse(readFileSync(join(datos, "instrumento/validacion.json"), "utf8")) as Validacion;
    expect(publicable(v)).toBe(true);
    expect(v.base.casos).toEqual(["hospital-futuro"]);
  });
  it("con una evidencia editada a mano sale 1, nombra la fila, dice «no se publica» y borra la salida", () => {
    const { datos, salida } = baseSembrada();
    const dir = join(datos, "evidencias/norte");
    const ruta = join(dir, readdirSync(dir).sort()[0]!);
    writeFileSync(ruta, readFileSync(ruta, "utf8").replace(/puntaje: \d/, (m) => `puntaje: ${m.endsWith("4") ? 3 : 4}`));
    expect(existsSync(salida)).toBe(true);
    const r = correr(datos, salida);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("aprobaciones · evidencias-aprobadas");
    expect(r.stderr).toContain("no se publica");
    expect(existsSync(salida)).toBe(false);
    const v = JSON.parse(readFileSync(join(datos, "instrumento/validacion.json"), "utf8")) as Validacion;
    expect(publicable(v)).toBe(false);
  });
});
