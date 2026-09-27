// Datos de la calculadora de referencia: gramática + mapa de ejemplo (copia fijada de la planeadora en
// entrada/, con huella en entrada/HUELLAS.json) + textos EN REDACTADOS en la Etapa de Diseño (la gramática
// y el mapa v0.2.0 son solo ES).
import fs from "node:fs";
import { ENTRADA } from "../rutas.mjs";
export const MAPA = JSON.parse(fs.readFileSync(`${ENTRADA}/plataforma-ejemplo.mapa.json`, "utf8"));
export const GRAM = JSON.parse(fs.readFileSync(`${ENTRADA}/plataformas-datos.json`, "utf8"));

export const BANDA = {
  fuentes: { es: ["Fuentes", "¿De dónde vienen los datos?"], en: ["Sources", "Where does the data come from?"] },
  ingesta: { es: ["Ingesta", "¿Cómo entran los datos a la plataforma?"], en: ["Ingestion", "How does data get into the platform?"] },
  almacenamiento: { es: ["Almacenamiento", "¿Dónde y en qué formato se guardan?"], en: ["Storage", "Where is it kept, and in what format?"] },
  procesamiento: { es: ["Procesamiento y transformación", "¿Con qué motor se limpian, combinan y preparan?"], en: ["Processing and transformation", "What engine cleans, joins and prepares it?"] },
  orquestacion: { es: ["Orquestación", "¿Quién decide qué se ejecuta y cuándo?"], en: ["Orchestration", "Who decides what runs, and when?"] },
  consumo: { es: ["Consumo", "¿Cómo llegan a tableros, reportes y aplicaciones?"], en: ["Consumption", "How does it reach dashboards, reports and apps?"] },
  ia: { es: ["Inteligencia artificial", "¿Cómo se construyen modelos y agentes sobre los datos?"], en: ["Artificial intelligence", "How are models and agents built on the data?"] },
  gobierno: { es: ["Gobierno y seguridad", "¿Quién puede ver qué, y cómo se audita?"], en: ["Governance and security", "Who can see what, and how is it audited?"] },
  operacion: { es: ["Operación y costo", "¿Cómo se vigila, se despliega y se paga?"], en: ["Operations and cost", "How is it monitored, deployed and paid for?"] },
};

export const BLOQUE = {
  origen: { es: ["Sistemas de origen", "Donde nacen los datos del negocio."], en: ["Source systems", "Where the business data is born."] },
  entrada: { es: ["Entrada de datos", "Trae los datos a la plataforma, en tandas o a medida que cambian."], en: ["Data intake", "Brings data in, in batches or as it changes."] },
  almacen: { es: ["Almacén central", "Guarda todos los datos en un formato que otras herramientas pueden leer."], en: ["Central store", "Keeps all the data in a format other tools can read."] },
  preparacion: { es: ["Preparación", "Limpia y combina los datos para que sirvan."], en: ["Preparation", "Cleans and combines the data so it is fit for use."] },
  "consumo-bi": { es: ["Tableros", "Convierte los datos en indicadores que la gente consulta."], en: ["Dashboards", "Turns the data into the indicators people check."] },
  agentes: { es: ["Agentes", "Responde preguntas usando los datos como contexto."], en: ["Agents", "Answers questions using the data as context."] },
  gobierno: { es: ["Gobierno", "Decide quién ve qué y deja rastro de cada acceso."], en: ["Governance", "Decides who sees what, and keeps a trail of every access."] },
};

export const NODO = {
  "sistema-admisiones": { es: "Sistema de admisiones", en: "Admissions system" },
  "conector-relacional": { es: "Conector de bases relacionales", en: "Relational database connector" },
  "captura-cambios": { es: "Captura de cambios", en: "Change capture" },
  "capa-cruda": { es: "Zona de datos crudos", en: "Raw data zone" },
  "almacen-tablas-abiertas": { es: "Tablas limpias en formato abierto", en: "Clean tables in an open format" },
  "motor-transformacion": { es: "Motor de transformación", en: "Transformation engine" },
  "canalizacion-declarativa": { es: "Canalizaciones declarativas", en: "Declarative pipelines" },
  "programador-tareas": { es: "Programador de tareas", en: "Task scheduler" },
  "modelo-semantico": { es: "Modelo semántico", en: "Semantic model" },
  tablero: { es: "Tablero de ocupación", en: "Bed occupancy dashboard" },
  "agente-datos": { es: "Agente de preguntas sobre datos", en: "Data question agent" },
  "catalogo-central": { es: "Catálogo central", en: "Central catalog" },
  "filtros-filas": { es: "Filtros por fila y enmascaramiento", en: "Row filters and masking" },
  "monitor-capacidad": { es: "Monitor de consumo", en: "Usage monitor" },
};

export const MODOS = ["por-lotes", "continuo", "a-demanda", "sin-copia"];
export const MODO = {
  "por-lotes": { es: ["Por lotes", "Viaja en tandas programadas."], en: ["In batches", "Travels in scheduled batches."] },
  continuo: { es: ["Continuo", "Viaja a medida que ocurre."], en: ["Continuous", "Travels as it happens."] },
  "a-demanda": { es: ["A demanda", "Viaja cuando alguien lo pide."], en: ["On request", "Travels when someone asks for it."] },
  "sin-copia": { es: ["Sin copia", "Se lee en su lugar, sin copiarlo."], en: ["No copy", "Read where it lives, never copied."] },
};

export const TIPO = {
  "cap-ingesta": { t: "tipo-1", g: "triangulo", es: ["ING", "Ingesta e integración de datos"], en: ["ING", "Data ingestion and integration"] },
  "cap-almacenamiento": { t: "tipo-2", g: "cuadrado", es: ["ALM", "Almacenamiento y formato abierto"], en: ["STO", "Storage and open formats"] },
  "cap-transformacion": { t: "tipo-3", g: "rombo", es: ["TRA", "Transformación y orquestación"], en: ["TRA", "Transformation and orchestration"] },
  "cap-gobierno": { t: "tipo-4", g: "escudo", es: ["GOB", "Gobierno, seguridad y linaje"], en: ["GOV", "Governance, security and lineage"] },
  "cap-consumo": { t: "tipo-5", g: "circulo", es: ["CON", "Consumo analítico e inteligencia de negocio"], en: ["CON", "Analytics and business intelligence"] },
  "cap-ia": { t: "tipo-6", g: "estrella", es: ["IA", "Inteligencia artificial y agentes sobre los datos"], en: ["AI", "AI and agents on the data"] },
  "tipo-externo": { t: "tipo-7", g: "anillo", es: ["EXT", "Sistema externo a la plataforma"], en: ["EXT", "System outside the platform"] },
  "tipo-operacion": { t: "tipo-8", g: "barras", es: ["OPE", "Operación, monitoreo y costo"], en: ["OPS", "Operations, monitoring and cost"] },
};

export const MADUREZ = {
  "disponible-general": { nivel: 4, es: "disponible", en: "available", largo: { es: "Disponible de forma general", en: "Generally available" } },
  "vista-previa-publica": { nivel: 3, es: "vista previa", en: "preview", largo: { es: "Vista previa pública", en: "Public preview" } },
  "vista-previa-privada": { nivel: 2, es: "previa privada", en: "private preview", largo: { es: "Vista previa privada", en: "Private preview" } },
  beta: { nivel: 1, es: "beta", en: "beta", largo: { es: "Beta", en: "Beta" } },
  anunciado: { nivel: 0, es: "anunciado", en: "announced", largo: { es: "Anunciado", en: "Announced" } },
  retirado: { nivel: -1, es: "retirado", en: "retired", largo: { es: "Retirado", en: "Retired" } },
};

/** Variantes de P9: orquestación capa (7 columnas) o transversal (6 columnas + 3 franjas). */
export const VARIANTE = {
  transversal: {
    capas: ["fuentes", "ingesta", "almacenamiento", "procesamiento", "consumo", "ia"],
    franjas: ["gobierno", "operacion", "orquestacion"],
  },
  capa: {
    capas: ["fuentes", "ingesta", "almacenamiento", "procesamiento", "orquestacion", "consumo", "ia"],
    franjas: ["gobierno", "operacion"],
  },
};

/** Días desde la verificación por elemento, por estado de vigencia de la maqueta (consulta 2026-09-26). */
export const DIAS_BASE = 6;
export const VIGENCIA = {
  vigente: {},
  revisar: { entrada: 34, agentes: 34 },
  vencido: { agentes: 63, almacen: 41 },
};
export const UMBRAL_REVISAR = 30;
export const UMBRAL_VENCIDO = 60;
