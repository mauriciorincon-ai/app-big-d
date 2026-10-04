// Recorre todos los mapas de idioma y diccionarios de una gramática o de un mapa, con su ruta (JSON
// Pointer) y el id del elemento dueño. Lo usan G7, V14 y V15: una sola lista de «todo texto».
import type { DiccionarioIdioma, Gramatica, Mapa, TextoIdioma } from "../tipos";
import { ruta } from "./informe";

export interface TextoUbicado {
  ruta: string;
  id: string;
  valor: TextoIdioma;
}
export interface DiccionarioUbicado {
  ruta: string;
  id: string;
  valor: DiccionarioIdioma | Record<string, string[]>;
}

export function textosDeGramatica(g: Gramatica): { textos: TextoUbicado[]; diccionarios: DiccionarioUbicado[] } {
  const textos: TextoUbicado[] = [{ ruta: ruta("nombre"), id: g.id, valor: g.nombre }];
  g.bandas.forEach((b, i) => {
    textos.push({ ruta: ruta("bandas", i, "nombre"), id: b.id, valor: b.nombre });
    textos.push({ ruta: ruta("bandas", i, "pregunta_lider"), id: b.id, valor: b.pregunta_lider });
  });
  g.tipos_de_nodo.forEach((t, i) => {
    textos.push({ ruta: ruta("tipos_de_nodo", i, "nombre"), id: t.id, valor: t.nombre });
    textos.push({ ruta: ruta("tipos_de_nodo", i, "etiqueta_corta"), id: t.id, valor: t.etiqueta_corta });
  });
  g.modos_de_flujo.forEach((m, i) => {
    textos.push({ ruta: ruta("modos_de_flujo", i, "nombre"), id: m.id, valor: m.nombre });
    textos.push({ ruta: ruta("modos_de_flujo", i, "descripcion"), id: m.id, valor: m.descripcion });
  });
  g.escala_madurez.forEach((m, i) => {
    textos.push({ ruta: ruta("escala_madurez", i, "nombre"), id: m.id, valor: m.nombre });
    if (m.etiqueta_corta) textos.push({ ruta: ruta("escala_madurez", i, "etiqueta_corta"), id: m.id, valor: m.etiqueta_corta });
  });
  const diccionarios: DiccionarioUbicado[] = g.terminos_a_explicar
    ? [{ ruta: ruta("terminos_a_explicar"), id: g.id, valor: g.terminos_a_explicar }]
    : [];
  return { textos, diccionarios };
}

export function textosDeMapa(m: Mapa): { textos: TextoUbicado[]; diccionarios: DiccionarioUbicado[] } {
  const textos: TextoUbicado[] = [{ ruta: ruta("sujeto_nombre"), id: m.sujeto_id, valor: m.sujeto_nombre }];
  const diccionarios: DiccionarioUbicado[] = [];
  m.bloques.forEach((b, i) => {
    textos.push({ ruta: ruta("bloques", i, "nombre"), id: b.id, valor: b.nombre });
    textos.push({ ruta: ruta("bloques", i, "lider"), id: b.id, valor: b.lider });
  });
  m.nodos.forEach((n, i) => {
    for (const campo of ["nombre", "lider", "experto", "por_que_importa"] as const)
      textos.push({ ruta: ruta("nodos", i, campo), id: n.id, valor: n[campo] });
    (n.nombres_anteriores ?? []).forEach((v, k) => textos.push({ ruta: ruta("nodos", i, "nombres_anteriores", k), id: n.id, valor: v }));
    n.fuentes.forEach((f, k) => textos.push({ ruta: ruta("nodos", i, "fuentes", k, "titulo"), id: n.id, valor: f.titulo }));
    if (n.terminos) diccionarios.push({ ruta: ruta("nodos", i, "terminos"), id: n.id, valor: n.terminos });
  });
  m.flujos.forEach((f, i) => {
    textos.push({ ruta: ruta("flujos", i, "que_viaja"), id: f.id, valor: f.que_viaja });
    textos.push({ ruta: ruta("flujos", i, "lider"), id: f.id, valor: f.lider });
  });
  m.recorridos.forEach((r, i) => {
    textos.push({ ruta: ruta("recorridos", i, "titulo"), id: r.id, valor: r.titulo });
    r.pasos.forEach((p, k) => {
      for (const campo of ["que_pasa", "lider", "experto"] as const)
        textos.push({ ruta: ruta("recorridos", i, "pasos", k, campo), id: `${r.id}/${p.id}`, valor: p[campo] });
    });
  });
  if (m.glosario) diccionarios.push({ ruta: ruta("glosario"), id: m.sujeto_id, valor: m.glosario });
  return { textos, diccionarios };
}
