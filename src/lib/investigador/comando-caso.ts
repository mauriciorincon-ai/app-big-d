// La aprobación del PERFIL del caso (S4, D-S4-03) es humana y mecánica, igual que la de una propuesta: la pantalla del
// borrador solo ARMA el comando con lo que la persona fijó y respondió; ella lo corre en su terminal. Este módulo es puro y
// sin dependencias (lo importa un componente del navegador: nada de Zod aquí, que prueba `new Function` y dispara la CSP).
// Lo que escribe el comando vive en aprobar-caso.ts.

/** La decisión que todo caso responde (E-17); la misma de `UNA_O_COMBINACION` en datos/conocimiento.ts (lo comprueba una prueba). */
export const DECISION_UNA_O_COMBINACION = "una-o-combinacion";

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX64 = /^[0-9a-f]{64}$/;

/** Lo que el perfil en borrador ofrece a la persona: los criterios, las restricciones y las decisiones del caso. */
export interface PerfilEditable {
  id: string;
  criterios: readonly {
    criterio_id: string;
    peso_centesimas: number;
    rango_relativo_pct: number;
  }[];
  restricciones: readonly { id: string }[];
  decisiones_implicitas: readonly {
    id: string;
    opciones: readonly { id: string }[];
    respuesta: string | null;
  }[];
}

/** Lo que la persona fija: pesos en centésimas (suman 10 000), rango relativo en %, las restricciones que conserva y una respuesta por decisión. */
export interface DecisionesPerfil {
  pesos: Record<string, number>;
  rangos: Record<string, number>;
  restricciones: string[];
  respuestas: Record<string, string>;
}

/** Las decisiones de arranque: el borrador tal cual está (el default de cada pregunta). */
export function decisionesPorDefecto(p: PerfilEditable): DecisionesPerfil {
  return {
    pesos: Object.fromEntries(
      p.criterios.map((k) => [k.criterio_id, k.peso_centesimas]),
    ),
    rangos: Object.fromEntries(
      p.criterios.map((k) => [k.criterio_id, k.rango_relativo_pct]),
    ),
    restricciones: p.restricciones.map((r) => r.id),
    respuestas: Object.fromEntries(
      p.decisiones_implicitas.flatMap((d) =>
        d.respuesta === null ? [] : [[d.id, d.respuesta] as const],
      ),
    ),
  };
}

const esEntero = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;

/** Todo lo que impide aprobar con estas decisiones; vacía = el comando se puede armar. */
export function problemasDelPerfil(
  p: PerfilEditable,
  d: DecisionesPerfil,
): string[] {
  const out: string[] = [];
  const criterios = new Set(p.criterios.map((k) => k.criterio_id));
  let suma = 0;
  for (const k of p.criterios) {
    const w = d.pesos[k.criterio_id];
    const r = d.rangos[k.criterio_id];
    if (!esEntero(w, 0, 10_000))
      out.push(
        `peso de ${k.criterio_id}: falta o no es un entero de 0 a 10 000 centésimas`,
      );
    else suma += w;
    if (!esEntero(r, 0, 100))
      out.push(
        `rango de ${k.criterio_id}: falta o no es un entero de 0 a 100 %`,
      );
  }
  for (const k of [...Object.keys(d.pesos), ...Object.keys(d.rangos)])
    if (!criterios.has(k)) out.push(`«${k}» no es un criterio del caso`);
  if (suma !== 10_000)
    out.push(
      `los pesos suman ${suma} centésimas y deben sumar 10 000 (100 puntos)`,
    );
  const conocidas = new Set(p.restricciones.map((r) => r.id));
  for (const r of d.restricciones)
    if (!conocidas.has(r)) out.push(`«${r}» no es una restricción del caso`);
  for (const dec of p.decisiones_implicitas) {
    const r = d.respuestas[dec.id];
    if (r === undefined)
      out.push(
        `falta responder «${dec.id}»${dec.id === DECISION_UNA_O_COMBINACION ? " (¿una plataforma o combinación?, E-17)" : ""}`,
      );
    else if (!dec.opciones.some((o) => o.id === r))
      out.push(`«${r}» no es una opción de «${dec.id}»`);
  }
  for (const k of Object.keys(d.respuestas))
    if (!p.decisiones_implicitas.some((x) => x.id === k))
      out.push(`«${k}» no es una decisión del caso`);
  return out;
}

const lista = (xs: readonly string[]) => (xs.length ? xs.join(",") : "-");
const pares = (o: Record<string, number | string>, orden: readonly string[]) =>
  lista(orden.filter((k) => k in o).map((k) => `${k}=${o[k]}`));

/**
 * El comando exacto que la persona corre. `desde` es la huella del borrador sobre el que se armó: si el archivo cambia
 * antes de que lo corra, el comando se niega (no aprueba lo que la persona no vio). Lanza si las decisiones no se pueden aprobar.
 */
export function comandoAprobarCaso(
  p: PerfilEditable,
  desde: string,
  d: DecisionesPerfil,
): string {
  if (!ID.test(p.id))
    throw new Error(`id de caso con caracteres no permitidos: «${p.id}»`);
  if (!HEX64.test(desde))
    throw new Error("la huella del borrador no es un SHA-256 en hexadecimal");
  const problemas = problemasDelPerfil(p, d);
  if (problemas.length)
    throw new Error(`no se puede armar el comando:\n${problemas.join("\n")}`);
  for (const x of [
    ...p.criterios.map((k) => k.criterio_id),
    ...d.restricciones,
    ...p.decisiones_implicitas.flatMap((x) => [
      x.id,
      ...x.opciones.map((o) => o.id),
    ]),
  ])
    if (!ID.test(x)) throw new Error(`id no permitido en el comando: «${x}»`);
  const criterios = p.criterios.map((k) => k.criterio_id);
  const decisiones = p.decisiones_implicitas.map((x) => x.id);
  return [
    "node scripts/aprobar.mjs",
    `--caso ${p.id}`,
    `--desde ${desde}`,
    `--pesos ${pares(d.pesos, criterios)}`,
    `--rangos ${pares(d.rangos, criterios)}`,
    `--restricciones ${lista(d.restricciones)}`,
    `--respuestas ${pares(d.respuestas, decisiones)}`,
  ].join(" ");
}

/** Lo que leyó el script del comando: el caso, el borrador de origen y las decisiones. «-» es la lista vacía. */
export interface AprobacionDeCaso {
  caso: string;
  desde: string;
  decisiones: DecisionesPerfil;
}

/** Lee lo que armó `comandoAprobarCaso`. No valida contra el caso (eso lo hace `aprobarCaso`), solo la forma. */
export function leerAprobacionCaso(args: readonly string[]): AprobacionDeCaso {
  const valor = (bandera: string): string => {
    const i = args.indexOf(bandera);
    const v = args[i + 1];
    if (i < 0 || !v || v.startsWith("--"))
      throw new Error(`falta ${bandera} <…>`);
    return v;
  };
  const caso = valor("--caso");
  const desde = valor("--desde");
  if (!ID.test(caso))
    throw new Error(`id de caso con caracteres no permitidos: «${caso}»`);
  if (!HEX64.test(desde))
    throw new Error("--desde no es un SHA-256 en hexadecimal");
  const items = (bandera: string): string[] =>
    valor(bandera) === "-" ? [] : valor(bandera).split(",").filter(Boolean);
  const mapa = (
    bandera: string,
    numerico: boolean,
  ): Record<string, number | string> => {
    const o: Record<string, number | string> = {};
    for (const par of items(bandera)) {
      const m =
        /^([a-z0-9]+(?:-[a-z0-9]+)*)=([a-z0-9]+(?:-[a-z0-9]+)*|\d+)$/.exec(par);
      if (!m)
        throw new Error(`${bandera}: «${par}» no tiene la forma id=valor`);
      if (m[1]! in o)
        throw new Error(`${bandera}: «${m[1]}» aparece dos veces`);
      if (numerico && !/^\d+$/.test(m[2]!))
        throw new Error(`${bandera}: «${par}» no es un número entero`);
      o[m[1]!] = numerico ? Number(m[2]) : m[2]!;
    }
    return o;
  };
  const restricciones = items("--restricciones");
  for (const r of restricciones)
    if (!ID.test(r)) throw new Error(`--restricciones: id no permitido «${r}»`);
  return {
    caso,
    desde,
    decisiones: {
      pesos: mapa("--pesos", true) as Record<string, number>,
      rangos: mapa("--rangos", true) as Record<string, number>,
      restricciones,
      respuestas: mapa("--respuestas", false) as Record<string, string>,
    },
  };
}

/**
 * Puntos con hasta dos decimales («12», «12,5», «12.50») a centésimas enteras, sin pasar por un flotante. `null` si no es un
 * número de ese tipo. Nunca más de 100 puntos.
 */
export function puntosACentesimas(texto: string): number | null {
  const m = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(texto.trim());
  if (!m) return null;
  const n = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
  return n <= 10_000 ? n : null;
}

/** Centésimas a puntos con dos decimales y el separador del idioma: 1250 → «12,50» / «12.50». Entero puro, sin `toLocale*`. */
export function centesimasAPuntos(n: number, idioma: "es" | "en"): string {
  return `${Math.floor(n / 100)}${idioma === "es" ? "," : "."}${String(n % 100).padStart(2, "0")}`;
}
