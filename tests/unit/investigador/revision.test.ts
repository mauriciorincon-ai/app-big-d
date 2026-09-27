// @vitest-environment node
// La pantalla del investigador, preparada en el build: vigencia por banda con la regla del motor, estado vacío
// para la plataforma sin mapa, la propuesta pendiente con su validación y verificación, el cambio de cada
// afirmación calculado por código, y el historial que cierra propuestas. Sobre una raíz temporal.
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { parse } from "yaml";
import type { Mapa } from "diagramador";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarDatos } from "@/lib/datos";
import { sha256 } from "@/lib/investigador";
import { conteo, vigenciaPorBanda, vistaInvestigador } from "@/lib/investigador/revision";
import { textos } from "@/lib/i18n";
import { PLATAFORMA, propuestaNorte, raizDePrueba } from "./lib/muestra";

const REPO = process.cwd();
const RANGOS = JSON.parse(readFileSync("packages/diagramador/metricas/cobertura.json", "utf8")).fuentes["space-grotesk"].rangos;
const p = propuestaNorte();
const { raiz, carpeta } = raizDePrueba(p);
afterAll(() => rmSync(raiz, { recursive: true, force: true }));
const d = () => cargarDatos(join(raiz, "data"), REPO);
const verificar = (resultado: (id: string) => "verificada" | "no-encontrada" | "no-verificable") => {
  const bytes = readFileSync(join(raiz, carpeta, "propuesta.json"));
  const v = { version: 1, fecha: "2026-09-27", propuesta_sha256: sha256(bytes), resultados: p.afirmaciones.map((a) => ({ afirmacion: a.id, url: a.cita.url, resultado: resultado(a.id), http: 200, sha256: "a".repeat(64) })) };
  writeFileSync(join(raiz, carpeta, "verificacion.json"), JSON.stringify(v));
};

describe("vigencia por banda", () => {
  it("cada banda del mapa con sus componentes y su componente más viejo; mismo estado que el motor", () => {
    const atlas = d().atlas.get("plataforma-ejemplo")!;
    const b = vigenciaPorBanda(atlas, "es", "2026-10-20");
    expect(b.map((x) => x.numero)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
    expect(b.reduce((s, x) => s + x.componentes, 0)).toBe(atlas.mapa.nodos.length);
    expect(new Set(b.map((x) => `${x.estado} ${x.dias}`))).toEqual(new Set(["revisar 30"]));
    expect(new Set(vigenciaPorBanda(atlas, "es", "2026-09-26").map((x) => x.estado))).toEqual(new Set(["vigente"]));
  });
});

describe("vista del investigador", () => {
  it("una plataforma sin mapa no trae bandas (estado vacío) y sí su propuesta pendiente", () => {
    const v = vistaInvestigador(d(), PLATAFORMA, "es", "2026-09-27", raiz, RANGOS);
    expect(v.mapa).toBeUndefined();
    expect(v.bandas).toBeUndefined();
    expect(v.propuesta!.carpeta).toBe(carpeta);
    expect(v.propuesta!.fallas).toEqual([]);
    expect(v.propuesta!.diff.primera).toBe(true);
  });

  it("sin verificación de ESTA versión, no hay resultados; con ella, cada afirmación trae el suyo", () => {
    expect(vistaInvestigador(d(), PLATAFORMA, "es", "2026-09-27", raiz, RANGOS).propuesta!.verificada).toBe(false);
    verificar((id) => (id === "A-1" ? "no-encontrada" : id === "A-2" ? "no-verificable" : "verificada"));
    const v = vistaInvestigador(d(), PLATAFORMA, "en", "2026-09-27", raiz, RANGOS).propuesta!;
    expect(v.verificada).toBe(true);
    expect(v.afirmaciones.find((a) => a.id === "A-1")!.verificacion!.resultado).toBe("no-encontrada");
    expect(v.afirmaciones[0]!.enunciado).toMatch(/ exists\.$/);
    expect(v.afirmaciones.every((a) => a.cambio === "nuevo")).toBe(true);
    expect(conteo(v.afirmaciones, textos("es").investigador)).toBe(`${p.afirmaciones.length} afirmaciones · ${p.afirmaciones.length - 2} verificadas · 1 no verificables · 1 no encontradas`);
    // Si la propuesta cambia después de verificarla, la verificación deja de valer.
    appendFileSync(join(raiz, carpeta, "propuesta.json"), " ");
    expect(vistaInvestigador(d(), PLATAFORMA, "es", "2026-09-27", raiz, RANGOS).propuesta!.verificada).toBe(false);
  });

  it("una propuesta rota se muestra con sus fallas, sin revisión", () => {
    writeFileSync(join(raiz, carpeta, "propuesta.json"), JSON.stringify({ ...p, afirmaciones: p.afirmaciones.slice(1) }));
    const v = vistaInvestigador(d(), PLATAFORMA, "es", "2026-09-27", raiz, RANGOS).propuesta!;
    expect(v.fallas).toEqual([`afirmaciones · nodo ${p.afirmaciones[0]!.sobre.id} no tiene ninguna afirmación que lo respalde`]);
  });

  it("una revisión en el historial cierra su propuesta", () => {
    mkdirSync(join(raiz, "data/revisiones"), { recursive: true });
    writeFileSync(join(raiz, "data/revisiones", `${PLATAFORMA}.jsonl`), `${JSON.stringify({ fecha: "2026-09-28", propuesta: carpeta, resultado: "aprobada", aprobadas: ["A-1"], rechazadas: [], mapa_version: "0.1.0", huella: "b".repeat(64) })}\n`);
    const v = vistaInvestigador(d(), PLATAFORMA, "es", "2026-09-28", raiz, RANGOS);
    expect(v.propuesta).toBeUndefined();
    expect(v.revisiones.map((r) => r.propuesta)).toEqual([carpeta]);
  });
});

describe("cambios contra un mapa aprobado", () => {
  // Una propuesta sobre la Plataforma Ejemplo (que ya tiene mapa): un renombre, un cambio de madurez, un nodo
  // con otra frase, un flujo cambiado y uno nuevo; el resto igual.
  const r2 = mkdtempSync(join(tmpdir(), "bigd-rev-"));
  afterAll(() => rmSync(r2, { recursive: true, force: true }));
  cpSync("data", join(r2, "data"), { recursive: true });
  const m = parse(readFileSync("data/mapas/plataforma-ejemplo.mapa.yaml", "utf8")) as Mapa;
  const prop = structuredClone(m);
  prop.estado = "propuesta";
  const cruda = prop.nodos.find((n) => n.id === "capa-cruda")!;
  cruda.nombres_anteriores = [cruda.nombre];
  cruda.nombre = { es: "Zona cruda", en: "Raw zone" };
  prop.nodos.find((n) => n.id === "agente-datos")!.madurez = "disponible-general";
  prop.nodos.find((n) => n.id === "tablero")!.lider = { es: "Otra frase del tablero.", en: "Another dashboard line." };
  prop.flujos.find((f) => f.id === "f-cruda-motor")!.que_viaja = { es: "Datos crudos nuevos", en: "New raw data" };
  prop.flujos.push({ id: "f-nuevo", origen: "tablero", destino: "agente-datos", modo_id: "a-demanda", que_viaja: { es: "Consultas", en: "Queries" }, lider: { es: "El agente lee el tablero.", en: "The agent reads the dashboard." } });
  const coi = { es: "fabricante", en: "vendor" };
  let k = 0;
  const cita = (n: string) => ({ url: prop.nodos.find((x) => x.id === n)!.fuentes[0]!.url, texto: "Una cita cualquiera de la fuente.", titulo: "t", tipo: "oficial" as const, conflicto_de_interes: coi });
  const afirmaciones = [
    ...prop.nodos.map((n) => ({ id: `A-${++k}`, sobre: { entidad: "nodo" as const, id: n.id }, enunciado: { es: n.id, en: n.id }, cita: cita(n.id) })),
    ...prop.flujos.map((f) => ({ id: `A-${++k}`, sobre: { entidad: "flujo" as const, id: f.id }, enunciado: { es: f.id, en: f.id }, cita: cita(f.origen) })),
  ];
  const dir = join(r2, "propuestas", "2026-10-20-plataforma-ejemplo");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "propuesta.json"), JSON.stringify({ version: 1, plataforma: "plataforma-ejemplo", fecha: "2026-10-20", ejecucion: { herramienta: "claude-code", modelo: "m", reintentos: 0 }, mapa: prop, afirmaciones, preguntas_guia: [], sin_novedades: false }));

  it("cada afirmación dice si su componente o flujo es nuevo, renombrado, cambia de madurez, cambia o sigue igual", () => {
    const v = vistaInvestigador(cargarDatos(join(r2, "data"), REPO), "plataforma-ejemplo", "es", "2026-10-20", r2, RANGOS);
    expect(v.bandas).toHaveLength(9);
    const p = v.propuesta!;
    expect(p.fallas).toEqual([]);
    expect(p.diff).toEqual({ primera: false, nuevos: 0, renombrados: 1, retirados: 0, madurez: 1 });
    const cambio = (id: string) => p.afirmaciones.find((a) => a.sobre === id)!.cambio;
    expect([cambio("capa-cruda"), cambio("agente-datos"), cambio("tablero"), cambio("sistema-admisiones")]).toEqual(["renombrado", "madurez", "cambiado", "igual"]);
    expect([cambio("f-cruda-motor"), cambio("f-nuevo"), cambio("f-conector-cruda")]).toEqual(["cambiado", "nuevo", "igual"]);
  });

  it("una propuesta que no es JSON se muestra con la falla", () => {
    writeFileSync(join(dir, "propuesta.json"), "{ roto");
    const p = vistaInvestigador(cargarDatos(join(r2, "data"), REPO), "plataforma-ejemplo", "es", "2026-10-20", r2, RANGOS).propuesta!;
    expect(p.fallas[0]).toMatch(/^propuesta\.json no es JSON: /);
    expect(p.afirmaciones).toEqual([]);
  });
});
