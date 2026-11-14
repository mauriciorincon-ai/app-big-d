import { z } from "zod";

// S10 (F2): el contrato de los mensajes del Worker de la demo, en Zod (regla 19). Valida en Vitest el fixture que escribe el
// EMISOR real (scripts/demo/fixture-worker.mjs con `atenderDemo`). La página no lo importa: lee con `esRespuesta`.

const entero = z.number().int();
const id = z.string().min(1);

export const esquemaRespuestaDemo = z.discriminatedUnion("tipo", [
  z.strictObject({
    tipo: z.literal("evaluado"),
    id: entero,
    huella: z.string().regex(/^[0-9a-f]{64}$/),
    recibido: z.array(id),
    max: entero,
    filas: z.array(z.strictObject({ plataforma_id: id, posicion: entero, unidades: entero })),
    veredicto: z.discriminatedUnion("tipo", [
      z.strictObject({ tipo: z.literal("unica"), plataforma_id: id }),
      z.strictObject({ tipo: z.literal("ganadora-clara"), plataforma_id: id, brecha_unidades: entero }),
      z.strictObject({ tipo: z.literal("empate-tecnico"), plataformas: z.array(id), brecha_unidades: entero }),
    ]),
  }),
  z.strictObject({ tipo: z.literal("no-evaluable"), id: entero, motivos: z.array(z.string()) }),
  z.strictObject({ tipo: z.literal("error"), id: entero, mensaje: z.string() }),
]);
