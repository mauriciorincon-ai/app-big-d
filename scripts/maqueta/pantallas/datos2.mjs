// Datos de la mirada 2: textos EN REDACTADOS de los 14 nodos (el mapa v0.2.0 es solo ES), el recorrido,
// el glosario y cuatro plataformas ficticias para el lado a lado. Nada de esto se versiona como dato;
// el artefacto es la maqueta.
export { MAPA, GRAM, BANDA, BLOQUE, NODO, MODOS, MODO, TIPO, MADUREZ, VARIANTE } from "../nucleo/datos.mjs";
import { MAPA } from "../nucleo/datos.mjs";

/** Registros EN por nodo: [líder, experto, por qué importa]. */
export const NODO_EN = {
  "sistema-admisiones": ["The system where the hospital registers every patient who arrives.", "Transactional relational database of the administrative system; it exposes admissions tables with a primary key and a last-modified timestamp, which change capture requires.", "If the platform cannot read it without hurting its performance, analytics competes with patient care."],
  "conector-relacional": ["Copies whole tables from the source system on a fixed schedule.", "Batch extraction with full or watermark queries; useful for initial loads and for tables without a modification mark.", "Without a complete initial load there is no starting point for change capture."],
  "captura-cambios": ["Brings only what is new or changed, almost as it happens.", "Reads the source's transaction log and replays inserts, updates and deletes in order, with retries and duplicate control.", "Copying everything every time saturates the source and arrives late; without change capture the indicators run a day behind."],
  "capa-cruda": ["Keeps the data exactly as it arrived, so you can always go back to it.", "Open-format tables with version history; written by append only, they keep the original record for audit and reprocessing.", "If the original data is lost, a transformation error has no way back."],
  "almacen-tablas-abiertas": ["The prepared data, stored in a format other tools can read without copying it.", "Open-format tables with transactions and a versioned schema; external engines read them in place through the catalog.", "A closed format ties the data to a single tool and makes leaving it expensive."],
  "motor-transformacion": ["Cleans, combines and corrects the raw data.", "Distributed engine that runs batch transformations over the open tables; it scales compute with the load.", "Uncleaned data produces indicators that contradict each other across dashboards."],
  "canalizacion-declarativa": ["Describes which steps a piece of data must follow, and the platform runs them.", "Declarative definition of dependencies and quality rules; the engine resolves the order and stops the load when a rule fails.", "Without explicit quality rules, bad data reaches the dashboard and nobody notices."],
  "programador-tareas": ["Decides what runs and at what time.", "Scheduler with task dependencies, retries and alerts; it triggers pipelines on a schedule or on an event.", "If nobody coordinates the order, one task reads data another has not finished preparing."],
  "modelo-semantico": ["Defines once what each indicator means, so every dashboard says the same thing.", "Metrics and relationships layer over the clean tables, read in place; it centralises definitions and applies row-level security.", "Without single definitions, two departments report different figures for the same indicator."],
  tablero: ["Shows how many patients are admitted and how many beds are free.", "Visualisation that queries the semantic model on request; it inherits its definitions and its row-level security.", "This is where management decides; if the data arrives late, it decides blind."],
  "agente-datos": ["Answers plain-language questions about admissions, using only the data the user is allowed to see.", "Agent that queries the clean tables as context under the catalog's permissions; it is in preview and does not guarantee answers for production.", "An agent without the catalog's permissions could show patient data to someone who must not see it."],
  "catalogo-central": ["The inventory of all the data, with who may use it and where it comes from.", "Single registry of tables, permissions and lineage, captured automatically on every read and write.", "Without a central catalog every tool manages permissions on its own and nobody can audit the whole."],
  "filtros-filas": ["Each person sees only the patients and columns that belong to them.", "Row policies and column masks defined in the catalog and enforced by every engine that reads the table.", "With clinical data, a misplaced permission is a sensitive-data incident."],
  "monitor-capacidad": ["Shows how much is being spent, and on what.", "Compute usage metrics per task and per department, with budget alerts.", "Without visibility of spend, the bill is discovered at the end of the month."],
};
export const TERMINO_EN = {
  "registro de transacciones": ["transaction log", "Internal journal where the database records every change before applying it."],
  cómputo: ["compute", "Processing capacity rented by time of use."],
  linaje: ["lineage", "The trail of where a piece of data comes from and which transformations it went through."],
  catálogo: ["catalog", "Central inventory of the data: what exists, where it is and who may use it."],
};
export const FUENTE_EN = { "Ficha ficticia del sistema de admisiones": "Fictional data sheet of the admissions system", "Documentación ficticia del conector": "Fictional connector documentation", "Documentación ficticia de captura de cambios": "Fictional change-capture documentation", "Documentación ficticia del almacén": "Fictional store documentation", "Documentación ficticia del motor": "Fictional engine documentation", "Documentación ficticia de canalizaciones": "Fictional pipelines documentation", "Documentación ficticia del programador": "Fictional scheduler documentation", "Documentación ficticia del modelo semántico": "Fictional semantic model documentation", "Documentación ficticia de tableros": "Fictional dashboards documentation", "Anuncio ficticio del agente": "Fictional agent announcement", "Documentación ficticia del catálogo": "Fictional catalog documentation", "Documentación ficticia de filtros": "Fictional filters documentation", "Documentación ficticia del monitor": "Fictional monitor documentation" };
export const FLUJO_EN = { "f-origen-cambios": ["New or changed records", "Every new admission travels as soon as it is registered."], "f-origen-conector": ["Whole tables", "A full copy, once a day."], "f-cambios-cruda": ["Changes in order", "Changes are stored just as they arrive."], "f-conector-cruda": ["Whole tables", "The daily copy is stored untouched."], "f-cruda-motor": ["Raw data", "The engine takes the raw data to clean it."], "f-motor-limpias": ["Clean tables", "What is clean is stored apart from what is raw."], "f-canalizacion-motor": ["Steps and quality rules", "Tells the engine what to do and what to check."], "f-programador-canalizacion": ["Run order", "Gives the order to start."], "f-limpias-semantico": ["Clean tables", "The model reads the tables in place, without copying them."], "f-semantico-tablero": ["Indicator queries", "The dashboard asks for the indicators when someone opens it."], "f-limpias-agente": ["Context to answer", "The agent queries the tables to answer."], "f-catalogo-limpias": ["Permissions and metadata", "The catalog says who may read each table."], "f-filtros-semantico": ["Rows visible per person", "Each person receives only their rows."], "f-motor-monitor": ["Usage metrics", "Every task reports what it spent."] };

/** Recorrido: numeración con rama (D13): 1–5, luego 6a → 7a (tablero) y 6b (agente). */
export const REC = MAPA.recorridos[0];
export const REC_EN = { titulo: "One admission record, end to end", pasos: { p1: ["The record is born", "A fictional patient is admitted and registered.", "Insert into the admissions table with a modification timestamp."], p2: ["The change is detected", "The platform notices there is a new record.", "The transaction-log reader emits the insert event."], p3: ["Stored as is", "The record is stored unmodified.", "Append to the raw table with version and load metadata."], p4: ["Cleaned and combined", "Formats are corrected and it is joined with the patient's other data.", "Batch transformation with quality rules; records that fail are set aside."], p5: ["Ready to be used", "The clean record is available to dashboards and agents.", "Transactional write to the clean table; the catalog records the lineage."], p6: ["Becomes an indicator", "It counts inside the day's admissions indicator.", "Read without copy by the semantic model; row-level security applies."], p7: ["Shows on the dashboard", "Management sees the updated occupancy.", "On-request query from the dashboard to the semantic model."], p8: ["Serves as context for an agent", "An agent can answer how many admissions there were today.", "The agent reads the clean tables under the catalog's permissions."] } };
export const PASO_NUM = { p1: "1", p2: "2", p3: "3", p4: "4", p5: "5", p6: "6a", p7: "7a", p8: "6b" };
export const PASO_ORDEN = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
/** Flujo que lleva a cada paso (para resaltarlo). */
export const PASO_FLUJO = { p2: "f-origen-cambios", p3: "f-cambios-cruda", p4: "f-cruda-motor", p5: "f-motor-limpias", p6: "f-limpias-semantico", p7: "f-semantico-tablero", p8: "f-limpias-agente" };

/**
 * Lado a lado: cuatro plataformas ficticias (N = 4, la vista muestra 3 en ancho: constante de vista).
 * Cada una: por banda, {nombre es/en, n componentes, tipo dominante, madurez peor} o null (sin bloque
 * ni componentes). Nombres genéricos: ningún producto real.
 */
export const PLATAFORMAS = [
  { id: "ejemplo", nombre: { es: "Plataforma Ejemplo (ficticia)", en: "Example Platform (fictional)" }, version: "0.1.0", verificado: 6 },
  { id: "norte", nombre: { es: "Plataforma Norte (ficticia)", en: "North Platform (fictional)" }, version: "0.3.0", verificado: 12 },
  { id: "sur", nombre: { es: "Plataforma Sur (ficticia)", en: "South Platform (fictional)" }, version: "0.2.0", verificado: 41 },
  { id: "este", nombre: { es: "Plataforma Este (ficticia)", en: "East Platform (fictional)" }, version: "0.1.0", verificado: 3 },
];
export const LADO = {
  ejemplo: { fuentes: ["Sistemas de origen", "Source systems", 1, "tipo-externo", "disponible-general"], ingesta: ["Entrada de datos", "Data intake", 2, "cap-ingesta", "disponible-general"], almacenamiento: ["Almacén central", "Central store", 2, "cap-almacenamiento", "disponible-general"], procesamiento: ["Preparación", "Preparation", 2, "cap-transformacion", "disponible-general"], consumo: ["Tableros", "Dashboards", 2, "cap-consumo", "disponible-general"], ia: ["Agentes", "Agents", 1, "cap-ia", "vista-previa-publica"], gobierno: ["Gobierno", "Governance", 2, "cap-gobierno", "disponible-general"], operacion: ["Monitor de consumo", "Usage monitor", 1, "tipo-operacion", "disponible-general"], orquestacion: ["Programador de tareas", "Task scheduler", 1, "cap-transformacion", "disponible-general"] },
  norte: { fuentes: ["Sistemas de origen", "Source systems", 2, "tipo-externo", "disponible-general"], ingesta: ["Conectores gestionados", "Managed connectors", 3, "cap-ingesta", "disponible-general"], almacenamiento: ["Almacén de archivos", "File store", 1, "cap-almacenamiento", "disponible-general"], procesamiento: ["Motor de consultas", "Query engine", 1, "cap-transformacion", "disponible-general"], consumo: ["Reportes", "Reports", 2, "cap-consumo", "disponible-general"], ia: null, gobierno: ["Catálogo", "Catalog", 1, "cap-gobierno", "vista-previa-publica"], operacion: ["Control de costo", "Cost control", 1, "tipo-operacion", "disponible-general"], orquestacion: ["Flujos programados", "Scheduled flows", 1, "cap-transformacion", "disponible-general"] },
  sur: { fuentes: ["Sistemas de origen", "Source systems", 1, "tipo-externo", "disponible-general"], ingesta: ["Ingesta en tiempo real", "Real-time intake", 2, "cap-ingesta", "disponible-general"], almacenamiento: ["Almacén columnar", "Columnar store", 1, "cap-almacenamiento", "disponible-general"], procesamiento: ["Preparación SQL", "SQL preparation", 3, "cap-transformacion", "disponible-general"], consumo: ["Tableros", "Dashboards", 1, "cap-consumo", "disponible-general"], ia: ["Asistente", "Assistant", 1, "cap-ia", "vista-previa-privada"], gobierno: ["Permisos y máscaras", "Permissions and masks", 2, "cap-gobierno", "disponible-general"], operacion: ["Monitor de gasto", "Spend monitor", 1, "tipo-operacion", "disponible-general"], orquestacion: ["Tareas programadas", "Scheduled tasks", 2, "cap-transformacion", "disponible-general"] },
  este: { fuentes: ["Sistemas de origen", "Source systems", 1, "tipo-externo", "disponible-general"], ingesta: ["Entrada por eventos", "Event intake", 1, "cap-ingesta", "beta"], almacenamiento: ["Almacén abierto", "Open store", 2, "cap-almacenamiento", "disponible-general"], procesamiento: ["Preparación", "Preparation", 1, "cap-transformacion", "disponible-general"], consumo: ["Tableros", "Dashboards", 2, "cap-consumo", "disponible-general"], ia: ["Modelos y agentes", "Models and agents", 2, "cap-ia", "beta"], gobierno: ["Catálogo y linaje", "Catalog and lineage", 2, "cap-gobierno", "disponible-general"], operacion: null, orquestacion: ["Orquestador", "Orchestrator", 1, "cap-transformacion", "anunciado"] },
};
/** Diferencias entre dos versiones del mapa de la Plataforma Ejemplo (v0.1.0 → v0.2.0, ficticio). */
export const DIFF = [
  { tipo: "nuevo", banda: "ia", nodo: { es: "Búsqueda vectorial", en: "Vector search" }, detalle: { es: "Nuevo componente en Inteligencia artificial, vista previa pública.", en: "New component in Artificial intelligence, public preview." } },
  { tipo: "madurez", banda: "ia", nodo: { es: "Agente de preguntas sobre datos", en: "Data question agent" }, detalle: { es: "Madurez: de vista previa pública a disponible de forma general.", en: "Maturity: from public preview to generally available." } },
  { tipo: "renombrado", banda: "ingesta", nodo: { es: "Conector de bases relacionales", en: "Relational database connector" }, detalle: { es: "Antes «Conector JDBC». Mismo componente.", en: "Formerly “JDBC connector”. Same component." } },
  { tipo: "retirado", banda: "procesamiento", nodo: { es: "Cuadernos interactivos", en: "Interactive notebooks" }, detalle: { es: "Retirado del mapa: el fabricante lo descontinuó.", en: "Removed from the map: the vendor discontinued it." } },
];

/**
 * Componentes detrás de cada bloque del lado a lado (mirada 2, ajuste del usuario: «quiero ver cuáles
 * son esos componentes»). Ejemplo: los 14 nodos del mapa agrupados por banda. Norte, Sur y Este:
 * ficticios, [es, en, tipo, madurez, fuentes]. El conteo de LADO se verifica contra estas listas.
 */
const C = (es, en, tipo, mad = "disponible-general", fuentes = 1) => ({ es, en, tipo, mad, fuentes });
export const COMPONENTES = {
  norte: {
    fuentes: [C("Sistema de admisiones (ficticio)", "Admissions system (fictional)", "tipo-externo"), C("Historia clínica (ficticia)", "Clinical record (fictional)", "tipo-externo")],
    ingesta: [C("Conector de bases relacionales", "Relational database connector", "cap-ingesta", "disponible-general", 2), C("Conector de archivos", "File connector", "cap-ingesta"), C("Captura de cambios gestionada", "Managed change capture", "cap-ingesta")],
    almacenamiento: [C("Almacén de archivos", "File store", "cap-almacenamiento", "disponible-general", 2)],
    procesamiento: [C("Motor de consultas", "Query engine", "cap-transformacion")],
    consumo: [C("Reportes paginados", "Paginated reports", "cap-consumo"), C("Tableros", "Dashboards", "cap-consumo")],
    ia: [],
    gobierno: [C("Catálogo", "Catalog", "cap-gobierno", "vista-previa-publica")],
    operacion: [C("Control de costo", "Cost control", "tipo-operacion")],
    orquestacion: [C("Flujos programados", "Scheduled flows", "cap-transformacion")],
  },
  sur: {
    fuentes: [C("Sistema de admisiones (ficticio)", "Admissions system (fictional)", "tipo-externo")],
    ingesta: [C("Ingesta por flujo", "Stream intake", "cap-ingesta", "disponible-general", 2), C("Carga por lotes", "Batch load", "cap-ingesta")],
    almacenamiento: [C("Almacén columnar", "Columnar store", "cap-almacenamiento", "disponible-general", 2)],
    procesamiento: [C("Transformación SQL", "SQL transformation", "cap-transformacion"), C("Vistas materializadas", "Materialized views", "cap-transformacion"), C("Funciones definidas por el usuario", "User-defined functions", "cap-transformacion")],
    consumo: [C("Tableros", "Dashboards", "cap-consumo")],
    ia: [C("Asistente de consultas", "Query assistant", "cap-ia", "vista-previa-privada")],
    gobierno: [C("Permisos por fila", "Row permissions", "cap-gobierno"), C("Máscaras de columna", "Column masks", "cap-gobierno")],
    operacion: [C("Monitor de gasto", "Spend monitor", "tipo-operacion")],
    orquestacion: [C("Tareas programadas", "Scheduled tasks", "cap-transformacion"), C("Cadenas de tareas", "Task chains", "cap-transformacion")],
  },
  este: {
    fuentes: [C("Sistema de admisiones (ficticio)", "Admissions system (fictional)", "tipo-externo")],
    ingesta: [C("Entrada por eventos", "Event intake", "cap-ingesta", "beta")],
    almacenamiento: [C("Capa cruda", "Raw layer", "cap-almacenamiento"), C("Tablas abiertas", "Open tables", "cap-almacenamiento", "disponible-general", 2)],
    procesamiento: [C("Preparación", "Preparation", "cap-transformacion")],
    consumo: [C("Tableros", "Dashboards", "cap-consumo"), C("Consultas ad hoc", "Ad hoc queries", "cap-consumo")],
    ia: [C("Modelos gestionados", "Managed models", "cap-ia", "beta"), C("Agente de datos", "Data agent", "cap-ia", "beta")],
    gobierno: [C("Catálogo", "Catalog", "cap-gobierno"), C("Linaje", "Lineage", "cap-gobierno")],
    operacion: [],
    orquestacion: [C("Orquestador", "Orchestrator", "cap-transformacion", "anunciado", 1)],
  },
};
import { NODO as NODO_ES } from "../nucleo/datos.mjs";
COMPONENTES.ejemplo = {};
for (const n of MAPA.nodos) (COMPONENTES.ejemplo[n.banda_id] ??= []).push(C(NODO_ES[n.id].es, NODO_ES[n.id].en, n.tipo_id, n.madurez, n.fuentes.length));
