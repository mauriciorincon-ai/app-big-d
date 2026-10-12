// @vitest-environment node
// El plan del caso como dato (S5, C16–C18): el plan real carga contra la base aprobada y cada forma de dato roto rompe la
// carga con `archivo:línea:col · id · campo · regla`. Cada caso trabaja en una copia temporal de data/; data/ no se toca.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { informeDeInstrumentos } from "instrumentos-de-plan";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { ErrorDeDatos } from "@/lib/datos";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { dirDatos } from "@/lib/datos/dir";
import { huellaPlan } from "@/lib/datos/instantanea";
import type { Plan } from "@/lib/datos/plan";

const PLAN = "casos/hospital-futuro/plan";
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Una copia de data/ con el plan real; `cambio` la rompe de una forma. */
function copia(cambio?: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "bigd-plan-"));
  dirs.push(dir);
  cpSync(dirDatos(), dir, { recursive: true });
  cambio?.(dir);
  return dir;
}
/** Un YAML del plan como objeto suelto: la prueba lo rompe de a un campo y no le importa su forma. */
type Suelto = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const yaml = (dir: string, rel: string, f: (d: Suelto) => void) => {
  const ruta = join(dir, rel);
  const d = parse(readFileSync(ruta, "utf8")) as Suelto;
  f(d);
  writeFileSync(ruta, stringify(d));
};
const decision = (dir: string, id: string, f: (d: Suelto) => void) => yaml(dir, `${PLAN}/decisiones/${id}.yaml`, f);

function fallas(dir: string): string[] {
  try {
    cargarConocimiento(dir);
  } catch (e) {
    if (e instanceof ErrorDeDatos) return e.fallas;
    throw e;
  }
  return [];
}

describe("el plan real del caso", () => {
  const k = cargarConocimiento();
  const plan = k.planes.find((p) => p.caso_id === "hospital-futuro")!;

  // S5-B-7: la especificación pide un mínimo (§ 10.5), no el número de hoy: agregar una decisión no rompe esta prueba.
  it("carga: al menos las siete decisiones de § 10.5, modos de falla y supuestos con prueba barata", () => {
    expect(plan.decisiones.length).toBeGreaterThanOrEqual(7);
    expect(plan.modos_de_falla.length).toBeGreaterThanOrEqual(1);
    expect(plan.supuestos.length).toBeGreaterThanOrEqual(1);
    for (const s of plan.supuestos) expect(s.prueba_barata.es.trim(), s.id).not.toBe("");
  });

  it("hay decisiones de una vía e implícitas, y cada plataforma que el caso evalúa tiene su opción", () => {
    expect(plan.decisiones.filter((d) => d.reversibilidad === "una_via").length).toBeGreaterThan(0);
    expect(plan.decisiones.filter((d) => d.implicita).length).toBeGreaterThan(0);
    const evaluables = ["databricks", "fabric", "snowflake"];
    for (const d of plan.decisiones) expect(d.opciones_por_plataforma.map((o) => o.plataforma_id).sort(), d.id).toEqual(evaluables);
  });

  it("toda cita resuelve a una evidencia APROBADA de la plataforma de su opción, y sus componentes son de esa evidencia", () => {
    const evidencias = new Map(k.evidencias.map((e) => [e.id, e]));
    for (const d of plan.decisiones)
      for (const o of d.opciones_por_plataforma)
        for (const c of o.citas) {
          const e = evidencias.get(c.evidencia_id)!;
          expect(e.estado_aprobacion, c.evidencia_id).toBe("aprobada");
          expect(e.plataforma_id, c.evidencia_id).toBe(o.plataforma_id);
          for (const comp of c.componentes ?? []) expect(e.componentes, `${c.evidencia_id}:${comp}`).toContain(comp);
        }
  });

  it("nada del plan real queda «sin fuente»: cada opción cita lo aprobado", () => {
    for (const d of plan.decisiones) for (const o of d.opciones_por_plataforma) expect(o.sin_fuente, `${d.id}/${o.plataforma_id}`).not.toBe(true);
  });

  it("los números de riesgo son juicio y lo dicen: origen propuesto por el agente y su razón en los dos idiomas", () => {
    for (const m of plan.modos_de_falla) {
      expect(m.origen).toBe("propuesto-por-agente");
      expect(m.razon.es.length).toBeGreaterThan(20);
      expect(m.razon.en.length).toBeGreaterThan(20);
    }
  });

  it("el paquete lo ordena en ondas sin ciclo, con las de una vía y sin bloqueantes: el plan es aprobable", () => {
    const informe = informeDeInstrumentos({ decisiones: plan.decisiones, modos_de_falla: plan.modos_de_falla, supuestos: plan.supuestos });
    expect(informe.ciclo).toBeNull();
    expect(informe.ok).toBe(true);
    expect(informe.bloqueantes).toEqual([]);
    expect(informe.una_via.sort()).toEqual(plan.decisiones.filter((d) => d.reversibilidad === "una_via").map((d) => d.id).sort());
  });

  it("sigue en borrador hasta que una persona corra el comando de su pantalla", () => {
    expect(plan.estado_aprobacion).toBe("borrador");
    expect(plan.aprobacion).toBeUndefined();
  });
});

describe("cada forma de dato roto rompe la carga con archivo, id, campo y regla", () => {
  const casos: [string, (dir: string) => void, RegExp][] = [
    ["una cita a una evidencia que no existe", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].citas[0].evidencia_id = "evi-databricks-inexistente")), /dec-catalogo\.yaml:\d+:\d+ · dec-catalogo · opciones_por_plataforma\[0\]\.citas\[0\]\.evidencia_id · «evi-databricks-inexistente» no es una evidencia aprobada/],
    ["una cita a una evidencia de otra plataforma", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].citas[0].evidencia_id = "evi-fabric-gobierno")), /· dec-catalogo · opciones_por_plataforma\[0\]\.citas\[0\]\.evidencia_id · «evi-fabric-gobierno» es de fabric, no de databricks/],
    ["un componente que no es de la evidencia citada", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].citas[0].componentes = ["horizon-catalog"])), /· dec-catalogo · opciones_por_plataforma\[0\]\.citas\[0\]\.componentes · «horizon-catalog» no es un componente de evi-databricks-gobierno/],
    ["una opción sin cita y sin `sin_fuente`", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].citas = [])), /· dec-catalogo · opciones_por_plataforma\[0\]\.citas · sin cita de evidencia aprobada no hay afirmación/],
    ["una opción «sin fuente» que aun así cita", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].sin_fuente = true)), /· dec-catalogo · opciones_por_plataforma\[0\]\.sin_fuente · una opción con citas no es «sin fuente»/],
    ["una plataforma del caso sin su opción", (d) => decision(d, "dec-catalogo", (x) => x.opciones_por_plataforma.pop()), /· dec-catalogo · opciones_por_plataforma · falta la opción de snowflake/],
    ["una opción para la plataforma ficticia que el caso descarta", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].plataforma_id = "plataforma-ejemplo")), /· dec-catalogo · opciones_por_plataforma\[0\]\.plataforma_id · «plataforma-ejemplo» no es una plataforma que el caso evalúe/],
    ["un texto vacío en un idioma", (d) => decision(d, "dec-catalogo", (x) => (x.opciones_por_plataforma[0].texto.en = "")), /· dec-catalogo · opciones_por_plataforma\[0\]\.texto\.en · no puede ir vacío/],
    ["una capacidad que no existe", (d) => decision(d, "dec-catalogo", (x) => (x.capacidad_id = "cap-inexistente")), /· dec-catalogo · capacidad_id · «cap-inexistente» no es una capacidad de la instantánea/],
    ["capacidad y criterio a la vez", (d) => decision(d, "dec-catalogo", (x) => (x.criterio_id = "crit-ecosistema")), /· dec-catalogo · capacidad_id · exactamente una de `capacidad_id` o `criterio_id`/],
    ["una dependencia que no es una decisión", (d) => decision(d, "dec-catalogo", (x) => (x.depende_de = ["dec-fantasma"])), /· dec-catalogo · depende_de\[0\] · «dec-fantasma» no es una decisión del plan/],
    ["una decisión que depende de sí misma", (d) => decision(d, "dec-catalogo", (x) => (x.depende_de = ["dec-catalogo"])), /· dec-catalogo · depende_de · una decisión no depende de sí misma/],
    ["una reversibilidad que no existe", (d) => decision(d, "dec-catalogo", (x) => (x.reversibilidad = "facil")), /· dec-catalogo · reversibilidad · «facil» no es uno de: una_via, costosa, dos_vias/],
    ["un archivo que no se llama como su id", (d) => decision(d, "dec-catalogo", (x) => (x.id = "dec-otro")), /· dec-otro · id · el archivo se llama como su id: «dec-otro\.yaml»/],
    ["un modo de falla de una decisión que no existe", (d) => yaml(d, `${PLAN}/modos-de-falla/rie-catalogo-rehacer.yaml`, (x) => (x.decision_id = "dec-fantasma")), /· rie-catalogo-rehacer · decision_id · «dec-fantasma» no es una decisión del plan/],
    ["una severidad fuera de la escala 1–10", (d) => yaml(d, `${PLAN}/modos-de-falla/rie-catalogo-rehacer.yaml`, (x) => (x.severidad = 11)), /· rie-catalogo-rehacer · severidad · a lo sumo 10/],
    ["una mitigación que empeora la ocurrencia", (d) => yaml(d, `${PLAN}/modos-de-falla/rie-catalogo-rehacer.yaml`, (x) => (x.mitigaciones[0].efecto.ocurrencia = 9)), /· rie-catalogo-rehacer · mitigaciones\[0\]\.efecto\.ocurrencia · una mitigación no sube la ocurrencia \(5\)/],
    ["una mitigación sin efecto", (d) => yaml(d, `${PLAN}/modos-de-falla/rie-catalogo-rehacer.yaml`, (x) => (x.mitigaciones[0].efecto = {})), /· rie-catalogo-rehacer · mitigaciones\[0\]\.efecto · baja la ocurrencia, la detección o las dos/],
    ["un supuesto que sostiene una decisión que no existe", (d) => yaml(d, `${PLAN}/supuestos/sup-equipo-opera.yaml`, (x) => (x.decisiones = ["dec-fantasma"])), /· sup-equipo-opera · decisiones\[0\] · «dec-fantasma» no es una decisión del plan/],
    ["un supuesto con una fecha que no existe", (d) => yaml(d, `${PLAN}/supuestos/sup-equipo-opera.yaml`, (x) => (x.vence = "2026-02-31")), /· sup-equipo-opera · vence · una fecha AAAA-MM-DD que exista/],
    ["una carpeta de plan de otro caso", (d) => yaml(d, `${PLAN}/plan.yaml`, (x) => (x.caso_id = "otro-caso")), /plan\.yaml:\d+:\d+ · plan · caso_id · el plan está en la carpeta del caso «hospital-futuro»/],
    ["un plan aprobado sin sello", (d) => yaml(d, `${PLAN}/plan.yaml`, (x) => (x.estado_aprobacion = "aprobado")), /plan\.yaml:\d+:\d+ · plan · aprobacion · obligatorio en un plan aprobado/],
    ["vocabulario vetado en un texto del plan", (d) => decision(d, "dec-catalogo", (x) => (x.pregunta.es = "¿Cómo se organiza el lago de datos?")), /· dec-catalogo · pregunta\.es · vocabulario vetado/],
  ];
  it.each(casos)("%s", (_nombre, cambio, esperada) => {
    const f = fallas(copia(cambio));
    expect(f.length, f.join("\n")).toBeGreaterThan(0);
    expect(f.some((l) => esperada.test(l)), `${esperada}\n---\n${f.join("\n")}`).toBe(true);
  });

  it("un plan aprobado cuya huella no es la de su contenido se rechaza: no se edita a mano", () => {
    const f = fallas(
      copia((d) => {
        const k = cargarConocimiento(d);
        const plan = k.planes[0]!;
        yaml(d, `${PLAN}/plan.yaml`, (x) => {
          x.estado_aprobacion = "aprobado";
          x.aprobacion = { fecha: "2026-10-12", huella: huellaPlan({ ...plan, estado_aprobacion: "borrador" } as Plan) };
        });
        decision(d, "dec-catalogo", (x) => (x.pregunta.es = `${x.pregunta.es} (editada a mano)`));
      }),
    );
    expect(f.some((l) => /plan\.yaml:\d+:\d+ · plan · aprobacion\.huella · no es la huella del plan/.test(l)), f.join("\n")).toBe(true);
  });

  it("un plan aprobado con una alta sin mitigación (aunque su huella sea la suya) se rechaza: el bloqueante manda", () => {
    const f = fallas(
      copia((d) => {
        yaml(d, `${PLAN}/modos-de-falla/rie-fuga-datos-clinicos.yaml`, (x) => (x.mitigaciones = []));
        const plan = cargarConocimiento(d).planes[0]!;
        yaml(d, `${PLAN}/plan.yaml`, (x) => {
          x.estado_aprobacion = "aprobado";
          x.aprobacion = { fecha: "2026-10-12", huella: huellaPlan(plan) };
        });
      }),
    );
    expect(f.some((l) => /· plan · estado_aprobacion · un plan aprobado no tiene bloqueantes \(prioridad_alta_sin_mitigacion: rie-fuga-datos-clinicos/.test(l)), f.join("\n")).toBe(true);
  });

  it("el MISMO plan en borrador, con ciclo y una alta sin mitigación, SÍ carga: la pantalla los muestra", () => {
    const dir = copia((d) => {
      decision(d, "dec-identidad", (x) => (x.depende_de = ["dec-proteccion-clinica"]));
      yaml(d, `${PLAN}/modos-de-falla/rie-fuga-datos-clinicos.yaml`, (x) => (x.mitigaciones = []));
    });
    expect(fallas(dir)).toEqual([]);
    const plan = cargarConocimiento(dir).planes[0]!;
    const informe = informeDeInstrumentos({ decisiones: plan.decisiones, modos_de_falla: plan.modos_de_falla, supuestos: plan.supuestos });
    expect(informe.ok).toBe(false);
    expect(informe.ciclo).not.toBeNull();
    expect(informe.bloqueantes.map((b) => b.tipo).sort()).toEqual(["ciclo", "prioridad_alta_sin_mitigacion"]);
  });
});

describe("la huella del plan", () => {
  const plan = cargarConocimiento().planes[0]!;

  it("es la misma en cualquier copia del plan: el cargador ordena por id, no por el orden de los archivos", () => {
    const otra = cargarConocimiento(copia()).planes[0]!;
    expect(otra.decisiones.map((d) => d.id)).toEqual([...otra.decisiones.map((d) => d.id)].sort());
    expect(huellaPlan(otra)).toBe(huellaPlan(plan));
  });

  it("cambia con un solo dato y no depende de su sello ni de su estado", () => {
    const h = huellaPlan(plan);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(huellaPlan({ ...plan, estado_aprobacion: "aprobado", aprobacion: { fecha: "2026-10-12", huella: h } })).toBe(h);
    const otro = { ...plan, supuestos: plan.supuestos.map((s, i) => (i === 0 ? { ...s, estado: "confirmado" as const } : s)) };
    expect(huellaPlan(otro)).not.toBe(h);
  });
});
