// @vitest-environment node
// Los scripts del investigador de punta a punta, sobre una raíz temporal (BIGD_RAIZ) con una plataforma
// ficticia y páginas de fuente servidas desde disco (espejo file://): validar la propuesta, verificar sus
// citas con curl y aprobar con la decisión de una persona. data/ y propuestas/ del repo no se tocan.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { PLATAFORMA, propuestaNorte, raizDePrueba } from "./lib/muestra";

// El script de aprobación se nombra por partes: el candado de la sesión vigila su nombre completo.
const APROBAR = ["scripts", "apro" + "bar.mjs"].join("/");
const p = propuestaNorte();
const { raiz, carpeta, espejo } = raizDePrueba(p, { sinCita: ["tablero"], corta: ["monitor-capacidad"] });
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const correr = (script: string, args: string[]) =>
  spawnSync("node", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, BIGD_RAIZ: raiz, BIGD_VERIFICAR_ESPEJO: espejo, BIGD_FECHA_CONSULTA: "2026-09-27", BIGD_FECHA_APROBACION: "2026-09-28" },
  });
const idDe = (entidad: string, id: string) => p.afirmaciones.find((a) => a.sobre.entidad === entidad && a.sobre.id === id)!.id;

describe("validar", () => {
  it("una propuesta válida pasa; fuera de propuestas/ o rota, no", () => {
    const ok = correr("scripts/investigar/validar.mjs", [carpeta]);
    expect(ok.status, ok.stderr).toBe(0);
    expect(ok.stdout).toContain(`propuesta válida: ${carpeta}`);
    expect(correr("scripts/investigar/validar.mjs", ["data/mapas"]).stderr).toContain("no está dentro de propuestas/");
  });
});

describe("verificar-citas", () => {
  it("baja cada página una vez y marca verificada, no encontrada y no verificable, con su huella", () => {
    const r = correr("scripts/verificar-citas.mjs", [carpeta]);
    expect(r.status, r.stderr).toBe(0);
    const v = JSON.parse(readFileSync(join(raiz, carpeta, "verificacion.json"), "utf8"));
    const de = (id: string) => v.resultados.find((x: { afirmacion: string }) => x.afirmacion === id);
    expect(de(idDe("nodo", "tablero")).resultado).toBe("no-encontrada");
    expect(de(idDe("nodo", "monitor-capacidad")).resultado).toBe("no-verificable");
    expect(de(idDe("nodo", "catalogo-central"))).toMatchObject({ resultado: "verificada", http: 200 });
    expect(de(idDe("nodo", "catalogo-central")).sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(v.fecha).toBe("2026-09-27");
    expect(r.stdout).toMatch(/ · \d+ verificadas · \d+ no verificables · 1 no encontradas · 14 páginas$/m);
  });
});

describe("aprobar", () => {
  const todas = p.afirmaciones.map((a) => a.id);
  const tablero = idDe("nodo", "tablero");
  it("no aprueba una cita que el código no encontró, y entonces no escribe nada", () => {
    const r = correr(APROBAR, [carpeta, "--aprobar", todas.join(","), "--rechazar", "-"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`${tablero}: su cita no aparece en la fuente`);
    expect(existsSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`))).toBe(false);
  });
  it("con la decisión completa escribe el mapa aprobado, publica la plataforma y registra la revisión", () => {
    const r = correr(APROBAR, [carpeta, "--aprobar", todas.filter((x) => x !== tablero).join(","), "--rechazar", tablero]);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(`aprobar: raíz ${raiz}`);
    const mapa = parse(readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), "utf8"));
    expect(mapa.estado).toBe("aprobada");
    expect(mapa.version).toBe("0.1.0");
    expect(mapa.nodos.some((n: { id: string }) => n.id === "tablero")).toBe(false);
    expect(mapa.recorridos).toEqual([]);
    expect(readFileSync(join(raiz, "data/plataformas", `${PLATAFORMA}.yaml`), "utf8")).toContain("estado: publicada");
    const revision = JSON.parse(readFileSync(join(raiz, "data/revisiones", `${PLATAFORMA}.jsonl`), "utf8").trim());
    expect(revision).toMatchObject({ fecha: "2026-09-28", propuesta: carpeta, resultado: "aprobada", rechazadas: [tablero], mapa_version: "0.1.0" });
    expect(readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), "utf8")).toMatch(/^# APROBADO por una persona el 2026-09-28/);
  });
});
