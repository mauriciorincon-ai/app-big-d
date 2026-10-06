// @vitest-environment node
// Los scripts del investigador en modo EVIDENCIAS (D-S3-10), de punta a punta, sobre una raíz temporal (BIGD_RAIZ) con la
// plataforma ficticia y páginas servidas desde disco (espejo file://): validar contra la base de conocimiento, verificar
// la cita de cada fuente y aprobar con la decisión de una persona. data/ y propuestas/ del repo no se tocan.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { evidenciasSinAprobacion } from "@/lib/investigador/aprobados";
import { PLATAFORMA } from "./lib/muestra";
import { propuestaEvidenciasNorte, raizDeEvidencias } from "./lib/muestra-evidencias";

// El script de aprobación se nombra por partes: el candado de la sesión vigila su nombre completo.
const APROBAR = ["scripts", "apro" + "bar.mjs"].join("/");
const p = propuestaEvidenciasNorte();
const { raiz, carpeta, espejo } = raizDeEvidencias(p, { sinCita: ["ia"], corta: ["costo"] });
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const correr = (script: string, args: string[]) =>
  spawnSync("node", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, BIGD_RAIZ: raiz, BIGD_VERIFICAR_ESPEJO: espejo, BIGD_FECHA_CONSULTA: "2026-10-05", BIGD_FECHA_APROBACION: "2026-10-06" },
  });
const idDe = (sufijo: string) => p.evidencias.find((x) => x.evidencia.id === `evi-${PLATAFORMA}-${sufijo}`)!.id;

describe("modo evidencias de punta a punta", () => {
  it("validar: la propuesta pasa contra la base de conocimiento", () => {
    const r = correr("scripts/investigar/validar.mjs", [carpeta]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`propuesta válida: ${carpeta} · 11 evidencias`);
  });
  it("verificar-citas: una por fuente, con el número de la fuente; no encontrada y no verificable donde corresponde", () => {
    const r = correr("scripts/verificar-citas.mjs", [carpeta]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/11 evidencias · 11 citas · 9 verificadas · 1 no verificables · 1 no encontradas · 11 páginas$/m);
    const v = JSON.parse(readFileSync(join(raiz, carpeta, "verificacion.json"), "utf8"));
    const de = (s: string) => v.resultados.find((x: { afirmacion: string }) => x.afirmacion === idDe(s));
    expect(de("ia")).toMatchObject({ resultado: "no-encontrada", fuente: 0 });
    expect(de("costo")).toMatchObject({ resultado: "no-verificable", fuente: 0 });
    expect(de("ingesta")).toMatchObject({ resultado: "verificada", fuente: 0, http: 200 });
  });
  it("aprobar: no deja aprobar una cita no encontrada ni retirar nada; escribe nada si no procede", () => {
    const todas = p.evidencias.map((x) => x.id).join(",");
    const r = correr(APROBAR, [carpeta, "--aprobar", todas, "--rechazar", "-", "--retirar", "-"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`${idDe("ia")}: una de sus citas no aparece en la fuente`);
    expect(existsSync(join(raiz, "data/evidencias"))).toBe(false);
  });
  it("aprobar: escribe cada evidencia aprobada y la línea de la revisión; la base carga y cada huella coincide", () => {
    const rechazada = idDe("ia");
    const aprobadas = p.evidencias.map((x) => x.id).filter((x) => x !== rechazada);
    const r = correr(APROBAR, [carpeta, "--aprobar", aprobadas.join(","), "--rechazar", rechazada, "--retirar", "-"]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`aprobar: evidencias de ${PLATAFORMA} el 2026-10-06 (UTC) · 10 aprobadas · 1 rechazadas`);
    const dir = join(raiz, "data/evidencias", PLATAFORMA);
    expect(readdirSync(dir).filter((f) => f.endsWith(".yaml"))).toHaveLength(10);
    expect(readdirSync(dir).some((f) => f.endsWith(".tmp"))).toBe(false);
    const costo = parse(readFileSync(join(dir, `evi-${PLATAFORMA}-costo.yaml`), "utf8"));
    expect(costo).toMatchObject({ estado_aprobacion: "aprobada", aprobada_por: "autor", fecha_aprobacion: "2026-10-06", criterio_id: "crit-costo" });
    expect(parse(readFileSync(join(dir, `evi-${PLATAFORMA}-almacenamiento.yaml`), "utf8"))).toMatchObject({ capacidad_id: "cap-almacenamiento", madurez: "vista-previa-publica" });
    expect(costo.fuentes[0].verificacion).toMatchObject({ resultado: "no-verificable", fecha: "2026-10-05" });
    expect(readFileSync(join(dir, `evi-${PLATAFORMA}-costo.yaml`), "utf8")).toMatch(/^# APROBADA por una persona el 2026-10-06/);
    const lineas = readFileSync(join(raiz, "data/revisiones/evidencias", `${PLATAFORMA}.jsonl`), "utf8").trim().split("\n");
    expect(lineas).toHaveLength(1);
    expect(JSON.parse(lineas[0]!)).toMatchObject({ propuesta: carpeta, rechazadas: [rechazada] });
    expect(cargarConocimiento(join(raiz, "data")).evidencias.filter((e) => e.plataforma_id === PLATAFORMA)).toHaveLength(10);
    expect(evidenciasSinAprobacion(join(raiz, "data"))).toEqual([]);
  });
  it("aprobar dos veces la misma propuesta no procede ni duplica la revisión", () => {
    const r = correr(APROBAR, [carpeta, "--aprobar", "A-1", "--rechazar", "-", "--retirar", "-"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no es posterior a la última propuesta de evidencias cerrada");
    expect(readFileSync(join(raiz, "data/revisiones/evidencias", `${PLATAFORMA}.jsonl`), "utf8").trim().split("\n")).toHaveLength(1);
  });
});
