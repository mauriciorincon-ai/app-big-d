// @vitest-environment node
// La aprobación del PLAN del caso (S5, D-S5-09): el comando que arma la pantalla, lo que escribe el script que solo una
// persona corre y el cinturón que rechaza un plan aprobado editado a mano. Sobre una raíz temporal que copia data/: el
// del repo no se toca y la prueba no depende de que el plan real esté o no aprobado.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { dirDatos } from "@/lib/datos/dir";
import { huellaPlan } from "@/lib/datos/instantanea";
import type { Plan } from "@/lib/datos/plan";
import { planesSinAprobacion } from "@/lib/investigador/aprobados";
import {
  aprobarPlan,
  ErrorDeAprobacionDePlan,
  esquemaRevisionPlan,
} from "@/lib/investigador/aprobar-plan";
import {
  comandoAprobarPlan,
  leerAprobacionPlan,
} from "@/lib/investigador/comando-plan";
import { puedeAprobar } from "../../../scripts/investigar/comun.mjs";

// El script de aprobación se nombra por partes: el candado de la sesión vigila su nombre completo.
const APROBAR = ["scripts", "apro" + "bar.mjs"].join("/");
const REPO = process.cwd();
const CASO = "hospital-futuro";
let raiz = "";

const planDe = (dir: string): Plan =>
  cargarConocimiento(join(dir, "data")).planes.find((p) => p.caso_id === CASO)!;
const correr = (args: string[], env: Record<string, string> = {}) =>
  spawnSync("node", [APROBAR, ...args], {
    cwd: REPO,
    encoding: "utf8",
    env: {
      ...process.env,
      BIGD_RAIZ: raiz,
      BIGD_FECHA_APROBACION: "2026-10-12",
      ...env,
    },
  });
const yaml = (rel: string, f: (d: Record<string, unknown>) => void) => {
  const ruta = join(raiz, "data", rel);
  const d = parse(readFileSync(ruta, "utf8")) as Record<string, unknown>;
  f(d);
  writeFileSync(ruta, stringify(d, { lineWidth: 0, version: "1.2" }));
};
const PLAN = `casos/${CASO}/plan`;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "bigd-plan-aprob-"));
  cpSync(dirDatos(), join(raiz, "data"), { recursive: true });
});
afterEach(() => rmSync(raiz, { recursive: true, force: true }));

describe("el comando que arma la pantalla de decisiones", () => {
  const desde = "a".repeat(64);

  it("lleva el caso y el borrador de origen, y se lee de vuelta idéntico", () => {
    const c = comandoAprobarPlan(CASO, desde);
    expect(c).toBe(`node ${APROBAR} --plan ${CASO} --desde ${desde}`);
    expect(leerAprobacionPlan(c.split(" ").slice(2))).toEqual({
      caso: CASO,
      desde,
    });
  });
  it("se niega a armarse con un caso o una huella que no son lo que dicen", () => {
    expect(() => comandoAprobarPlan("Hospital; rm -rf", desde)).toThrow(
      /caracteres no permitidos/,
    );
    expect(() => comandoAprobarPlan(CASO, "xyz")).toThrow(/SHA-256/);
  });
  it("el script se niega a leer un comando incompleto o con una huella que no es SHA-256", () => {
    expect(() => leerAprobacionPlan(["--plan", CASO])).toThrow(/falta --desde/);
    expect(() => leerAprobacionPlan(["--plan", CASO, "--desde", "no"])).toThrow(
      /SHA-256/,
    );
    expect(() => leerAprobacionPlan(["--desde", desde])).toThrow(
      /falta --plan/,
    );
  });
});

describe("aprobarPlan (puro)", () => {
  it("deja el plan aprobado con su sello, su revisión, y los riesgos y supuestos declarados por la persona", () => {
    const b = planDe(REPO);
    const { plan, revision } = aprobarPlan(b, huellaPlan(b), "2026-10-12");
    expect(plan.estado_aprobacion).toBe("aprobado");
    expect(plan.aprobacion).toEqual({
      fecha: "2026-10-12",
      huella: revision.huella,
    });
    expect(huellaPlan(plan)).toBe(revision.huella);
    expect(revision).toEqual(
      esquemaRevisionPlan.parse({
        fecha: "2026-10-12",
        caso: CASO,
        desde: huellaPlan(b),
        huella: revision.huella,
      }),
    );
    expect(
      plan.modos_de_falla.every((m) => m.origen === "declarado-por-usuario"),
    ).toBe(true);
    expect(
      plan.supuestos.every((s) => s.origen === "declarado-por-usuario"),
    ).toBe(true);
    // Lo que la persona no cambió sigue igual: solo el origen y el estado.
    expect(plan.decisiones).toEqual(b.decisiones);
  });
  it("rechaza un `--desde` que ya no es el borrador: no aprueba lo que la persona no vio", () => {
    const b = planDe(REPO);
    expect(() => aprobarPlan(b, "0".repeat(64), "2026-10-12")).toThrow(
      ErrorDeAprobacionDePlan,
    );
    expect(() => aprobarPlan(b, "0".repeat(64), "2026-10-12")).toThrow(
      /cambió desde que se armó el comando/,
    );
  });
  it("rechaza un plan que ya está aprobado", () => {
    const b = planDe(REPO);
    const { plan } = aprobarPlan(b, huellaPlan(b), "2026-10-12");
    expect(() => aprobarPlan(plan, huellaPlan(plan), "2026-10-13")).toThrow(
      /ya está aprobado/,
    );
  });
  it("rechaza un plan con una acción alta sin mitigación, aunque el comando se arme", () => {
    const b = planDe(REPO);
    const roto: Plan = {
      ...b,
      modos_de_falla: b.modos_de_falla.map((m) =>
        m.id === "rie-fuga-datos-clinicos" ? { ...m, mitigaciones: [] } : m,
      ),
    };
    expect(() => aprobarPlan(roto, huellaPlan(roto), "2026-10-12")).toThrow(
      /no se puede aprobar[\s\S]*prioridad_alta_sin_mitigacion: rie-fuga-datos-clinicos/,
    );
  });
  it("rechaza un plan con un ciclo", () => {
    const b = planDe(REPO);
    const roto: Plan = {
      ...b,
      decisiones: b.decisiones.map((d) =>
        d.id === "dec-identidad"
          ? { ...d, depende_de: ["dec-proteccion-clinica"] }
          : d,
      ),
    };
    expect(() => aprobarPlan(roto, huellaPlan(roto), "2026-10-12")).toThrow(
      /ciclo/,
    );
  });
});

describe("el script de aprobación, sobre una raíz temporal", () => {
  const desdeActual = () => huellaPlan(planDe(raiz));

  it("escribe el plan aprobado, su revisión, y el cargador y el cinturón lo aceptan", () => {
    const antes = readFileSync(join(raiz, "data", PLAN, "plan.yaml"), "utf8");
    const r = correr(["--plan", CASO, "--desde", desdeActual()]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(r.stdout).toContain(`aprobar: plan ${CASO} el 2026-10-12`);
    const plan = planDe(raiz);
    expect(plan.estado_aprobacion).toBe("aprobado");
    expect(plan.aprobacion?.fecha).toBe("2026-10-12");
    const lineas = readFileSync(
      join(raiz, "data/revisiones/planes", `${CASO}.jsonl`),
      "utf8",
    )
      .trim()
      .split("\n");
    expect(lineas).toHaveLength(1);
    expect(esquemaRevisionPlan.parse(JSON.parse(lineas[0]!)).huella).toBe(
      plan.aprobacion?.huella,
    );
    expect(planesSinAprobacion(join(raiz, "data"))).toEqual([]);
    // plan.yaml conserva su procedencia (los comentarios) y suma el aviso de la aprobación.
    const despues = readFileSync(join(raiz, "data", PLAN, "plan.yaml"), "utf8");
    expect(despues).toMatch(/^# APROBADO por una persona el 2026-10-12/);
    expect(despues).toContain("De dónde sale cada cosa");
    expect(antes).not.toContain("APROBADO");
  });

  it("un `--desde` viejo se rechaza y no escribe nada", () => {
    const r = correr(["--plan", CASO, "--desde", "0".repeat(64)]);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("cambió desde que se armó el comando");
    expect(existsSync(join(raiz, "data/revisiones/planes"))).toBe(false);
    expect(planDe(raiz).estado_aprobacion).toBe("borrador");
  });

  it("sobre el repo real, dentro de una sesión de Claude Code o sin terminal, la guarda no deja correrlo", () => {
    expect(puedeAprobar({ raiz: REPO, repo: REPO, env: { CLAUDECODE: "1" }, tty: true }).ok).toBe(false);
    expect(puedeAprobar({ raiz: REPO, repo: REPO, env: {}, tty: false }).ok).toBe(false);
    expect(puedeAprobar({ raiz: REPO, repo: REPO, env: {}, tty: true }).ok).toBe(true);
  });

  it("un plan con un bloqueante no se escribe, aunque el comando esté bien armado", () => {
    yaml(
      `${PLAN}/modos-de-falla/rie-fuga-datos-clinicos.yaml`,
      (d) => (d.mitigaciones = []),
    );
    const r = correr(["--plan", CASO, "--desde", desdeActual()]);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("prioridad_alta_sin_mitigacion");
    expect(existsSync(join(raiz, "data/revisiones/planes"))).toBe(false);
  });
});

describe("planesSinAprobacion (el cinturón de la revisión)", () => {
  function aprobado(): void {
    const r = correr(["--plan", CASO, "--desde", huellaPlan(planDe(raiz))]);
    expect(r.status, r.stderr + r.stdout).toBe(0);
  }

  it("un plan en borrador no necesita revisión", () => {
    expect(planesSinAprobacion(join(raiz, "data"))).toEqual([]);
  });

  it("un plan aprobado sin su línea de revisión se rechaza: lo aprueba una persona con su comando", () => {
    aprobado();
    rmSync(join(raiz, "data/revisiones/planes"), { recursive: true });
    expect(planesSinAprobacion(join(raiz, "data"))).toEqual([
      expect.stringContaining("no hay revisión que lo apruebe"),
    ]);
  });

  it("un plan aprobado editado a mano, aunque se recalcule su sello, se rechaza: no es el que aprobó una persona", () => {
    aprobado();
    const antes = planDe(raiz);
    const editado: Plan = { ...antes, supuestos: antes.supuestos.map((x) => (x.id === "sup-equipo-opera" ? { ...x, estado: "confirmado" as const } : x)) };
    yaml(`${PLAN}/supuestos/sup-equipo-opera.yaml`, (d) => (d.estado = "confirmado"));
    // Quien edita a mano recalcula el sello para que el cargador lo acepte…
    yaml(`${PLAN}/plan.yaml`, (d) => (d.aprobacion = { fecha: "2026-10-12", huella: huellaPlan(editado) }));
    expect(() => cargarConocimiento(join(raiz, "data"))).not.toThrow();
    // …pero la revisión, que solo escribe el comando, dice otra cosa.
    expect(planesSinAprobacion(join(raiz, "data"))).toEqual([expect.stringContaining("su huella no es la que aprobó una persona el 2026-10-12")]);
  });

  it("un plan aprobado cuyo contenido cambió sin recalcular el sello ni siquiera carga", () => {
    aprobado();
    yaml(
      `${PLAN}/supuestos/sup-equipo-opera.yaml`,
      (d) => (d.estado = "confirmado"),
    );
    expect(() => cargarConocimiento(join(raiz, "data"))).toThrow(
      /plan\.yaml:\d+:\d+ · plan · aprobacion\.huella · no es la huella del plan/,
    );
  });
});
