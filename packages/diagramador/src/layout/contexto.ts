// Contexto de disposición: la gramática ordenada (D1, D3), los índices por id, los medidores de texto y
// las cadenas de interfaz. Lo comparten todas las vistas.
import type { Banda, Gramatica, Mapa, ModoDeFlujo, NivelMadurez, Nodo, TipoDeNodo } from "../tipos";
import { METRICAS_PILOTO, medidor, type Medidor } from "../texto/metricas";
import { diasEntre } from "../util/fechas";
import { ordenarPor } from "../util/orden";
import type { OpcionesLayout, TextosMotor } from "./tipos";

// Constantes de § 5.3, en décimas.
export const M = 80;
export const COL = 1520;
export const CANAL = 500;
export const PISTA_EXPRES_1 = 240;
export const PISTA_EXPRES_PASO = 220;

export type Vigencia = "vigente" | "revisar" | "vencido";

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
  avisos: string[];
}

export function contexto(mapa: Mapa, gramatica: Gramatica, opciones: OpcionesLayout): Contexto {
  const tabla = opciones.metricas ?? METRICAS_PILOTO;
  const sans = tabla.fuentes[opciones.fuente ?? "space-grotesk"];
  const mono = tabla.fuentes[opciones.fuenteMono ?? "jetbrains-mono"];
  if (!sans || !mono) throw new Error("layout: la tabla de métricas no tiene las fuentes pedidas");
  for (const idioma of gramatica.idiomas)
    if (!opciones.textos[idioma]) throw new Error(`layout: faltan las cadenas de interfaz en «${idioma}» (options.textos)`);
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
    textos: opciones.textos,
    fechaConsulta: opciones.fechaConsulta,
    avisos: [],
  };
}

/** Nodos de una banda en orden estable (D3): `orden`, luego `id`; sin `orden`, al final por id. */
export function nodosDe(ctx: Contexto, banda: string): Nodo[] {
  return ordenarPor(ctx.mapa.nodos.filter((n) => n.banda_id === banda), (n) => n.orden ?? Number.MAX_SAFE_INTEGER, (n) => n.id);
}

export function diasDe(ctx: Contexto, nodos: readonly Nodo[]): number {
  return nodos.reduce((max, n) => Math.max(max, diasEntre(n.fecha_verificacion, ctx.fechaConsulta)), 0);
}

export function vigenciaDe(ctx: Contexto, dias: number): Vigencia {
  const v = ctx.gramatica.vigencia;
  return dias >= v.umbral_vencido_dias ? "vencido" : dias >= v.umbral_revisar_dias ? "revisar" : "vigente";
}

/** La madurez más baja de un conjunto de nodos (por `nivel`). */
export function peorMadurez(ctx: Contexto, nodos: readonly Nodo[]): NivelMadurez | undefined {
  return ordenarPor(
    nodos.map((n) => ctx.madurez.get(n.madurez)!).filter(Boolean),
    (m) => m.nivel,
    (m) => m.id,
  )[0];
}

/** Cadena por idioma a partir de una función. */
export function porIdioma(ctx: Contexto, f: (idioma: string, t: TextosMotor) => string): Record<string, string> {
  return Object.fromEntries(ctx.idiomas.map((l) => [l, f(l, ctx.textos[l]!)]));
}

/** Plural de interfaz: [uno, varios]. */
export const plural = (formas: readonly [string, string], n: number): string => (n === 1 ? formas[0] : formas[1]).replace("{n}", String(n));

export const colX = (i: number): number => M + i * (COL + CANAL);
export const anchoLienzo = (n: number): number => 2 * M + n * COL + (n - 1) * CANAL;
