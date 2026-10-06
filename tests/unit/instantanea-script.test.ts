// @vitest-environment node
// scripts/instantanea.mjs de punta a punta (D-S3-13) sobre una raíz temporal (BIGD_RAIZ) con la base sembrada: congela
// lo aprobado con la fecha dada, no congela otra si nada cambió, y no escribe nada si la copia de ensayo no carga.
// data/ del repo no se toca.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { armarBaseFuturo, FECHA_INSTANTANEA } from "./lib/base-futuro";

const raices: string[] = [];
afterEach(() => raices.splice(0).forEach((r) => rmSync(r, { recursive: true, force: true })));
function raiz() {
  const r = mkdtempSync(join(tmpdir(), "bigd-inst-"));
  raices.push(r);
  armarBaseFuturo(join(r, "data"));
  return r;
}
const correr = (r: string, ...args: string[]) => spawnSync("node", ["scripts/instantanea.mjs", ...args], { encoding: "utf8", env: { ...process.env, BIGD_RAIZ: r } });
const versiones = (r: string) => readdirSync(join(r, "data/instantaneas")).sort();
const EVI = "data/evidencias/norte/evi-norte-ingesta.yaml";
const editar = (r: string, cambio: (e: Record<string, unknown>) => void) => {
  const e = parse(readFileSync(join(r, EVI), "utf8")) as Record<string, unknown>;
  cambio(e);
  writeFileSync(join(r, EVI), stringify(e));
};

describe("scripts/instantanea.mjs", () => {
  it("sin una fecha AAAA-MM-DD no hace nada", () => {
    const r = raiz();
    for (const args of [[], ["2026-02-30"], ["ayer"]]) {
      const x = correr(r, ...args);
      expect(x.status).toBe(1);
      expect(x.stderr).toContain("la fecha va como argumento, AAAA-MM-DD");
    }
    expect(versiones(r)).toEqual([`${FECHA_INSTANTANEA}.1.json`]);
  });

  it("si nada cambió desde la última, no congela otra", () => {
    const r = raiz();
    const x = correr(r, "2026-09-30");
    expect(x.status).toBe(1);
    expect(x.stderr).toContain(`nada cambió desde ${FECHA_INSTANTANEA}.1: no se congela otra`);
    expect(versiones(r)).toEqual([`${FECHA_INSTANTANEA}.1.json`]);
  });

  it("congela lo aprobado con su anterior y solo los cambios, y la base sigue cargando", () => {
    const r = raiz();
    editar(r, (e) => void (e.puntaje = 2));
    const x = correr(r, "2026-09-30");
    expect(x.status, x.stderr).toBe(0);
    expect(x.stdout).toContain("instantanea: 2026-09-30.1 · 44 evidencias aprobadas · 1 cambios frente a 2026-09-26.1");
    expect(versiones(r)).toEqual([`${FECHA_INSTANTANEA}.1.json`, "2026-09-30.1.json"]);
    const k = cargarConocimiento(join(r, "data"));
    expect(k.instantaneas.at(-1)).toMatchObject({ version: "2026-09-30.1", anterior: `${FECHA_INSTANTANEA}.1`, cambios: [{ evidencia_id: "evi-norte-ingesta", tipo: "modificada" }] });
    expect(readdirSync(join(r, "data/instantaneas")).some((f) => f.endsWith(".tmp"))).toBe(false);
  });

  it("no congela una evidencia aprobada después de la fecha: el ensayo no carga y no escribe nada", () => {
    const r = raiz();
    editar(r, (e) => void (e.fecha_aprobacion = "2026-10-01"));
    const x = correr(r, "2026-09-30");
    expect(x.status).toBe(1);
    expect(x.stderr).toMatch(/2026-09-30\.1\.json:\d+:\d+ · 2026-09-30\.1 · contenido\.evidencias\[\d+\]\.fecha_aprobacion · es posterior a la instantánea \(2026-09-30\)/);
    expect(existsSync(join(r, "data/instantaneas/2026-09-30.1.json"))).toBe(false);
  });

  it("una fecha anterior a la última instantánea no se congela", () => {
    const r = raiz();
    editar(r, (e) => void (e.puntaje = 2));
    const x = correr(r, "2026-09-20");
    expect(x.status).toBe(1);
    expect(x.stderr).toContain(`la última instantánea (${FECHA_INSTANTANEA}.1) es posterior a 2026-09-20`);
    expect(versiones(r)).toEqual([`${FECHA_INSTANTANEA}.1.json`]);
  });
});
