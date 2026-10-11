// Los errores sembrados del instrumento (RF-09.3, S4): cada uno es un defecto puesto a propósito que el sistema real debe
// atrapar. Un sembrado está «detectado» solo si (a) con el dato o el motor limpios NO hay alarma y (b) con el defecto sí:
// así un detector que siempre grita, o que nunca grita, no cuenta. Usan el código REAL (el esquema del caso, el cargador de la
// base, el motor): si alguien debilita uno, el sembrado deja de detectarse y `pnpm build` no publica (RF-09.4). Solo Node.
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import {
  canonicoEstricto,
  evaluar,
  type Bilingue,
  type Entrada,
} from "@/engine";
import { CASOS_DE_REFERENCIA } from "@/engine";
import { cargarConocimiento } from "@/lib/datos/cargar-conocimiento";
import { esquemaCaso, type Caso } from "@/lib/datos/conocimiento";
import { huellaCaso } from "@/lib/datos/instantanea";
import { esInvarianteAlOrden } from "./propiedades";

export interface Sembrado {
  id: string;
  descripcion: Bilingue;
  /** El requisito o la convención que cubre. */
  referencia: string;
  /** Sin el defecto: devuelve la alarma si el sistema grita sin motivo (debe ser null). */
  limpio(): string | null;
  /** Con el defecto: devuelve la alarma con que el sistema lo atrapa (null = no lo vio). */
  sembrado(): string | null;
}

export interface ContextoSembrados {
  /** La carpeta de datos de la base que se publica. */
  dir: string;
  /** Un caso de esa base, para sembrar defectos en su perfil. */
  caso: Caso | undefined;
}

type Evaluador = (e: Entrada) => unknown;

const REFERENCIA = CASOS_DE_REFERENCIA.find(
  (c) => c.id === "todo-el-peso",
)!.entrada;
const copia = <T>(x: T): T => structuredClone(x);

/** La alarma del esquema del caso: sus mensajes, o null si lo acepta. */
function alarmaDelEsquema(c: unknown): string | null {
  const r = esquemaCaso.safeParse(c);
  return r.success ? null : r.error.issues.map((i) => i.message).join(" · ");
}

const sinCaso = (): never => {
  throw new Error(
    "la base no trae ningún caso: no hay perfil en el que sembrar el defecto",
  );
};
const casoDe = (ctx: ContextoSembrados): Caso => ctx.caso ?? sinCaso();

/** Un perfil aprobado «de mentira» para el esquema (el sello y la instantánea los exige, la huella la comprueba el cargador). */
function comoAprobado(c: Caso): Caso {
  return {
    ...c,
    estado_aprobacion: "aprobado",
    instantanea: c.instantanea ?? "2000-01-01.1",
    aprobacion: { fecha: c.fecha_evaluacion, huella: huellaCaso(c) },
  };
}
const conTodoRespondido = (c: Caso): Caso => ({
  ...c,
  decisiones_implicitas: c.decisiones_implicitas.map((d) => ({
    ...d,
    respuesta: d.respuesta ?? d.opciones[0]!.id,
  })),
});

/** La alarma del cargador al abrir la base con una evidencia sin su campo obligatorio: debe nombrar el archivo, el id y el campo. */
function alarmaDeBaseIncompleta(dir: string, quitar: boolean): string | null {
  const tmp = mkdtempSync(join(tmpdir(), "bigd-sembrado-"));
  try {
    cpSync(dir, join(tmp, "data"), { recursive: true });
    const carpeta = join(tmp, "data/evidencias");
    const plataforma = readdirSync(carpeta).sort()[0]!;
    const archivo = readdirSync(join(carpeta, plataforma))
      .filter((f) => f.endsWith(".yaml"))
      .sort()[0]!;
    const ruta = join(carpeta, plataforma, archivo);
    const e = parse(readFileSync(ruta, "utf8")) as Record<string, unknown>;
    if (quitar) delete e.justificacion_puntaje;
    writeFileSync(ruta, stringify(e, { lineWidth: 0, version: "1.2" }));
    try {
      cargarConocimiento(join(tmp, "data"));
      return null;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      // Atrapar no basta: el error debe decir dónde (archivo e id) y qué falta (campo): jamás se completa por inferencia (RF-01.2).
      return mensaje.includes(archivo) &&
        mensaje.includes(String(e.id)) &&
        mensaje.includes("justificacion_puntaje")
        ? (mensaje.split("\n").find((l) => l.includes(archivo)) ?? mensaje).trim()
        : `error sin archivo, id o campo: ${mensaje.split("\n")[0]}`;
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** La alarma del motor ante una entrada que no puede evaluarse (dice por qué), o null si la evalúa. */
function alarmaDeNoEvaluable(e: Entrada): string | null {
  const r = evaluar(e);
  return r.tipo === "no-evaluable"
    ? `no evaluable: ${r.motivos.map((m) => m.motivo).join(", ")}`
    : null;
}
/** La referencia con una restricción que elimina a todas las plataformas (RF-03.4). */
function conTodasDescartadas(): Entrada {
  const e = copia(REFERENCIA);
  e.caso.restricciones = [
    { id: "res-sembrada", elimina: e.base.plataformas.map((p) => p.id) },
  ];
  return e;
}

/**
 * Una evidencia con otro puntaje en una celda ya puntuada: si es solo PROPUESTA no debe mover nada (solo cuentan las
 * aprobadas, RF-01.3) y el sistema lo dice; si es aprobada sí cuenta, y es el control que prueba que la comparación puede fallar.
 */
function neutralizada(estado: "propuesta" | "aprobada"): string | null {
  const e0 = REFERENCIA.base.evidencias[0]!;
  const con = copia(REFERENCIA);
  con.base.evidencias.push({
    ...e0,
    id: "evi-sembrada",
    puntaje: e0.puntaje === 4 ? 0 : 4,
    estado,
  });
  return canonicoEstricto(evaluar(con)) ===
    canonicoEstricto(evaluar(REFERENCIA))
    ? "el resultado no cambió: la evidencia propuesta no cuenta"
    : null;
}

/** El motor que deja que el orden de la lista se cuele en el resultado (un empate roto por el primero, E-11). */
const conOrdenFiltrado: Evaluador = (e) => ({
  ...evaluar(e),
  primera: e.base.plataformas[0]?.id,
});
const alarmaDeOrden = (evaluador: Evaluador): string | null =>
  esInvarianteAlOrden(evaluador, REFERENCIA, [5, 4, 3, 2, 1, 0])
    ? null
    : "reordenar las listas cambió la huella";

export function sembrados(ctx: ContextoSembrados): readonly Sembrado[] {
  const caso = () => casoDe(ctx);
  return [
    {
      id: "suma-distinta-de-100",
      descripcion: {
        es: "Perfil con pesos que no suman 100",
        en: "Profile with weights that do not add up to 100",
      },
      referencia: "RF-03.1",
      limpio: () => alarmaDelEsquema(caso()),
      sembrado: () =>
        alarmaDelEsquema({
          ...caso(),
          criterios: caso().criterios.map((k, i) =>
            i === 0 ? { ...k, peso_centesimas: k.peso_centesimas + 100 } : k,
          ),
        }),
    },
    {
      id: "rango-abierto",
      descripcion: {
        es: "Rango de incertidumbre abierto: más de 100 % del peso",
        en: "Open uncertainty range: more than 100 % of the weight",
      },
      referencia: "RF-03.2",
      limpio: () => alarmaDelEsquema(caso()),
      sembrado: () =>
        alarmaDelEsquema({
          ...caso(),
          criterios: caso().criterios.map((k, i) =>
            i === 0 ? { ...k, rango_relativo_pct: 101 } : k,
          ),
        }),
    },
    {
      id: "restriccion-que-elimina-a-todas",
      descripcion: {
        es: "Restricción que elimina a todas las plataformas",
        en: "Constraint that eliminates every platform",
      },
      referencia: "RF-03.4",
      limpio: () => alarmaDeNoEvaluable(REFERENCIA),
      sembrado: () => alarmaDeNoEvaluable(conTodasDescartadas()),
    },
    {
      id: "decision-implicita-sin-responder",
      descripcion: {
        es: "Perfil aprobado con una decisión implícita sin responder",
        en: "Approved profile with an unanswered implicit decision",
      },
      referencia: "RF-03.5",
      limpio: () => alarmaDelEsquema(comoAprobado(conTodoRespondido(caso()))),
      sembrado: () =>
        alarmaDelEsquema(
          comoAprobado({
            ...conTodoRespondido(caso()),
            decisiones_implicitas: conTodoRespondido(
              caso(),
            ).decisiones_implicitas.map((d, i) =>
              i === 0 ? { ...d, respuesta: null } : d,
            ),
          }),
        ),
    },
    {
      id: "evidencia-propuesta-altera-puntajes",
      descripcion: {
        es: "Evidencia solo propuesta que altera un puntaje",
        en: "Merely proposed evidence that alters a score",
      },
      referencia: "RF-01.3",
      limpio: () => neutralizada("aprobada"),
      sembrado: () => neutralizada("propuesta"),
    },
    {
      id: "base-incompleta",
      descripcion: {
        es: "Evidencia sin su justificación: la base no carga y dice dónde",
        en: "Evidence without its justification: the base does not load and says where",
      },
      referencia: "RF-01.2",
      limpio: () => alarmaDeBaseIncompleta(ctx.dir, false),
      sembrado: () => alarmaDeBaseIncompleta(ctx.dir, true),
    },
    {
      id: "reorden-cambia-la-huella",
      descripcion: {
        es: "Reordenar las listas cambia el resultado (empate roto por el orden)",
        en: "Reordering the lists changes the result (tie broken by order)",
      },
      referencia: "RF-09.2 · E-11",
      limpio: () => alarmaDeOrden(evaluar),
      sembrado: () => alarmaDeOrden(conOrdenFiltrado),
    },
  ];
}
