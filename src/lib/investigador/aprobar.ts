import {
  coberturaDeRangos,
  diff,
  validate,
  type Gramatica,
  type Mapa,
} from "diagramador";
import { aplicarDecisiones, sinAfirmacion } from "./decisiones";
import { avisosDeDibujo } from "./dibujo";
import type { Propuesta, Revision, Verificacion } from "./esquema";
import { huella } from "./huella";

// Núcleo de scripts/aprobar.mjs (solo humano, D-S1-10): de una propuesta verificada y la decisión de una
// persona sale el mapa APROBADO y la línea de la revisión. Reglas:
//   - la propuesta es posterior a la última que se cerró (M-19: una vieja no hace retroceder el mapa, y
//     repetir el comando no duplica la revisión);
//   - la verificación es de ESTA propuesta (huella de sus bytes) y de sus citas (misma URL, B-45);
//   - todo componente y flujo propuesto tiene al menos una afirmación, también en «sin novedades» (A-3);
//   - cada afirmación tiene exactamente una decisión; una cita «no encontrada» no se aprueba (la rechazó el
//     código); una «no verificable» solo entra si la persona la aprueba explícitamente;
//   - lo que el mapa aprobado tenía y la propuesta ya no trae (retiros) lo nombra la persona con --retirar, y
//     tiene que coincidir con el diff (M-21: un retiro no es una afirmación y no puede pasar sin verse);
//   - lo rechazado sale del mapa (con lo que depende de ello) y el resultado debe pasar el diagramador en modo
//     publicación, sin alertas, y dibujarse hoy y al envejecer; si no pasa, no se escribe nada;
//   - «sin novedades» solo si el contenido es idéntico al mapa aprobado Y la persona no rechazó nada (A-4: un
//     rechazo se aplica siempre); entonces solo se renuevan las fechas de verificación.

export interface Entrada {
  carpeta: string;
  propuesta: Propuesta;
  /** Huella de los bytes de propuesta.json. */
  propuestaSha256: string;
  verificacion: Verificacion;
  aprobadas: readonly string[];
  rechazadas: readonly string[];
  /** Ids (componentes y flujos) que la persona acepta retirar; deben ser exactamente los retiros del diff. */
  retiradas: readonly string[];
  gramatica: Gramatica;
  rangos: readonly (readonly [number, number])[];
  /** El mapa aprobado vigente, si la plataforma ya tiene uno. */
  anterior?: Mapa;
  /** La carpeta de la última propuesta cerrada de esta plataforma (data/revisiones/), si hay. */
  ultimaPropuesta?: string;
  /** Día de la aprobación (AAAA-MM-DD, UTC). */
  fecha: string;
}

export class ErrorDeAprobacion extends Error {
  constructor(readonly fallas: string[]) {
    super(`la aprobación no procede (${fallas.length}):\n${fallas.join("\n")}`);
    this.name = "ErrorDeAprobacion";
  }
}

/**
 * Lo que cambia entre versiones sin ser contenido: estado, versión y fechas (también la de consulta de cada
 * fuente: la skill la pone en el día de la corrida, y con ella «sin novedades» era inalcanzable, M-22).
 */
const contenido = (m: Mapa) => ({
  ...m,
  estado: undefined,
  version: undefined,
  fecha_actualizacion: undefined,
  nodos: m.nodos.map((n) => ({
    ...n,
    fecha_verificacion: undefined,
    fuentes: n.fuentes.map((f) => ({ ...f, fecha: undefined })),
  })),
});

function siguienteVersion(anterior?: Mapa): string {
  if (!anterior) return "0.1.0";
  const [a, b] = anterior.version.split(".").map(Number);
  return `${a}.${(b ?? 0) + 1}.0`;
}

/** Los componentes y flujos del aprobado que la propuesta ya no trae (un renombre no es un retiro). */
export function retirosDe(
  anterior: Mapa | undefined,
  propuesto: Mapa,
): string[] {
  if (!anterior) return [];
  const d = diff(anterior, propuesto);
  return [...d.nodos.retirados, ...d.flujos.retirados].sort();
}

export function aprobar(e: Entrada): { mapa: Mapa; revision: Revision } {
  const fallas: string[] = [];
  if (e.ultimaPropuesta !== undefined && e.carpeta <= e.ultimaPropuesta)
    fallas.push(
      `${e.carpeta} no es posterior a la última propuesta cerrada (${e.ultimaPropuesta}): no se aprueba dos veces ni se vuelve a una vieja`,
    );
  if (e.verificacion.propuesta_sha256 !== e.propuestaSha256)
    fallas.push(
      "verificacion.json es de otra versión de la propuesta: vuelve a correr scripts/verificar-citas.mjs",
    );
  const ids = e.propuesta.afirmaciones.map((a) => a.id);
  const decididas = [...e.aprobadas, ...e.rechazadas];
  for (const id of decididas)
    if (!ids.includes(id))
      fallas.push(`${id} no es una afirmación de esta propuesta`);
  for (const id of ids) {
    const veces = decididas.filter((d) => d === id).length;
    if (veces === 0)
      fallas.push(`${id} no tiene decisión: va en --aprobar o en --rechazar`);
    if (veces > 1) fallas.push(`${id} tiene más de una decisión`);
  }
  const resultado = new Map(
    e.verificacion.resultados.map((r) => [r.afirmacion, r]),
  );
  for (const a of e.propuesta.afirmaciones) {
    const r = resultado.get(a.id);
    if (!r) fallas.push(`${a.id} no fue verificada`);
    else if (r.url !== a.cita.url)
      fallas.push(
        `${a.id}: la verificación es de otra URL (${r.url}), no de su cita`,
      );
  }
  for (const id of e.aprobadas)
    if (resultado.get(id)?.resultado === "no-encontrada")
      fallas.push(
        `${id}: su cita no aparece en la fuente; el código la rechazó y no se puede aprobar`,
      );
  const propuesto = e.propuesta.mapa as unknown as Mapa;
  for (const x of sinAfirmacion(propuesto, e.propuesta.afirmaciones))
    fallas.push(`${x} no tiene ninguna afirmación que lo respalde`);
  const retiros = retirosDe(e.anterior, propuesto);
  const pedidos = [...new Set(e.retiradas)].sort();
  if (retiros.join(",") !== pedidos.join(","))
    fallas.push(
      `los retiros no coinciden con el diff: la propuesta retira [${retiros.join(", ") || "nada"}] y el comando dice --retirar ${pedidos.join(",") || "-"}`,
    );
  if (fallas.length) throw new ErrorDeAprobacion(fallas);

  const sinNovedades =
    e.anterior !== undefined &&
    e.rechazadas.length === 0 &&
    huella(contenido(propuesto)) === huella(contenido(e.anterior));
  const base = sinNovedades
    ? e.anterior!
    : aplicarDecisiones(
        propuesto,
        e.propuesta.afirmaciones,
        new Set(e.rechazadas),
      );
  const mapa: Mapa = {
    ...base,
    estado: "aprobada",
    version: sinNovedades ? e.anterior!.version : siguienteVersion(e.anterior),
    fecha_actualizacion: sinNovedades
      ? e.anterior!.fecha_actualizacion
      : e.fecha,
    nodos: base.nodos.map((n) => ({
      ...n,
      fecha_verificacion: e.verificacion.fecha,
    })),
  };
  const inf = validate(mapa, e.gramatica, {
    mode: "publicacion",
    coverage: coberturaDeRangos(e.rangos),
  });
  for (const x of [...inf.errores, ...inf.alertas])
    fallas.push(`mapa${x.ruta} · ${x.regla} · ${x.id} · ${x.mensaje}`);
  if (!mapa.nodos.length) fallas.push("no queda ningún componente aprobado");
  // Lo que quedó tras las decisiones también tiene que dibujarse: el build no publica un dibujo con avisos.
  if (inf.ok && mapa.nodos.length)
    fallas.push(...avisosDeDibujo(mapa, e.gramatica, e.fecha));
  if (fallas.length) throw new ErrorDeAprobacion(fallas);
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
