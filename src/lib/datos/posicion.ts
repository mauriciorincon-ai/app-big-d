import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { z } from "zod";
import { LineCounter, parseDocument } from "yaml";

// Lectura de un archivo de la base con la POSICIÓN de cada campo (técnica-núcleo § 3.2): una falla se escribe
// `archivo:línea:col · id · campo · regla`, con la línea y la columna del `LineCounter` de `yaml`, el campo de la ruta
// del problema y el id del propio dato. RF-01.2 pide campo e id; la posición es el extra que lleva directo al error.
// Sirve igual para YAML y para JSON (un JSON es YAML 1.2).

export type Ruta = readonly (string | number)[];

export interface Leido {
  archivo: string;
  dato: unknown;
  /** El id del dato si lo trae; si no, el nombre del archivo sin extensión. */
  id: string;
  /** «línea:col» del campo, o del ancestro más cercano que exista (un campo ausente apunta a su objeto). */
  pos: (ruta: Ruta) => string;
}

const sinExtension = (archivo: string) => basename(archivo).replace(/\.(mapa\.)?(ya?ml|json)$/, "");

/** El campo en la forma de la pantalla: `fuentes[0].conflicto_de_interes`. */
export function campo(ruta: Ruta): string {
  return ruta.reduce<string>((s, k) => (typeof k === "number" ? `${s}[${k}]` : s ? `${s}.${k}` : k), "") || "/";
}

/** Lee un archivo; si no es YAML válido, anota la falla con su posición y devuelve null. */
export function leerConPosicion(ruta: string, archivo: string, fallas: string[]): Leido | null {
  const texto = readFileSync(ruta, "utf8");
  const lc = new LineCounter();
  const doc = parseDocument(texto, { lineCounter: lc, uniqueKeys: true, prettyErrors: false });
  const donde = (offset: number) => {
    const { line, col } = lc.linePos(offset);
    return `${line}:${col}`;
  };
  if (doc.errors.length) {
    const e = doc.errors[0]!;
    fallas.push(`${archivo}:${donde(e.pos[0])} · ${sinExtension(archivo)} · yaml · ${e.message.split("\n")[0]}`);
    return null;
  }
  const dato = doc.toJS() as unknown;
  const idDato = dato && typeof dato === "object" && typeof (dato as { id?: unknown }).id === "string" ? (dato as { id: string }).id : sinExtension(archivo);
  const pos = (r: Ruta) => {
    for (let k = r.length; k > 0; k--) {
      const n = doc.getIn(r.slice(0, k), true) as { range?: [number, number, number] } | undefined;
      if (n && typeof n === "object" && n.range) return donde(n.range[0]);
    }
    const raiz = doc.contents as { range?: [number, number, number] } | null;
    return donde(raiz?.range?.[0] ?? 0);
  };
  return { archivo, dato, id: idDato, pos };
}

/** Una línea de falla con el formato de la base. */
export function linea(l: Leido, ruta: Ruta, regla: string): string {
  return `${l.archivo}:${l.pos(ruta)} · ${l.id} · ${campo(ruta)} · ${regla}`;
}

const TIPOS: Record<string, string> = { string: "un texto", number: "un número", boolean: "verdadero o falso", array: "una lista", object: "un objeto", int: "un entero" };

/** Los mensajes por defecto de Zod, en español; los mensajes propios del esquema mandan sobre estos. */
const enEspanol: z.core.$ZodErrorMap = (iss) => {
  // Un campo que no está: lo mismo da que se esperara un texto, una lista o una de varias opciones.
  if (iss.code !== "custom" && iss.code !== "unrecognized_keys" && iss.input === undefined) return "obligatorio, ausente";
  switch (iss.code) {
    case "invalid_type":
      return `se esperaba ${TIPOS[iss.expected] ?? iss.expected}`;
    case "invalid_value":
      return `«${String(iss.input)}» no es uno de: ${iss.values.map(String).join(", ")}`;
    case "unrecognized_keys":
      return `campo desconocido: ${iss.keys.map((k) => `«${k}»`).join(", ")}`;
    case "too_small":
      return iss.origin === "array" ? `al menos ${iss.minimum} elementos` : iss.origin === "string" ? "no puede ir vacío" : `al menos ${iss.minimum}`;
    case "too_big":
      return iss.origin === "array" ? `a lo sumo ${iss.maximum} elementos` : `a lo sumo ${iss.maximum}`;
    case "invalid_format":
      return `formato inválido (${iss.format})`;
    default:
      return undefined;
  }
};

/** Valida un dato leído; cada problema de Zod se anota con su posición. Devuelve el dato validado o null. */
export function validarLeido<T extends z.ZodType>(l: Leido, esquema: T, fallas: string[]): z.infer<T> | null {
  const r = esquema.safeParse(l.dato, { error: enEspanol });
  if (r.success) return r.data;
  for (const i of r.error.issues) {
    // Un campo desconocido apunta a sí mismo, no a su objeto.
    const ruta = i.code === "unrecognized_keys" ? [...i.path, i.keys[0]!] : i.path;
    fallas.push(linea(l, ruta as Ruta, i.message));
  }
  return null;
}
