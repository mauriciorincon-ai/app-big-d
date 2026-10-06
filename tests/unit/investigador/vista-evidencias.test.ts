// @vitest-environment node
// El modo EVIDENCIAS (D-S3-10) en la pantalla y en los hooks del investigador, sobre una raíz temporal: la vista prepara
// la propuesta de evidencias pendiente (validada contra la base, con su verificación, el tope por madurez de cada una y
// si reemplaza a una aprobada), y la búsqueda de la propuesta de MAPA no la confunde con una de mapa. El hook de fin la
// valida con el validador de evidencias; el candado deja al investigador leer el esquema de la evidencia y nada más de
// src/lib/datos/.
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarDatos } from "@/lib/datos";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { sha256 } from "@/lib/investigador";
import { vistaInvestigador } from "@/lib/investigador/revision";
import { PLATAFORMA } from "./lib/muestra";
import { propuestaEvidenciasNorte, raizDeEvidencias, verificacionDe } from "./lib/muestra-evidencias";

const REPO = process.cwd();
const RANGOS = JSON.parse(readFileSync("packages/diagramador/metricas/cobertura.json", "utf8")).fuentes["space-grotesk"].rangos;
const p = propuestaEvidenciasNorte();
const { raiz, carpeta } = raizDeEvidencias(p);
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const vista = () => vistaInvestigador(cargarDatos(join(raiz, "data"), REPO), PLATAFORMA, "es", "2026-10-05", raiz, RANGOS, cargarConocimiento(join(raiz, "data")));
const hook = (nombre: string, e: Record<string, unknown>) => spawnSync("node", [`scripts/investigar/hooks/${nombre}.mjs`], { input: JSON.stringify(e), encoding: "utf8", env: { ...process.env, BIGD_RAIZ: raiz } });
const INV = { agent_type: "investigador", agent_id: "a1", cwd: raiz };

describe("vista: la propuesta de evidencias pendiente", () => {
  it("sin verificación: la propuesta aparece válida pero sin verificar; la de mapa no la toma por suya", () => {
    const v = vista();
    expect(v.propuesta).toBeUndefined();
    expect(v.mapa?.sujeto_id).toBe(PLATAFORMA);
    expect(v.evidencias).toMatchObject({ carpeta, fallas: [], verificada: false, fuentes: 11, topeNoDisponible: 2 });
    expect(v.evidencias!.niveles.map((n) => n.valor)).toEqual([0, 1, 2, 3, 4]);
    expect(v.revisionesEvidencias).toEqual([]);
  });
  it("verificada: cada evidencia con su criterio, su tope por madurez, el resultado de su cita y «nueva»", () => {
    const bytes = readFileSync(join(raiz, carpeta, "propuesta.json"));
    writeFileSync(join(raiz, carpeta, "verificacion.json"), JSON.stringify(verificacionDe(p, sha256(bytes), { "A-2": "no-encontrada", "A-3": "no-verificable" })));
    const ev = vista().evidencias!;
    expect(ev.verificada).toBe(true);
    expect(ev.evidencias[0]).toMatchObject({ id: "A-1", criterio: "Almacenamiento", tipo: "capacidad", madurez: "Vista previa pública", tope: 2, topeConVistaPrevia: 4, puntaje: 3, resultado: "verificada", cambio: "nueva" });
    expect(ev.evidencias[0]!.fuentes[0]!.cita.conflicto).toBe("fuente del propio fabricante");
    // Los componentes se nombran por id y la pantalla lee su nombre del mapa aprobado, en el idioma de la página.
    expect(ev.evidencias[0]!.componentes).toEqual(["Catálogo central"]);
    expect(ev.evidencias.find((e) => e.tipo === "transversal")?.criterio).toBeTruthy();
    expect(ev.evidencias[1]!.resultado).toBe("no-encontrada");
    expect(ev.evidencias[2]!.resultado).toBe("no-verificable");
  });
  it("una propuesta inválida muestra las fallas del validador de evidencias", () => {
    const mala = propuestaEvidenciasNorte();
    mala.evidencias[0]!.evidencia.madurez = "rumor";
    const otra = raizDeEvidencias(mala);
    try {
      const v = vistaInvestigador(cargarDatos(join(otra.raiz, "data"), REPO), PLATAFORMA, "es", "2026-10-05", otra.raiz, RANGOS, cargarConocimiento(join(otra.raiz, "data")));
      expect(v.evidencias!.fallas.join("\n")).toContain("madurez «rumor»");
    } finally {
      rmSync(otra.raiz, { recursive: true, force: true });
    }
  });
});

describe("hooks: el modo evidencias", () => {
  it("el de fin deja terminar solo con la propuesta válida y sus citas verificadas", () => {
    const otra = raizDeEvidencias();
    const fin = () => spawnSync("node", ["scripts/investigar/hooks/validar-al-terminar.mjs"], { input: JSON.stringify({ ...INV, cwd: otra.raiz, hook_event_name: "SubagentStop" }), encoding: "utf8", env: { ...process.env, BIGD_RAIZ: otra.raiz } });
    try {
      const a = fin();
      expect(a.status).toBe(2);
      expect(a.stderr).toContain("faltan las citas verificadas de esta versión");
      const v = spawnSync("node", ["scripts/verificar-citas.mjs", otra.carpeta], { encoding: "utf8", env: { ...process.env, BIGD_RAIZ: otra.raiz, BIGD_VERIFICAR_ESPEJO: otra.espejo } });
      expect(v.status, v.stderr).toBe(0);
      const b = fin();
      expect(b.status, b.stderr).toBe(0);
    } finally {
      rmSync(otra.raiz, { recursive: true, force: true });
    }
  });
  it("el de fin hace seguir a una inválida con las fallas del validador de evidencias", () => {
    const mala = propuestaEvidenciasNorte();
    mala.evidencias[0]!.evidencia.capacidad_id = "cap-teletransporte";
    const otra = raizDeEvidencias(mala);
    try {
      const r = spawnSync("node", ["scripts/investigar/hooks/validar-al-terminar.mjs"], { input: JSON.stringify({ ...INV, cwd: otra.raiz, hook_event_name: "SubagentStop" }), encoding: "utf8", env: { ...process.env, BIGD_RAIZ: otra.raiz } });
      expect(r.status).toBe(2);
      expect(r.stderr).toContain("«cap-teletransporte» no es una capacidad de la base");
    } finally {
      rmSync(otra.raiz, { recursive: true, force: true });
    }
  });
  it("el candado deja leer el esquema de la evidencia y nada más de src/lib/datos/", () => {
    const leer = (ruta: string) => hook("candado", { ...INV, tool_name: "Read", tool_input: { file_path: ruta } }).status;
    expect(leer("src/lib/datos/conocimiento.ts")).toBe(0);
    expect(leer("src/lib/investigador/evidencias.ts")).toBe(0);
    for (const ruta of ["src/lib/datos/cargar.ts", "src/lib/datos/conocimiento.ts.bak", "src/lib/datos"]) expect(leer(ruta), ruta).toBe(2);
  });
});
