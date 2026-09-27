// Fase 2 de la gramática (CONTRATO § 7): G1–G7, en código. Solo corre si la forma (fase 1) pasó.
import { CONTRATO_VERSION } from "../version";
import type { Gramatica } from "../tipos";
import { idiomasExactos } from "./idiomas";
import { ruta, type Entrada } from "./informe";
import { textosDeGramatica } from "./textos";
import { compatible } from "./version";

const e = (regla: string, r: string, id: string, mensaje: string): Entrada => ({ doc: "gramatica", fase: 2, regla, ruta: r, id, mensaje });

function repetidos<T>(lista: readonly T[], clave: (x: T) => string | number, coleccion: string, regla: string, id: (x: T) => string, que: string): Entrada[] {
  const vistos = new Set<string | number>();
  const salida: Entrada[] = [];
  lista.forEach((x, i) => {
    const k = clave(x);
    if (vistos.has(k)) salida.push(e(regla, ruta(coleccion, i), id(x), `${que} repetido: «${String(k)}»`));
    vistos.add(k);
  });
  return salida;
}

export function reglasGramatica(g: Gramatica): Entrada[] {
  const salida: Entrada[] = [];
  if (!compatible(g.contrato_version, CONTRATO_VERSION))
    salida.push(e("G1", ruta("contrato_version"), g.id, `contrato ${g.contrato_version} incompatible con el motor (${CONTRATO_VERSION})`));

  salida.push(...repetidos(g.bandas, (b) => b.id, "bandas", "G2", (b) => b.id, "id de banda"));
  salida.push(...repetidos(g.tipos_de_nodo, (t) => t.id, "tipos_de_nodo", "G2", (t) => t.id, "id de tipo"));
  salida.push(...repetidos(g.modos_de_flujo, (m) => m.id, "modos_de_flujo", "G2", (m) => m.id, "id de modo"));
  salida.push(...repetidos(g.escala_madurez, (m) => m.id, "escala_madurez", "G2", (m) => m.id, "id de madurez"));
  salida.push(...repetidos(g.escala_madurez, (m) => m.nivel, "escala_madurez", "G2", (m) => m.id, "nivel de madurez"));

  for (const clase of ["capa", "carril", "transversal"] as const) {
    const vistos = new Set<number>();
    g.bandas.forEach((b, i) => {
      if (b.clase !== clase) return;
      if (vistos.has(b.orden)) salida.push(e("G3", ruta("bandas", i, "orden"), b.id, `orden ${b.orden} repetido entre las bandas de clase «${clase}»`));
      vistos.add(b.orden);
    });
  }

  if (g.bandas.some((b) => b.clase === "capa") && g.bandas.some((b) => b.clase === "carril"))
    salida.push(e("G4", ruta("bandas"), g.id, "una gramática v0.x no mezcla capas y carriles"));

  if (g.recorrido_referencia) {
    const ids = new Set(g.bandas.map((b) => b.id));
    for (const lado of ["desde_bandas", "hasta_bandas"] as const)
      g.recorrido_referencia[lado].forEach((id, i) => {
        if (!ids.has(id)) salida.push(e("G5", ruta("recorrido_referencia", lado, i), id, `el recorrido de referencia nombra una banda que no existe: «${id}»`));
      });
  }

  if (g.vigencia.umbral_revisar_dias >= g.vigencia.umbral_vencido_dias)
    salida.push(e("G6", ruta("vigencia"), g.id, `el umbral de revisión (${g.vigencia.umbral_revisar_dias}) debe ser menor que el de vencimiento (${g.vigencia.umbral_vencido_dias})`));
  if (g.limites.bloques_min > g.limites.bloques_max)
    salida.push(e("G6", ruta("limites"), g.id, `bloques_min (${g.limites.bloques_min}) mayor que bloques_max (${g.limites.bloques_max})`));
  if (!g.escala_madurez.some((m) => m.disponible))
    salida.push(e("G6", ruta("escala_madurez"), g.id, "la escala de madurez no tiene ningún nivel disponible"));

  if (!g.idiomas.includes(g.idioma_base))
    salida.push(e("G7", ruta("idioma_base"), g.id, `el idioma base «${g.idioma_base}» no está entre los idiomas declarados (${g.idiomas.join(", ")})`));
  const { textos, diccionarios } = textosDeGramatica(g);
  salida.push(...idiomasExactos("gramatica", "G7", g.idiomas, [...textos, ...diccionarios]));
  return salida;
}
