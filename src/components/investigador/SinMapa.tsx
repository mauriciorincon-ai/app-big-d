import { plantilla } from "@/lib/atlas";
import { textos, type Idioma } from "@/lib/i18n";
import { urlSolicitud } from "@/lib/investigador/solicitud";
import { Solicitar } from "./Solicitar";

/**
 * El estado vacío de una plataforma que todavía no tiene mapa (A-27): dice que su mapa llega con una investigación
 * y deja el botón que la pide como tarea de GitHub ya escrita.
 */
export function SinMapa({ idioma, plataforma }: { idioma: Idioma; plataforma: { id: string; nombre: string } }) {
  const t = textos(idioma).investigador;
  return (
    <section className="seccion" aria-labelledby="vacio-t">
      <div className="estado">
        <h2 id="vacio-t">{plantilla(t.vacio.titulo, { plataforma: plataforma.nombre })}</h2>
        <p>{t.vacio.texto}</p>
        <Solicitar href={urlSolicitud(t.solicitud, plataforma)} texto={t.solicitud.boton} nota={t.solicitud.nota} />
      </div>
    </section>
  );
}
