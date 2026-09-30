import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampoPlataforma } from "@/components/atlas/CampoPlataforma";
import { MarcaVigencia } from "@/components/atlas/MarcaVigencia";
import { Comando } from "@/components/investigador/Copiar";
import { RevisionPropuesta } from "@/components/investigador/RevisionPropuesta";
import { plantilla, plural } from "@/lib/atlas";
import { datos, fechaDeConsulta } from "@/lib/datos";
import { esIdioma, textos } from "@/lib/i18n";
import { conteo, vistaInvestigador } from "@/lib/investigador/revision";
// Estilos solo de esta pantalla: no bloquean el pintado del atlas.
import "@/styles/investigador.css";

// Conocimiento · investigador de una plataforma (fiel a docs/diseno/investigador.html): la vigencia de cada
// capa con el comando exacto para investigarla, o el estado vacío si la plataforma aún no tiene mapa (A-27);
// la propuesta pendiente con su verificación y la revisión afirmación por afirmación, que arma el comando de
// aprobación (lo corre una persona); y el veredicto de la última revisión. Una página estática por
// plataforma: nada se aprueba ni se investiga desde aquí.
export const dynamicParams = false;

export function generateStaticParams() {
  return datos().plataformas.map((p) => ({ plataforma: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/investigador/[plataforma]">): Promise<Metadata> {
  const { idioma, plataforma } = await params;
  const p = datos().plataformas.find((x) => x.id === plataforma);
  if (!esIdioma(idioma) || !p) return {};
  return { title: `${p.nombre[idioma]} · ${textos(idioma).investigador.titulo}` };
}

export default async function Investigador({ params }: PageProps<"/[idioma]/investigador/[plataforma]">) {
  const { idioma, plataforma } = await params;
  const d = datos();
  if (!esIdioma(idioma) || !d.plataformas.some((p) => p.id === plataforma)) notFound();
  const t = textos(idioma).investigador;
  const fecha = fechaDeConsulta();
  const v = vistaInvestigador(d, plataforma, idioma, fecha);
  const nombre = v.plataforma.nombre[idioma];
  const gramatica = [...d.atlas.values()][0]?.gramatica;
  const ultima = v.revisiones.at(-1);
  const punto = (
    <span className="punto" aria-hidden="true">
      ·
    </span>
  );
  const p = v.propuesta;

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{nombre}</h1>
          <p className="sub">{t.sub}</p>
          <p className="meta">
            <span>{v.mapa ? plantilla(t.mapaAprobado, { version: v.mapa.version }) : t.sinMapa}</span>
            {punto}
            <span>{plantilla(textos(idioma).atlas.consultado, { fecha })}</span>
            {punto}
            <span>{plural(t.historial, v.revisiones.length)}</span>
          </p>
        </div>
        <CampoPlataforma
          opciones={d.plataformas.map((x) => ({ id: x.id, nombre: x.nombre[idioma], ruta: `/${idioma}/investigador/${x.id}` }))}
          actual={plataforma}
          etiqueta={textos(idioma).atlas.plataforma.etiqueta}
          pronto={textos(idioma).atlas.plataforma.pronto}
          nota={textos(idioma).atlas.plataforma.notaInvestigador}
        />
      </div>
      <ul className="niveles" aria-label={t.secciones.etiqueta}>
        <li>
          <Link href={`/${idioma}/investigador/${plataforma}`} aria-current="page">
            <span className="n">05</span>
            {t.secciones.investigador}
          </Link>
        </li>
        <li>
          <span className="pend">
            <span className="n">06</span>
            {t.secciones.base}
          </span>
        </li>
      </ul>

      {v.bandas ? (
        <section className="seccion" aria-labelledby="vig-t">
          <h2 id="vig-t">{t.vigencia.titulo}</h2>
          {gramatica && <p className="kit-nota">{plantilla(t.vigencia.nota, { revisar: gramatica.vigencia.umbral_revisar_dias, vencido: gramatica.vigencia.umbral_vencido_dias })}</p>}
          <ul className="filas sem-lista">
            {v.bandas.map((b) => (
              <li key={b.id} data-vencido={b.estado === "vencido" ? "" : undefined} data-banda={b.id}>
                <span className="n">{b.numero}</span>
                <span className="sem-banda">
                  {b.nombre}
                  <small>
                    {plural(t.vigencia.componentes, b.componentes)} · {plural(t.vigencia.verificado, b.dias)}
                  </small>
                </span>
                <span className={`semaforo semaforo-${b.estado}`}>
                  <MarcaVigencia estado={b.estado} />
                  {t.vigencia.estados[b.estado]} · {plural(t.vigencia.dias, b.dias)}
                </span>
                {b.estado !== "vigente" && <Comando texto={`/investigar ${plataforma} ${b.id}`} copiar={t.comando.copiar} copiado={t.comando.copiado} nota={t.comando.nota} />}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="seccion" aria-labelledby="vacio-t">
          <div className="estado">
            <h2 id="vacio-t">{plantilla(t.vacio.titulo, { plataforma: nombre })}</h2>
            <p>{t.vacio.texto}</p>
            <Comando texto={`/investigar ${plataforma}`} copiar={t.comando.copiar} copiado={t.comando.copiado} nota={t.comando.nota} />
          </div>
        </section>
      )}

      {ultima && (
        <div className="veredicto">
          <b>
            <MarcaVigencia estado="vigente" />
            {ultima.resultado === "aprobada" ? t.veredicto.aprobada : t.veredicto.sinNovedades}
          </b>
          <span className="mono">{plantilla(t.veredicto.detalle, { fecha: ultima.fecha, a: ultima.aprobadas.length, r: ultima.rechazadas.length, version: ultima.mapa_version })}</span>
          <span className="huella">{ultima.propuesta}</span>
        </div>
      )}

      {p && (
        <section className="seccion" aria-labelledby="prop-t">
          <h2 id="prop-t">{p.capa ? plantilla(t.propuesta.tituloCapa, { capa: p.capa }) : t.propuesta.titulo}</h2>
          <p className="kit-nota">{t.propuesta.nota}</p>
          <div className="tarjeta">
            <p className="ojo">{t.propuesta.corrida}</p>
            <p className="huella">
              <b>{p.carpeta}</b>
            </p>
            <p className="meta">
              <span>{p.fecha}</span>
              {punto}
              <span>{plantilla(t.propuesta.modelo, { modelo: p.modelo })}</span>
              {punto}
              <span>{plural(t.propuesta.reintentos, p.reintentos)}</span>
              {punto}
              <span>{plural(t.propuesta.fuentes, p.fuentes)}</span>
              {p.fechaVerificacion && (
                <>
                  {punto}
                  <span>{plantilla(t.propuesta.verificadaEl, { fecha: p.fechaVerificacion })}</span>
                </>
              )}
            </p>
          </div>
          <p className="conteo">
            <span>{p.diff.primera ? plantilla(t.propuesta.primera, { n: p.diff.nuevos }) : plantilla(t.propuesta.diff, { nuevos: p.diff.nuevos, renombrados: p.diff.renombrados, retirados: p.diff.retirados, madurez: p.diff.madurez })}</span>
            {p.afirmaciones.length > 0 && <span>{conteo(p.afirmaciones, t)}</span>}
          </p>
          {p.fallas.length > 0 ? (
            <div className="estado estado-error">
              <p>{t.propuesta.invalida}</p>
              <ul className="error-lista">
                {p.fallas.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : !p.verificada ? (
            <div className="estado">
              <p>{t.propuesta.sinVerificar}</p>
            </div>
          ) : (
            <RevisionPropuesta carpeta={p.carpeta} afirmaciones={p.afirmaciones} retiros={p.retiros} t={t} />
          )}
          {p.preguntas.length > 0 && (
            <div className="tarjeta preguntas">
              <h3>{t.propuesta.preguntas}</h3>
              <ul>
                {p.preguntas.map((q) => (
                  <li key={q.pregunta}>
                    {q.pregunta} <small>{q.respondida ? t.propuesta.respondida : t.propuesta.sinFuente}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
