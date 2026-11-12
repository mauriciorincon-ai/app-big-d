// @vitest-environment node
// S9 (F2): el ejecutor del modelo del sistema (scripts/investigar/sistema.mjs) en la CI, con un modelo FALSO y las páginas
// de la muestra servidas desde disco (espejo file://): rehace una capa sobre la propuesta de /investigar, el código tumba la
// cita que no está en la página y el componente que no está en la lista, y la propuesta sale por el mismo esquema, el mismo
// validador y la misma verificación de citas que la de la skill. Sin modelo, lo dice y no escribe nada. Jamás aprueba.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { esquemaPropuesta } from "@/lib/investigador";
import { PLATAFORMA, propuestaNorte, raizDePrueba } from "./lib/muestra";

const FALSO = join(__dirname, "lib", "modelo-falso.mjs");
const CAPA = "almacenamiento";
const p = propuestaNorte();
const { raiz, carpeta: base, espejo } = raizDePrueba(p);
afterAll(() => rmSync(raiz, { recursive: true, force: true }));

const correr = (args: string[], env: Record<string, string> = {}, r = raiz) =>
  spawnSync("node", ["scripts/investigar/sistema.mjs", ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      BIGD_RAIZ: r,
      BIGD_VERIFICAR_ESPEJO: espejo,
      BIGD_MODELO_FALSO: FALSO,
      BIGD_FECHA_CONSULTA: "2026-09-28",
      ...env,
    },
  });
const carpetas = () =>
  readdirSync(join(raiz, "propuestas"))
    .filter((c) => !c.endsWith(".jsonl"))
    .sort();
const nodosDeCapa = (
  p.mapa as unknown as { nodos: { id: string; banda_id: string }[] }
).nodos
  .filter((n) => n.banda_id === CAPA)
  .map((n) => n.id);

describe("sistema.mjs sin modelo", () => {
  it("Apple Intelligence apagado: sale con 3, dice la razón y no escribe nada", () => {
    const antes = carpetas();
    const r = correr([PLATAFORMA, CAPA], { BIGD_FALSO_MODO: "no-disponible" });
    expect(r.status, r.stderr).toBe(3);
    expect(r.stderr).toMatch(
      /no está disponible: Apple Intelligence está apagado en Configuración del Sistema\. No se escribió nada/,
    );
    expect(carpetas()).toEqual(antes);
    expect(
      existsSync(join(raiz, "propuestas/registro-de-ejecucion.jsonl")),
    ).toBe(false);
  });

  it("sin español, tampoco: el texto nace en los dos idiomas", () => {
    const r = correr([PLATAFORMA, CAPA], { BIGD_FALSO_MODO: "sin-es" });
    expect(r.status).toBe(3);
    expect(r.stderr).toContain("no trae es");
  });

  it("el modelo falso jamás corre sobre el repo real", () => {
    const r = spawnSync(
      "node",
      ["scripts/investigar/sistema.mjs", PLATAFORMA, CAPA],
      {
        encoding: "utf8",
        env: { ...process.env, BIGD_RAIZ: "", BIGD_MODELO_FALSO: FALSO },
      },
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(
      /solo corre sobre una raíz temporal|no hay una propuesta de mapa completo/,
    );
  });
});

describe("sistema.mjs con el modelo falso", () => {
  it("argumentos, base y capa inválidos fallan sin escribir", () => {
    const antes = carpetas();
    expect(correr([PLATAFORMA]).stderr).toMatch(
      /uso: node scripts\/investigar\/sistema\.mjs/,
    );
    expect(correr(["../x", CAPA]).stderr).toMatch(/uso:/);
    expect(correr(["otra", CAPA]).stderr).toMatch(
      /no hay una propuesta de mapa completo de «otra»/,
    );
    expect(correr([PLATAFORMA, "no-es-banda"]).stderr).toMatch(
      /no es una banda de la gramática/,
    );
    expect(correr([PLATAFORMA, CAPA, "--base", "data/mapas"]).stderr).toMatch(
      /no está dentro de propuestas\//,
    );
    expect(carpetas()).toEqual(antes);
  });

  it("rehace la capa: propias con cita literal, lo demás de la base; el código tumba lo inventado; valida y verifica", () => {
    const r = correr([PLATAFORMA, CAPA]);
    expect(r.status, r.stderr).toBe(0);
    const carpeta = `propuestas/2026-09-28-${PLATAFORMA}-${CAPA}`;
    const n = nodosDeCapa.length;
    expect(r.stdout).toContain(
      `sistema: ${carpeta} · capa ${CAPA} sobre ${base} · ${n} de ${n} componentes con afirmación propia · ${n} de ${n} citas propias verificadas`,
    );
    // Por página, uno por motivo: el código los tumbó antes de escribir.
    expect(r.stdout).toContain(
      `${5 * n} rechazadas por el código antes de escribir (${n} la cita no está en la página, ${n} componente fuera de la lista, ` +
        `${n} la cita no es una frase (código, título o lista), ${n} enunciado que no está en su idioma, ${n} enunciado copiado de la lista, no del texto)`,
    );
    expect(r.stdout).toContain("Nada se aprobó");

    const prop = esquemaPropuesta.parse(
      JSON.parse(readFileSync(join(raiz, carpeta, "propuesta.json"), "utf8")),
    );
    expect(prop.ejecucion).toMatchObject({
      herramienta: "modelo-del-sistema",
      base,
      propias: nodosDeCapa.map((_, i) => `A-${i + 1}`),
    });
    expect(prop.capa).toBe(CAPA);
    // Lo de la capa es suyo; todo lo demás, de la base, con la misma cita.
    const propias = prop.afirmaciones.slice(0, n);
    expect(propias.map((a) => a.sobre.id).sort()).toEqual(
      [...nodosDeCapa].sort(),
    );
    expect(propias.every((a) => a.enunciado.en.endsWith("does its job."))).toBe(
      true,
    );
    expect(prop.afirmaciones.length).toBe(p.afirmaciones.length);
    expect(prop.afirmaciones.slice(n).map((a) => a.cita.texto)).toEqual(
      p.afirmaciones
        .filter(
          (a) =>
            !(a.sobre.entidad === "nodo" && nodosDeCapa.includes(a.sobre.id)),
        )
        .map((a) => a.cita.texto),
    );
    expect(prop.mapa).toEqual(p.mapa);

    const v = JSON.parse(
      readFileSync(join(raiz, carpeta, "verificacion.json"), "utf8"),
    ) as { resultados: { resultado: string }[] };
    expect(v.resultados).toHaveLength(prop.afirmaciones.length);
    expect(v.resultados.every((x) => x.resultado === "verificada")).toBe(true);
    // Cada lectura queda en el registro, como las de la skill.
    const registro = readFileSync(
      join(raiz, "propuestas/registro-de-ejecucion.jsonl"),
      "utf8",
    )
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(registro.length).toBe(n);
    expect(
      registro.every(
        (l) =>
          l.herramienta === "modelo-del-sistema" &&
          l.url.startsWith("https://ejemplo.invalid/"),
      ),
    ).toBe(true);
    // Jamás aprueba: ni mapa ni revisión.
    expect(
      existsSync(join(raiz, "data/mapas", `${PLATAFORMA}.mapa.yaml`)),
    ).toBe(false);
    expect(
      existsSync(join(raiz, "data/revisiones", `${PLATAFORMA}.jsonl`)),
    ).toBe(false);

    // Una segunda corrida el mismo día no sobrescribe.
    expect(correr([PLATAFORMA, CAPA]).stderr).toMatch(
      /ya existe: no se sobrescribe/,
    );
  }, 60_000);
});

describe("sistema.mjs y la ventana corta del modelo", () => {
  it("un trozo que no cabe se parte en dos y la corrida termina igual; si ni partido cabe, falla sin escribir", () => {
    const otra = raizDePrueba(p);
    const env = { BIGD_VERIFICAR_ESPEJO: otra.espejo };
    try {
      const n = nodosDeCapa.length;
      const r = correr([PLATAFORMA, CAPA], { ...env, BIGD_FALSO_VENTANA: "600" }, otra.raiz);
      expect(r.status, r.stderr).toBe(0);
      expect(r.stdout).toContain(`${n} de ${n} citas propias verificadas`);
      // Por página: el pedido que no cupo y, al menos, sus dos mitades (y las mitades de una mitad que tampoco cupo).
      const [, paginas, llamadas] = r.stdout.match(/(\d+) páginas, (\d+) trozos/)!.map(Number);
      expect(paginas).toBe(n);
      expect(llamadas).toBeGreaterThanOrEqual(3 * n);
      const r2 = correr([PLATAFORMA, CAPA], { ...env, BIGD_FALSO_VENTANA: "10", BIGD_FECHA_CONSULTA: "2026-09-29" }, otra.raiz);
      expect(r2.status).toBe(1);
      expect(r2.stderr).toContain("exceeds the maximum allowed context size");
      expect(existsSync(join(otra.raiz, `propuestas/2026-09-29-${PLATAFORMA}-${CAPA}`))).toBe(false);
    } finally {
      rmSync(otra.raiz, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("el contrato de la propuesta", () => {
  it("base y propias van juntas y solo con el modelo del sistema; propias tienen que existir", async () => {
    const { validarPropuesta } = await import("@/lib/investigador");
    const conEjecucion = (ejecucion: object) => ({
      ...p,
      ejecucion: { ...p.ejecucion, ...ejecucion },
    });
    expect(
      esquemaPropuesta.safeParse(conEjecucion({ base: "propuestas/x" }))
        .success,
    ).toBe(false);
    expect(
      esquemaPropuesta.safeParse(
        conEjecucion({ herramienta: "modelo-del-sistema" }),
      ).success,
    ).toBe(false);
    expect(
      esquemaPropuesta.safeParse(conEjecucion({ herramienta: "otro" })).success,
    ).toBe(false);
    expect(
      esquemaPropuesta.safeParse(
        conEjecucion({
          herramienta: "modelo-del-sistema",
          base: "../fuera",
          propias: [],
        }),
      ).success,
    ).toBe(false);
    const { parse } = await import("yaml");
    const g = parse(
      readFileSync("data/gramaticas/plataformas-datos.gramatica.yaml", "utf8"),
    );
    const rangos = JSON.parse(
      readFileSync("packages/diagramador/metricas/cobertura.json", "utf8"),
    ).fuentes["space-grotesk"].rangos;
    const r = validarPropuesta(
      conEjecucion({
        herramienta: "modelo-del-sistema",
        base: "propuestas/x",
        propias: ["A-1", "A-1", "A-9999"],
      }),
      g,
      rangos,
    );
    expect(r.fallas.filter((f) => f.startsWith("ejecucion/propias"))).toEqual([
      "ejecucion/propias · A-1 no es una afirmación de esta propuesta, o está repetida",
      "ejecucion/propias · A-9999 no es una afirmación de esta propuesta, o está repetida",
    ]);
  });

  it("el puente no abre la red: solo stdin y stdout", () => {
    const swift = readFileSync(
      "scripts/investigar/sistema/puente.swift",
      "utf8",
    ).replace(/\/\/.*$/gm, "");
    expect(swift).not.toMatch(
      /URLSession|URLRequest|https?:|Network|NWConnection|Process\(|FileManager/,
    );
    expect(swift).toContain("SystemLanguageModel.default");
  });
});
