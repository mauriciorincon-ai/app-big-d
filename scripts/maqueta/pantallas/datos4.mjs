// Datos de la mirada 4 (100 % ficticios): decisiones del caso del Hospital Ficticio de la Sabana (§ 10.5
// de la especificación), riesgos con prioridad de acción, supuestos con prueba barata y hoja de ruta.
// Las ondas, el ciclo, la prioridad de acción y el orden se CALCULAN aquí, no se escriben.

export const REV = {
  una_via: { es: "una vía", en: "one-way", aria: ["Decisión de una vía", "One-way decision"], trato: ["Revertirla implica migrar datos, rediseñar permisos o renegociar contratos. Análisis de riesgos obligatorio; se decide primero.", "Reversing it means migrating data, redesigning permissions or renegotiating contracts. Risk analysis is mandatory; it is decided first."] },
  costosa: { es: "costosa", en: "costly", aria: ["Decisión costosa de revertir", "Costly-to-reverse decision"], trato: ["Reversible con un esfuerzo significativo pero acotado. Análisis de riesgos recomendado.", "Reversible with significant but bounded effort. Risk analysis recommended."] },
  dos_vias: { es: "dos vías", en: "two-way", aria: ["Decisión de dos vías", "Two-way decision"], trato: ["Se puede cambiar con bajo costo. Se decide rápido y se ajusta con la experiencia.", "It can be changed at low cost. Decide quickly and adjust with experience."] },
};
export const ESTADO_DEC = { pendiente: ["pendiente", "pending"], en_prueba: ["espera una prueba", "awaiting a test"], decidida: ["decidida", "decided"] };

/** Siete decisiones candidatas del caso; `dep` = decisiones que deben tomarse antes. */
export const DEC = [
  { id: "dec-identidad", es: "Relación con el directorio de identidad del grupo", en: "Relationship with the group's identity directory", rev: "una_via", dep: [], impl: false, estado: "en_prueba", cap: ["Gobierno y seguridad", "Governance and security"], sup: ["sup-federacion"], op: { ejemplo: ["Federación con el directorio del grupo", "Federation with the group directory"], norte: ["Directorio propio sincronizado", "Own synchronised directory"], sur: ["Federación o directorio propio", "Federation or own directory"] }, reco: ["Federación con el directorio del grupo", "Federation with the group directory"] },
  { id: "dec-formato", es: "Formato abierto y ubicación física de los datos", en: "Open format and physical location of the data", rev: "una_via", dep: [], impl: true, estado: "decidida", cap: ["Almacenamiento", "Storage"], sup: [], op: { ejemplo: ["Tablas abiertas en el almacén del hospital", "Open tables in the hospital's store"], norte: ["Formato propio en el almacén de archivos", "Proprietary format in the file store"], sur: ["Columnar propio con exportación abierta", "Proprietary columnar with open export"] }, reco: ["Tablas abiertas en el almacén del hospital", "Open tables in the hospital's store"] },
  { id: "dec-catalogo", es: "Organización del catálogo: por ambiente o por dominio", en: "Catalog organisation: by environment or by domain", rev: "una_via", dep: ["dec-identidad"], impl: true, estado: "pendiente", cap: ["Gobierno y seguridad", "Governance and security"], sup: [], op: { ejemplo: ["Por dominio, ambientes como esquemas", "By domain, environments as schemas"], norte: ["Un catálogo por ambiente", "One catalog per environment"], sur: ["Base de datos por ambiente", "Database per environment"] }, reco: ["Por dominio, ambientes como esquemas", "By domain, environments as schemas"] },
  { id: "dec-ingesta", es: "Ingesta: captura de cambios nativa o herramienta externa", en: "Ingestion: native change capture or external tool", rev: "costosa", dep: ["dec-formato"], impl: false, estado: "pendiente", cap: ["Ingesta", "Ingestion"], sup: ["sup-registro"], op: { ejemplo: ["Captura de cambios nativa", "Native change capture"], norte: ["Conector gestionado de captura de cambios", "Managed change-capture connector"], sur: ["Herramienta externa de captura de cambios", "External change-capture tool"] }, reco: ["Captura de cambios nativa", "Native change capture"] },
  { id: "dec-computo", es: "Cómputo: sin servidor o aprovisionado", en: "Compute: serverless or provisioned", rev: "dos_vias", dep: ["dec-formato"], impl: false, estado: "decidida", cap: ["Transformación y orquestación", "Transformation and orchestration"], sup: ["sup-equipo"], op: { ejemplo: ["Sin servidor", "Serverless"], norte: ["Aprovisionado con escalado", "Provisioned with scaling"], sur: ["Almacén virtual por tamaño", "Virtual warehouse by size"] }, reco: ["Sin servidor para empezar", "Serverless to start"] },
  { id: "dec-proteccion", es: "Protección de datos clínicos: filtros por fila y máscaras", en: "Clinical data protection: row filters and masks", rev: "costosa", dep: ["dec-catalogo"], impl: false, estado: "pendiente", cap: ["Gobierno y seguridad", "Governance and security"], sup: [], op: { ejemplo: ["Filtros por fila y máscaras en el catálogo", "Row filters and masks in the catalog"], norte: ["Políticas por fila en el catálogo", "Row policies in the catalog"], sur: ["Vistas seguras por rol", "Secure views per role"] }, reco: ["Filtros por fila y máscaras en el catálogo", "Row filters and masks in the catalog"] },
  { id: "dec-consumo", es: "Consumo: tableros existentes o capacidades nativas", en: "Consumption: existing dashboards or native capabilities", rev: "dos_vias", dep: ["dec-proteccion", "dec-computo"], impl: false, estado: "pendiente", cap: ["Consumo", "Consumption"], sup: ["sup-tableros"], op: { ejemplo: ["Tableros existentes sobre el modelo semántico", "Existing dashboards on the semantic model"], norte: ["Reportes nativos", "Native reports"], sur: ["Tableros nativos", "Native dashboards"] }, reco: ["Se reabre: el supuesto de los tableros se refutó", "Reopened: the dashboards assumption was refuted"] },
];
export const decDe = (id) => DEC.find((d) => d.id === id);
/** Variante sembrada: la protección pasa a ser requisito del catálogo → ciclo catálogo ⇄ protección. */
export const DEC_CICLO = DEC.map((d) => (d.id === "dec-catalogo" ? { ...d, dep: ["dec-identidad", "dec-proteccion"] } : d));

/** Kahn por ondas + DFS del ciclo (lo que hará src/engine/decisiones.ts). */
export function ondasDe(decs) {
  const pend = new Map(decs.map((d) => [d.id, new Set(d.dep)]));
  const ondas = [];
  const hecho = new Set();
  for (;;) {
    const libres = decs.filter((d) => !hecho.has(d.id) && [...pend.get(d.id)].every((x) => hecho.has(x))).map((d) => d.id);
    if (!libres.length) break;
    ondas.push(libres);
    libres.forEach((x) => hecho.add(x));
  }
  const resto = decs.filter((d) => !hecho.has(d.id)).map((d) => d.id);
  let ciclo = null;
  if (resto.length) {
    const color = {}; const pila = [];
    const dfs = (u) => { color[u] = 1; pila.push(u); for (const v of decDe2(decs, u).dep) { if (color[v] === 1) { ciclo = [...pila.slice(pila.indexOf(v)), v]; return true; } if (!color[v] && resto.includes(v) && dfs(v)) return true; } color[u] = 2; pila.pop(); return false; };
    for (const u of resto) if (!color[u] && dfs(u)) break;
  }
  return { ondas, resto, ciclo };
}
const decDe2 = (decs, id) => decs.find((d) => d.id === id);

/** Tabla de prioridad de acción v0 (convención declarada en datos; severidad primero). Calibrada con el
 *  caso sembrado S8/O3/D4 (E-3): la propuesta de C § 2.4 decía «S 7–8 con O ≥ 4» y lo dejaba en media. */
export function prioridad(s, o, d) {
  if (s >= 9) return o === 1 ? "media" : "alta";
  if (s >= 7) return o >= 3 || d >= 7 ? "alta" : "media";
  if (s >= 4 && o >= 6) return "media";
  return "baja";
}
export const AP_TXT = { alta: ["alta", "high"], media: ["media", "medium"], baja: ["baja", "low"] };
const R = (id, dec, modo, efecto, s, o, d, mit, res) => ({ id, dec, modo, efecto, s, o, d, mit, res, ap: prioridad(s, o, d), rpn: s * o * d, apRes: res ? prioridad(...res) : null });
export const RIESGOS = [
  R("R-1", "dec-proteccion", ["Datos clínicos visibles sin filtro por fila", "Clinical data visible without a row filter"], ["Incidente de datos sensibles y sanción regulatoria", "Sensitive-data incident and regulatory sanction"], 9, 4, 6, null, null),
  R("R-2", "dec-ingesta", ["La copia completa diaria satura el sistema de admisiones", "The full daily copy saturates the admissions system"], ["La atención de pacientes se vuelve lenta en horas pico", "Patient care slows down at peak hours"], 7, 5, 3, { es: "Captura de cambios desde el mes 2", en: "Change capture from month 2", quien: ["equipo de datos", "data team"], cuando: ["antes de construir", "before building"] }, [7, 2, 3]),
  R("R-3", "dec-catalogo", ["El catálogo por ambiente duplica permisos entre desarrollo y producción", "A per-environment catalog duplicates permissions between development and production"], ["Permisos divergentes y auditoría imposible", "Diverging permissions and impossible audit"], 8, 3, 4, { es: "Catálogo por dominio con ambientes como esquemas", en: "Catalog by domain with environments as schemas", quien: ["arquitectura", "architecture"], cuando: ["antes de construir", "before building"] }, [8, 1, 4]),
  R("R-4", "dec-formato", ["Un formato propio obliga a migrar si se cambia de plataforma", "A proprietary format forces a migration when switching platforms"], ["Meses de migración y costo de salida", "Months of migration and exit cost"], 7, 2, 2, { es: "Tablas abiertas legibles por otros motores", en: "Open tables readable by other engines", quien: ["arquitectura", "architecture"], cuando: ["antes de construir", "before building"] }, [7, 1, 2]),
  R("R-5", "dec-consumo", ["Dos definiciones del mismo indicador", "Two definitions of the same indicator"], ["Cifras contradictorias ante la gerencia", "Contradicting figures in front of management"], 5, 6, 4, { es: "Modelo semántico único", en: "Single semantic model", quien: ["equipo de datos", "data team"], cuando: ["durante", "during"] }, [5, 2, 4]),
  R("R-6", "dec-computo", ["La factura se descubre a fin de mes", "The bill is discovered at month end"], ["Sobrecosto sin aviso", "Overspend without warning"], 3, 4, 2, { es: "Alertas de presupuesto", en: "Budget alerts", quien: ["dirección financiera", "finance"], cuando: ["durante", "during"] }, [3, 2, 2]),
];
const ORD = { alta: 0, media: 1, baja: 2 };
/** Orden: prioridad de acción → severidad → RPN (solo secundario). */
export const RIESGOS_ORD = [...RIESGOS].sort((a, b) => ORD[a.ap] - ORD[b.ap] || b.s - a.s || b.rpn - a.rpn);

export const SUP = [
  { id: "sup-federacion", es: "El directorio del grupo admite federación con la plataforma sin cambios de licencia", en: "The group directory supports federation with the platform without licence changes", crit: "alta", prueba: ["Consulta escrita al equipo de identidad del grupo y revisión del contrato vigente por jurídica", "Written query to the group's identity team and review of the current contract by legal"], costo: "gratis", estado: "sin_probar", quien: ["equipo de identidad del grupo", "group identity team"], vence: "2026-10-09", dec: "dec-identidad" },
  { id: "sup-equipo", es: "El equipo actual puede operar el motor de transformación sin formación adicional", en: "The current team can operate the transformation engine without extra training", crit: "alta", prueba: ["Taller de dos días con un caso real del hospital y tres tareas cronometradas", "Two-day workshop with a real hospital case and three timed tasks"], costo: "bajo", estado: "sin_probar", quien: ["equipo de datos del hospital", "hospital data team"], vence: "2026-10-16", dec: "dec-computo" },
  { id: "sup-registro", es: "El sistema de admisiones expone un registro de transacciones legible", en: "The admissions system exposes a readable transaction log", crit: "alta", prueba: ["Pedir al proveedor la ficha técnica y una lectura de prueba en el ambiente de pruebas", "Ask the vendor for the data sheet and a test read in the test environment"], costo: "bajo", estado: "confirmado", quien: ["proveedor del sistema de admisiones", "admissions system vendor"], vence: "2026-09-20", dec: "dec-ingesta" },
  { id: "sup-tableros", es: "Los tableros existentes pueden leer el modelo semántico de la plataforma", en: "The existing dashboards can read the platform's semantic model", crit: "media", prueba: ["Conectar un tablero a un modelo de ejemplo siguiendo la documentación pública", "Connect one dashboard to a sample model following the public documentation"], costo: "gratis", estado: "refutado", quien: ["equipo de analítica", "analytics team"], vence: "2026-09-18", dec: "dec-consumo" },
];
export const SUP_EST = { sin_probar: ["sin probar", "untested"], confirmado: ["confirmado", "confirmed"], refutado: ["refutado", "refuted"] };
export const COSTO = { gratis: ["gratis", "free"], bajo: ["bajo", "low"], medio: ["medio", "medium"] };
export const CRIT = { alta: ["alta", "high"], media: ["media", "medium"], baja: ["baja", "low"] };

/** Hoja de ruta: fases por dependencias; las pruebas baratas antes de las decisiones de una vía (E-10). */
export const CATEG = { identidad_y_acceso: ["Identidad y acceso", "Identity and access"], red_y_seguridad: ["Red y seguridad", "Network and security"], gobierno: ["Gobierno", "Governance"], datos: ["Datos", "Data"], habilidades: ["Habilidades", "Skills"], presupuesto_y_contratos: ["Presupuesto y contratos", "Budget and contracts"], operacion: ["Operación", "Operations"] };
const T = (id, fase, tipo, es, en, origen, cumplido, estado = "pendiente", cat = null) => ({ id, fase, tipo, es, en, origen, cumplido, estado, cat });
export const FASES = [
  { n: 0, es: "Probar los supuestos baratos", en: "Test the cheap assumptions", sem: ["semanas 1–2", "weeks 1–2"] },
  { n: 1, es: "Tomar las decisiones de una vía", en: "Make the one-way decisions", sem: ["semanas 3–4", "weeks 3–4"] },
  { n: 2, es: "Construir la base", en: "Build the foundation", sem: ["semanas 5–10", "weeks 5–10"] },
  { n: 3, es: "Llegar al consumo", en: "Reach consumption", sem: ["semanas 11–14", "weeks 11–14"] },
];
export const ITEMS = [
  T("T-01", 0, "tarea", "Consulta escrita al equipo de identidad del grupo", "Written query to the group's identity team", ["sup-federacion"], ["Respuesta escrita archivada en el caso", "Written answer filed in the case"], "pendiente", "identidad_y_acceso"),
  T("V-01", 0, "verificacion", "Contrato vigente revisado por jurídica", "Current contract reviewed by legal", ["sup-federacion"], ["Nota de jurídica con la cláusula de licencias", "Legal note with the licensing clause"], "pendiente", "presupuesto_y_contratos"),
  T("T-02", 0, "tarea", "Taller de dos días con el motor de transformación", "Two-day workshop with the transformation engine", ["sup-equipo"], ["Tres tareas cronometradas dentro del tiempo acordado", "Three timed tasks within the agreed time"], "pendiente", "habilidades"),
  T("T-03", 1, "tarea", "Decidir la relación con el directorio del grupo", "Decide the relationship with the group directory", ["dec-identidad"], ["Decisión registrada con su supuesto confirmado", "Decision recorded with its assumption confirmed"]),
  T("T-04", 1, "tarea", "Fijar formato abierto y ubicación de los datos", "Fix the open format and data location", ["dec-formato"], ["Decisión registrada", "Decision recorded"], "hecho"),
  T("T-05", 1, "tarea", "Decidir la organización del catálogo", "Decide the catalog organisation", ["dec-catalogo", "R-3"], ["Decisión registrada; mitigación de R-3 incorporada", "Decision recorded; R-3 mitigation included"]),
  T("V-02", 2, "verificacion", "Grupos de acceso creados en el directorio", "Access groups created in the directory", ["dec-identidad"], ["Los tres grupos del hospital existen y tienen responsable", "The hospital's three groups exist and have an owner"], "pendiente", "identidad_y_acceso"),
  T("V-03", 2, "verificacion", "Red privada entre el hospital y la plataforma", "Private network between the hospital and the platform", ["dec-formato"], ["Prueba de conexión sin salida a internet", "Connection test with no internet egress"], "pendiente", "red_y_seguridad"),
  T("T-06", 2, "tarea", "Captura de cambios desde admisiones", "Change capture from admissions", ["R-2", "dec-ingesta"], ["Cambios llegan en menos de 5 minutos durante una semana", "Changes arrive in under 5 minutes for a week"], "pendiente", "datos"),
  T("T-07", 2, "tarea", "Filtros por fila y máscaras en el catálogo", "Row filters and masks in the catalog", ["R-1", "dec-proteccion"], ["Prueba con tres perfiles: cada uno ve solo sus filas", "Test with three profiles: each sees only its rows"], "bloqueado", "gobierno"),
  T("T-08", 3, "tarea", "Modelo semántico único para los indicadores", "Single semantic model for the indicators", ["R-5"], ["Las tres cifras de ocupación coinciden en todos los tableros", "The three occupancy figures match across dashboards"]),
  T("T-09", 3, "tarea", "Reabrir la decisión de tableros", "Reopen the dashboards decision", ["sup-tableros", "dec-consumo"], ["Nueva opción registrada con su prueba barata", "New option recorded with its cheap test"]),
  T("V-04", 3, "verificacion", "Alertas de presupuesto activas", "Budget alerts active", ["R-6"], ["Una alerta de prueba llega a la dirección financiera", "A test alert reaches finance"], "pendiente", "presupuesto_y_contratos"),
  T("V-06", 2, "verificacion", "Responsable de los datos clínicos nombrado", "Clinical data owner appointed", ["R-1"], ["Nombre y suplente registrados en el catálogo", "Name and deputy recorded in the catalog"], "pendiente", "gobierno"),
  T("V-07", 2, "verificacion", "Restauración de la capa cruda probada", "Raw-layer restore tested", ["dec-formato"], ["Una tabla restaurada a la versión de hace 7 días", "One table restored to its version from 7 days ago"], "pendiente", "datos"),
  T("V-08", 3, "verificacion", "Dos personas formadas en el motor de transformación", "Two people trained on the transformation engine", ["sup-equipo"], ["Dos personas completan las tareas del taller sin ayuda", "Two people finish the workshop tasks unaided"], "pendiente", "habilidades"),
  T("V-05", 3, "verificacion", "Guardia de operación definida con el fabricante", "Operations on-call agreed with the vendor", ["dec-computo"], ["Acuerdo de soporte firmado con tiempos de respuesta", "Support agreement signed with response times"], "pendiente", "operacion"),
];
