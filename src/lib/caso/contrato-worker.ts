import { z } from "zod";

// El contrato de los mensajes del Worker, en Zod (D-S3-08, regla 19): valida en Vitest el fixture que escribe el EMISOR
// real (scripts/nucleo/fixture-simulacion.mjs con `atender`). La UI no lo importa: lee con la guarda de respuesta.ts.

const entero = z.number().int();
const clase = z.enum(["robusta", "moderada", "fragil"]).nullable();

const semilla = z.strictObject({
  semilla: entero,
  estado: z.enum(["completa", "tope-de-intentos"]),
  aceptadas: entero,
  intentos: entero,
  aceptabilidad: z.array(z.array(entero)),
  central: z.array(z.array(entero).nullable()),
  cerca: entero,
  clase,
  zona_gris: z.boolean(),
  semiamplitud_centesimas: entero.nullable(),
});

export const esquemaRespuesta = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("progreso"), id: entero, semilla: entero, indice: entero, semillas: entero, aceptadas: entero, objetivo: entero, intentos: entero }),
  z.strictObject({
    tipo: z.literal("resultado"),
    id: entero,
    resultado: z.strictObject({
      estado: z.enum(["completa", "tope-de-intentos"]),
      plataformas: z.array(z.string()),
      criterios: z.array(z.string()),
      L: entero,
      objetivo: entero,
      ganadora: z.string().nullable(),
      semillas: z.array(semilla),
      clase,
      estable: z.boolean(),
      frontera: z.boolean(),
    }),
  }),
  z.strictObject({ tipo: z.literal("error"), id: entero, mensaje: z.string() }),
]);
