import { z } from "zod";
import { IDIOMAS, type Idioma } from "@/lib/i18n";

// Esquemas del dato de la app (la regla «el conocimiento es dato»: Zod es la fuente del esquema). Los mapas
// y las gramáticas NO se describen aquí: los valida el diagramador con los esquemas de su contrato.
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id en minúsculas con guiones");

/** Un texto por idioma de la interfaz, todos presentes y ninguno vacío (redactados, no traducidos). */
const textoIdioma = z.strictObject(Object.fromEntries(IDIOMAS.map((i) => [i, z.string().trim().min(1)])) as Record<Idioma, z.ZodString>);

export const esquemaPlataforma = z.strictObject({
  id,
  nombre: textoIdioma,
  /** publicada: tiene mapa aprobado en data/mapas/<id>.mapa.yaml · proximamente: todavía no, y no lo tiene. */
  estado: z.enum(["publicada", "proximamente"]),
  /** Ficticia: sus componentes no describen un producto real (la Plataforma Ejemplo). */
  ficticia: z.boolean(),
});

export type Plataforma = z.infer<typeof esquemaPlataforma>;
