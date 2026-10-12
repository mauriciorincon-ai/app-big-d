import { z } from "zod";
import { entero, fecha } from "./conocimiento";
import { id, textoIdioma } from "./esquemas";
import { IDIOMAS, type Idioma } from "@/lib/i18n";

// Las convenciones del informe (S6, C19–C20; especificación § 6.11 y § 12, E-13): lo que el informe usa y no sale de la
// evidencia ni del caso. Viven en su propio archivo, data/convenciones/informe.yaml, y NO entran a la instantánea: no
// puntúan, así que no cambian la huella de lo congelado. Sí entran a la huella de entradas de la ficha de reproducibilidad.
//   · `lectura`: el presupuesto del resumen para quien decide (E-13), como dato y no como constante del código.
//   · `categorias`: la categoría de alistamiento (§ 6.11) de cada capacidad y criterio de la base.
//   · `glosario`: los términos del método que el informe explica, redactados en cada idioma, con las formas con que
//     aparecen en el texto (el detector de lectura cuenta una palabra completa, no una raíz).

/** Las siete categorías de alistamiento de § 6.11. */
export const CATEGORIAS = [
  "identidad_y_acceso",
  "red_y_seguridad",
  "gobierno",
  "datos",
  "habilidades",
  "presupuesto_y_contratos",
  "operacion",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

const formas = z.strictObject(
  Object.fromEntries(
    IDIOMAS.map((i) => [
      i,
      z.array(z.string().trim().min(1)).min(1, "al menos una forma"),
    ]),
  ) as Record<Idioma, z.ZodArray<z.ZodString>>,
);

export const esquemaConvencionesInforme = z
  .strictObject({
    id: z.literal("informe"),
    /** E-13: el resumen se lee en voz alta en menos de 20 s: hasta `palabras_max` palabras o hasta `silabas_max` sílabas, y hasta `terminos_max` términos a explicar. */
    lectura: z.strictObject({
      palabras_max: entero(1, 500),
      silabas_max: entero(1, 2_000),
      terminos_max: entero(0, 10),
    }),
    /** Capacidad o criterio de la base → categoría de alistamiento de los ítems que nacen de sus decisiones. */
    categorias: z
      .record(id, z.enum(CATEGORIAS))
      .refine((c) => Object.keys(c).length > 0, "al menos una categoría"),
    glosario: z.array(
      z.strictObject({
        id,
        termino: textoIdioma,
        formas,
        explicacion: textoIdioma,
      }),
    ),
  })
  .superRefine((c, ctx) => {
    const r = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    c.glosario.forEach((g, i) => {
      if (c.glosario.findIndex((x) => x.id === g.id) !== i)
        r(["glosario", i, "id"], "repetido");
      for (const idioma of IDIOMAS)
        if (!g.formas[idioma].includes(g.termino[idioma]))
          r(
            ["glosario", i, "formas", idioma],
            `incluye el propio término «${g.termino[idioma]}»`,
          );
    });
  });

export type ConvencionesInforme = z.infer<typeof esquemaConvencionesInforme>;

/**
 * El relato de fracaso que escribe el comité del caso ANTES del análisis (pre-mortem, E-9): data/casos/<caso>/relato-de-fracaso.yaml,
 * opcional. La herramienta lo guarda y lo muestra al lado del relato generado por plantilla; jamás lo redacta.
 */
export const esquemaRelatoDeFracaso = z.strictObject({
  caso_id: id,
  texto: textoIdioma,
  escrito_por: z.string().trim().min(1, "quién lo escribió"),
  fecha,
  origen: z.literal("declarado-por-usuario"),
});

export type RelatoDeFracaso = z.infer<typeof esquemaRelatoDeFracaso>;
