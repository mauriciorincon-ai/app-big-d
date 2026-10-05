// @vitest-environment node
// La base de conocimiento y el caso (C9–C10, RF-01.2, RF-01.3, RF-03.x): la base del repo carga; una base completa y
// ficticia carga de punta a punta y el núcleo la evalúa como al caso de la maqueta; y cada forma de dato roto rompe
// la carga con `archivo:línea:col · id · campo · regla` (jamás se completa por inferencia). Cada caso trabaja en un
// directorio temporal; data/ no se toca.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { canonicoEstricto, evaluar } from "@/engine";
import { ErrorDeDatos } from "@/lib/datos";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { contenidoDe, entradaDe, huellaDe, nuevaInstantanea } from "@/lib/datos/instantanea";
import { armarBaseSabana, FECHA_INSTANTANEA } from "./lib/base-sabana";
import { sabana } from "./nucleo/lib/sabana";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function base(cambio?: (dir: string, version: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "bigd-conocimiento-"));
  dirs.push(dir);
  const version = armarBaseSabana(dir);
  cambio?.(dir, version);
  return dir;
}
const yaml = (dir: string, rel: string, f: (d: Record<string, unknown>) => void) => {
  const ruta = join(dir, rel);
  const d = parse(readFileSync(ruta, "utf8")) as Record<string, unknown>;
  f(d);
  writeFileSync(ruta, stringify(d));
};
const EVI = "evidencias/norte/evi-norte-ingesta.yaml";

function fallas(dir: string): string[] {
  try {
    cargarConocimiento(dir);
  } catch (e) {
    if (e instanceof ErrorDeDatos) return e.fallas;
    throw e;
  }
  return [];
}

describe("la base del repo", () => {
  it("carga: seis capacidades (las de la gramática), once criterios y una escala con su tabla de topes", () => {
    const k = cargarConocimiento();
    expect(k.capacidades.map((c) => c.id)).toEqual(["cap-almacenamiento", "cap-consumo", "cap-gobierno", "cap-ia", "cap-ingesta", "cap-transformacion"]);
    expect(k.criterios).toHaveLength(11);
    expect(k.criterios.filter((c) => c.tipo === "transversal").map((c) => c.id)).toEqual(["crit-costo", "crit-cumplimiento", "crit-dependencia", "crit-ecosistema", "crit-habilidades"]);
    for (const cap of k.capacidades) expect(k.criterios.filter((c) => c.capacidad_id === cap.id)).toHaveLength(1);
    expect(k.escalas.map((e) => e.tope_por_madurez.map((t) => `${t.madurez}:${t.tope}/${t.tope_aceptando_vista_previa}`))).toEqual([["disponible-general:4/4", "vista-previa-publica:2/4", "vista-previa-privada:2/4", "beta:2/4", "anunciado:2/2", "retirado:2/2"]]);
    expect(k.convenciones).toMatchObject({ umbral_empate_centesimas: 500, robustez: { robusta_pct: 70, fragil_pct: 50 } });
  });
});

describe("una base completa y ficticia", () => {
  it("carga de punta a punta y el núcleo la evalúa igual que al caso de la maqueta", () => {
    const k = cargarConocimiento(base());
    expect(k.evidencias).toHaveLength(44);
    expect(k.instantaneas.map((i) => [i.version, i.cambios.length])).toEqual([[`${FECHA_INSTANTANEA}.1`, 44]]);
    const r = evaluar(entradaDe(k.casos[0]!, k.instantaneas[0]!));
    const m = evaluar(sabana());
    if (r.tipo !== "evaluado" || m.tipo !== "evaluado") throw new Error("no se evaluó");
    expect(r.orden).toEqual(m.orden);
    expect(r.veredicto).toEqual(m.veredicto);
    expect(canonicoEstricto(r.sensibilidad)).toBe(canonicoEstricto(m.sensibilidad));
  });

  it("dos cargas dan la misma huella, y una evidencia propuesta no entra a la instantánea ni cambia un puntaje (M1)", () => {
    const dir = base((d) => {
      const e = parse(readFileSync(join(d, EVI), "utf8")) as Record<string, unknown>;
      writeFileSync(join(d, "evidencias/norte/evi-norte-ingesta-2.yaml"), stringify({ ...e, id: "evi-norte-ingesta-2", puntaje: 0, estado_aprobacion: "propuesta", aprobada_por: undefined, fecha_aprobacion: undefined }));
    });
    const [a, b] = [cargarConocimiento(dir), cargarConocimiento(dir)];
    expect(huellaDe(contenidoDe(a))).toBe(huellaDe(contenidoDe(b)));
    expect(a.evidencias).toHaveLength(45);
    expect(contenidoDe(a).evidencias.map((e) => e.id)).not.toContain("evi-norte-ingesta-2");
    expect(huellaDe(contenidoDe(a))).toBe(a.instantaneas[0]!.huella);
  });

  it("la instantánea siguiente lleva la anterior y solo los cambios", () => {
    const k = cargarConocimiento(base());
    const sig = nuevaInstantanea({ ...k, evidencias: k.evidencias.map((e) => (e.id === "evi-sur-costo" ? { ...e, puntaje: 3 } : e)).filter((e) => e.id !== "evi-este-ia") }, FECHA_INSTANTANEA, k.instantaneas);
    expect(sig.version).toBe(`${FECHA_INSTANTANEA}.2`);
    expect(sig.anterior).toBe(`${FECHA_INSTANTANEA}.1`);
    expect(sig.cambios).toEqual([
      { evidencia_id: "evi-este-ia", tipo: "retirada" },
      { evidencia_id: "evi-sur-costo", tipo: "modificada" },
    ]);
    expect(() => nuevaInstantanea(k, "2026-09-01", k.instantaneas)).toThrow("es posterior");
  });
});

describe("una base rota no carga y dice dónde (RF-01.2)", () => {
  const casos: [string, (dir: string, version: string) => void, RegExp][] = [
    ["evidencia sin fecha de verificación", (d) => yaml(d, EVI, (e) => void delete e.fecha_verificacion), /^data\/evidencias\/norte\/evi-norte-ingesta\.yaml:1:1 · evi-norte-ingesta · fecha_verificacion · obligatorio, ausente$/],
    ["evidencia sin fuentes", (d) => yaml(d, EVI, (e) => void (e.fuentes = [])), /evi-norte-ingesta\.yaml:\d+:\d+ · evi-norte-ingesta · fuentes · al menos una fuente$/],
    ["fuente sin conflicto de interés (E-18)", (d) => yaml(d, EVI, (e) => void delete (e.fuentes as Record<string, unknown>[])[0]!.conflicto_de_interes), /evi-norte-ingesta\.yaml:\d+:\d+ · evi-norte-ingesta · fuentes\[0\]\.conflicto_de_interes · obligatorio, ausente$/],
    ["evidencia sin justificación del puntaje", (d) => yaml(d, EVI, (e) => void delete e.justificacion_puntaje), /· justificacion_puntaje · obligatorio, ausente$/],
    ["`verificada_en_practica` (E-23: la herramienta no opera plataformas)", (d) => yaml(d, EVI, (e) => void (e.verificada_en_practica = true)), /· verificada_en_practica · campo desconocido: «verificada_en_practica»$/],
    ["una madurez que la gramática no tiene", (d) => yaml(d, EVI, (e) => void (e.madurez = "rumor")), /· madurez · «rumor» no está en la escala de madurez de la gramática$/],
    ["capacidad y criterio a la vez", (d) => yaml(d, EVI, (e) => void (e.criterio_id = "crit-costo")), /· criterio_id · una evidencia evalúa una capacidad o un criterio transversal: exactamente uno de los dos$/],
    ["una evidencia transversal que apunta a un criterio de capacidad", (d) => yaml(d, "evidencias/norte/evi-norte-costo.yaml", (e) => void (e.criterio_id = "crit-gobierno")), /· criterio_id · crit-gobierno es de tipo capacidad: la evidencia va a su capacidad \(cap-gobierno\)$/],
    ["aprobada sin quién la aprobó", (d) => yaml(d, EVI, (e) => void delete e.aprobada_por), /· aprobada_por · obligatorio en una evidencia aprobada$/],
    ["una ficticia que cita un dominio real", (d) => yaml(d, EVI, (e) => void ((e.fuentes as Record<string, unknown>[])[0]!.url = "https://docs.norte.com/ingesta")), /· fuentes\[0\]\.url · una plataforma ficticia solo cita dominios reservados/],
    ["dos evidencias aprobadas en una celda y ninguna esencial", (d) => {
      yaml(d, EVI, (e) => void (e.esencial = false));
      const e = parse(readFileSync(join(d, EVI), "utf8")) as Record<string, unknown>;
      writeFileSync(join(d, "evidencias/norte/evi-norte-ingesta-2.yaml"), stringify({ ...e, id: "evi-norte-ingesta-2" }));
    }, /· esencial · norte · cap-ingesta tiene 2 evidencias aprobadas y ninguna esencial/],
    ["un id que no empieza por la plataforma de su carpeta", (d) => {
      const e = parse(readFileSync(join(d, EVI), "utf8")) as Record<string, unknown>;
      writeFileSync(join(d, "evidencias/norte/evi-sur-otra.yaml"), stringify({ ...e, id: "evi-sur-otra", capacidad_id: undefined, criterio_id: "crit-costo" }));
    }, /evi-sur-otra\.yaml:\d+:\d+ · evi-sur-otra · id · el id empieza por «evi-norte-»$/],
    ["una clave repetida en el YAML", (d) => writeFileSync(join(d, EVI), `${readFileSync(join(d, EVI), "utf8")}puntaje: 2\n`), /evi-norte-ingesta\.yaml:\d+:1 · evi-norte-ingesta · yaml · Map keys must be unique/],
    ["vocabulario vetado en una afirmación", (d) => yaml(d, EVI, (e) => void ((e.afirmacion as Record<string, string>).es = "Guarda todo en un lago de datos.")), /· afirmacion\.es · vocabulario vetado: calco de «data lake»/],
    ["una capacidad con otro nombre que su tipo en la gramática", (d) => yaml(d, "capacidades/cap-ia.yaml", (c) => void ((c.nombre as Record<string, string>).es = "IA")), /cap-ia\.yaml:\d+:\d+ · cap-ia · nombre\.es · no coincide con el nombre del tipo en la gramática/],
    ["una capacidad que falta", (d) => rmSync(join(d, "capacidades/cap-consumo.yaml")), /data\/capacidades · falta cap-consumo\.yaml/],
    ["un tope de 4 para lo que no está disponible (RF-04.2)", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[1]!.tope = 4)), /esc-evidencia\.yaml:\d+:\d+ · esc-evidencia · tope_por_madurez\[1\]\.tope · RF-04\.2/],
    ["la instantánea editada después de congelarse", (d, v) => {
      const ruta = join(d, "instantaneas", `${v}.json`);
      writeFileSync(ruta, readFileSync(ruta, "utf8").replace('"puntaje": 4', '"puntaje": 3'));
    }, /instantaneas\/2026-09-26\.1\.json:\d+:\d+ · 2026-09-26\.1 · huella · no es la huella de su contenido/],
    ["un caso cuyos pesos no suman 100", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.criterios as Record<string, number>[])[0]!.peso_centesimas += 1)), /hospital-sabana\.yaml:\d+:\d+ · hospital-sabana · criterios · los pesos suman 10001 centésimas y deben sumar 10 000/],
    ["un caso sin «¿una plataforma o combinación?» (E-17)", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void (c.decisiones_implicitas = (c.decisiones_implicitas as { id: string }[]).filter((x) => x.id !== "una-o-combinacion"))), /· decisiones_implicitas · falta la decisión «una-o-combinacion»/],
    ["un perfil aprobado con una decisión sin responder", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.decisiones_implicitas as Record<string, unknown>[])[0]!.respuesta = null)), /· decisiones_implicitas\[0\]\.respuesta · un perfil aprobado responde todas sus decisiones implícitas$/],
    ["un perfil aprobado editado a mano", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void (c.acepta_vista_previa = true)), /· aprobacion\.huella · no es la huella del perfil: un perfil aprobado no se edita a mano/],
    ["un caso que referencia una instantánea que no existe", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void (c.instantanea = "2026-09-27.1")), /· instantanea · no existe data\/instantaneas\/2026-09-27\.1\.json$/],
    ["una restricción que elimina una plataforma que no está en la instantánea", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.restricciones as { elimina: Record<string, unknown>[] }[])[0]!.elimina[0]!.plataforma_id = "oeste")), /· restricciones\[0\]\.elimina\[0\]\.plataforma_id · «oeste» no es una plataforma de la instantánea 2026-09-26\.1$/],
    ["dos archivos de convenciones", (d) => writeFileSync(join(d, "convenciones/otro.yaml"), "id: metodo\n"), /^data\/convenciones · la base trae exactamente un archivo de convenciones/],
    // Criterios y capacidades.
    ["un criterio de capacidad sin capacidad", (d) => yaml(d, "criterios/crit-ia.yaml", (c) => void delete c.capacidad_id), /crit-ia\.yaml:\d+:\d+ · crit-ia · capacidad_id · obligatorio en un criterio de tipo capacidad$/],
    ["un criterio transversal con capacidad", (d) => yaml(d, "criterios/crit-costo.yaml", (c) => void (c.capacidad_id = "cap-ia")), /crit-costo\.yaml:\d+:\d+ · crit-costo · capacidad_id · un criterio transversal no tiene capacidad$/],
    ["dos criterios para una capacidad", (d) => yaml(d, "criterios/crit-consumo.yaml", (c) => void (c.capacidad_id = "cap-ia")), /· capacidad_id · la capacidad cap-ia ya tiene su criterio/],
    ["un criterio con una escala que no existe", (d) => yaml(d, "criterios/crit-costo.yaml", (c) => void (c.escala_id = "esc-otra")), /crit-costo\.yaml:\d+:\d+ · crit-costo · escala_id · «esc-otra» no es una escala de la base$/],
    ["una capacidad que la gramática no tiene", (d) => writeFileSync(join(d, "capacidades/cap-extra.yaml"), stringify({ id: "cap-extra", nombre: { es: "Extra", en: "Extra" }, definicion: { es: "x", en: "x" }, preguntas_guia: [{ es: "¿x?", en: "x?" }] })), /cap-extra\.yaml:\d+:\d+ · cap-extra · id · la gramática plataformas-datos no tiene la capacidad cap-extra$/],
    ["un archivo que no se llama como su id", (d) => yaml(d, "capacidades/cap-ia.yaml", (c) => void (c.id = "cap-ia-2")), /cap-ia\.yaml:\d+:\d+ · cap-ia-2 · id · el archivo se llama como su id: «cap-ia-2\.yaml»$/],
    // Convenciones.
    ["frágil por encima de robusta", (d) => yaml(d, "convenciones/metodo.yaml", (c) => void ((c.robustez as Record<string, number>).fragil_pct = 80)), /metodo\.yaml:\d+:\d+ · metodo · robustez\.fragil_pct · tiene que ser menor que robusta_pct$/],
    ["vencida antes de por revisar", (d) => yaml(d, "convenciones/metodo.yaml", (c) => void ((c.vigencia as Record<string, number>).vencido_dias = 10)), /· vigencia\.vencido_dias · tiene que ser mayor que revisar_dias$/],
    ["el ancla baja por encima de la alta", (d) => yaml(d, "convenciones/metodo.yaml", (c) => void ((c.pros_contras as Record<string, number>).ancla_corta = 4)), /· pros_contras\.ancla_corta · tiene que ser menor que ancla_destaca$/],
    ["una semilla repetida", (d) => yaml(d, "convenciones/metodo.yaml", (c) => void ((c.simulacion as Record<string, unknown>).semillas_estabilidad = [20261004])), /· simulacion\.semillas_estabilidad · las semillas no se repiten/],
    ["una gramática que no existe", (d) => yaml(d, "convenciones/metodo.yaml", (c) => void (c.gramatica_id = "otra")), /metodo\.yaml:\d+:\d+ · metodo · gramatica_id · no existe data\/gramaticas\/otra\.gramatica\.yaml$/],
    // Escala.
    ["una madurez de la gramática sin tope", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void (e.tope_por_madurez = (e.tope_por_madurez as { madurez: string }[]).filter((x) => x.madurez !== "beta"))), /· tope_por_madurez · falta la madurez «beta» de la gramática$/],
    ["un tope con una madurez que la gramática no tiene", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[5]!.madurez = "rumor")), /· tope_por_madurez\[5\]\.madurez · «rumor» no está en la escala de madurez de la gramática$/],
    ["una madurez repetida en los topes", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[5]!.madurez = "beta")), /· tope_por_madurez\[5\]\.madurez · repetida$/],
    ["«disponible» distinto del de la gramática", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[3]!.disponible = true)), /· tope_por_madurez\[3\]\.disponible · la gramática dice false$/],
    ["un tope para lo disponible por debajo del máximo", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[0]!.tope = 3)), /· tope_por_madurez\[0\]\.tope · una madurez disponible no tiene tope: 4$/],
    ["aceptar vista previa que baja el tope", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void ((e.tope_por_madurez as Record<string, unknown>[])[1]!.tope_aceptando_vista_previa = 1)), /· tope_por_madurez\[1\]\.tope_aceptando_vista_previa · aceptar vista previa no baja el tope$/],
    ["niveles que no son 0 a 4", (d) => yaml(d, "escalas/esc-evidencia.yaml", (e) => void (e.niveles as unknown[]).pop()), /· niveles · los niveles 0, 1, 2, 3 y 4, en orden/],
    // Evidencias.
    ["un puntaje fuera de la escala", (d) => yaml(d, EVI, (e) => void (e.puntaje = 5)), /· puntaje · a lo sumo 4$/],
    ["un puntaje que no es un número", (d) => yaml(d, EVI, (e) => void (e.puntaje = "tres")), /· puntaje · se esperaba un número$/],
    ["una fecha que no existe", (d) => yaml(d, EVI, (e) => void (e.fecha_verificacion = "2026-02-31")), /· fecha_verificacion · una fecha AAAA-MM-DD que exista$/],
    ["una propuesta con quién la aprobó", (d) => yaml(d, EVI, (e) => void (e.estado_aprobacion = "propuesta")), /· aprobada_por · solo una evidencia aprobada lo lleva$/],
    ["una fuente que no es https", (d) => yaml(d, EVI, (e) => void ((e.fuentes as Record<string, unknown>[])[0]!.url = "http://example.org/x")), /· fuentes\[0\]\.url · solo fuentes https$/],
    ["una cita demasiado corta", (d) => yaml(d, EVI, (e) => void ((e.fuentes as Record<string, unknown>[])[0]!.cita = "corta")), /· fuentes\[0\]\.cita · una cita de al menos 40 caracteres$/],
    ["un conflicto de interés fuera de la lista", (d) => yaml(d, EVI, (e) => void ((e.fuentes as Record<string, unknown>[])[0]!.conflicto_de_interes = "amigo")), /· fuentes\[0\]\.conflicto_de_interes · «amigo» no es uno de: propio-fabricante/],
    ["una capacidad que no existe", (d) => yaml(d, EVI, (e) => void (e.capacidad_id = "cap-magia")), /· capacidad_id · «cap-magia» no es una capacidad de la base$/],
    ["un criterio que no existe", (d) => yaml(d, "evidencias/norte/evi-norte-costo.yaml", (e) => void (e.criterio_id = "crit-magia")), /· criterio_id · «crit-magia» no es un criterio de la base$/],
    ["una evidencia en la carpeta de otra plataforma", (d) => yaml(d, EVI, (e) => void (e.plataforma_id = "sur")), /· plataforma_id · «sur» no es la plataforma de su carpeta \(«norte»\)$/],
    ["una carpeta que no es una plataforma", (d) => {
      const e = parse(readFileSync(join(d, EVI), "utf8")) as Record<string, unknown>;
      mkdirSync(join(d, "evidencias/oeste"));
      writeFileSync(join(d, "evidencias/oeste/evi-oeste-ingesta.yaml"), stringify({ ...e, id: "evi-oeste-ingesta", plataforma_id: "oeste" }));
    }, /^data\/evidencias\/oeste · la carpeta se llama como una plataforma/],
    // Instantáneas.
    ["unos cambios que no son los de la anterior", (d, v) => {
      const ruta = join(d, "instantaneas", `${v}.json`);
      const i = JSON.parse(readFileSync(ruta, "utf8"));
      i.cambios.pop();
      writeFileSync(ruta, JSON.stringify(i, null, 2));
    }, /2026-09-26\.1\.json:\d+:\d+ · 2026-09-26\.1 · cambios · no son los cambios frente a la anterior$/],
    ["una anterior que no es la previa", (d, v) => {
      const ruta = join(d, "instantaneas", `${v}.json`);
      const i = JSON.parse(readFileSync(ruta, "utf8"));
      i.anterior = "2026-09-01.1";
      writeFileSync(ruta, JSON.stringify(i, null, 2));
    }, /· anterior · la anterior es null \(es la primera\)$/],
    ["una instantánea cuyo archivo no es su versión", (d, v) => {
      const ruta = join(d, "instantaneas", `${v}.json`);
      writeFileSync(join(d, "instantaneas", "2026-09-26.9.json"), readFileSync(ruta));
      rmSync(ruta);
    }, /2026-09-26\.9\.json:\d+:\d+ · 2026-09-26\.1 · version · el archivo se llama como su versión/],
    ["una instantánea con una evidencia no aprobada", (d, v) => {
      const ruta = join(d, "instantaneas", `${v}.json`);
      const i = JSON.parse(readFileSync(ruta, "utf8"));
      Object.assign(i.contenido.evidencias[0], { estado_aprobacion: "propuesta", aprobada_por: undefined, fecha_aprobacion: undefined });
      writeFileSync(ruta, JSON.stringify(i, null, 2));
    }, /· contenido\.evidencias\[0\]\.estado_aprobacion · una instantánea congela solo evidencias aprobadas$/],
    // Casos.
    ["una respuesta que no es una opción", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.decisiones_implicitas as Record<string, unknown>[])[0]!.respuesta = "tres")), /· decisiones_implicitas\[0\]\.respuesta · «tres» no es una de sus opciones$/],
    ["un borrador con sello", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void (c.estado_aprobacion = "borrador")), /· aprobacion · solo un perfil aprobado lleva sello$/],
    ["un aprobado sin sello", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void delete c.aprobacion), /· aprobacion · obligatorio en un perfil aprobado$/],
    ["un criterio pesado dos veces", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => {
      const cs = c.criterios as Record<string, unknown>[];
      cs[1]!.criterio_id = cs[0]!.criterio_id;
    }), /· criterios · un criterio aparece dos veces$/],
    ["un criterio de la instantánea sin peso", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => {
      const cs = c.criterios as Record<string, number>[];
      cs[0]!.peso_centesimas += cs.pop()!.peso_centesimas;
    }), /· criterios · falta el peso de crit-ecosistema/],
    ["un requisito sobre un criterio que no existe", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.requisitos as Record<string, unknown>[])[0]!.criterio_id = "crit-magia")), /· requisitos\[0\]\.criterio_id · «crit-magia» no es un criterio de la instantánea 2026-09-26\.1$/],
    ["una restricción sobre un criterio que no existe", (d) => yaml(d, "casos/hospital-sabana.yaml", (c) => void ((c.restricciones as Record<string, unknown>[])[0]!.criterio_id = "crit-magia")), /· restricciones\[0\]\.criterio_id · «crit-magia» no es un criterio de la instantánea 2026-09-26\.1$/],
  ];

  it.each(casos)("%s", (_que, romper, esperado) => {
    const f = fallas(base(romper));
    expect(f.some((x) => esperado.test(x)), f.join("\n")).toBe(true);
  });
});
