import { z } from "zod";
import { entero } from "./conocimiento";
import { id, textoIdioma } from "./esquemas";

// S9 (F1): la convención del entrevistador (data/convenciones/entrevista.yaml). No entra a la instantánea: las respuestas
// producen un perfil PROPUESTO (origen `entrevista`), y solo el comando de aprobación lo vuelve del caso. Sin modelo.
export const esquemaConvencionesEntrevista = z
  .strictObject({
    id: z.literal("entrevista"),
    introduccion: textoIdioma,
    niveles: z
      .array(z.strictObject({ id, valor: entero(0, 100), texto: textoIdioma }))
      .min(2, "al menos dos niveles"),
    /** Las restricciones de un criterio se conservan si el valor de su respuesta llega a este. */
    conserva_restricciones_desde: entero(0, 100),
    preguntas: z.array(z.strictObject({ id, criterio_id: id, texto: textoIdioma })).min(1, "al menos una pregunta"),
  })
  .superRefine((c, ctx) => {
    const r = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    c.niveles.forEach((n, i) => {
      if (c.niveles.findIndex((x) => x.id === n.id) !== i) r(["niveles", i, "id"], "repetido");
      if (i > 0 && n.valor <= c.niveles[i - 1]!.valor) r(["niveles", i, "valor"], "los niveles van de menor a mayor valor, sin repetir");
    });
    if (!c.niveles.some((n) => n.valor > 0)) r(["niveles"], "al menos un nivel pesa más que 0");
    if (c.conserva_restricciones_desde > Math.max(...c.niveles.map((n) => n.valor))) r(["conserva_restricciones_desde"], "ningún nivel llega a ese valor");
    c.preguntas.forEach((p, i) => {
      if (c.preguntas.findIndex((x) => x.id === p.id) !== i) r(["preguntas", i, "id"], "repetido");
      if (c.preguntas.findIndex((x) => x.criterio_id === p.criterio_id) !== i) r(["preguntas", i, "criterio_id"], "dos preguntas para el mismo criterio");
    });
  });

export type ConvencionesEntrevista = z.infer<typeof esquemaConvencionesEntrevista>;
