// Contexto de disposición: la gramática ordenada (D1, D3), los índices por id, los medidores de texto y
// las cadenas de interfaz. Lo comparten todas las vistas.
import type { Banda, Gramatica, Mapa, ModoDeFlujo, NivelMadurez, Nodo, TipoDeNodo } from "../tipos";
import { METRICAS_PILOTO, medidor, type Medidor } from "../texto/metricas";
import { diasEntre } from "../util/fechas";
import { estadoVigencia } from "../util/vigencia";
import { ordenarPor } from "../util/orden";
import type { Aviso, Geometria, OpcionesLayout, Plural, TextosMotor, TipoAviso, Vigencia, VistaGeometria } from "./tipos";

// Constantes de § 5.3, en décimas.
export const M = 80;
export const COL = 1520;
export const CANAL = 500;
export const PISTA_EXPRES_1 = 240;
export const PISTA_EXPRES_PASO = 220;

export type { Vigencia };

export interface Contexto {
  mapa: Mapa;
  gramatica: Gramatica;
  idiomas: string[];
  capas: Banda[];
  transversales: Banda[];
  carriles: Banda[];
  tipo: Map<string, TipoDeNodo>;
  modo: Map<string, ModoDeFlujo>;
  ordenModo: Map<string, number>;
  madurez: Map<string, NivelMadurez>;
  nodo: Map<string, Nodo>;
  sans: Medidor;
  mono: Medidor;
  textos: Record<string, TextosMotor>;
  fechaConsulta: string;
  vista: VistaGeometria;
  avisos: Aviso[];
}

export function contexto(mapa: Mapa, gramatica: Gramatica, opciones: OpcionesLayout, vista: VistaGeometria): Contexto {
  if (opciones.fuente_metricas && opciones.metricas && opciones.fuente_metricas !== opciones.metricas)
    throw new Error("layout: llegaron `fuente_metricas` y `metricas` con tablas distintas; usa solo `fuente_metricas`");
  const tabla = opciones.fuente_metricas ?? opciones.metricas ?? METRICAS_PILOTO;
  const sans = tabla.fuentes[opciones.fuente ?? "space-grotesk"];
  const mono = tabla.fuentes[opciones.fuenteMono ?? "jetbrains-mono"];
  if (!sans || !mono)
    throw new Error(`layout: la tabla de métricas no tiene las fuentes pedidas («${opciones.fuente ?? "space-grotesk"}», «${opciones.fuenteMono ?? "jetbrains-mono"}»); trae: ${Object.keys(tabla.fuentes).join(", ")}`);
  for (const idioma of gramatica.idiomas)
    if (!opciones.texts[idioma]) throw new Error(`layout: faltan las cadenas de interfaz en «${idioma}» (options.texts)`);
  const porClase = (c: Banda["clase"]) => ordenarPor(gramatica.bandas.filter((b) => b.clase === c), (b) => b.orden, (b) => b.id);
  return {
    mapa,
    gramatica,
    idiomas: gramatica.idiomas,
    capas: porClase("capa"),
    transversales: porClase("transversal"),
    carriles: porClase("carril"),
    tipo: new Map(gramatica.tipos_de_nodo.map((t) => [t.id, t])),
    modo: new Map(gramatica.modos_de_flujo.map((m) => [m.id, m])),
    ordenModo: new Map(gramatica.modos_de_flujo.map((m, i) => [m.id, i])),
    madurez: new Map(gramatica.escala_madurez.map((m) => [m.id, m])),
    nodo: new Map(mapa.nodos.map((n) => [n.id, n])),
    sans: medidor(sans),
    mono: medidor(mono),
    textos: opciones.texts,
    fechaConsulta: opciones.queryDate,
    vista,
    avisos: [],
  };
}

/** Anota un aviso de geometría (§ 5.6) de la vista en curso: «<tipo>: <detalle>», una vez por mensaje. */
export function avisar(ctx: Contexto, tipo: TipoAviso, id: string, detalle: string): void {
  const mensaje = `${tipo}: ${detalle}`;
  if (!ctx.avisos.some((a) => a.mensaje === mensaje)) ctx.avisos.push({ vista: ctx.vista, tipo, id, mensaje });
}

/** Nodos de una banda en orden estable (D3): `orden`, luego `id`; sin `orden`, al final por id. */
export function nodosDe(ctx: Contexto, banda: string): Nodo[] {
  return ordenarPor(ctx.mapa.nodos.filter((n) => n.banda_id === banda), (n) => n.orden ?? Number.MAX_SAFE_INTEGER, (n) => n.id);
}

export function diasDe(ctx: Contexto, nodos: readonly Nodo[]): number {
  return nodos.reduce((max, n) => Math.max(max, diasEntre(n.fecha_verificacion, ctx.fechaConsulta)), 0);
}

export const vigenciaDe = (ctx: Contexto, dias: number): Vigencia => estadoVigencia(ctx.gramatica, dias);

/** Vigencia del mapa entero y de cada elemento activable, en el orden en que llegan (§ 4.8). */
export function resumenVigencia(ctx: Contexto, elementos: readonly { id: string; nodos: readonly Nodo[] }[]): Geometria["vigencia"] {
  const dias = diasDe(ctx, ctx.mapa.nodos);
  return {
    dias,
    estado: vigenciaDe(ctx, dias),
    elementos: elementos.map((e) => {
      const d = diasDe(ctx, e.nodos);
      return { id: e.id, dias: d, estado: vigenciaDe(ctx, d) };
    }),
  };
}

/** La madurez más baja de un conjunto de nodos (por `nivel`). */
export function peorMadurez(ctx: Contexto, nodos: readonly Nodo[]): NivelMadurez | undefined {
  return ordenarPor(
    nodos.map((n) => ctx.madurez.get(n.madurez)!).filter(Boolean),
    (m) => m.nivel,
    (m) => m.id,
  )[0];
}

/** Lo que se dibuja de una madurez en bloques y nodos: su `etiqueta_corta` si la gramática la trae; si no, el nombre (0.4.0). */
export const rotuloMadurez = (m: NivelMadurez, idioma: string): string => m.etiqueta_corta?.[idioma] ?? m.nombre[idioma]!;

/** Cadena por idioma a partir de una función. */
export function porIdioma(ctx: Contexto, f: (idioma: string, t: TextosMotor) => string): Record<string, string> {
  return Object.fromEntries(ctx.idiomas.map((l) => [l, f(l, ctx.textos[l]!)]));
}

/**
 * Regla de plural por idioma (§ 8, 0.6.0: `n === 1` fijo es incorrecto en idiomas que pluralizan distinto). Tabla
 * propia, de las categorías `one`/`other` de CLDR para enteros no negativos (G2 prohíbe `Intl`): en español, inglés,
 * alemán e italiano `one` es exactamente 1; en francés y portugués, 0 y 1. Un idioma sin regla es un error claro.
 */
const REGLAS_PLURAL: Readonly<Record<string, (n: number) => "one" | "other">> = {
  es: (n) => (n === 1 ? "one" : "other"),
  en: (n) => (n === 1 ? "one" : "other"),
  de: (n) => (n === 1 ? "one" : "other"),
  it: (n) => (n === 1 ? "one" : "other"),
  fr: (n) => (n === 0 || n === 1 ? "one" : "other"),
  pt: (n) => (n === 0 || n === 1 ? "one" : "other"),
};

/** Plural de interfaz (§ 8): la forma la elige la regla del idioma. */
export function plural(formas: Plural, n: number, idioma: string): string {
  const regla = REGLAS_PLURAL[idioma];
  if (!regla) throw new Error(`plural: no hay regla de plural para el idioma «${idioma}»`);
  return formas[regla(n)].replace("{n}", String(n));
}

export const colX = (i: number): number => M + i * (COL + CANAL);
export const anchoLienzo = (n: number): number => 2 * M + n * COL + (n - 1) * CANAL;
