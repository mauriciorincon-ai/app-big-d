import type { ReactNode } from "react";
import { MarcoTabla } from "@/components/caso/MarcoTabla";
import { Alerta, Aspa } from "@/components/caso/Iconos";
import type {
  AlertaEvidencia,
  Racional,
  Resultado,
  ResultadoSimulacion,
} from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import {
  brecha,
  entero,
  lista,
  peso,
  porcentaje,
  semiamplitud,
} from "@/lib/caso/formato";
import type { Caso } from "@/lib/datos/conocimiento";
import type { RelatoDeFracaso } from "@/lib/datos/informe";
import type { Plan } from "@/lib/datos/plan";
import type { Idioma, Textos } from "@/lib/i18n";
import type { Informe } from "@/lib/informe/construir";
import { textoDeAlerta, type NombresInforme } from "@/lib/informe/narrativa";

type T = Textos["caso"]["informe"];
type TD = Textos["caso"]["decisiones"];
type TC = Textos["caso"]["comparacion"];
type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;

// Las secciones del informe de 14 que no son un componente ya hecho de la comparación o de las decisiones (S6, § 12): la
// cabecera de sección, el resumen, el caso, la robustez estática, la estructura de decisiones, las implícitas, el relato, las
// alertas de evidencia y la ficha. Todo texto llega de las plantillas del idioma; aquí solo se compone.

export function Sec({
  id,
  n,
  titulo,
  children,
}: {
  id: string;
  n: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      className="inf-sec"
      id={`sec-${id}`}
      aria-labelledby={`sec-${id}-t`}
    >
      <h2 id={`sec-${id}-t`}>
        <span className="mono">{String(n).padStart(2, "0")}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Resumen({
  parrafo,
  lectura,
  informe,
  nombres,
  glosario,
  nombreRiesgo,
  prioridad,
  motivoTexto,
  y,
  tc,
  idioma,
  t,
}: {
  parrafo: string;
  lectura: {
    palabras: number;
    silabas: number;
    terminos: string[];
    cumple: boolean;
  };
  informe: Informe;
  nombres: NombresInforme;
  /** Los términos del resumen que el glosario explica, con su explicación. */
  glosario: { id: string; termino: string; explicacion: string }[];
  nombreRiesgo: Record<string, string>;
  prioridad: Record<string, string>;
  /** Por qué la comparación no puntúa, si no puntúa. */
  motivoTexto: string;
  /** El conector de las listas del idioma («y» / «and»). */
  y: string;
  tc: TC;
  idioma: Idioma;
  t: T;
}) {
  const r = informe.modelo.resumen;
  const v = r.veredicto;
  const nom = (id: string) => nombres.plataforma[id] ?? id;
  const rec = t.resumen.recomendacion;
  const rb = r.robustez;
  const riesgo = (id: string) => {
    const x = informe.resultadoPlan.riesgos.find((r) => r.id === id);
    if (!x) throw new Error(`informe · resumen · el riesgo «${id}» no está en el plan calculado`);
    return x;
  };
  return (
    <>
      <p className="inf-lider">{parrafo}</p>
      <p className="inf-presupuesto mono">
        {plantilla(t.resumen.lectura, {
          palabras: entero(lectura.palabras, idioma),
          silabas: entero(lectura.silabas, idioma),
          terminos: plural(t.resumen.terminos, lectura.terminos.length),
        })}{" "}
        · {lectura.cumple ? t.resumen.dentro : t.resumen.fuera}
      </p>
      {glosario.map((g) => (
        <p key={g.id} className="kit-nota">
          <b>
            {t.resumen.queSignifica}: «{g.termino}».
          </b>{" "}
          {g.explicacion}
        </p>
      ))}
      <h3>{rec.titulo}</h3>
      <p>
        {v.tipo === "ganadora" && v.segunda === null
          ? // S6-M1: una sola plataforma en pie no «gana con ventaja»: no hay otra contra la que medirla.
            plantilla(rec.unica, { plataforma: nom(v.plataforma_id) })
          : v.tipo === "ganadora"
          ? plantilla(rec.ganadora, {
              plataforma: nom(v.plataforma_id),
              brecha: brecha(v.brecha_unidades, r.escala_max, idioma),
            })
          : v.tipo === "empate-tecnico"
            ? plantilla(rec.empate, {
                plataformas: lista(v.plataformas.map(nom), y),
                brecha: brecha(v.brecha_unidades, r.escala_max, idioma),
              })
            : plantilla(rec.sin, { motivo: motivoTexto })}
      </p>
      {rb && rb.clase && (
        <p>
          {plantilla(rec.robustez, {
            clase: tc.robustez.clase[rb.clase],
            plataforma: nom(rb.ganadora),
            pct: porcentaje(rb.primera_unidades, rb.total_unidades, idioma),
            K: entero(rb.aceptadas, idioma),
          })}
        </p>
      )}
      <h3>{t.resumen.unaVia}</h3>
      {r.una_via.length ? (
        <ol className="inf-lista">
          {r.una_via.map((id) => (
            <li key={id}>
              <a href={`#d-${id}`}>{nombres.decision[id] ?? id}</a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="kit-nota">{t.resumen.sinUnaVia}</p>
      )}
      <h3>{t.resumen.riesgos}</h3>
      {r.riesgos_principales.length ? (
        <ol className="inf-lista">
          {r.riesgos_principales.map((id) => {
            const x = riesgo(id);
            return (
              <li key={id}>
                <a href={`#r-${id}`}>
                  <span className="cod mono">{id}</span>{" "}
                  {nombreRiesgo[id] ?? id}
                </a>{" "}
                <span className="mono">
                  · {prioridad[x.prioridad_de_accion]}
                  {x.bloqueante ? ` · ${t.item.estado.bloqueado}` : ""}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="kit-nota">{t.resumen.sinRiesgos}</p>
      )}
    </>
  );
}

export function SeccionCaso({
  caso,
  nombreCriterio,
  nombrePlataforma,
  idioma,
  t,
  y,
}: {
  caso: Caso;
  nombreCriterio: Record<string, string>;
  nombrePlataforma: Record<string, string>;
  idioma: Idioma;
  t: T;
  y: string;
}) {
  return (
    <>
      <p>{caso.descripcion[idioma]}</p>
      <h3>{t.caso.contexto}</h3>
      <ul className="inf-lista">
        {caso.contexto.map((c) => (
          <li key={c.elemento.es}>
            <b>{c.elemento[idioma]}.</b> {c.descripcion[idioma]}
          </li>
        ))}
      </ul>
      <h3>{t.caso.requisitos}</h3>
      <ul className="inf-lista">
        {caso.requisitos.map((r) => (
          <li key={r.descripcion.es}>
            {r.descripcion[idioma]}{" "}
            <span className="mono">
              ·{" "}
              {r.tipo === "obligatorio"
                ? t.caso.obligatorio
                : t.caso.preferente}{" "}
              · {nombreCriterio[r.criterio_id] ?? r.criterio_id}
            </span>
          </li>
        ))}
      </ul>
      <h3>{t.caso.restricciones}</h3>
      <ul className="inf-lista">
        {caso.restricciones.map((r) => (
          <li key={r.id}>
            {r.descripcion[idioma]}
            {r.elimina.length > 0 && (
              <span className="mono">
                {" "}
                ·{" "}
                {plantilla(t.caso.elimina, {
                  plataformas: lista(
                    r.elimina.map(
                      (e) =>
                        nombrePlataforma[e.plataforma_id] ?? e.plataforma_id,
                    ),
                    y,
                  ),
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <h3>{t.caso.pesos}</h3>
      <ul className="inf-lista">
        {caso.criterios
          .filter((c) => c.peso_centesimas > 0)
          .sort(
            (a, b) =>
              b.peso_centesimas - a.peso_centesimas ||
              (a.criterio_id < b.criterio_id ? -1 : 1),
          )
          .map((c) => (
            <li key={c.criterio_id}>
              {nombreCriterio[c.criterio_id] ?? c.criterio_id}:{" "}
              <b>{peso(c.peso_centesimas, idioma)}</b>{" "}
              <span className="mono">· {t.caso.origen[c.origen]}</span>
            </li>
          ))}
      </ul>
    </>
  );
}

/** Las inversiones de la sensibilidad y la clase de la simulación, estáticas: la versión que se puede repetir y se imprime. */
export function RobustezEstatica({
  r,
  simulacion,
  nombreCriterio,
  nombrePlataforma,
  declaracion,
  tc,
  t,
  idioma,
}: {
  r: Evaluado;
  simulacion: ResultadoSimulacion | null;
  nombreCriterio: Record<string, string>;
  nombrePlataforma: Record<string, string>;
  declaracion: string;
  tc: TC;
  t: T;
  idioma: Idioma;
}) {
  const racional = (x: Racional) => peso((x.n - (x.n % x.d)) / x.d, idioma);
  const s = simulacion?.semillas[0];
  const extremo = (c: Evaluado["sensibilidad"][number]): string => {
    if (c.estado !== "calculada") return t.robustez.sinInversion;
    const partes = [
      c.inversion_abajo
        ? plantilla(t.robustez.porDebajo, { t: racional(c.inversion_abajo.t) })
        : null,
      c.inversion_arriba
        ? plantilla(t.robustez.desde, { t: racional(c.inversion_arriba.t) })
        : null,
    ].filter((x): x is string => x !== null);
    return partes.length ? partes.join(" · ") : t.robustez.sinInversion;
  };
  return (
    <>
      <h3>{t.robustez.titulo}</h3>
      <ul className="inf-lista">
        {r.sensibilidad.map((c) => (
          <li key={c.criterio_id}>
            {plantilla(t.robustez.inversion, {
              criterio: nombreCriterio[c.criterio_id] ?? c.criterio_id,
              texto: extremo(c),
            })}
          </li>
        ))}
      </ul>
      {simulacion && s && simulacion.clase && simulacion.ganadora ? (
        <>
          <p>
            <b>
              {plantilla(tc.robustez.tituloClase, {
                clase: tc.robustez.clase[simulacion.clase],
              })}
            </b>
          </p>
          <p>
            {plantilla(tc.robustez.primera, {
              plataforma:
                nombrePlataforma[simulacion.ganadora] ?? simulacion.ganadora,
              pct: porcentaje(
                s.aceptabilidad[
                  simulacion.plataformas.indexOf(simulacion.ganadora)
                ]![0]!,
                s.aceptadas * simulacion.L,
                idioma,
              ),
              K: entero(s.aceptadas, idioma),
            })}{" "}
            {plantilla(tc.robustez.intervalo, {
              ic: semiamplitud(s.semiamplitud_centesimas ?? 0, idioma),
            })}
          </p>
          <p>
            {simulacion.estable
              ? plantilla(tc.robustez.estable, {
                  n: entero(simulacion.semillas.length - 1, idioma),
                })
              : tc.robustez.inestable}
          </p>
        </>
      ) : (
        <p className="kit-nota">{t.robustez.sinSimulacion}</p>
      )}
      <p className="kit-nota">{declaracion}</p>
    </>
  );
}

export function TablaDecisiones({
  informe,
  plan,
  nombres,
  opcionDe,
  t,
  td,
}: {
  informe: Informe;
  plan: Plan;
  nombres: NombresInforme;
  opcionDe: Record<string, string>;
  t: T;
  td: TD;
}) {
  const porId = new Map(plan.decisiones.map((d) => [d.id, d]));
  const c = t.decisiones.columnas;
  return (
    <MarcoTabla etiqueta={t.informe.secciones.decisiones}>
      <table className="tabla">
        <thead>
          <tr>
            <th>{c.onda}</th>
            <th>{c.decision}</th>
            <th>{c.reversibilidad}</th>
            <th>{c.opcion}</th>
            <th>{c.depende}</th>
          </tr>
        </thead>
        <tbody>
          {informe.resultadoPlan.decisiones.map((d) => {
            const dec = porId.get(d.id)!;
            return (
              <tr key={d.id} id={`d-${d.id}`}>
                <td className="mono">{d.onda ?? t.decisiones.sinOnda}</td>
                <td>
                  <b>{nombres.decision[d.id]}</b>
                </td>
                <td>
                  <span className={`rev rev-${dec.reversibilidad}`}>
                    {td.reversibilidad[dec.reversibilidad]}
                  </span>
                </td>
                <td>
                  {d.planificadas.length ? (
                    d.planificadas.map((p) => (
                      <p key={p}>
                        <b>{nombres.plataforma[p] ?? p}.</b>{" "}
                        {opcionDe[`${d.id}|${p}`]}
                      </p>
                    ))
                  ) : (
                    <small>{t.decisiones.sinOpcion}</small>
                  )}
                </td>
                <td>
                  {dec.depende_de.length
                    ? dec.depende_de
                        .map((x) => nombres.decision[x] ?? x)
                        .join(" · ")
                    : t.decisiones.sinDependencias}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </MarcoTabla>
  );
}

export function Implicitas({
  caso,
  plan,
  idioma,
  t,
}: {
  caso: Caso;
  plan: Plan;
  idioma: Idioma;
  t: T;
}) {
  const delPlan = plan.decisiones.filter(
    (d) => d.implicita && d.estado !== "decidida",
  );
  if (!caso.decisiones_implicitas.length && !delPlan.length)
    return <p className="kit-nota">{t.implicitas.ninguna}</p>;
  return (
    <ul className="inf-lista">
      {caso.decisiones_implicitas.map((d) => {
        const op = d.opciones.find((o) => o.id === d.respuesta);
        return (
          <li key={d.id}>
            {plantilla(t.implicitas.perfil, { pregunta: d.pregunta[idioma] })}{" "}
            <span className="mono">
              ·{" "}
              {op
                ? plantilla(t.implicitas.respondida, {
                    opcion: op.texto[idioma],
                  })
                : t.implicitas.sinResponder}
            </span>
          </li>
        );
      })}
      {delPlan.map((d) => (
        <li key={d.id}>
          {plantilla(t.implicitas.plan, { pregunta: d.pregunta[idioma] })}
        </li>
      ))}
    </ul>
  );
}

export function Relato({
  generado,
  humano,
  idioma,
  t,
}: {
  generado: string;
  humano: RelatoDeFracaso | undefined;
  idioma: Idioma;
  t: T;
}) {
  return (
    <>
      <blockquote className="relato">{generado}</blockquote>
      <p className="kit-nota">{t.relato.generado}</p>
      <h3>{t.relato.humano}</h3>
      {humano ? (
        <>
          <blockquote className="relato">{humano.texto[idioma]}</blockquote>
          <p className="kit-nota">
            {plantilla(t.relato.escritoPor, {
              quien: humano.escrito_por,
              fecha: humano.fecha,
            })}
          </p>
        </>
      ) : (
        <>
          <p>
            <b className="campo-aviso">{t.relato.sinHumano}</b>
          </p>
          <p className="kit-nota">{t.relato.sinHumanoNota}</p>
        </>
      )}
    </>
  );
}

export function AlertasEvidencia({
  alertas,
  nombres,
  madurez,
  idioma,
  t,
}: {
  alertas: AlertaEvidencia[];
  nombres: NombresInforme;
  madurez: Record<string, string>;
  idioma: Idioma;
  t: T;
}) {
  if (!alertas.length) return <p className="kit-nota">{t.alertas.vacia}</p>;
  return (
    <ul className="alertas">
      {alertas.map((a) => (
        <li
          key={`${a.evidencia_id}|${a.motivo}`}
          className={
            a.motivo === "sin-fuente-oficial" ? "alerta-fuerte" : undefined
          }
        >
          {a.motivo === "vencida" ? <Aspa s={14} /> : <Alerta s={14} />}
          <span>{textoDeAlerta(a, nombres, idioma, madurez)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Ficha({
  informe,
  versionTexto,
  huella,
  idioma,
  t,
}: {
  informe: Informe;
  versionTexto: string;
  huella: string;
  idioma: Idioma;
  t: T;
}) {
  const f = informe.modelo.ficha;
  const u = f.umbrales;
  const fila = (k: string, v: ReactNode) => (
    <div key={k}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
  return (
    <>
      <dl className="repro evidencia-meta">
        {fila(t.ficha.instantanea, versionTexto)}
        {fila(t.ficha.fecha, f.fecha_evaluacion)}
        {fila(t.ficha.huella, <span className="huella">{huella}</span>)}
        {fila(t.ficha.semilla, <span className="mono">{f.semilla}</span>)}
        {fila(
          t.ficha.semillasMas,
          <span className="mono">{f.semillas_estabilidad.join(", ")}</span>,
        )}
        {fila(
          t.ficha.combinaciones,
          <span className="mono">{f.aceptadas}</span>,
        )}
        {fila(
          t.ficha.umbrales,
          plantilla(t.ficha.umbralesTexto, {
            empate: peso(u.empate_centesimas, idioma),
            robusta: u.robusta_pct,
            fragil: u.fragil_pct,
            revisar: u.revisar_dias,
            vencido: u.vencido_dias,
          }),
        )}
        {fila(t.ficha.version, <span className="mono">{f.version_app}</span>)}
      </dl>
      <p className="kit-nota">{t.ficha.nota}</p>
    </>
  );
}
