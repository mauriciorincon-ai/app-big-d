// Geometría (CONTRATO § 1, § 8): el resultado puro de `layout`. No depende del idioma: las cajas se
// calculan con el texto más largo entre los idiomas declarados, y cada texto guarda sus líneas por idioma
// para que `toSVG` elija. Toda coordenada es un ENTERO en décimas de unidad (G1).
import type { TextoIdioma } from "../tipos";
import type { Decimas } from "../util/numeros";

export type Vista = "nivel-1" | "nivel-2" | "recorrido";
/** Semáforo de vigencia (§ 4.8): se cuenta desde `fecha_verificacion` hasta la fecha de consulta. */
export type Vigencia = "vigente" | "revisar" | "vencido";
export type Punto = readonly [Decimas, Decimas];

export interface Caja {
  x: Decimas;
  y: Decimas;
  w: Decimas;
  h: Decimas;
}

/** Valor de atributo: número = décimas (se escribe con `fmt`), texto literal, u objeto = un texto por idioma. */
export type ValorAtributo = number | string | Record<string, string>;

export interface Elemento {
  el: "g" | "rect" | "path" | "text" | "use";
  attrs: Record<string, ValorAtributo>;
  hijos?: Elemento[];
  /** Solo en `text`: una línea por `tspan`, por idioma, desde la línea base `y` cada `lh`. */
  texto?: { x: Decimas; y: Decimas; lh: Decimas; lineas: Record<string, string[]> };
}

export interface CajaPropia {
  id: string;
  clase: "bloque" | "nodo" | "ficha";
  caja: Caja;
}

export interface Trazado {
  id: string;
  /** Ids de las cajas de los extremos (bloque o nodo): D11 no cuenta cruces con ellas. */
  origen: string;
  destino: string;
  puntos: Punto[];
}

export interface PasoGeo {
  id: string;
  numero: string;
  nodo: string;
  /** Flujo que lleva a este paso desde el anterior (no existe en el primero). */
  flujo?: string;
  /** Pasos anteriores en su rama (para «visitado»). */
  visitados: string[];
}

export interface Geometria {
  vista: Vista;
  sujeto: string;
  gramatica: string;
  idiomas: string[];
  ancho: Decimas;
  alto: Decimas;
  /** Columnas de capa, para el índice de bandas del lienzo deslizable (G11). */
  columnas: { banda: string; x: Decimas; numero: string; nombre: TextoIdioma }[];
  /** Filas de franja (o de carril): dónde empieza cada una y cuánto mide (G5). */
  filas: { banda: string; y: Decimas; alto: Decimas }[];
  cajas: CajaPropia[];
  trazados: Trazado[];
  /** Etiquetas de modos, referencias de franja e insignias: no pueden quedar encima de una caja ajena. */
  rotulos: { id: string; dueno: string; caja: Caja }[];
  escena: Elemento[];
  titulo: TextoIdioma;
  descripcion: TextoIdioma;
  recorrido?: { id: string; titulo: TextoIdioma; pasos: PasoGeo[] };
  /**
   * Semáforo de vigencia (§ 4.8) del mapa (su nodo más viejo) y de cada elemento activable de la vista
   * (bloque, caja sin bloque o ficha en el nivel 1; nodo en el nivel 2). Es el MISMO cálculo que dibuja
   * las insignias: la app lo usa para la píldora del mapa sin repetir la regla.
   */
  vigencia: { dias: number; estado: Vigencia; elementos: { id: string; dias: number; estado: Vigencia }[] };
  /** Avisos de geometría (§ 5.3): etiquetas que no caben, textos de más líneas que su caja, pistas agotadas. */
  avisos: string[];
}

/** Cadenas de interfaz que el motor dibuja, por idioma (D-S1-06): llegan de la app, el paquete no las trae. */
export interface TextosMotor {
  /** «{n} componente» / «{n} componentes». */
  componentes: readonly [string, string];
  /** «{n} fuente» / «{n} fuentes». */
  fuentes: readonly [string, string];
  sinBloque: string;
  /** Rótulo sobre las franjas transversales. */
  transversales: string;
  /** Nombre accesible de una referencia de franja: «{nombre}» y «{modos}». */
  envia: string;
  recibe: string;
  /** Conjunción para listar modos: « y ». */
  y: string;
  /** Rótulo de la lista de componentes de un bloque. */
  componentesDe: string;
  /** «{n} d»: días en la insignia de vigencia. */
  dias: string;
  /** Vigencia en palabras para el nombre accesible: «{n}» días. */
  porRevisar: string;
  vencido: string;
  /** Títulos y descripciones del SVG por vista: «{sujeto}», «{capas}», «{franjas}», «{nodos}», «{recorrido}». */
  titulo: Record<Vista, string>;
  descripcion: Record<Vista, string>;
  /** Nombre accesible de un paso: «{numero}» y «{que}». */
  paso: string;
  /** Lectura en texto (G10): «{nombre}», «{modo}» y «{que}». */
  hacia: string;
  desde: string;
  /** Encabezado de un recorrido en la lectura: «{titulo}». */
  recorridoDe: string;
  /** Rótulo de una bifurcación en la lectura. */
  ramas: { paralela: string; alternativa: string };
  /** Leyenda (§ 4.9): títulos, regla de vigencia («{revisar}», «{vencido}») y nota de marcas (D7). */
  leyenda: { tipos: string; modos: string; madurez: string; vigencia: string; reglaVigencia: string; vigente: string; porRevisar: string; vencido: string; notaMarcas: string };
}

export interface OpcionesLayout {
  textos: Record<string, TextosMotor>;
  /** Fecha de consulta (AAAA-MM-DD) para el semáforo de vigencia (§ 4.8): una entrada, jamás el reloj. */
  fechaConsulta: string;
  /** Recorrido a dibujar en la vista «recorrido» (por defecto, el primero). */
  recorrido?: string;
  /** Tabla de métricas (por defecto, la del piloto) y fuentes de interfaz y mono dentro de ella. */
  metricas?: import("../texto/metricas").TablaMetricas;
  fuente?: string;
  fuenteMono?: string;
}
