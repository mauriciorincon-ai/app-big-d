// Modelo de datos del contrato v0.4.0 (§ 3). Escrito a mano desde los JSON Schema de `esquema/`, que son
// la fuente normativa: el esquema valida la forma y estos tipos solo describen lo que ya pasó por él.

/** Mapa de idioma: una cadena por idioma declarado en la gramática (§ 3.0). */
export type TextoIdioma = Record<string, string>;
/** Diccionario por idioma: `{ es: { término: explicación } }`. */
export type DiccionarioIdioma = Record<string, Record<string, string>>;

export type ClaseBanda = "capa" | "carril" | "transversal";
export type Glifo = "circulo" | "cuadrado" | "rombo" | "triangulo" | "escudo" | "estrella" | "anillo" | "barras";
export type EstiloLinea = "continua" | "discontinua" | "punteada" | "doble";
export type Marcador = "cuadros" | "onda" | "ida-y-vuelta" | "enlace" | "ninguno";

export interface Banda {
  id: string;
  nombre: TextoIdioma;
  clase: ClaseBanda;
  orden: number;
  pregunta_lider: TextoIdioma;
}

export interface TipoDeNodo {
  id: string;
  nombre: TextoIdioma;
  token_color: string;
  glifo: Glifo;
  etiqueta_corta: TextoIdioma;
}

export interface ModoDeFlujo {
  id: string;
  nombre: TextoIdioma;
  estilo_linea: EstiloLinea;
  marcador: Marcador;
  descripcion: TextoIdioma;
  exige_condicion?: boolean;
}

export interface NivelMadurez {
  id: string;
  nombre: TextoIdioma;
  nivel: number;
  disponible: boolean;
  /** Opcional, por idioma (0.4.0, D-S1-17): lo que se dibuja en bloques y nodos, donde el nombre largo no cabe. */
  etiqueta_corta?: TextoIdioma;
}

export interface Gramatica {
  contrato_version: string;
  id: string;
  version: string;
  nombre: TextoIdioma;
  descripcion?: string;
  idiomas: string[];
  idioma_base: string;
  bandas: Banda[];
  tipos_de_nodo: TipoDeNodo[];
  modos_de_flujo: ModoDeFlujo[];
  escala_madurez: NivelMadurez[];
  vigencia: { umbral_revisar_dias: number; umbral_vencido_dias: number };
  recorrido_referencia?: { desde_bandas: string[]; hasta_bandas: string[]; llegadas: "todas" | "alguna" };
  limites: { bloques_min: number; bloques_max: number; frases_lider_max: number; nodos_por_banda_max: number };
  terminos_a_explicar?: Record<string, string[]>;
}

export interface Fuente {
  url: string;
  titulo: TextoIdioma;
  fecha: string;
  tipo: "oficial" | "tercero";
}

export interface Bloque {
  id: string;
  nombre: TextoIdioma;
  banda_id: string;
  lider: TextoIdioma;
}

export interface Nodo {
  id: string;
  banda_id: string;
  tipo_id: string;
  bloque_id?: string;
  nombre: TextoIdioma;
  nombres_anteriores?: TextoIdioma[];
  orden?: number;
  lider: TextoIdioma;
  experto: TextoIdioma;
  por_que_importa: TextoIdioma;
  terminos?: DiccionarioIdioma;
  madurez: string;
  fuentes: Fuente[];
  fecha_verificacion: string;
  refs_externas?: string[];
}

export interface Condicion {
  senal: string;
  operador: "<" | "<=" | "=" | "!=" | ">=" | ">";
  valor: number | string | boolean;
}

export interface Flujo {
  id: string;
  origen: string;
  destino: string;
  modo_id: string;
  que_viaja: TextoIdioma;
  lider: TextoIdioma;
  condicion?: Condicion;
}

export interface Paso {
  id: string;
  nodo_id: string;
  sigue_de?: string;
  bifurca?: "paralela" | "alternativa";
  que_pasa: TextoIdioma;
  lider: TextoIdioma;
  experto: TextoIdioma;
}

export interface Recorrido {
  id: string;
  titulo: TextoIdioma;
  pasos: Paso[];
}

export interface Mapa {
  contrato_version: string;
  gramatica_id: string;
  gramatica_version: string;
  sujeto_id: string;
  sujeto_nombre: TextoIdioma;
  version: string;
  fecha_actualizacion: string;
  estado: "propuesta" | "aprobada" | "rechazada";
  bloques: Bloque[];
  nodos: Nodo[];
  flujos: Flujo[];
  recorridos: Recorrido[];
  glosario?: DiccionarioIdioma;
  refs_externas?: string[];
}
