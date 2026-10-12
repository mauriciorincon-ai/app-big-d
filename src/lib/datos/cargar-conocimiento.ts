import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateGrammar, type Gramatica } from "diagramador";
import { informeDeInstrumentos } from "instrumentos-de-plan";
import { parse } from "yaml";
import { ErrorDeDatos, esDominioDeEjemplo } from "./cargar";
import { esquemaCapacidad, esquemaCaso, esquemaConvenciones, esquemaCriterio, esquemaEscala, esquemaEvidencia, esquemaInstantanea, type Capacidad, type Caso, type Convenciones, type Criterio, type Escala, type Evidencia, type Instantanea } from "./conocimiento";
import { esquemaPlataforma, type Plataforma } from "./esquemas";
import { esquemaConvencionesInforme, type ConvencionesInforme } from "./informe";
import { cambiosEntre, compararInstantanea, huellaCaso, huellaDe, huellaPlan, type Base } from "./instantanea";
import { esquemaDecision, esquemaModoDeFalla, esquemaPlanCaso, esquemaSupuesto, type Decision, type ModoDeFalla, type Plan, type PlanCaso, type Supuesto } from "./plan";
import { dirDatos } from "./dir";
import { migrarContrato } from "./migrar";
import { leerConPosicion, linea, validarLeido, type Leido, type Ruta } from "./posicion";
import { vocabularioVetado } from "./vocabulario";

// Cargador de la base de conocimiento y de los casos (C9–C10, RF-01.2): YAML 1.2, un archivo por entidad, validado
// entero antes de calcular nada. Toda falla se escribe `archivo:línea:col · id · campo · regla` y la carga entera se
// rechaza: una base incompleta no carga y jamás se completa por inferencia. Además de cada esquema, cruza los
// archivos: capacidades = las de la gramática, cada capacidad con su criterio, madurez de la gramática con su tope,
// referencias que resuelven, celdas con varias evidencias y ninguna esencial, fuentes de las ficticias, vocabulario
// vetado, la huella de cada instantánea y sus cambios, y el sello de cada caso aprobado.

export interface Conocimiento extends Base {
  gramatica: Gramatica;
  convenciones: Convenciones;
  /** S6: lo que el informe usa (lectura, categorías, glosario). No entra a la instantánea. */
  informe: ConvencionesInforme;
  capacidades: Capacidad[];
  criterios: Criterio[];
  escalas: Escala[];
  /** Todas, en cualquier estado; solo las aprobadas entran a una instantánea (RF-01.3). */
  evidencias: Evidencia[];
  /** De la más vieja a la más nueva. */
  instantaneas: Instantanea[];
  casos: Caso[];
  /** El plan de cada caso que lo tiene (data/casos/<caso>/plan/), de decisiones, modos de falla y supuestos. */
  planes: Plan[];
}

interface Con<T> {
  l: Leido;
  v: T;
}

const porId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const yamls = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort() : []);

/** Lee y valida cada `<id>.yaml` de una carpeta; el nombre del archivo es el id. */
function entidades<T extends { id: string }>(dir: string, rel: string, esquema: Parameters<typeof validarLeido>[1], fallas: string[]): Con<T>[] {
  const out: Con<T>[] = [];
  for (const f of yamls(dir)) {
    const l = leerConPosicion(join(dir, f), `${rel}/${f}`, fallas);
    if (!l) continue;
    const v = validarLeido(l, esquema, fallas) as T | null;
    if (!v) continue;
    if (f !== `${v.id}.yaml`) fallas.push(linea(l, ["id"], `el archivo se llama como su id: «${v.id}.yaml»`));
    out.push({ l, v });
  }
  return out.sort((a, b) => porId(a.v, b.v));
}

/** Cada texto vetado (design-system § 8) de un dato que Big-D publica. */
function vetadas(c: Con<unknown>, campos: readonly string[], fallas: string[]): void {
  const dato = c.v as Record<string, unknown>;
  for (const k of campos)
    for (const { ruta, que } of vocabularioVetado(dato[k])) {
      const r: Ruta = [k, ...ruta.split("/").filter(Boolean).map((x) => (/^\d+$/.test(x) ? Number(x) : x))];
      fallas.push(linea(c.l, r, `vocabulario vetado: ${que}`));
    }
}

/**
 * Las reglas que cruzan archivos de una base (la viva o la congelada en una instantánea). `l` da la posición: la del
 * archivo de cada entidad, o la de la instantánea con su ruta dentro del contenido.
 */
function cruzarBase(b: { plataformas: { id: string; ficticia: boolean }[]; capacidades: Capacidad[]; criterios: Criterio[]; escalas: Escala[]; evidencias: Evidencia[] }, donde: (tipo: "criterio" | "evidencia", i: number, ruta: Ruta, regla: string) => string, fallas: string[]): void {
  const caps = new Set(b.capacidades.map((c) => c.id));
  const escalas = new Set(b.escalas.map((e) => e.id));
  const plataformas = new Map(b.plataformas.map((p) => [p.id, p]));
  b.criterios.forEach((c, i) => {
    if (c.capacidad_id && !caps.has(c.capacidad_id)) fallas.push(donde("criterio", i, ["capacidad_id"], `«${c.capacidad_id}» no es una capacidad de la base`));
    if (!escalas.has(c.escala_id)) fallas.push(donde("criterio", i, ["escala_id"], `«${c.escala_id}» no es una escala de la base`));
  });
  const usadas = new Set(b.criterios.map((c) => c.escala_id));
  if (usadas.size > 1) b.criterios.forEach((c, i) => i > 0 && c.escala_id !== b.criterios[0]!.escala_id && fallas.push(donde("criterio", i, ["escala_id"], `todos los criterios usan una sola escala (el total suma sus puntajes): ${b.criterios[0]!.escala_id}`)));
  for (const cap of b.capacidades) {
    const de = b.criterios.map((c, i) => [c, i] as const).filter(([c]) => c.capacidad_id === cap.id);
    if (de.length > 1) de.slice(1).forEach(([, i]) => fallas.push(donde("criterio", i, ["capacidad_id"], `la capacidad ${cap.id} ya tiene su criterio (${de[0]![0].id}): cada capacidad, uno`)));
  }
  const criterios = new Map(b.criterios.map((c) => [c.id, c]));
  const celdas = new Map<string, number[]>();
  b.evidencias.forEach((e, i) => {
    const p = plataformas.get(e.plataforma_id);
    if (!p) fallas.push(donde("evidencia", i, ["plataforma_id"], `«${e.plataforma_id}» no es una plataforma de la base`));
    if (e.capacidad_id && !caps.has(e.capacidad_id)) fallas.push(donde("evidencia", i, ["capacidad_id"], `«${e.capacidad_id}» no es una capacidad de la base`));
    if (e.criterio_id) {
      const c = criterios.get(e.criterio_id);
      if (!c) fallas.push(donde("evidencia", i, ["criterio_id"], `«${e.criterio_id}» no es un criterio de la base`));
      else if (c.tipo !== "transversal") fallas.push(donde("evidencia", i, ["criterio_id"], `${c.id} es de tipo capacidad: la evidencia va a su capacidad (${c.capacidad_id})`));
    }
    if (p?.ficticia) e.fuentes.forEach((f, k) => !esDominioDeEjemplo(f.url) && fallas.push(donde("evidencia", i, ["fuentes", k, "url"], "una plataforma ficticia solo cita dominios reservados (example.org, *.invalid…)")));
    if (e.estado_aprobacion === "aprobada") {
      const clave = `${e.plataforma_id}|${e.capacidad_id ?? e.criterio_id}`;
      celdas.set(clave, [...(celdas.get(clave) ?? []), i]);
    }
  });
  for (const [clave, is] of celdas)
    if (is.length > 1 && !is.some((i) => b.evidencias[i]!.esencial))
      fallas.push(donde("evidencia", is[0]!, ["esencial"], `${clave.replace("|", " · ")} tiene ${is.length} evidencias aprobadas y ninguna esencial: el mínimo no tiene sobre qué calcularse (RF-04.1)`));
}

/** La base contra la que un plan cita y se cruza: la de la instantánea del caso, o la viva de un borrador sin ella. */
interface BaseDelPlan {
  donde: string;
  plataformas: { id: string; ficticia: boolean }[];
  capacidades: { id: string }[];
  criterios: { id: string }[];
  evidencias: Evidencia[];
}

/**
 * El plan de un caso: `data/casos/<caso>/plan/{plan.yaml, decisiones/, modos-de-falla/, supuestos/}`, un archivo por
 * entidad. Aplica los esquemas y las reglas que cruzan archivos: toda cita es de una evidencia APROBADA de la plataforma
 * de su opción, toda plataforma evaluable tiene su opción, y un plan aprobado lleva la huella de su contenido y ningún
 * bloqueante. Un ciclo o una alta sin mitigación NO impiden cargar un borrador: la pantalla los muestra (C16–C17).
 */
function cargarPlan(dir: string, caso: Caso, b: BaseDelPlan, categorias: ConvencionesInforme["categorias"] | null, fallas: string[]): Plan | null {
  const raiz = join(dir, "casos", caso.id, "plan");
  if (!existsSync(raiz)) return null;
  const rel = `data/casos/${caso.id}/plan`;
  const cab = leerConPosicion(join(raiz, "plan.yaml"), `${rel}/plan.yaml`, fallas);
  const cabecera = cab ? (validarLeido(cab, esquemaPlanCaso, fallas) as PlanCaso | null) : null;
  if (cab && cabecera && cabecera.caso_id !== caso.id) fallas.push(linea(cab, ["caso_id"], `el plan está en la carpeta del caso «${caso.id}»`));
  const decisiones = entidades<Decision>(join(raiz, "decisiones"), `${rel}/decisiones`, esquemaDecision, fallas);
  const modos = entidades<ModoDeFalla>(join(raiz, "modos-de-falla"), `${rel}/modos-de-falla`, esquemaModoDeFalla, fallas);
  const supuestos = entidades<Supuesto>(join(raiz, "supuestos"), `${rel}/supuestos`, esquemaSupuesto, fallas);

  const eliminadas = new Set(caso.restricciones.flatMap((r) => r.elimina.map((e) => e.plataforma_id)));
  const evaluables = b.plataformas.filter((p) => !eliminadas.has(p.id)).map((p) => p.id);
  const aprobadas = new Map(b.evidencias.filter((e) => e.estado_aprobacion === "aprobada").map((e) => [e.id, e]));
  const caps = new Set(b.capacidades.map((c) => c.id));
  const crits = new Set(b.criterios.map((c) => c.id));
  const idsDecision = new Set(decisiones.map((d) => d.v.id));

  for (const x of decisiones) {
    const d = x.v;
    if (d.capacidad_id && !caps.has(d.capacidad_id)) fallas.push(linea(x.l, ["capacidad_id"], `«${d.capacidad_id}» no es una capacidad de ${b.donde}`));
    if (d.criterio_id && !crits.has(d.criterio_id)) fallas.push(linea(x.l, ["criterio_id"], `«${d.criterio_id}» no es un criterio de ${b.donde}`));
    // S6: el alistamiento de la decisión necesita su categoría (§ 6.11): sin ella el ítem de la hoja de ruta no se puede clasificar.
    const origen = d.capacidad_id ?? d.criterio_id;
    if (categorias && origen && !(origen in categorias)) fallas.push(linea(x.l, [d.capacidad_id ? "capacidad_id" : "criterio_id"], `«${origen}» no tiene categoría de alistamiento en data/convenciones/informe.yaml`));
    d.depende_de.forEach((o, i) => !idsDecision.has(o) && fallas.push(linea(x.l, ["depende_de", i], `«${o}» no es una decisión del plan`)));
    d.opciones_por_plataforma.forEach((o, i) => {
      if (!evaluables.includes(o.plataforma_id)) fallas.push(linea(x.l, ["opciones_por_plataforma", i, "plataforma_id"], `«${o.plataforma_id}» no es una plataforma que el caso evalúe (${evaluables.join(", ")})`));
      o.citas.forEach((c, k) => {
        const e = aprobadas.get(c.evidencia_id);
        const aqui = (campo: string, regla: string) => fallas.push(linea(x.l, ["opciones_por_plataforma", i, "citas", k, campo], regla));
        if (!e) return aqui("evidencia_id", `«${c.evidencia_id}» no es una evidencia aprobada de ${b.donde}: el plan solo cita lo aprobado`);
        if (e.plataforma_id !== o.plataforma_id) aqui("evidencia_id", `«${c.evidencia_id}» es de ${e.plataforma_id}, no de ${o.plataforma_id}`);
        for (const comp of c.componentes ?? []) if (!e.componentes.includes(comp)) aqui("componentes", `«${comp}» no es un componente de ${c.evidencia_id} (${e.componentes.join(", ")})`);
      });
    });
    for (const p of evaluables) if (!d.opciones_por_plataforma.some((o) => o.plataforma_id === p)) fallas.push(linea(x.l, ["opciones_por_plataforma"], `falta la opción de ${p}: cada plataforma que el caso evalúa se resuelve, aunque sea «sin_fuente»`));
  }
  for (const x of modos) {
    const m = x.v;
    if (!idsDecision.has(m.decision_id)) fallas.push(linea(x.l, ["decision_id"], `«${m.decision_id}» no es una decisión del plan`));
    m.mitigaciones.forEach((t, i) => {
      if (t.efecto.ocurrencia !== undefined && t.efecto.ocurrencia > m.ocurrencia) fallas.push(linea(x.l, ["mitigaciones", i, "efecto", "ocurrencia"], `una mitigación no sube la ocurrencia (${m.ocurrencia})`));
      if (t.efecto.deteccion !== undefined && t.efecto.deteccion > m.deteccion) fallas.push(linea(x.l, ["mitigaciones", i, "efecto", "deteccion"], `una mitigación no empeora la detección (${m.deteccion})`));
    });
  }
  for (const x of supuestos) x.v.decisiones.forEach((o, i) => !idsDecision.has(o) && fallas.push(linea(x.l, ["decisiones", i], `«${o}» no es una decisión del plan`)));
  for (const x of decisiones) vetadas(x, ["pregunta", "razon_reversibilidad", "opciones_por_plataforma"], fallas);
  for (const x of modos) vetadas(x, ["modo", "efecto", "causa", "razon", "mitigaciones"], fallas);
  for (const x of supuestos) vetadas(x, ["enunciado", "prueba_barata", "responsable"], fallas);

  if (!cab || !cabecera) return null;
  const plan: Plan = { ...cabecera, decisiones: decisiones.map((x) => x.v), modos_de_falla: modos.map((x) => x.v), supuestos: supuestos.map((x) => x.v) };
  if (plan.estado_aprobacion === "aprobado" && plan.aprobacion) {
    if (plan.aprobacion.huella !== huellaPlan(plan)) fallas.push(linea(cab, ["aprobacion", "huella"], "no es la huella del plan: un plan aprobado no se edita a mano (se vuelve a aprobar)"));
    const informe = informeDeInstrumentos({ decisiones: plan.decisiones, modos_de_falla: plan.modos_de_falla, supuestos: plan.supuestos });
    for (const bl of informe.bloqueantes) fallas.push(linea(cab, ["estado_aprobacion"], `un plan aprobado no tiene bloqueantes (${bl.tipo}: ${bl.ids.join(", ")})`));
  }
  return plan;
}

/** `dir` = la carpeta de datos (data/ o un árbol de prueba). */
export function cargarConocimiento(dir = dirDatos()): Conocimiento {
  const fallas: string[] = [];

  const plataformas = entidades<Plataforma>(join(dir, "plataformas"), "data/plataformas", esquemaPlataforma, fallas).map((x) => x.v);

  const archivosConv = yamls(join(dir, "convenciones"));
  if (archivosConv.join() !== "informe.yaml,metodo.yaml") fallas.push(`data/convenciones · la base trae exactamente dos archivos de convenciones, informe.yaml y metodo.yaml (hay: ${archivosConv.join(", ") || "ninguno"})`);
  const convL = archivosConv.includes("metodo.yaml") ? leerConPosicion(join(dir, "convenciones/metodo.yaml"), "data/convenciones/metodo.yaml", fallas) : null;
  const convenciones = convL ? (validarLeido(convL, esquemaConvenciones, fallas) as Convenciones | null) : null;
  const infL = archivosConv.includes("informe.yaml") ? leerConPosicion(join(dir, "convenciones/informe.yaml"), "data/convenciones/informe.yaml", fallas) : null;
  const convInforme = infL ? (validarLeido(infL, esquemaConvencionesInforme, fallas) as ConvencionesInforme | null) : null;

  // La gramática del atlas: de ella salen las capacidades y la escala de madurez.
  let gramatica: Gramatica | null = null;
  if (convenciones) {
    const ruta = join(dir, "gramaticas", `${convenciones.gramatica_id}.gramatica.yaml`);
    if (!existsSync(ruta)) fallas.push(linea(convL!, ["gramatica_id"], `no existe data/gramaticas/${convenciones.gramatica_id}.gramatica.yaml`));
    else {
      const g = migrarContrato(parse(readFileSync(ruta, "utf8")));
      const inf = validateGrammar(g);
      if (inf.ok) gramatica = g as Gramatica;
      else fallas.push(linea(convL!, ["gramatica_id"], `la gramática ${convenciones.gramatica_id} no valida (la carga del atlas dice por qué)`));
    }
  }

  const capacidades = entidades<Capacidad>(join(dir, "capacidades"), "data/capacidades", esquemaCapacidad, fallas);
  const criterios = entidades<Criterio>(join(dir, "criterios"), "data/criterios", esquemaCriterio, fallas);
  const escalas = entidades<Escala>(join(dir, "escalas"), "data/escalas", esquemaEscala, fallas);

  // Evidencias: data/evidencias/<plataforma>/<id>.yaml, con el id que empieza por evi-<plataforma>-.
  const evidencias: Con<Evidencia>[] = [];
  const dirEv = join(dir, "evidencias");
  const carpetas = existsSync(dirEv) ? readdirSync(dirEv).filter((x) => !x.startsWith(".")).sort() : [];
  const idsPlataforma = new Set(plataformas.map((p) => p.id));
  for (const carpeta of carpetas) {
    if (!idsPlataforma.has(carpeta)) fallas.push(`data/evidencias/${carpeta} · la carpeta se llama como una plataforma de data/plataformas`);
    for (const x of entidades<Evidencia>(join(dirEv, carpeta), `data/evidencias/${carpeta}`, esquemaEvidencia, fallas)) {
      if (x.v.plataforma_id !== carpeta) fallas.push(linea(x.l, ["plataforma_id"], `«${x.v.plataforma_id}» no es la plataforma de su carpeta («${carpeta}»)`));
      if (!x.v.id.startsWith(`evi-${carpeta}-`)) fallas.push(linea(x.l, ["id"], `el id empieza por «evi-${carpeta}-»`));
      evidencias.push(x);
    }
  }
  evidencias.sort((a, b) => porId(a.v, b.v));

  if (gramatica) {
    // Capacidades = los tipos `cap-` de la gramática, con el mismo nombre en cada idioma.
    const tipos = gramatica.tipos_de_nodo.filter((t) => t.id.startsWith("cap-"));
    for (const t of tipos) {
      const c = capacidades.find((x) => x.v.id === t.id);
      if (!c) fallas.push(`data/capacidades · falta ${t.id}.yaml: la gramática ${gramatica.id} tiene esa capacidad`);
      else for (const i of ["es", "en"] as const) if (c.v.nombre[i] !== t.nombre[i]) fallas.push(linea(c.l, ["nombre", i], `no coincide con el nombre del tipo en la gramática («${t.nombre[i]}»)`));
    }
    for (const c of capacidades) if (!tipos.some((t) => t.id === c.v.id)) fallas.push(linea(c.l, ["id"], `la gramática ${gramatica.id} no tiene la capacidad ${c.v.id}`));
    // La tabla de topes cubre la escala de madurez de la gramática, una vez cada una, con su «disponible».
    const madurez = new Map(gramatica.escala_madurez.map((m) => [m.id, m.disponible]));
    for (const e of escalas) {
      const max = e.v.niveles.at(-1)!.valor;
      e.v.tope_por_madurez.forEach((t, i) => {
        const r = (campo: string, regla: string) => fallas.push(linea(e.l, ["tope_por_madurez", i, campo], regla));
        if (!madurez.has(t.madurez)) r("madurez", `«${t.madurez}» no está en la escala de madurez de la gramática`);
        else if (madurez.get(t.madurez) !== t.disponible) r("disponible", `la gramática dice ${madurez.get(t.madurez)}`);
        if (e.v.tope_por_madurez.findIndex((x) => x.madurez === t.madurez) !== i) r("madurez", "repetida");
        if (t.disponible && (t.tope !== max || t.tope_aceptando_vista_previa !== max)) r("tope", `una madurez disponible no tiene tope: ${max}`);
        if (!t.disponible && t.tope >= max) r("tope", `RF-04.2: lo que no está disponible de forma general aporta menos de ${max}`);
        if (t.tope_aceptando_vista_previa < t.tope) r("tope_aceptando_vista_previa", "aceptar vista previa no baja el tope");
      });
      for (const m of madurez.keys()) if (!e.v.tope_por_madurez.some((t) => t.madurez === m)) fallas.push(linea(e.l, ["tope_por_madurez"], `falta la madurez «${m}» de la gramática`));
    }
    evidencias.forEach((x) => !madurez.has(x.v.madurez) && fallas.push(linea(x.l, ["madurez"], `«${x.v.madurez}» no está en la escala de madurez de la gramática`)));
  }

  const lugar = { criterio: criterios, evidencia: evidencias } as const;
  cruzarBase(
    { plataformas, capacidades: capacidades.map((x) => x.v), criterios: criterios.map((x) => x.v), escalas: escalas.map((x) => x.v), evidencias: evidencias.map((x) => x.v) },
    (tipo, i, ruta, regla) => linea(lugar[tipo][i]!.l, ruta, regla),
    fallas,
  );
  for (const x of capacidades) vetadas(x, ["nombre", "definicion", "preguntas_guia"], fallas);
  for (const x of criterios) vetadas(x, ["nombre", "que_evalua"], fallas);
  for (const x of evidencias) vetadas(x, ["afirmacion", "justificacion_puntaje", "limitaciones"], fallas);

  // Las categorías de alistamiento nombran capacidades y criterios que existen; el glosario no usa vocabulario vetado.
  if (infL && convInforme) {
    const existentes = new Set([...capacidades.map((x) => x.v.id), ...criterios.map((x) => x.v.id)]);
    for (const k of Object.keys(convInforme.categorias)) if (!existentes.has(k)) fallas.push(linea(infL, ["categorias", k], `«${k}» no es una capacidad ni un criterio de la base`));
    vetadas({ l: infL, v: convInforme }, ["glosario"], fallas);
  }

  // Instantáneas: data/instantaneas/<versión>.json. Cada una se basta sola: su huella, sus cambios y su base.
  const instantaneas: Con<Instantanea>[] = [];
  const dirInst = join(dir, "instantaneas");
  for (const f of existsSync(dirInst) ? readdirSync(dirInst).filter((x) => !x.startsWith(".")).sort() : []) {
    const rel = `data/instantaneas/${f}`;
    const l = leerConPosicion(join(dirInst, f), rel, fallas);
    if (!l) continue;
    const v = validarLeido(l, esquemaInstantanea, fallas) as Instantanea | null;
    if (!v) continue;
    const x = { l: { ...l, id: v.version }, v };
    if (f !== `${v.version}.json`) fallas.push(linea(x.l, ["version"], `el archivo se llama como su versión: «${v.version}.json»`));
    if (!v.version.startsWith(`${v.fecha}.`)) fallas.push(linea(x.l, ["fecha"], `la versión ${v.version} es de otro día`));
    if (huellaDe(v.contenido) !== v.huella) fallas.push(linea(x.l, ["huella"], "no es la huella de su contenido: la instantánea cambió después de congelarse"));
    v.contenido.evidencias.forEach((e, i) => e.estado_aprobacion !== "aprobada" && fallas.push(linea(x.l, ["contenido", "evidencias", i, "estado_aprobacion"], "una instantánea congela solo evidencias aprobadas")));
    v.contenido.evidencias.forEach((e, i) => e.fecha_aprobacion && e.fecha_aprobacion > v.fecha && fallas.push(linea(x.l, ["contenido", "evidencias", i, "fecha_aprobacion"], `es posterior a la instantánea (${v.fecha}): no se congela lo que aún no estaba aprobado`)));
    cruzarBase(v.contenido, (tipo, i, ruta, regla) => linea(x.l, ["contenido", tipo === "criterio" ? "criterios" : "evidencias", i, ...ruta], regla), fallas);
    instantaneas.push(x);
  }
  instantaneas.sort((a, b) => compararInstantanea(a.v.version, b.v.version));
  instantaneas.forEach((x, i) => {
    const previa = instantaneas[i - 1]?.v ?? null;
    if (x.v.anterior !== (previa?.version ?? null)) fallas.push(linea(x.l, ["anterior"], `la anterior es ${previa ? `«${previa.version}»` : "null (es la primera)"}`));
    else if (JSON.stringify(cambiosEntre(previa?.contenido ?? null, x.v.contenido)) !== JSON.stringify(x.v.cambios)) fallas.push(linea(x.l, ["cambios"], "no son los cambios frente a la anterior"));
  });
  const porVersion = new Map(instantaneas.map((x) => [x.v.version, x.v]));

  // Casos: cada uno contra la base congelada en la instantánea que referencia.
  const casos = entidades<Caso>(join(dir, "casos"), "data/casos", esquemaCaso, fallas);
  for (const x of casos) {
    const c = x.v;
    vetadas(x, ["nombre", "descripcion", "contexto", "requisitos", "restricciones", "decisiones_implicitas"], fallas);
    // Un borrador sin instantánea se cruza con la base viva; con instantánea, con lo que ella congeló.
    const inst = c.instantanea === null ? null : porVersion.get(c.instantanea);
    if (c.instantanea !== null && !inst) {
      fallas.push(linea(x.l, ["instantanea"], `no existe data/instantaneas/${c.instantanea}.json`));
      continue;
    }
    if (inst && c.fecha_evaluacion < inst.fecha) fallas.push(linea(x.l, ["fecha_evaluacion"], `es anterior a su instantánea (${inst.fecha}): no se evalúa una base que aún no existía`));
    const donde = inst ? `la instantánea ${inst.version}` : "la base";
    const ids = new Set((inst ? inst.contenido.criterios : criterios.map((y) => y.v)).map((k) => k.id));
    const plats = new Set((inst ? inst.contenido.plataformas : plataformas).map((p) => p.id));
    c.criterios.forEach((k, i) => !ids.has(k.criterio_id) && fallas.push(linea(x.l, ["criterios", i, "criterio_id"], `«${k.criterio_id}» no es un criterio de ${donde}`)));
    for (const k of ids) if (!c.criterios.some((y) => y.criterio_id === k)) fallas.push(linea(x.l, ["criterios"], `falta el peso de ${k} (puede ser 0, pero se declara)`));
    c.requisitos.forEach((r, i) => !ids.has(r.criterio_id) && fallas.push(linea(x.l, ["requisitos", i, "criterio_id"], `«${r.criterio_id}» no es un criterio de ${donde}`)));
    c.restricciones.forEach((r, i) => {
      if (!ids.has(r.criterio_id)) fallas.push(linea(x.l, ["restricciones", i, "criterio_id"], `«${r.criterio_id}» no es un criterio de ${donde}`));
      r.elimina.forEach((e, k) => !plats.has(e.plataforma_id) && fallas.push(linea(x.l, ["restricciones", i, "elimina", k, "plataforma_id"], `«${e.plataforma_id}» no es una plataforma de ${donde}`)));
    });
    if (c.estado_aprobacion === "aprobado" && c.aprobacion && c.aprobacion.huella !== huellaCaso(c)) fallas.push(linea(x.l, ["aprobacion", "huella"], "no es la huella del perfil: un perfil aprobado no se edita a mano (se vuelve a aprobar)"));
  }

  // Planes: cada caso que trae su carpeta `plan/`, contra la misma base que su perfil.
  const planes: Plan[] = [];
  for (const x of casos) {
    const inst = x.v.instantanea === null ? null : porVersion.get(x.v.instantanea);
    if (x.v.instantanea !== null && !inst) continue;
    const base: BaseDelPlan = inst
      ? { donde: `la instantánea ${inst.version}`, plataformas: inst.contenido.plataformas, capacidades: inst.contenido.capacidades, criterios: inst.contenido.criterios, evidencias: inst.contenido.evidencias }
      : { donde: "la base", plataformas, capacidades: capacidades.map((y) => y.v), criterios: criterios.map((y) => y.v), evidencias: evidencias.map((y) => y.v) };
    const plan = cargarPlan(dir, x.v, base, convInforme?.categorias ?? null, fallas);
    if (plan) planes.push(plan);
  }

  if (fallas.length || !convenciones || !convInforme || !gramatica) throw new ErrorDeDatos(fallas.length ? fallas : ["data/convenciones · sin convenciones ni gramática no hay base"]);
  return {
    gramatica,
    plataformas,
    convenciones,
    informe: convInforme,
    capacidades: capacidades.map((x) => x.v),
    criterios: criterios.map((x) => x.v),
    escalas: escalas.map((x) => x.v),
    evidencias: evidencias.map((x) => x.v),
    instantaneas: instantaneas.map((x) => x.v),
    casos: casos.map((x) => x.v),
    planes,
  };
}
