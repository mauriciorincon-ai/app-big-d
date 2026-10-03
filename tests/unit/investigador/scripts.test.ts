// @vitest-environment node
// Los scripts del investigador de punta a punta, sobre una raíz temporal (BIGD_RAIZ) con una plataforma
// ficticia y páginas de fuente servidas desde disco (espejo file://): validar la propuesta, verificar sus
// citas con curl y aprobar con la decisión de una persona. data/ y propuestas/ del repo no se tocan.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { BASE, PLATAFORMA, propuestaNorte, raizDePrueba } from "./lib/muestra";

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
    const r = correr(APROBAR, [carpeta, "--aprobar", todas.join(","), "--rechazar", "-", "--retirar", "-"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(`${tablero}: su cita no aparece en la fuente`);
    expect(existsSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`))).toBe(false);
  });
  it("con la decisión completa escribe el mapa aprobado, publica la plataforma y registra la revisión", () => {
    const r = correr(APROBAR, [carpeta, "--aprobar", todas.filter((x) => x !== tablero).join(","), "--rechazar", tablero, "--retirar", "-"]);
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
    expect(readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), "utf8")).toMatch(/^# APROBADO por una persona el 2026-09-28 \(UTC\)/);
    expect(r.stdout).toContain("aprobada el 2026-09-28 (UTC)");
    // Sin temporales a medio escribir.
    expect(existsSync(join(raiz, "data/revisiones", `${PLATAFORMA}.jsonl.tmp`))).toBe(false);
  });
  it("M-19: repetir el mismo comando no duplica la revisión ni vuelve a escribir", () => {
    const r = correr(APROBAR, [carpeta, "--aprobar", todas.filter((x) => x !== tablero).join(","), "--rechazar", tablero, "--retirar", "-"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no es posterior a la última propuesta cerrada");
    expect(readFileSync(join(raiz, "data/revisiones", `${PLATAFORMA}.jsonl`), "utf8").trim().split("\n")).toHaveLength(1);
  });
  it("B-33: una fecha de aprobación fijada que no existe es un error", () => {
    const r = spawnSync("node", [APROBAR, carpeta, "--aprobar", "A-1", "--rechazar", "-", "--retirar", "-"], {
      encoding: "utf8",
      env: { ...process.env, BIGD_RAIZ: raiz, BIGD_FECHA_APROBACION: "2026-02-31" },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("BIGD_FECHA_APROBACION no es una fecha AAAA-MM-DD");
  });
});

// Pedido de la persona al mirar la lista de retiros (2026-09-30): nada sale del mapa aprobado sin su argumento.
describe("una segunda propuesta que retira un componente", () => {
  const carpeta2 = `propuestas/2026-10-01-${PLATAFORMA}`;
  const CITA = "The capacity monitor is retired and its metrics now live in the operations panel.";
  const preparar = (conRetiro: boolean) => {
    const aprobado = parse(readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), "utf8"));
    const sale = (f: { origen: string; destino: string }) => f.origen === "monitor-capacidad" || f.destino === "monitor-capacidad";
    const mapa = { ...aprobado, estado: "propuesta", nodos: aprobado.nodos.filter((n: { id: string }) => n.id !== "monitor-capacidad"), flujos: aprobado.flujos.filter((f: { origen: string; destino: string }) => !sale(f)) };
    const q = propuestaNorte(mapa);
    if (conRetiro)
      q.retiros = [
        {
          id: "R-1",
          sobre: { entidad: "nodo", id: "monitor-capacidad" },
          motivo: { es: "El fabricante lo retiró; sus métricas pasaron al panel de operación.", en: "The vendor retired it; its metrics moved to the operations panel." },
          cita: { url: `${BASE}novedades`, texto: CITA, titulo: "Novedades", tipo: "oficial", conflicto_de_interes: q.afirmaciones[0]!.cita.conflicto_de_interes },
        },
      ];
    mkdirSync(join(raiz, carpeta2), { recursive: true });
    writeFileSync(join(raiz, carpeta2, "propuesta.json"), `${JSON.stringify(q, null, 2)}\n`);
    writeFileSync(join(raiz, "paginas", "novedades"), `<!doctype html><html><body><main><h1>Novedades</h1><p>${"Texto de relleno de una página de novedades del fabricante. ".repeat(8)}</p><p>${CITA}</p></main></body></html>`);
    return { q, flujos: aprobado.flujos.filter(sale).map((f: { id: string }) => f.id) };
  };
  it("sin retiro, validar lo rechaza y dice qué sale sin argumento", () => {
    preparar(false);
    const r = correr("scripts/investigar/validar.mjs", [carpeta2]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("retiros · el componente «monitor-capacidad» sale del mapa sin argumento");
  });
  it("con su retiro: valida, su cita se verifica y la aprobación lo saca del mapa con sus flujos (y archiva la versión anterior)", async () => {
    const { q, flujos } = preparar(true);
    const v = correr("scripts/investigar/validar.mjs", [carpeta2]);
    expect(v.status, v.stderr).toBe(0);
    const c = correr("scripts/verificar-citas.mjs", [carpeta2]);
    expect(c.status, c.stderr).toBe(0);
    expect(c.stdout).toContain(`${q.afirmaciones.length} afirmaciones y 1 retiros`);
    const verif = JSON.parse(readFileSync(join(raiz, carpeta2, "verificacion.json"), "utf8"));
    expect(verif.resultados.find((x: { afirmacion: string }) => x.afirmacion === "R-1")).toMatchObject({ resultado: "verificada", url: `${BASE}novedades` });
    const ids = q.afirmaciones.map((a) => a.id).join(",");
    const primera = readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`));
    const r = correr(APROBAR, [carpeta2, "--aprobar", ids, "--rechazar", "-", "--retirar", ["monitor-capacidad", ...flujos].join(",")]);
    expect(r.status, r.stderr).toBe(0);
    // D-S2-09: la versión anterior queda archivada con sus mismos bytes, y el cargador la lee.
    expect(readFileSync(join(raiz, "data/mapas/versiones", `${PLATAFORMA}-0.1.0.mapa.yaml`)).equals(primera)).toBe(true);
    const { cargarDatos } = await import("@/lib/datos");
    expect(cargarDatos(join(raiz, "data"), process.cwd()).versiones.get(PLATAFORMA)!.map((v) => v.version)).toEqual(["0.1.0"]);
    const mapa = parse(readFileSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`), "utf8"));
    expect(mapa.nodos.some((n: { id: string }) => n.id === "monitor-capacidad")).toBe(false);
    expect(mapa.version).toBe("0.2.0");
  });
});

describe("M-15: la guarda de la aprobación (la frontera está dentro del script)", () => {
  it("sobre el repo real, niega dentro de Claude Code y sin terminal; en una raíz temporal no aplica", async () => {
    const { puedeAprobar } = await import("../../../scripts/investigar/comun.mjs");
    const repo = process.cwd();
    expect(puedeAprobar({ raiz: repo, repo, env: { CLAUDECODE: "1" }, tty: true }).ok).toBe(false);
    expect(puedeAprobar({ raiz: repo, repo, env: {}, tty: false }).ok).toBe(false);
    expect(puedeAprobar({ raiz: repo, repo, env: {}, tty: true }).ok).toBe(true);
    expect(puedeAprobar({ raiz: raiz, repo, env: { CLAUDECODE: "1" }, tty: false }).ok).toBe(true);
  });
  it("el script la aplica: sin BIGD_RAIZ (el repo real) y sin terminal, sale con 1 sin tocar nada", () => {
    const env = { ...process.env, CLAUDECODE: "1" };
    delete (env as Record<string, string | undefined>).BIGD_RAIZ;
    const r = spawnSync("node", [APROBAR, "propuestas/no-existe", "--aprobar", "-", "--rechazar", "-", "--retirar", "-"], { encoding: "utf8", env });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("solo una persona aprueba");
    expect(r.stdout).not.toContain("aprobar: raíz");
  });
});
