import { z } from "zod";
import { entero } from "./conocimiento";
import { textoIdioma } from "./esquemas";
import { IDIOMAS, type Idioma } from "@/lib/i18n";

// S9 (F1): la tabla del detector de jerga (data/convenciones/jerga.yaml; decisions/jargon-detector.md). `cubos` se DERIVA con
// scripts/jerga/derivar.mjs de textos del propio proyecto (vía d: ninguna lista externa entra al repo sin licencia compatible);
// `permitidas` la escribe una persona. No entra a la instantánea.
const porIdioma = <T extends z.ZodType>(t: T) =>
  z.strictObject(Object.fromEntries(IDIOMAS.map((i) => [i, t])) as Record<Idioma, T>);

export const esquemaConvencionesJerga = z
  .strictObject({
    id: z.literal("jerga"),
    /** De dónde sale la tabla y bajo qué licencia, en cada idioma (la cita que el dato exige). */
    fuente: textoIdioma,
    largo_minimo: entero(1, 20),
    umbral_cubo: entero(1, 9),
    cubos: porIdioma(z.record(z.string().min(1), entero(1, 9))),
    permitidas: porIdioma(z.array(z.string().trim().min(1))),
  })
  .superRefine((c, ctx) => {
    for (const idioma of IDIOMAS) {
      for (const [palabra, cubo] of Object.entries(c.cubos[idioma]))
        if (cubo > c.umbral_cubo) ctx.addIssue({ code: "custom", path: ["cubos", idioma, palabra], message: "la tabla solo guarda cubos hasta el umbral" });
      const p = c.permitidas[idioma];
      if (new Set(p.map((x) => x.toLowerCase())).size !== p.length) ctx.addIssue({ code: "custom", path: ["permitidas", idioma], message: "una permitida aparece dos veces" });
    }
  });

export type ConvencionesJerga = z.infer<typeof esquemaConvencionesJerga>;
