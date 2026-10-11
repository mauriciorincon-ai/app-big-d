import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraPeso } from "@/components/caso/Barras";
import { Alerta, Anillo, Aspa, Circulo, Estrella, Ok, Pendiente } from "@/components/caso/Iconos";
import { Meta } from "@/components/Meta";
import { Pestanas } from "@/components/Pestanas";
import { rangoEntero } from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { conocimiento, congeladaDe } from "@/lib/caso/casos";
import { huellaCorta, lista, peso } from "@/lib/caso/formato";
import { pestanasCaso, rutaComparacion } from "@/lib/caso/rutas";
import { esIdioma, textos } from "@/lib/i18n";
import "@/styles/secciones.css";
import "@/styles/caso.css";

// 07 Perfil del caso (maqueta perfil.html; D-S3-12): pesos y rangos con su origen, restricciones eliminatorias, las
// decisiones implícitas (la opción elegida con un anillo lleno, no con un radio deshabilitado que apenas se ve) y el
// estado del perfil. Solo lectura: el perfil se decide en la parada de DECISIÓN y lo aprueba
// una persona con su comando; nada se edita ni se aprueba desde esta página.
export const dynamicParams = false;

export function generateStaticParams() {
  return conocimiento().casos.map((c) => ({ caso: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/casos/[caso]">): Promise<Metadata> {
  const { idioma, caso } = await params;
  const c = conocimiento().casos.find((x) => x.id === caso);
  if (!esIdioma(idioma) || !c) return {};
  return { title: `${c.nombre[idioma]} · ${textos(idioma).secciones.perfil}` };
}

export default async function Perfil({ params }: PageProps<"/[idioma]/casos/[caso]">) {
  const { idioma, caso: id } = await params;
  const k = conocimiento();
  const caso = k.casos.find((x) => x.id === id);
  if (!esIdioma(idioma) || !caso) notFound();
  const T = textos(idioma);
  const t = T.caso.perfil;
  const base = congeladaDe(k, caso).contenido;
  const nombreCriterio = new Map(base.criterios.map((c) => [c.id, c.nombre[idioma]]));
  const nombrePlataforma = new Map(base.plataformas.map((p) => [p.id, p.nombre[idioma]]));
  const aprobado = caso.estado_aprobacion === "aprobado";
  const sinResponder = caso.decisiones_implicitas.filter((d) => d.respuesta === null).length;
  const suma = caso.criterios.reduce((s, c) => s + c.peso_centesimas, 0);
  const huella = caso.aprobacion ? huellaCorta(caso.aprobacion.huella) : null;

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{caso.nombre[idioma]}</h1>
          <p className="sub">{t.sub}</p>
          {aprobado && caso.aprobacion && huella ? (
            <Meta
              items={[
                <b key="e">
                  <Ok />
                  {t.aprobado}
                </b>,
                caso.aprobacion.fecha,
                <span key="h" className="huella">
                  sha256 <b>{huella.inicio}</b>…{huella.fin}
                </span>,
                t.soloLectura,
              ]}
            />
          ) : (
            <Meta
              items={[
                <b key="e">
                  <Pendiente />
                  {t.borrador}
                </b>,
                plantilla(t.archivo, { id: caso.id }),
                plantilla(t.evaluacion, { fecha: caso.fecha_evaluacion }),
                caso.instantanea ? plantilla(t.instantanea, { version: caso.instantanea }) : t.sinInstantanea,
              ]}
            />
          )}
        </div>
      </div>
      <Pestanas etiqueta={T.secciones.etiqueta} pestanas={pestanasCaso(T.secciones, idioma, caso.id, "perfil")} />

      {aprobado && caso.aprobacion && huella && (
        <div className="veredicto">
          <span className="sello">
            <Ok />
            {t.sello.titulo}
          </span>
          <span className="mono">{plantilla(t.sello.detalle, { fecha: caso.aprobacion.fecha, inicio: huella.inicio, fin: huella.fin })}</span>
          <Link className="boton" href={rutaComparacion(idioma, caso.id)}>
            {t.sello.comparar}
          </Link>
        </div>
      )}

      <section className="seccion" aria-labelledby="pesos-t">
        <h2 id="pesos-t">{t.pesos.titulo}</h2>
        <p className="kit-nota">{t.pesos.nota}</p>
        <div className="suma">
          <span>{t.pesos.suma}</span>
          <span className="mono">{peso(suma, idioma)}</span>
          <span className="campo-aviso">
            <Ok />
            {t.pesos.sumaBien}
          </span>
        </div>
        <ul className="filas pesos-lista">
          {caso.criterios.map((c) => {
            const [lo, hi] = rangoEntero(c.peso_centesimas, c.rango_relativo_pct);
            const nombre = nombreCriterio.get(c.criterio_id) ?? c.criterio_id;
            const origen = c.fijado_por ? plantilla(t.pesos.origen, { quien: c.fijado_por[idioma] }) : c.origen === "propuesto-por-agente" ? t.pesos.origenAgente : t.pesos.origenPersona;
            return (
              <li key={c.criterio_id} data-criterio={c.criterio_id}>
                <span className="peso-nombre">
                  <b>
                    {nombre}
                    {c.esencial && <Estrella titulo={t.pesos.esencial} />}
                  </b>
                  <small>{origen}</small>
                </span>
                <span className="peso-valor">{peso(c.peso_centesimas, idioma)}</span>
                <BarraPeso escala={10_000} rango={[lo, hi]} punto={c.peso_centesimas} alto={10} etiqueta={plantilla(t.pesos.etiquetaBarra, { criterio: nombre, peso: peso(c.peso_centesimas, idioma), lo: peso(lo, idioma), hi: peso(hi, idioma) })} />
                <span className="peso-meta">
                  <span className="mono">{c.rango_relativo_pct ? plantilla(t.pesos.rango, { pct: c.rango_relativo_pct, lo: peso(lo, idioma), hi: peso(hi, idioma) }) : t.pesos.sinRango}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="seccion" aria-labelledby="restr-t">
        <h2 id="restr-t">{t.restricciones.titulo}</h2>
        {caso.restricciones.length ? (
          <ul className="filas restr">
            {caso.restricciones.map((r) => (
              <li key={r.id} data-restriccion={r.id}>
                <span>
                  <b>{r.descripcion[idioma]}</b>
                  {r.fijado_por && <small>{plantilla(t.restricciones.origen, { quien: r.fijado_por[idioma] })}</small>}
                  {r.elimina.map((e) => (
                    <small key={e.plataforma_id}>
                      {nombrePlataforma.get(e.plataforma_id) ?? e.plataforma_id}: {e.razon[idioma]}
                    </small>
                  ))}
                </span>
                {r.elimina.length ? (
                  <span className="insignia insignia-llena insignia-larga">
                    <Aspa s={12} />
                    {plantilla(t.restricciones.elimina, { plataforma: lista(r.elimina.map((e) => nombrePlataforma.get(e.plataforma_id) ?? e.plataforma_id), T.caso.y) })}
                  </span>
                ) : (
                  <span className="insignia insignia-suave">
                    <Ok s={12} />
                    {t.restricciones.todas}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="kit-nota">{t.restricciones.vacio}</p>
        )}
        <p className="kit-nota">{t.restricciones.nota}</p>
      </section>

      <section className="seccion" aria-labelledby="dec-t">
        <h2 id="dec-t">{t.decisiones.titulo}</h2>
        <p className="kit-nota">{t.decisiones.nota}</p>
        <div className="dos">
          {caso.decisiones_implicitas.map((d) => (
            <div key={d.id} className="tarjeta" data-decision={d.id}>
              <h3>{d.pregunta[idioma]}</h3>
              <ul className="opciones">
                {d.opciones.map((o) => (
                  <li key={o.id} className="opcion" data-elegida={d.respuesta === o.id ? "" : undefined}>
                    {d.respuesta === o.id ? <Anillo /> : <Circulo />}
                    <span>
                      {o.texto[idioma]}
                      {d.respuesta === o.id && <span className="solo-lector"> ({t.decisiones.elegida})</span>}
                      {o.nota && <small>{o.nota[idioma]}</small>}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="campo-aviso">
                {d.respuesta === null ? <Alerta /> : <Ok />}
                {d.respuesta === null ? t.decisiones.sinResponder : t.decisiones.respondida}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!aprobado && (
        <div className="kit-fila aprobar-perfil">
          <button type="button" className="boton" disabled>
            {t.aprobar.boton}
          </button>
          <span className="campo-aviso">
            <Alerta />
            {sinResponder ? plural(t.aprobar.faltanDecisiones, sinResponder) : caso.instantanea === null ? t.aprobar.faltaInstantanea : t.aprobar.comando}
          </span>
        </div>
      )}

      <details className="lectura-seccion contexto">
        <summary>{t.contexto}</summary>
        <p>{caso.descripcion[idioma]}</p>
        <dl>
          {caso.contexto.map((c) => (
            <div key={c.elemento.es}>
              <dt>{c.elemento[idioma]}</dt>
              <dd>{c.descripcion[idioma]}</dd>
            </div>
          ))}
        </dl>
      </details>
      <details className="lectura-seccion">
        <summary>{t.requisitos.titulo}</summary>
        <ul className="pros">
          {caso.requisitos.map((r, i) => (
            <li key={i}>
              {r.tipo === "obligatorio" ? <Anillo /> : <Pendiente />}
              <span>
                {r.descripcion[idioma]}
                <small>
                  {r.tipo === "obligatorio" ? t.requisitos.obligatorio : t.requisitos.preferente} · {plantilla(t.requisitos.criterio, { criterio: nombreCriterio.get(r.criterio_id) ?? r.criterio_id })}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </details>

    </>
  );
}
