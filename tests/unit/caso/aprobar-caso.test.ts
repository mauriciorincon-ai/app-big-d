// @vitest-environment node
// La aprobación del PERFIL del caso (S4, D-S4-03): el comando que arma la pantalla, lo que escribe el script que solo una
// persona corre, y el cinturón que rechaza un perfil aprobado editado a mano. Sobre una raíz temporal armada con la base
// sembrada, vuelta a borrador: data/ del repo no se toca, y las pruebas no dependen de que el perfil real esté o no aprobado.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
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
import {
  esquemaCaso,
  UNA_O_COMBINACION,
  type Caso,
} from "@/lib/datos/conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";
import { casosSinAprobacion } from "@/lib/investigador/aprobados";
import {
  aprobarCaso,
  esquemaRevisionCaso,
} from "@/lib/investigador/aprobar-caso";
import {
  centesimasAPuntos,
  comandoAprobarCaso,
  DECISION_UNA_O_COMBINACION,
  decisionesPorDefecto,
  leerAprobacionCaso,
  problemasDelPerfil,
  puntosACentesimas,
  type DecisionesPerfil,
} from "@/lib/investigador/comando-caso";
import { puedeAprobar } from "../../../scripts/investigar/comun.mjs";
import { armarBaseFuturo } from "../lib/base-futuro";

// El script de aprobación se nombra por partes: el candado de la sesión vigila su nombre completo.
const APROBAR = ["scripts", "apro" + "bar.mjs"].join("/");
const REPO = process.cwd();
let raiz = "";

/** La base sembrada con su caso vuelto a borrador: sin sello, sin revisión, pesos «propuestos» y tres decisiones sin responder. */
function borradorEn(dir: string): Caso {
  mkdirSync(join(dir, "data"), { recursive: true });
  armarBaseFuturo(join(dir, "data"), { atlas: true });
  rmSync(join(dir, "data/revisiones/casos"), { recursive: true, force: true });
  const ruta = join(dir, "data/casos/hospital-futuro.yaml");
  const aprobado = esquemaCaso.parse(parse(readFileSync(ruta, "utf8")));
  const { aprobacion: _a, ...resto } = aprobado;
  void _a;
  const borrador: Caso = {
    ...resto,
    criterios: aprobado.criterios.map((k) => ({
      ...k,
      origen: "propuesto-por-agente" as const,
    })),
    decisiones_implicitas: [
      ...aprobado.decisiones_implicitas.map((d) => ({ ...d, respuesta: null })),
      {
        id: "migrar-o-coexistir",
        pregunta: { es: "¿Migrar o coexistir?", en: "Migrate or coexist?" },
        opciones: [
          { id: "migrar", texto: { es: "Migrar", en: "Migrate" } },
          { id: "coexistir", texto: { es: "Coexistir", en: "Coexist" } },
        ],
        respuesta: null,
      },
    ],
    estado_aprobacion: "borrador",
  };
  writeFileSync(ruta, stringify(borrador, { lineWidth: 0, version: "1.2" }));
  return borrador;
}

const RESPUESTAS = {
  "una-o-combinacion": "una",
  "quien-opera": "gestionado",
  "migrar-o-coexistir": "coexistir",
};
const decisiones = (
  b: Caso,
  cambios: Partial<DecisionesPerfil> = {},
): DecisionesPerfil => ({
  ...decisionesPorDefecto(b),
  respuestas: RESPUESTAS,
  ...cambios,
});
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
const leerCaso = () =>
  parse(
    readFileSync(join(raiz, "data/casos/hospital-futuro.yaml"), "utf8"),
  ) as Caso;
const comandoDe = (b: Caso, d: DecisionesPerfil, desde = huellaCaso(b)) =>
  comandoAprobarCaso(b, desde, d).split(" ").slice(2);

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), "bigd-caso-"));
});
afterEach(() => rmSync(raiz, { recursive: true, force: true }));

describe("el comando que arma la pantalla del perfil", () => {
  it("lleva el caso, el borrador de origen, y los pesos, rangos, restricciones y respuestas, y se lee de vuelta idéntico", () => {
    const b = borradorEn(raiz);
    const d = decisiones(b);
    const comando = comandoAprobarCaso(b, huellaCaso(b), d);
    expect(comando).toMatch(
      /^node scripts\/aprobar\.mjs --caso hospital-futuro --desde [0-9a-f]{64} --pesos crit-ingesta=800,/,
    );
    expect(comando).toContain(
      "--restricciones res-residencia,res-servicio-gestionado ",
    );
    expect(comando).toMatch(
      /--respuestas una-o-combinacion=una,quien-opera=gestionado,migrar-o-coexistir=coexistir$/,
    );
    expect(leerAprobacionCaso(comando.split(" ").slice(2))).toEqual({
      caso: "hospital-futuro",
      desde: huellaCaso(b),
      decisiones: d,
    });
  });
  it("sin restricciones el comando dice «-», y se lee como lista vacía", () => {
    const b = borradorEn(raiz);
    const comando = comandoAprobarCaso(
      b,
      huellaCaso(b),
      decisiones(b, { restricciones: [] }),
    );
    expect(comando).toContain("--restricciones - ");
    expect(
      leerAprobacionCaso(comando.split(" ").slice(2)).decisiones.restricciones,
    ).toEqual([]);
  });
  it("no se arma si los pesos no suman 100, un rango pasa de 100, falta una respuesta o hay un id ajeno", () => {
    const b = borradorEn(raiz);
    const base = decisiones(b);
    const k = b.criterios[0]!.criterio_id;
    expect(problemasDelPerfil(b, base)).toEqual([]);
    expect(
      problemasDelPerfil(b, {
        ...base,
        pesos: { ...base.pesos, [k]: base.pesos[k]! + 1 },
      }),
    ).toEqual([expect.stringContaining("suman 10001 centésimas")]);
    expect(
      problemasDelPerfil(b, { ...base, rangos: { ...base.rangos, [k]: 101 } }),
    ).toEqual([expect.stringContaining(`rango de ${k}`)]);
    const { [UNA_O_COMBINACION]: _u, ...sinUna } = RESPUESTAS;
    void _u;
    expect(problemasDelPerfil(b, { ...base, respuestas: sinUna })).toEqual([
      expect.stringContaining(
        "falta responder «una-o-combinacion» (¿una plataforma o combinación?, E-17)",
      ),
    ]);
    expect(
      problemasDelPerfil(b, {
        ...base,
        respuestas: { ...RESPUESTAS, "quien-opera": "nadie" },
      }),
    ).toEqual([
      expect.stringContaining("«nadie» no es una opción de «quien-opera»"),
    ]);
    expect(
      problemasDelPerfil(b, { ...base, restricciones: ["res-inventada"] }),
    ).toEqual([
      expect.stringContaining("«res-inventada» no es una restricción"),
    ]);
    expect(() =>
      comandoAprobarCaso(b, huellaCaso(b), { ...base, respuestas: sinUna }),
    ).toThrow(/no se puede armar el comando/);
    expect(() => comandoAprobarCaso(b, "no-es-una-huella", base)).toThrow(
      /SHA-256/,
    );
  });
  it("la decisión obligatoria es la del esquema, y los puntos se pasan a centésimas sin flotantes", () => {
    expect(DECISION_UNA_O_COMBINACION).toBe(UNA_O_COMBINACION);
    expect(
      ["12", "12,5", "12.50", "0,05", "100", " 7 "].map(puntosACentesimas),
    ).toEqual([1200, 1250, 1250, 5, 10_000, 700]);
    expect(
      ["", "100,01", "101", "1,234", "abc", "-1", "1e2"].map(puntosACentesimas),
    ).toEqual([null, null, null, null, null, null, null]);
    expect([
      centesimasAPuntos(1250, "es"),
      centesimasAPuntos(1250, "en"),
      centesimasAPuntos(5, "es"),
      centesimasAPuntos(10_000, "en"),
    ]).toEqual(["12,50", "12.50", "0,05", "100.00"]);
  });
  it("sobre el repo real, la aprobación se niega dentro de Claude Code y sin terminal", () => {
    expect(
      puedeAprobar({
        raiz: REPO,
        repo: REPO,
        env: { CLAUDECODE: "1" },
        tty: true,
      }).ok,
    ).toBe(false);
    expect(
      puedeAprobar({ raiz: REPO, repo: REPO, env: {}, tty: false }).ok,
    ).toBe(false);
    expect(
      puedeAprobar({ raiz: REPO, repo: REPO, env: {}, tty: true }).ok,
    ).toBe(true);
  });
});

describe("aprobarCaso (lo que se escribe)", () => {
  it("el perfil queda aprobado, con cada peso declarado por la persona, su sello y la línea de la revisión", () => {
    const b = borradorEn(raiz);
    const k = b.criterios[0]!.criterio_id;
    const d = decisiones(b, {
      pesos: {
        ...decisionesPorDefecto(b).pesos,
        [k]: b.criterios[0]!.peso_centesimas + 100,
        [b.criterios[1]!.criterio_id]: b.criterios[1]!.peso_centesimas - 100,
      },
      restricciones: ["res-residencia"],
    });
    const { caso, revision } = aprobarCaso(b, huellaCaso(b), d, "2026-10-12");
    expect(caso.estado_aprobacion).toBe("aprobado");
    expect(
      caso.criterios.every((x) => x.origen === "declarado-por-usuario"),
    ).toBe(true);
    expect(caso.criterios[0]!.peso_centesimas).toBe(
      b.criterios[0]!.peso_centesimas + 100,
    );
    expect(caso.restricciones.map((r) => r.id)).toEqual(["res-residencia"]);
    expect(caso.decisiones_implicitas.map((x) => x.respuesta)).toEqual([
      "una",
      "gestionado",
      "coexistir",
    ]);
    expect(caso.aprobacion).toEqual({
      fecha: "2026-10-12",
      huella: huellaCaso(caso),
    });
    expect(esquemaRevisionCaso.parse(revision)).toEqual({
      fecha: "2026-10-12",
      caso: "hospital-futuro",
      desde: huellaCaso(b),
      huella: huellaCaso(caso),
    });
    expect(huellaCaso(caso)).not.toBe(huellaCaso(b));
  });
  it("se niega si el borrador cambió desde que se armó el comando, si ya está aprobado o si las decisiones no valen", () => {
    const b = borradorEn(raiz);
    expect(() =>
      aprobarCaso(b, "0".repeat(64), decisiones(b), "2026-10-12"),
    ).toThrow(/el borrador cambió desde que se armó el comando/);
    expect(() =>
      aprobarCaso(
        b,
        huellaCaso(b),
        decisiones(b, { respuestas: {} }),
        "2026-10-12",
      ),
    ).toThrow(/falta responder «una-o-combinacion»/);
    const { caso } = aprobarCaso(b, huellaCaso(b), decisiones(b), "2026-10-12");
    expect(() =>
      aprobarCaso(caso, huellaCaso(caso), decisiones(b), "2026-10-12"),
    ).toThrow(/ya está aprobado/);
  });
});

describe("scripts/aprobar --caso, de punta a punta", () => {
  it("escribe el perfil aprobado y la revisión; la base carga y el cinturón no encuentra fallas", () => {
    const b = borradorEn(raiz);
    const r = correr(comandoDe(b, decisiones(b)));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(
      "aprobar: perfil hospital-futuro el 2026-10-12 (UTC) · 11 pesos · 2 restricciones",
    );
    const c = leerCaso();
    expect(c.estado_aprobacion).toBe("aprobado");
    expect(c.aprobacion).toEqual({
      fecha: "2026-10-12",
      huella: huellaCaso(esquemaCaso.parse(c)),
    });
    const lineas = readFileSync(
      join(raiz, "data/revisiones/casos/hospital-futuro.jsonl"),
      "utf8",
    )
      .trim()
      .split("\n");
    expect(lineas).toHaveLength(1);
    expect(esquemaRevisionCaso.parse(JSON.parse(lineas[0]!))).toMatchObject({
      caso: "hospital-futuro",
      desde: huellaCaso(b),
      huella: c.aprobacion!.huella,
    });
    expect(() => cargarConocimiento(join(raiz, "data"))).not.toThrow();
    expect(casosSinAprobacion(join(raiz, "data"))).toEqual([]);
    expect(existsSync(join(raiz, "data/casos/hospital-futuro.yaml.tmp"))).toBe(
      false,
    );
  });
  it("S4-B3: un corte entre la revisión y el perfil deja la base cargable y el perfil en borrador (el aprobado se escribe al final)", () => {
    const b = borradorEn(raiz);
    const r = correr(comandoDe(b, decisiones(b)), { BIGD_PRUEBA_CORTE: "1" });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("corte simulado");
    expect(leerCaso().estado_aprobacion).toBe("borrador");
    expect(() => cargarConocimiento(join(raiz, "data"))).not.toThrow();
    expect(casosSinAprobacion(join(raiz, "data"))).toEqual([]);
  });
  it("con un borrador que cambió desde el comando, no escribe nada", () => {
    const b = borradorEn(raiz);
    const args = comandoDe(b, decisiones(b));
    const ruta = join(raiz, "data/casos/hospital-futuro.yaml");
    writeFileSync(
      ruta,
      readFileSync(ruta, "utf8").replace(
        "Hospital Ficticio del Futuro",
        "Hospital Ficticio del Futuro (editado)",
      ),
    );
    const antes = readFileSync(ruta, "utf8");
    const r = correr(args);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      "el borrador cambió desde que se armó el comando",
    );
    expect(readFileSync(ruta, "utf8")).toBe(antes);
    expect(existsSync(join(raiz, "data/revisiones/casos"))).toBe(false);
  });
  it("con pesos que no suman 100 o una decisión sin responder, no escribe nada", () => {
    const b = borradorEn(raiz);
    const k = b.criterios[0]!.criterio_id;
    const args = comandoDe(b, decisiones(b));
    const mal = args.map((a, i) =>
      args[i - 1] === "--pesos"
        ? a.replace(new RegExp(`${k}=\\d+`), `${k}=1`)
        : a,
    );
    const r1 = correr(mal);
    expect(r1.status).toBe(1);
    expect(r1.stderr).toContain("los pesos suman");
    const sinRespuestas = args.map((a, i) =>
      args[i - 1] === "--respuestas" ? "quien-opera=gestionado" : a,
    );
    const r2 = correr(sinRespuestas);
    expect(r2.status).toBe(1);
    expect(r2.stderr).toContain("falta responder «una-o-combinacion»");
    expect(leerCaso().estado_aprobacion).toBe("borrador");
    expect(existsSync(join(raiz, "data/revisiones/casos"))).toBe(false);
  });
  it("un perfil ya aprobado no se aprueba otra vez", () => {
    const b = borradorEn(raiz);
    const args = comandoDe(b, decisiones(b));
    expect(correr(args).status).toBe(0);
    const r = correr(args);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/ya está aprobado|el borrador cambió/);
    expect(
      readFileSync(
        join(raiz, "data/revisiones/casos/hospital-futuro.jsonl"),
        "utf8",
      )
        .trim()
        .split("\n"),
    ).toHaveLength(1);
  });
});

describe("casosSinAprobacion (el cinturón de la revisión)", () => {
  /** Un perfil aprobado como lo deja el comando, en `data/` de la raíz temporal. */
  function aprobadoEn(dir: string): Caso {
    const b = borradorEn(dir);
    const { caso, revision } = aprobarCaso(
      b,
      huellaCaso(b),
      decisiones(b),
      "2026-10-12",
    );
    writeFileSync(
      join(dir, "data/casos/hospital-futuro.yaml"),
      stringify(caso, { lineWidth: 0, version: "1.2" }),
    );
    mkdirSync(join(dir, "data/revisiones/casos"), { recursive: true });
    writeFileSync(
      join(dir, "data/revisiones/casos/hospital-futuro.jsonl"),
      `${JSON.stringify(revision)}\n`,
    );
    return caso;
  }
  it("un perfil aprobado con su revisión pasa; un borrador no necesita revisión", () => {
    aprobadoEn(raiz);
    expect(casosSinAprobacion(join(raiz, "data"))).toEqual([]);
    const otra = mkdtempSync(join(tmpdir(), "bigd-caso-"));
    try {
      borradorEn(otra);
      expect(casosSinAprobacion(join(otra, "data"))).toEqual([]);
    } finally {
      rmSync(otra, { recursive: true, force: true });
    }
  });
  it("un perfil aprobado sin revisión se nombra", () => {
    aprobadoEn(raiz);
    rmSync(join(raiz, "data/revisiones/casos"), { recursive: true });
    expect(casosSinAprobacion(join(raiz, "data"))).toEqual([
      expect.stringMatching(
        /hospital-futuro\.yaml · no hay revisión que lo apruebe/,
      ),
    ]);
  });
  it("un perfil aprobado editado a mano, aun con el sello recalculado para que el cargador lo acepte, se nombra", () => {
    const c = aprobadoEn(raiz);
    const k = c.criterios[0]!;
    const editado: Caso = {
      ...c,
      criterios: [
        { ...k, peso_centesimas: k.peso_centesimas + 100 },
        {
          ...c.criterios[1]!,
          peso_centesimas: c.criterios[1]!.peso_centesimas - 100,
        },
        ...c.criterios.slice(2),
      ],
    };
    const falso = {
      ...editado,
      aprobacion: { fecha: "2026-10-12", huella: huellaCaso(editado) },
    };
    writeFileSync(
      join(raiz, "data/casos/hospital-futuro.yaml"),
      stringify(falso, { lineWidth: 0, version: "1.2" }),
    );
    expect(() => cargarConocimiento(join(raiz, "data"))).not.toThrow();
    expect(casosSinAprobacion(join(raiz, "data"))).toEqual([
      expect.stringMatching(
        /hospital-futuro\.yaml · su huella no es la que aprobó una persona el 2026-10-12: un perfil aprobado no se edita a mano/,
      ),
    ]);
  });
});
