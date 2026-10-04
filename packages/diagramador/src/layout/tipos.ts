// Geometría (CONTRATO § 1, § 8): el resultado puro de `layout`. No depende del idioma: las cajas se
// calculan con el texto más largo entre los idiomas declarados, y cada texto guarda sus líneas por idioma
// para que `toSVG` elija. Toda coordenada es un ENTERO en décimas de unidad (G1).
import type { TextoIdioma } from "../tipos";
import type { Decimas } from "../util/numeros";

export type Vista = "nivel1" | "nivel2" | "recorrido" | "bloque";
/** Lo que puede dibujar una geometría: las vistas de `layout` y el lado a lado de `compare` (§ 4.4). */
export type VistaGeometria = Vista | "compare";
/**
 * Clase de un aviso de geometría (§ 5.6). `texto` (en el contrato desde la 0.6.0): un texto con más líneas que su
 * caja, una palabra que no cabe sola o una cabecera de franja más alta que su fila.
 */
export type TipoAviso = "D11" | "pistas" | "fuera-del-lienzo" | "encima" | "etiqueta" | "bloque-vacio" | "canal" | "carriles" | "texto";
/**
 * Aviso de geometría con forma fija (§ 5.6): `id` es el elemento que lo causa, o la descripción del texto (`texto`) o
 * del canal (`canal`); en `compare` lleva delante el prefijo de su fila (D12). `mensaje` empieza por «<tipo>: ».
 */
export interface Aviso {
  vista: VistaGeometria;
  tipo: TipoAviso;
  id: string;
  mensaje: string;
}
/** Un tramo de flujo que atraviesa la caja de un nodo ajeno (D11). */
export interface Cruce {
  flujo: string;
  caja: string;
  tramo: [Punto, Punto];
}
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
  vista: VistaGeometria;
  /**
   * Variante del dibujo de una misma vista, para el espacio de nombres por defecto de `toSVG` (D8): en el lado a lado,
   * «n1» con la rejilla de componentes contraída y «n2» con alguna banda desplegada; así las dos de una fila conviven.
   */
  variante?: string;
  sujeto: string;
  gramatica: string;
  idiomas: string[];
  ancho: Decimas;
  alto: Decimas;
  /** Columnas de capa, para el índice de bandas del lienzo deslizable (G11). */
  columnas: { banda: string; x: Decimas; numero: string; nombre: TextoIdioma }[];
  /**
   * Filas de franja (o de carril): dónde empieza cada una y cuánto mide (G5). En `compare`, una fila por mapa: `banda`
   * es el prefijo del mapa (D12).
   */
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
   * las insignias: la app lo usa para la píldora del mapa sin repetir la regla. En `compare`, `elementos` es una
   * entrada por fila (su prefijo) y `dias` el peor de todas.
   */
  vigencia: { dias: number; estado: Vigencia; elementos: { id: string; dias: number; estado: Vigencia }[] };
  /** Cruces D11 (§ 8): tramos que atraviesan una caja ajena. Siempre vacío en un dibujo publicable. */
  cruces: Cruce[];
  /** Avisos de geometría (§ 5.6), uno por causa; un consumidor que publica aborta ante cualquiera. */
  avisos: Aviso[];
}

/** Un plural de interfaz como dato por idioma (§ 8 v0.4.0): `one` para n = 1, `other` para lo demás; «{n}» es el número. */
export interface Plural {
  one: string;
  other: string;
}

/** Cadenas de interfaz que el motor dibuja, por idioma (D-S1-06): llegan de la app, el paquete no las trae. */
export interface TextosMotor {
  /** «{n} componente» / «{n} componentes». */
  componentes: Plural;
  /** «{n} fuente» / «{n} fuentes». */
  fuentes: Plural;
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
  /**
   * Títulos y descripciones del SVG por vista: «{sujeto}», «{capas}», «{franjas}», «{nodos}», «{recorrido}», «{bloque}»;
   * en el lado a lado, «{sujetos}» y «{mapas}».
   */
  titulo: Record<VistaGeometria, string>;
  descripcion: Record<VistaGeometria, string>;
  /** Lado a lado (§ 4.4) y sus marcas de diferencia (§ 4.7). */
  lado: {
    /** Rótulo de cada fila, por el estado de su nodo más viejo: «{version}» y «{n}» días. */
    fila: Plural;
    filaRevisar: string;
    filaVencido: string;
    /** Cuenta del bloque compacto: «{n} comp.». */
    comp: Plural;
    sinComponentes: string;
    /** Palabra de cada marca de diferencia: va siempre con su glifo (G7). */
    marcas: { nuevo: string; retirado: string; renombrado: string; madurez: string };
    /**
     * Lista explicativa (`diffToText`): qué cambió en cada componente («{banda}», «{madurez}», «{antes}», «{ahora}»),
     * cuántos flujos o pasos cambiaron («{n}») y la línea de «sin diferencias».
     */
    detalle: {
      nuevo: string;
      retirado: string;
      renombrado: string;
      madurez: string;
      otros: Plural;
      ninguna: string;
      /**
       * 0.6.0 (F-030): las líneas de un bloque nuevo («{banda}»), retirado o renombrado («{antes}»). Opcional: si las
       * diferencias traen bloques y faltan, `diffToText` da un error claro.
       */
      bloque?: { nuevo: string; retirado: string; renombrado: string };
    };
  };
  /** Nombre accesible de un paso: «{numero}» y «{que}». */
  paso: string;
  /**
   * 0.5.0 (§ 3.3): el papel de un nodo terminal, en su nombre accesible y en la lectura. Opcional: un consumidor cuyos
   * mapas no usan `papel` no lo trae; si un mapa lo usa y falta, el motor da un error claro.
   */
  papel?: { inicio: string; fin: string };
  /**
   * 0.5.0 (§ 3.4): la condición de un flujo en la lectura: «{condicion}» (la tripleta `señal op valor` o la función
   * `f(entradas)`, en notación del plan) y la rama por defecto. Opcional como `papel`.
   */
  condicion?: { si: string; porDefecto: string };
  /** Lectura en texto (G10): «{nombre}», «{modo}» y «{que}». */
  hacia: string;
  desde: string;
  /** Encabezado de un recorrido en la lectura: «{titulo}». */
  recorridoDe: string;
  /** Rótulo de una bifurcación en la lectura. */
  ramas: { paralela: string; alternativa: string };
  /** Ficha de nodo (§ 4.5): títulos de sus secciones, «{fecha}» de verificación y de consulta, tipo de fuente. */
  ficha: {
    queHace: string;
    porQueImporta: string;
    terminos: string;
    glosario: string;
    madurez: string;
    fuentes: string;
    verificado: string;
    consultado: string;
    /** `codigo` (0.5.0): una fuente que es un archivo del repositorio. */
    tipoFuente: { oficial: string; tercero: string; codigo: string };
  };
  /** Leyenda (§ 4.9): títulos, regla de vigencia («{revisar}», «{vencido}»), regla del haz y nota de marcas (D7). */
  leyenda: { tipos: string; modos: string; madurez: string; vigencia: string; reglaVigencia: string; vigente: string; porRevisar: string; vencido: string; haz: string; notaMarcas: string };
}

export interface OpcionesLayout {
  /** Cadenas de interfaz por idioma (§ 8: los nombres de la API van en inglés; los del dato, en español). */
  texts: Record<string, TextosMotor>;
  /** Fecha de consulta (AAAA-MM-DD) para el semáforo de vigencia (§ 4.8): una entrada, jamás el reloj. */
  queryDate: string;
  /** Recorrido a dibujar en la vista «recorrido» (por defecto, el primero). */
  recorrido?: string;
  /** Elemento del nivel 1 que se abre en la vista «bloque»: el id de un bloque o «_<banda>» (sus nodos sin bloque). */
  group?: string;
  /**
   * G15 (0.5.0): la tabla de métricas de la fuente que sirve el consumidor (una por fuente: Space Grotesk en el piloto,
   * Inter en planlang). La geometría es determinista POR tabla. Por defecto, la del piloto. El nombre lo fija § 8 en
   * español aunque § 8 pida nombres de API en inglés (va a «Enmiendas»). `metricas` es su nombre anterior.
   */
  fuente_metricas?: import("../texto/metricas").TablaMetricas;
  /** Nombre anterior de `fuente_metricas` (S1–S2); si llegan las dos, deben ser la misma tabla. */
  metricas?: import("../texto/metricas").TablaMetricas;
  /** Fuentes de interfaz y mono dentro de la tabla (por defecto, las del piloto). */
  fuente?: string;
  fuenteMono?: string;
}
