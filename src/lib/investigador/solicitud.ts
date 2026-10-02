import { plantilla } from "@/lib/atlas/plantilla";
import type { Textos } from "@/lib/i18n";

// Solicitud de investigación (decisión de la persona, 2026-09-30): la pantalla no corre la investigación ni
// explica cómo se corre; su botón abre una tarea nueva en el repositorio de Big-D en GitHub, ya escrita. Al
// confirmarla queda guardada, con su fecha, hasta que una persona la atienda (la regla «jamás corre sola» sigue
// intacta). Sin servidor y sin red desde la app: es un enlace. Cómo atenderla va en el cuerpo de la tarea.

/** El repositorio de este clon; `tests/unit/investigador/solicitud.test.ts` lo compara con `origin`. */
export const REPOSITORIO = "mauriciorincon-ai/app-big-d";
/** Etiqueta de la tarea: así se listan las solicitudes pendientes. */
export const ETIQUETA_SOLICITUD = "investigacion";

type Nombrado = { id: string; nombre: string };

export function urlSolicitud(t: Textos["investigador"]["solicitud"], plataforma: Nombrado, capa?: Nombrado): string {
  const comando = `/investigar ${plataforma.id}${capa ? ` ${capa.id}` : ""}`;
  const v = { plataforma: plataforma.nombre, capa: capa?.nombre ?? "" };
  const q = new URLSearchParams({
    title: plantilla(capa ? t.tituloCapa : t.titulo, v),
    body: plantilla(t.cuerpo, { alcance: plantilla(capa ? t.alcanceCapa : t.alcance, v), comando }),
    labels: ETIQUETA_SOLICITUD,
  });
  return `https://github.com/${REPOSITORIO}/issues/new?${q}`;
}
