// Fase 2 del mapa (CONTRATO § 7): V1–V15 en código, contra una gramática que ya pasó G1–G7.
import { CONTRATO_VERSION } from "../version";
import type { Gramatica, Mapa, Recorrido, TextoIdioma } from "../tipos";
import { idiomasExactos } from "./idiomas";
import { ruta, type Entrada } from "./informe";
import { contarFrases, contieneTermino, normalizarTermino } from "./lider";
import { textosDeMapa } from "./textos";
import { compatible } from "./version";
import { pasoPrevio } from "../util/recorrido";

export type Modo = "privado" | "publicacion";
/** Conjunto de puntos de código que cubre la tabla de métricas (V15). Un `Set<number>` sirve. */
export interface Cobertura {
  has(puntoDeCodigo: number): boolean;
}

const e = (regla: string, r: string, id: string, mensaje: string, idioma?: string): Entrada =>
  idioma === undefined ? { doc: "mapa", fase: 2, regla, ruta: r, id, mensaje } : { doc: "mapa", fase: 2, regla, ruta: r, id, idioma, mensaje };

function repetidos(ids: readonly string[], coleccion: string[], prefijo: string): Entrada[] {
  const vistos = new Set<string>();
  const salida: Entrada[] = [];
  ids.forEach((id, i) => {
    if (vistos.has(id)) salida.push(e("V6", ruta(...coleccion, i, "id"), `${prefijo}${id}`, `id repetido en ${coleccion[coleccion.length - 1]}: «${id}»`));
    vistos.add(id);
  });
  return salida;
}

function reglasRecorrido(m: Mapa, g: Gramatica, r: Recorrido, i: number, nodos: Map<string, string>): Entrada[] {
  const salida: Entrada[] = [];
  const flujos = new Set(m.flujos.map((f) => `${f.origen}>${f.destino}`));
  const porId = new Map(r.pasos.map((p) => [p.id, p]));
  const hijos = new Map<string, number>();
  r.pasos.forEach((p, k) => {
    const id = `${r.id}/${p.id}`;
    if (!nodos.has(p.nodo_id)) salida.push(e("V5", ruta("recorridos", i, "pasos", k, "nodo_id"), id, `el paso apunta a un nodo que no existe: «${p.nodo_id}»`));
    if (p.sigue_de !== undefined && !porId.has(p.sigue_de))
      salida.push(e("V5", ruta("recorridos", i, "pasos", k, "sigue_de"), id, `sigue a un paso que no existe: «${p.sigue_de}»`));
    // A-5 de la auditoría del S1: sin esto, un paso que se sigue a sí mismo (o que forma un ciclo) validaba y
    // el motor se quedaba sin memoria al numerar; y uno que sigue a otro posterior numeraba mal.
    else if (p.sigue_de !== undefined && r.pasos.findIndex((x) => x.id === p.sigue_de) >= k)
      salida.push(e("V5", ruta("recorridos", i, "pasos", k, "sigue_de"), id, `sigue a «${p.sigue_de}», que no está antes en la lista`));
    const previo = pasoPrevio(r, k);
    if (!previo) return;
    hijos.set(previo.id, (hijos.get(previo.id) ?? 0) + 1);
    if (nodos.has(previo.nodo_id) && nodos.has(p.nodo_id) && previo.nodo_id !== p.nodo_id && !flujos.has(`${previo.nodo_id}>${p.nodo_id}`))
      salida.push(e("V5", ruta("recorridos", i, "pasos", k), id, `ningún flujo declarado une «${previo.nodo_id}» con «${p.nodo_id}»`));
  });
  r.pasos.forEach((p, k) => {
    const n = hijos.get(p.id) ?? 0;
    const id = `${r.id}/${p.id}`;
    if (n >= 2 && !p.bifurca) salida.push(e("V12", ruta("recorridos", i, "pasos", k), id, `de este paso salen ${n} ramas y no declara si son paralelas o alternativas`));
    if (p.bifurca && n < 2) salida.push(e("V12", ruta("recorridos", i, "pasos", k, "bifurca"), id, `declara «${p.bifurca}» pero de él sale ${n} paso(s)`));
  });
  const ref = g.recorrido_referencia;
  if (ref && r.pasos.length > 0) {
    const banda = (p: { nodo_id: string }) => nodos.get(p.nodo_id);
    const primero = r.pasos[0]!;
    if (!ref.desde_bandas.includes(banda(primero) ?? ""))
      salida.push(e("V5", ruta("recorridos", i, "pasos", 0), r.id, `el recorrido empieza en «${banda(primero) ?? "?"}» y debe empezar en: ${ref.desde_bandas.join(", ")}`));
    const hojas = r.pasos.filter((p) => !hijos.has(p.id));
    for (const h of hojas)
      if (!ref.hasta_bandas.includes(banda(h) ?? ""))
        salida.push(e("V5", ruta("recorridos", i), r.id, `la rama que termina en «${h.id}» (${banda(h) ?? "?"}) no llega a: ${ref.hasta_bandas.join(", ")}`));
    const alcanzadas = new Set(hojas.map(banda));
    const faltan = ref.hasta_bandas.filter((b) => !alcanzadas.has(b));
    if (ref.llegadas === "todas" && faltan.length > 0)
      salida.push(e("V5", ruta("recorridos", i), r.id, `el recorrido no llega a: ${faltan.join(", ")} (la gramática exige todas)`));
    if (ref.llegadas === "alguna" && faltan.length === ref.hasta_bandas.length)
      salida.push(e("V5", ruta("recorridos", i), r.id, `el recorrido no llega a ninguna de: ${ref.hasta_bandas.join(", ")}`));
  }
  return salida;
}

/** Textos de líder de todo el mapa, con el diccionario de explicaciones que les aplica. */
function lideres(m: Mapa): { ruta: string; id: string; valor: TextoIdioma; nodo?: string }[] {
  const out: { ruta: string; id: string; valor: TextoIdioma; nodo?: string }[] = [];
  m.bloques.forEach((b, i) => out.push({ ruta: ruta("bloques", i, "lider"), id: b.id, valor: b.lider }));
  m.nodos.forEach((n, i) => out.push({ ruta: ruta("nodos", i, "lider"), id: n.id, valor: n.lider, nodo: n.id }));
  m.flujos.forEach((f, i) => out.push({ ruta: ruta("flujos", i, "lider"), id: f.id, valor: f.lider }));
  m.recorridos.forEach((r, i) =>
    r.pasos.forEach((p, k) => out.push({ ruta: ruta("recorridos", i, "pasos", k, "lider"), id: `${r.id}/${p.id}`, valor: p.lider, nodo: p.nodo_id })),
  );
  return out;
}

export function reglasMapa(m: Mapa, g: Gramatica, opciones: { mode: Modo; coverage?: Cobertura }): { errores: Entrada[]; alertas: Entrada[]; avisos: Entrada[] } {
  const errores: Entrada[] = [];
  const alertas: Entrada[] = [];
  const avisos: Entrada[] = [];

  // V1
  if (!compatible(m.contrato_version, CONTRATO_VERSION))
    errores.push(e("V1", ruta("contrato_version"), m.sujeto_id, `contrato ${m.contrato_version} incompatible con el motor (${CONTRATO_VERSION})`));
  if (m.gramatica_id !== g.id) errores.push(e("V1", ruta("gramatica_id"), m.sujeto_id, `el mapa es de la gramática «${m.gramatica_id}» y se validó con «${g.id}»`));
  else if (!compatible(m.gramatica_version, g.version))
    errores.push(e("V1", ruta("gramatica_version"), m.sujeto_id, `el mapa pide la gramática ${m.gramatica_version} y la disponible es ${g.version}`));

  // V2 y V3 (referencias)
  const bandas = new Set(g.bandas.map((b) => b.id));
  const tipos = new Set(g.tipos_de_nodo.map((t) => t.id));
  const modos = new Map(g.modos_de_flujo.map((x) => [x.id, x]));
  const madurez = new Set(g.escala_madurez.map((x) => x.id));
  const bloques = new Map(m.bloques.map((b) => [b.id, b]));
  m.bloques.forEach((b, i) => {
    if (!bandas.has(b.banda_id)) errores.push(e("V2", ruta("bloques", i, "banda_id"), b.id, `banda inexistente en la gramática: «${b.banda_id}»`));
  });
  m.nodos.forEach((n, i) => {
    if (!bandas.has(n.banda_id)) errores.push(e("V2", ruta("nodos", i, "banda_id"), n.id, `banda inexistente en la gramática: «${n.banda_id}»`));
    if (!tipos.has(n.tipo_id)) errores.push(e("V2", ruta("nodos", i, "tipo_id"), n.id, `tipo inexistente en la gramática: «${n.tipo_id}»`));
    if (!madurez.has(n.madurez)) errores.push(e("V2", ruta("nodos", i, "madurez"), n.id, `madurez inexistente en la gramática: «${n.madurez}»`));
    if (n.bloque_id !== undefined) {
      const b = bloques.get(n.bloque_id);
      if (!b) errores.push(e("V3", ruta("nodos", i, "bloque_id"), n.id, `bloque inexistente: «${n.bloque_id}»`));
      else if (b.banda_id !== n.banda_id)
        errores.push(e("V3", ruta("nodos", i, "bloque_id"), n.id, `el bloque «${b.id}» está anclado en «${b.banda_id}» y el nodo vive en «${n.banda_id}»`));
    }
  });

  // V4, V2 (modo) y V13
  const nodos = new Map(m.nodos.map((n) => [n.id, n.banda_id]));
  m.flujos.forEach((f, i) => {
    for (const lado of ["origen", "destino"] as const)
      if (!nodos.has(f[lado])) errores.push(e("V4", ruta("flujos", i, lado), f.id, `${lado} inexistente: «${f[lado]}»`));
    // B-38 de la auditoría del S1: un flujo de un nodo hacia sí mismo se aceptaba y cada vista lo trataba
    // distinto (el nivel 1 lo callaba, la lectura lo decía). Enmienda propuesta: V4 lo rechaza.
    if (f.origen === f.destino) errores.push(e("V4", ruta("flujos", i, "destino"), f.id, `un flujo une dos nodos distintos; origen y destino son «${f.origen}»`));
    const modo = modos.get(f.modo_id);
    if (!modo) errores.push(e("V2", ruta("flujos", i, "modo_id"), f.id, `modo inexistente en la gramática: «${f.modo_id}»`));
    else if (modo.exige_condicion && !f.condicion)
      errores.push(e("V13", ruta("flujos", i), f.id, `el modo «${modo.id}» exige condición (señal · operador · valor) y el flujo no la trae`));
  });

  // V5 y V12
  m.recorridos.forEach((r, i) => errores.push(...reglasRecorrido(m, g, r, i, nodos)));

  // V6
  errores.push(...repetidos(m.nodos.map((n) => n.id), ["nodos"], ""));
  errores.push(...repetidos(m.flujos.map((f) => f.id), ["flujos"], ""));
  errores.push(...repetidos(m.bloques.map((b) => b.id), ["bloques"], ""));
  errores.push(...repetidos(m.recorridos.map((r) => r.id), ["recorridos"], ""));
  m.recorridos.forEach((r, i) => errores.push(...repetidos(r.pasos.map((p) => p.id), ["recorridos", String(i), "pasos"], `${r.id}/`)));

  // V7
  const { bloques_min, bloques_max, frases_lider_max, nodos_por_banda_max } = g.limites;
  if (m.bloques.length < bloques_min || m.bloques.length > bloques_max)
    errores.push(e("V7", ruta("bloques"), m.sujeto_id, `${m.bloques.length} bloques; la gramática admite de ${bloques_min} a ${bloques_max}`));

  // V8
  if (opciones.mode === "publicacion" && m.estado !== "aprobada")
    errores.push(e("V8", ruta("estado"), m.sujeto_id, `en modo publicación solo se acepta un mapa «aprobada» (estado: «${m.estado}»)`));

  // V11
  const porBanda = new Map<string, number>();
  for (const n of m.nodos) porBanda.set(n.banda_id, (porBanda.get(n.banda_id) ?? 0) + 1);
  g.bandas.forEach((b) => {
    const k = porBanda.get(b.id) ?? 0;
    if (k > nodos_por_banda_max) errores.push(e("V11", ruta("nodos"), b.id, `${k} nodos en la banda «${b.id}»; el máximo es ${nodos_por_banda_max}`));
  });

  // V14
  const { textos, diccionarios } = textosDeMapa(m);
  errores.push(...idiomasExactos("mapa", "V14", g.idiomas, [...textos, ...diccionarios]));

  // V15
  if (!opciones.coverage) {
    avisos.push(e("V15", "", m.sujeto_id, "V15 no corrió: no se entregó la cobertura de la tabla de métricas"));
  } else {
    const cobertura = opciones.coverage;
    const revisar = (texto: string, r: string, id: string, idioma: string) => {
      const fuera = [...new Set([...texto].filter((c) => !cobertura.has(c.codePointAt(0) ?? 0)))];
      if (fuera.length)
        errores.push(e("V15", r, id, `carácter fuera de la tabla de métricas: ${fuera.map((c) => `«${c}» U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`, idioma));
    };
    for (const t of textos) for (const [idioma, v] of Object.entries(t.valor)) revisar(v, `${t.ruta}/${idioma}`, t.id, idioma);
    for (const d of diccionarios)
      for (const [idioma, dic] of Object.entries(d.valor))
        for (const [k, v] of Array.isArray(dic) ? dic.map((x) => [x, ""] as const) : Object.entries(dic)) revisar(`${k}${v}`, `${d.ruta}/${idioma}`, d.id, idioma);
  }

  // V9 y V10 (alertas)
  const explicados = (idioma: string, nodo?: string): Set<string> => {
    const s = new Set(Object.keys(m.glosario?.[idioma] ?? {}).map(normalizarTermino));
    const n = nodo ? m.nodos.find((x) => x.id === nodo) : undefined;
    for (const k of Object.keys(n?.terminos?.[idioma] ?? {})) s.add(normalizarTermino(k));
    return s;
  };
  for (const l of lideres(m))
    for (const idioma of g.idiomas) {
      const texto = l.valor[idioma];
      if (texto === undefined) continue;
      const ya = explicados(idioma, l.nodo);
      for (const termino of g.terminos_a_explicar?.[idioma] ?? [])
        if (contieneTermino(texto, termino) && !ya.has(normalizarTermino(termino)))
          alertas.push(e("V9", `${l.ruta}/${idioma}`, l.id, `«${termino}» aparece en el texto de líder sin explicación (ni en el nodo ni en el glosario)`, idioma));
      const frases = contarFrases(texto);
      if (frases > frases_lider_max) alertas.push(e("V10", `${l.ruta}/${idioma}`, l.id, `${frases} frases; el límite es ${frases_lider_max}`, idioma));
    }

  return { errores, alertas, avisos };
}
