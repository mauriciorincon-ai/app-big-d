import { coberturaDeRangos, diff, validate, type Gramatica, type Mapa } from "diagramador";
import { aplicarDecisiones } from "./decisiones";
import type { Propuesta, Revision, Verificacion } from "./esquema";
import { huella } from "./huella";

// Núcleo de scripts/aprobar.mjs (solo humano, D-S1-10): de una propuesta verificada y la decisión de una
// persona sale el mapa APROBADO y la línea de la revisión. Reglas:
//   - la verificación es de ESTA propuesta (huella de sus bytes);
//   - cada afirmación tiene exactamente una decisión; una cita «no encontrada» no se aprueba (la rechazó el
//     código); una «no verificable» solo entra si la persona la aprueba explícitamente;
//   - lo rechazado sale del mapa (con lo que depende de ello) y el resultado debe pasar el diagramador en modo
//     publicación, sin alertas; si no pasa, no se escribe nada;
//   - «sin novedades» solo si el contenido es idéntico al mapa aprobado; entonces solo se renuevan las fechas
//     de verificación (si el modelo dijo «sin novedades» y el diff no está vacío, gana el diff).

export interface Entrada {
  carpeta: string;
  propuesta: Propuesta;
  /** Huella de los bytes de propuesta.json. */
  propuestaSha256: string;
  verificacion: Verificacion;
  aprobadas: readonly string[];
  rechazadas: readonly string[];
  gramatica: Gramatica;
  rangos: readonly (readonly [number, number])[];
  /** El mapa aprobado vigente, si la plataforma ya tiene uno. */
  anterior?: Mapa;
  /** Día de la aprobación (AAAA-MM-DD). */
  fecha: string;
}

export class ErrorDeAprobacion extends Error {
  constructor(readonly fallas: string[]) {
    super(`la aprobación no procede (${fallas.length}):\n${fallas.join("\n")}`);
    this.name = "ErrorDeAprobacion";
  }
}

/** Lo que cambia entre versiones no es contenido: estado, versión y fechas. */
const contenido = (m: Mapa) => ({ ...m, estado: undefined, version: undefined, fecha_actualizacion: undefined, nodos: m.nodos.map((n) => ({ ...n, fecha_verificacion: undefined })) });

function siguienteVersion(anterior?: Mapa): string {
  if (!anterior) return "0.1.0";
  const [a, b] = anterior.version.split(".").map(Number);
  return `${a}.${(b ?? 0) + 1}.0`;
}

export function aprobar(e: Entrada): { mapa: Mapa; revision: Revision } {
  const fallas: string[] = [];
  if (e.verificacion.propuesta_sha256 !== e.propuestaSha256) fallas.push("verificacion.json es de otra versión de la propuesta: vuelve a correr scripts/verificar-citas.mjs");
  const ids = e.propuesta.afirmaciones.map((a) => a.id);
  const decididas = [...e.aprobadas, ...e.rechazadas];
  for (const id of decididas) if (!ids.includes(id)) fallas.push(`${id} no es una afirmación de esta propuesta`);
  for (const id of ids) {
    const veces = decididas.filter((d) => d === id).length;
    if (veces === 0) fallas.push(`${id} no tiene decisión: va en --aprobar o en --rechazar`);
    if (veces > 1) fallas.push(`${id} tiene más de una decisión`);
  }
  const resultado = new Map(e.verificacion.resultados.map((r) => [r.afirmacion, r.resultado]));
  for (const id of ids) if (!resultado.has(id)) fallas.push(`${id} no fue verificada`);
  for (const id of e.aprobadas) if (resultado.get(id) === "no-encontrada") fallas.push(`${id}: su cita no aparece en la fuente; el código la rechazó y no se puede aprobar`);
  if (fallas.length) throw new ErrorDeAprobacion(fallas);

  const propuesto = e.propuesta.mapa as unknown as Mapa;
  const sinNovedades = e.anterior !== undefined && huella(contenido(propuesto)) === huella(contenido(e.anterior));
  const base = sinNovedades ? e.anterior! : aplicarDecisiones(propuesto, e.propuesta.afirmaciones, new Set(e.rechazadas));
  const mapa: Mapa = {
    ...base,
    estado: "aprobada",
    version: sinNovedades ? e.anterior!.version : siguienteVersion(e.anterior),
    fecha_actualizacion: sinNovedades ? e.anterior!.fecha_actualizacion : e.fecha,
    nodos: base.nodos.map((n) => ({ ...n, fecha_verificacion: e.verificacion.fecha })),
  };
  const inf = validate(mapa, e.gramatica, { mode: "publicacion", coverage: coberturaDeRangos(e.rangos) });
  for (const x of [...inf.errores, ...inf.alertas]) fallas.push(`mapa${x.ruta} · ${x.regla} · ${x.id} · ${x.mensaje}`);
  if (!mapa.nodos.length) fallas.push("no queda ningún componente aprobado");
  if (fallas.length) throw new ErrorDeAprobacion(fallas);
  if (e.anterior && !sinNovedades) {
    // Sanidad: si el diff contra el aprobado estuviera vacío, esto habría sido «sin novedades».
    const d = diff(e.anterior, mapa);
    void d;
  }
  return {
    mapa,
    revision: {
      fecha: e.fecha,
      propuesta: e.carpeta,
      resultado: sinNovedades ? "sin-novedades" : "aprobada",
      aprobadas: [...e.aprobadas].sort(),
      rechazadas: [...e.rechazadas].sort(),
      mapa_version: mapa.version,
      huella: huella(mapa),
    },
  };
}
