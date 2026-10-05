import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { evaluar, simular, entradaSimulacion, type Entrada, type Resultado, type ResultadoSimulacion } from "@/engine";
import { cargarConocimiento, type Conocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Caso } from "@/lib/datos/conocimiento";
import { dirDatos } from "@/lib/datos/dir";
import { baseViva, entradaDe, type Congelada } from "@/lib/datos/instantanea";

// El caso en el build (servidor): la base de conocimiento cargada una vez por proceso, la instantánea contra la que se
// evalúa cada caso (o la base viva de un borrador sin instantánea, D-S3-13) y el resultado del núcleo. Las páginas del
// caso solo leen de aquí; el cálculo es el del núcleo, sin nada propio.

let memoria: Conocimiento | undefined;

/** La base y los casos del build, validados una sola vez por proceso (una base que no carga lanza `ErrorDeDatos`). */
export function conocimiento(): Conocimiento {
  return (memoria ??= cargarConocimiento());
}

/**
 * Los ids de los casos, por el nombre de su archivo (el cargador exige que coincida con el id). La barra los lee sin
 * validar la base: así la página de la base puede mostrar sus errores en desarrollo con la barra completa.
 */
export function idsDeCasos(dir = dirDatos()): string[] {
  const d = join(dir, "casos");
  return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".yaml")).map((f) => f.slice(0, -5)).sort() : [];
}

/** La base congelada que evalúa un caso: su instantánea o, si es un borrador sin ella, la base viva. */
export function congeladaDe(k: Conocimiento, caso: Caso): Congelada {
  if (caso.instantanea === null) return baseViva(k);
  const i = k.instantaneas.find((x) => x.version === caso.instantanea);
  if (!i) throw new Error(`el caso ${caso.id} cita la instantánea ${caso.instantanea}, que no está en la base`);
  return i;
}

export interface Evaluacion {
  caso: Caso;
  congelada: Congelada;
  entrada: Entrada;
  resultado: Resultado;
  /** La robustez con los pesos del perfil, calculada en el build (la pantalla la vuelve a correr en el Worker al explorar). */
  simulacion: ResultadoSimulacion | null;
}

export function evaluacionDe(k: Conocimiento, caso: Caso): Evaluacion {
  const congelada = congeladaDe(k, caso);
  const entrada = entradaDe(caso, congelada);
  const resultado = evaluar(entrada);
  const es = resultado.tipo === "evaluado" ? entradaSimulacion(entrada, resultado) : null;
  return { caso, congelada, entrada, resultado, simulacion: es ? simular(es) : null };
}
