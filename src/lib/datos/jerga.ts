import { z } from "zod";
import { entero } from "./conocimiento";
import { textoIdioma } from "./esquemas";
import { IDIOMAS, type Idioma } from "@/lib/i18n";

// S9 (F1), S10 (F1): la tabla del detector de jerga (data/convenciones/jerga.yaml; decisions/jargon-detector.md). `cubos` se DERIVA con
// scripts/jerga/derivar.mjs de Google Books Ngram (CC BY 3.0, vía b; atribución en LICENCIA-jerga.md); `permitidas` la escribe una
// persona y son solo nombres propios. No entra a la instantánea.
const porIdioma = <T extends z.ZodType>(t: T) =>
  z.strictObject(Object.fromEntries(IDIOMAS.map((i) => [i, t])) as Record<Idioma, T>);

export const esquemaConvencionesJerga = z
  .strictObject({
    id: z.literal("jerga"),
    /** De dónde sale la tabla y bajo qué licencia, en cada idioma (la cita que el dato exige). */
    fuente: textoIdioma,
    /** La edición de Ngram de que sale la tabla. */
    edicion: z.string().regex(/^\d{8}$/),
    /** SHA-256 de los cubos (scripts/jerga/derivar.mjs --comprobar la recalcula: una edición a mano la rompe). */
    huella: z.string().regex(/^[0-9a-f]{64}$/),
    largo_minimo: entero(1, 20),
    umbral_cubo: entero(1, 9),
    /** Por idioma, una cadena de palabras (separadas por un espacio) por cubo; se abre a {palabra: cubo} al cargar (más rápido que 24 000 claves). */
    cubos: porIdioma(
      z.strictObject({ "1": z.string(), "2": z.string(), "3": z.string(), "4": z.string() }).transform((porCubo) => {
        const abiertos: Record<string, number> = {};
        for (const [cubo, palabras] of Object.entries(porCubo)) for (const w of palabras.split(" ")) if (w) abiertos[w] = Number(cubo);
        return abiertos;
      }),
    ),
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
