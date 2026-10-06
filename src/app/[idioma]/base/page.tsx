import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { MarcaVigencia } from "@/components/atlas/MarcaVigencia";
import { FiltroEvidencias } from "@/components/base/FiltroEvidencias";
import { Alerta, Aspa, Ok } from "@/components/caso/Iconos";
import { MarcoTabla } from "@/components/caso/MarcoTabla";
import { Meta } from "@/components/Meta";
import { Pestanas } from "@/components/Pestanas";
import { diasEntre, estadoVigencia } from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { conocimiento } from "@/lib/caso/casos";
import { entero, huellaCorta, peso } from "@/lib/caso/formato";
import { pestanasConocimiento } from "@/lib/caso/rutas";
import { datos, ErrorDeDatos, fechaDeConsulta, rutaInvestigador } from "@/lib/datos";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Evidencia } from "@/lib/datos/conocimiento";
import { esIdioma, textos, type Idioma } from "@/lib/i18n";
import "@/styles/secciones.css";
import "@/styles/conocimiento.css";

// 06 Base de conocimiento (maqueta base.html; C9–C10, RF-01): las evidencias con su cita y su verificación, los criterios,
// la escala con sus topes por madurez, las convenciones del método (que entran a la huella) y las instantáneas. Una base
// que no carga detiene el build; en desarrollo esta página muestra los errores con el formato del cargador.

export async function generateMetadata({ params }: PageProps<"/[idioma]/base">): Promise<Metadata> {
  const { idioma } = await params;
  if (!esIdioma(idioma)) return {};
  return { title: textos(idioma).base.titulo };
}

function cargar(): { k: Conocimiento } | { fallas: string[] } {
  try {
    return { k: conocimiento() };
  } catch (e) {
    if (process.env.NODE_ENV === "development" && e instanceof ErrorDeDatos) return { fallas: e.fallas };
    throw e;
  }
}

export default async function Base({ params }: PageProps<"/[idioma]/base">) {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  const T = textos(idioma);
  const t = T.base;
  const pestanas = <Pestanas etiqueta={T.secciones.etiqueta} pestanas={pestanasConocimiento(T.secciones, idioma, rutaInvestigador(datos(), idioma), "base")} />;
  const cargada = cargar();
  if ("fallas" in cargada)
    return (
      <>
        <Encabezado t={t} meta={[<b key="e"><Aspa />{plural(t.noCarga, cargada.fallas.length)}</b>]} />
        {pestanas}
        <div className="estado estado-error" role="alert">
          <b>{t.error.titulo}</b>
          <p>{t.error.formato}</p>
          <ul className="error-lista">
            {cargada.fallas.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <section className="seccion" aria-labelledby="err-t">
          <h2 id="err-t">{t.error.consecuencias}</h2>
          <ul className="pros">
            <li>
              <Alerta />
              <span>{t.error.ninguna}</span>
            </li>
            <li>
              <Alerta />
              <span>{t.error.ci}</span>
            </li>
          </ul>
        </section>
      </>
    );

  const { k } = cargada;
  const fecha = fechaDeConsulta();
  const ultima = k.instantaneas.at(-1);
  const h = ultima ? huellaCorta(ultima.huella) : null;
  const nombreP = new Map(k.plataformas.map((p) => [p.id, p.nombre[idioma]]));
  const nombreC = new Map(k.criterios.map((c) => [c.id, c.nombre[idioma]]));
  const nombreCap = new Map(k.capacidades.map((c) => [c.id, c.nombre[idioma]]));
  const criterioDe = (e: Evidencia) => (e.criterio_id ? e.criterio_id : (k.criterios.find((c) => c.capacidad_id === e.capacidad_id)?.id ?? e.capacidad_id!));
  const madurez = new Map(k.gramatica.escala_madurez.map((m) => [m.id, m.nombre[idioma]]));
  const escala = k.escalas[0]!;
  const max = escala.niveles.at(-1)!.valor;
  const conv = k.convenciones;
  const evidencias = k.evidencias.filter((e) => e.estado_aprobacion !== "rechazada");
  const aprobadas = evidencias.filter((e) => e.estado_aprobacion === "aprobada").length;

  return (
    <>
      <Encabezado
        t={t}
        meta={[
          <b key="e">
            <Ok />
            {t.cargada}
          </b>,
          ultima ? plantilla(t.instantanea, { version: ultima.version }) : t.sinInstantanea,
          ...(h
            ? [
                <span key="h" className="huella">
                  sha256 <b>{h.inicio}</b>…{h.fin}
                </span>,
              ]
            : []),
        ]}
      />
      {pestanas}

      <section className="seccion" aria-labelledby="ev-t">
        <h2 id="ev-t">{t.evidencias.titulo}</h2>
        <p className="kit-nota">{t.evidencias.nota}</p>
        <p className="conteo">
          <span>{plural(t.evidencias.aprobadas, aprobadas)}</span>
          <span>{plural(t.evidencias.propuestas, evidencias.length - aprobadas)}</span>
          <span>{plural(t.evidencias.plataformas, k.plataformas.length)}</span>
          <span>{plural(t.evidencias.criterios, k.criterios.length)}</span>
        </p>
        {evidencias.length === 0 ? (
          <div className="estado" data-estado="sin-evidencias">
            <h2>{t.evidencias.vacio.titulo}</h2>
            <p>{t.evidencias.vacio.texto}</p>
          </div>
        ) : (
          <FiltroEvidencias
            t={t.evidencias}
            plataformas={k.plataformas.map((p) => [p.id, p.nombre[idioma]])}
            criterios={k.criterios.map((c) => [c.id, c.nombre[idioma]])}
            items={evidencias.map((e) => ({ plataforma: e.plataforma_id, criterio: criterioDe(e), estado: e.estado_aprobacion }))}
          >
            {evidencias.map((e) => (
              <TarjetaEvidencia key={e.id} e={e} idioma={idioma} t={t.evidencias} vig={T.caso.vigencia} fecha={fecha} umbrales={conv.vigencia} max={max} plataforma={nombreP.get(e.plataforma_id) ?? e.plataforma_id} criterio={nombreC.get(criterioDe(e)) ?? criterioDe(e)} madurez={madurez.get(e.madurez) ?? e.madurez} />
            ))}
          </FiltroEvidencias>
        )}
        <p className="kit-nota">{t.evidencias.ficticias}</p>
      </section>

      <section className="seccion" aria-labelledby="crit-t">
        <h2 id="crit-t">{t.criterios.titulo}</h2>
        <p className="kit-nota">{t.criterios.nota}</p>
        <ul className="filas criterios">
          {k.criterios.map((c) => (
            <li key={c.id} data-criterio={c.id}>
              <span>
                <b>{c.nombre[idioma]}</b>
                <small>{c.capacidad_id ? plantilla(t.criterios.capacidad, { capacidad: nombreCap.get(c.capacidad_id) ?? c.capacidad_id }) : t.criterios.transversal}</small>
              </span>
              <span>{c.que_evalua[idioma]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="seccion" aria-labelledby="esc-t">
        <h2 id="esc-t">{t.escala.titulo}</h2>
        <p className="kit-nota">{t.escala.nota}</p>
        <ul className="filas niveles-escala">
          {escala.niveles.map((n) => (
            <li key={n.valor}>
              <span className="n">{n.valor}</span>
              <span>
                <b>{n.nombre[idioma]}</b>
                <small>{n.descripcion[idioma]}</small>
              </span>
            </li>
          ))}
        </ul>
        <MarcoTabla etiqueta={t.escala.titulo}>
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">{t.escala.madurez}</th>
                <th scope="col">{t.escala.tope}</th>
                <th scope="col">{t.escala.topeVistaPrevia}</th>
              </tr>
            </thead>
            <tbody>
              {escala.tope_por_madurez.map((x) => (
                <tr key={x.madurez}>
                  <th scope="row">{madurez.get(x.madurez) ?? x.madurez}</th>
                  <td className="mono">{x.tope === max ? t.escala.sinTope : `${x.tope}/${max}`}</td>
                  <td className="mono">{x.tope_aceptando_vista_previa === max ? t.escala.sinTope : `${x.tope_aceptando_vista_previa}/${max}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </MarcoTabla>
      </section>

      <section className="seccion" aria-labelledby="conv-t">
        <h2 id="conv-t">{t.convenciones.titulo}</h2>
        <p className="kit-nota">{t.convenciones.nota}</p>
        <ul className="pros">
          {[
            plantilla(t.convenciones.empate, { puntos: peso(conv.umbral_empate_centesimas, idioma) }),
            plantilla(t.convenciones.robustez, { robusta: conv.robustez.robusta_pct, fragil: conv.robustez.fragil_pct }),
            plantilla(t.convenciones.vigencia, { revisar: conv.vigencia.revisar_dias, vencido: conv.vigencia.vencido_dias }),
            plantilla(t.convenciones.prosContras, { destaca: conv.pros_contras.ancla_destaca, corta: conv.pros_contras.ancla_corta, max, n: conv.pros_contras.max_por_lista }),
            plantilla(t.convenciones.sensibilidad, { paso: peso(conv.sensibilidad.paso_centesimas, idioma) }),
            plantilla(t.convenciones.simulacion, { semilla: conv.simulacion.semilla, n: conv.simulacion.semillas_estabilidad.length, aceptadas: entero(conv.simulacion.aceptadas, idioma), tope: entero(conv.simulacion.tope_intentos, idioma), z: peso(conv.simulacion.z_centesimas, idioma) }),
          ].map((x) => (
            <li key={x}>
              <Ok />
              <span>{x}</span>
            </li>
          ))}
        </ul>
        <p className="kit-nota">{conv.declaracion[idioma]}</p>
      </section>

      <section className="seccion" aria-labelledby="inst-t">
        <h2 id="inst-t">{t.instantaneas.titulo}</h2>
        <p className="kit-nota">{t.instantaneas.nota}</p>
        {k.instantaneas.length === 0 ? (
          <p className="kit-nota" data-estado="sin-instantaneas">
            {t.instantaneas.vacio}
          </p>
        ) : (
          <MarcoTabla etiqueta={t.instantaneas.titulo}>
            <table className="tabla">
              <thead>
                <tr>
                  <th scope="col">{t.instantaneas.version}</th>
                  <th scope="col">{t.instantaneas.huella}</th>
                  <th scope="col">{t.instantaneas.evidencias}</th>
                  <th scope="col">{t.instantaneas.plataformas}</th>
                  <th scope="col">{t.instantaneas.cambios}</th>
                </tr>
              </thead>
              <tbody>
                {[...k.instantaneas].reverse().map((i, n) => {
                  const hc = huellaCorta(i.huella);
                  const cuenta = (tipo: "nueva" | "modificada" | "retirada") => i.cambios.filter((c) => c.tipo === tipo).length;
                  const cambios = (["nueva", "modificada", "retirada"] as const).filter((x) => cuenta(x)).map((x) => plantilla(t.instantaneas.cambio[x], { n: cuenta(x) }));
                  return (
                    <tr key={i.version}>
                      <td className="mono">
                        {i.version}
                        {n === 0 && <span className="insignia insignia-suave">{t.instantaneas.vigente}</span>}
                      </td>
                      <td>
                        <span className="huella">
                          sha256 <b>{hc.inicio}</b>…{hc.fin}
                        </span>
                      </td>
                      <td className="mono">{i.contenido.evidencias.length}</td>
                      <td className="mono">{i.contenido.plataformas.length}</td>
                      <td className="mono">{cambios.length ? cambios.join(" · ") : t.instantaneas.ninguno}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </MarcoTabla>
        )}
      </section>
    </>
  );
}

function Encabezado({ t, meta }: { t: ReturnType<typeof textos>["base"]; meta: ReactNode[] }) {
  return (
    <div className="encabezado">
      <div>
        <span className="ojo">{t.ojo}</span>
        <h1>{t.titulo}</h1>
        <p className="sub">{t.sub}</p>
        <Meta items={meta} />
      </div>
    </div>
  );
}

function TarjetaEvidencia({ e, idioma, t, vig, fecha, umbrales, max, plataforma, criterio, madurez }: { e: Evidencia; idioma: Idioma; t: ReturnType<typeof textos>["base"]["evidencias"]; vig: ReturnType<typeof textos>["caso"]["vigencia"]; fecha: string; umbrales: { revisar_dias: number; vencido_dias: number }; max: number; plataforma: string; criterio: string; madurez: string }) {
  const dias = diasEntre(e.fecha_verificacion, fecha);
  const estado = estadoVigencia(dias, umbrales);
  const marca = estado === "vencida" ? "vencido" : estado === "por-revisar" ? "revisar" : "vigente";
  const f = e.fuentes[0]!;
  return (
    <article className={`evidencia${e.estado_aprobacion === "propuesta" ? " evidencia-propuesta" : ""}`} data-evidencia={e.id}>
      <header>
        <span className="cod">{e.id}</span>
        <span className={`semaforo semaforo-${marca}`}>
          <MarcaVigencia estado={marca} />
          {estado === "vencida" ? vig.vencido : estado === "por-revisar" ? vig.revisar : vig.vigente} · {plantilla(t.dias, { n: dias })}
        </span>
        <span className="evidencia-estado">{t.estado[e.estado_aprobacion]}</span>
      </header>
      <p className="conteo">
        <span>{plataforma}</span>
        <span>{criterio}</span>
        <span>{plantilla(t.puntaje, { p: e.puntaje, max })}</span>
      </p>
      <p className="evidencia-afirma">{e.afirmacion[idioma]}</p>
      <blockquote className={`evidencia-cita${f.verificacion.resultado === "verificada" ? "" : " evidencia-no-verificada"}`}>«{f.cita}»</blockquote>
      <dl className="evidencia-meta">
        <div>
          <dt>{t.fuente}</dt>
          <dd>
            <a href={f.url}>{f.titulo}</a>
            <span className="mono">
              {t.tipoFuente[f.tipo]}
              {f.fecha_publicacion ? ` · ${f.fecha_publicacion}` : ""}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.madurez}</dt>
          <dd>{madurez}</dd>
        </div>
        <div>
          <dt>{plantilla(t.porQue, { p: e.puntaje })}</dt>
          <dd>{e.justificacion_puntaje[idioma]}</dd>
        </div>
        <div>
          <dt>{t.conflicto}</dt>
          <dd>{t.conflictos[f.conflicto_de_interes]}</dd>
        </div>
        <div>
          <dt>{t.verificacion}</dt>
          <dd className="mono">{f.verificacion.resultado === "verificada" ? plantilla(t.verificada, { http: f.verificacion.http ?? "—", fecha: f.verificacion.fecha, sha: (f.verificacion.sha256 ?? "").slice(0, 4) }) : plantilla(t.noVerificable, { fecha: f.verificacion.fecha })}</dd>
        </div>
      </dl>
    </article>
  );
}
