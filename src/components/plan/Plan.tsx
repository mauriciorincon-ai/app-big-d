import { TABLA_AIAG_VDA, type PrioridadDeAccion } from "instrumentos-de-plan";
import { Alerta, Aspa, Ok, Pendiente } from "@/components/caso/Iconos";
import { MarcoTabla } from "@/components/caso/MarcoTabla";
import { Comando } from "@/components/investigador/Copiar";
import type { AlertaDelPlan, RiesgoCalculado } from "@/engine";
import { plantilla } from "@/lib/atlas/plantilla";
import { huellaCorta } from "@/lib/caso/formato";
import type { Plan } from "@/lib/datos/plan";
import { textos, type Idioma, type Textos } from "@/lib/i18n";
import { IMPL_D, REV_D } from "@/lib/plan/ondas-svg";
import type { FilaLectura } from "@/lib/plan/vista";

// Las piezas de la pantalla de decisiones y riesgos (maqueta `decisiones.html`): UI sin lógica de negocio. Todo lo que se
// muestra viene calculado por el núcleo (`planDe`) o es dato del plan; aquí solo se ordena en la página. El color nunca va
// solo: reversibilidad y prioridad llevan glifo + palabra + borde.

type T = Textos["caso"]["decisiones"];
type Rev = keyof typeof REV_D;

const trazo = (d: string, w = 1.7) => (
  <svg
    viewBox="-8 -8 16 16"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Reversibilidad = ({ r, t }: { r: Rev; t: T }) => (
  <span className={`rev rev-${r}`}>
    {trazo(REV_D[r])}
    {t.reversibilidad[r]}
  </span>
);

export const Leyenda = ({ t }: { t: T }) => (
  <ul className="leyenda-inline leyenda-dec">
    <li>
      <Reversibilidad r="una_via" t={t} />
      <small>{t.leyenda.grueso}</small>
    </li>
    <li>
      <Reversibilidad r="costosa" t={t} />
      <small>{t.leyenda.discontinuo}</small>
    </li>
    <li>
      <Reversibilidad r="dos_vias" t={t} />
      <small>{t.leyenda.fino}</small>
    </li>
    <li>
      <span className="rev">
        {trazo(IMPL_D, 2)}
        {t.leyenda.implicita}
      </span>
    </li>
  </ul>
);

const Prio = ({ p, t }: { p: PrioridadDeAccion; t: T }) => (
  <span className={`prio prio-${p}`}>
    {p === "alta" && trazo(IMPL_D, 2)}
    {t.riesgos.prioridad[p]}
  </span>
);

/** La lectura del diagrama en texto (G10): onda por onda, y las que el ciclo deja sin onda con su camino. */
export function LecturaOndas({ filas, t }: { filas: FilaLectura[]; t: T }) {
  return (
    <details className="lectura-seccion" id="lectura">
      <summary>{t.ondas.lectura}</summary>
      <ol className="filas lectura-ondas">
        {filas.map((f) => (
          <li key={f.etiqueta}>
            <b>{f.etiqueta}</b>
            <span>{f.items.join(" · ")}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * El ciclo de dependencias (S5, observado): el camino de las decisiones que se esperan unas a otras, nombrado, y qué pasa con el
 * orden. Mientras el ciclo exista el motor no entrega ondas (el reusable devuelve ninguna), así que lo dice con palabras en vez
 * de «ondas calculadas: 0».
 */
export function AlertaCiclo({ camino, ondas, sinOnda, t }: { camino: string[]; ondas: number; sinOnda: number; t: T }) {
  return (
    <div className="veredicto veredicto-alerta" role="alert">
      <b>{t.ciclo.alerta}</b>
      <span>{camino.join(" → ")}</span>
      <span className="mono">{plantilla(ondas === 0 ? t.ciclo.sinOndas : t.ciclo.conOndas, { ondas, sin: sinOnda })}</span>
    </div>
  );
}

/** Las alertas del plan, cada una con el nombre de la decisión o del supuesto que señala. */
export function Alertas({ alertas, nombre, nombrePlataforma, supuestos, idioma, t }: { alertas: AlertaDelPlan[]; nombre: Record<string, string>; nombrePlataforma: Record<string, string>; supuestos: Plan["supuestos"]; idioma: Idioma; t: T }) {
  if (!alertas.length) return null;
  const sobre = (a: AlertaDelPlan): string => {
    if (a.tipo === "decision-implicita") return nombre[a.id] ?? a.id;
    if (a.tipo === "opcion-sin-fuente") {
      const [d, p] = a.id.split("/");
      return `${nombre[d!] ?? d} · ${nombrePlataforma[p!] ?? p}`;
    }
    return supuestos.find((x) => x.id === a.id)?.enunciado[idioma] ?? a.id;
  };
  return (
    <ul className="alertas-plan" aria-label={t.alertas.titulo}>
      {alertas.map((a) => (
        <li key={`${a.tipo}:${a.id}`}>
          {a.tipo === "supuesto-refutado" ? <Aspa s={14} /> : <Alerta s={14} />}
          <span>
            <b>{t.alertas.tipos[a.tipo]}</b> · {sobre(a)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** La tabla de riesgos: prioridad de acción → severidad → RPN, con mitigación y residual. */
export function TablaRiesgos({
  riesgos,
  plan,
  nombre,
  idioma,
  t,
}: {
  riesgos: RiesgoCalculado[];
  plan: Plan;
  nombre: Record<string, string>;
  idioma: Idioma;
  t: T;
}) {
  const modo = new Map(plan.modos_de_falla.map((m) => [m.id, m]));
  return (
    <>
      <p className="pista-tabla">{t.riesgos.desliza}</p>
      <MarcoTabla etiqueta={t.riesgos.titulo}>
      <table className="tabla tabla-riesgos">
        <thead>
          <tr>
            <th>{t.riesgos.columnas.riesgo}</th>
            <th>{t.riesgos.columnas.decision}</th>
            <th>S</th>
            <th>O</th>
            <th>D</th>
            <th>{t.riesgos.columnas.prioridad}</th>
            <th>RPN</th>
            <th>{t.riesgos.columnas.mitigacion}</th>
            <th>{t.riesgos.columnas.residual}</th>
          </tr>
        </thead>
        <tbody>
          {riesgos.map((r) => {
            const m = modo.get(r.id)!;
            return (
              <tr
                key={r.id}
                id={`r-${r.id}`}
                className={r.bloqueante ? "prioridad-alta-sin" : undefined}
              >
                <td>
                  <span className="cod">{r.id}</span> <b>{m.modo[idioma]}</b>
                  <br />
                  <small>{m.efecto[idioma]}</small>
                  <details className="razon">
                    <summary>{t.riesgos.razon}</summary>
                    <small>{m.razon[idioma]}</small>
                  </details>
                </td>
                <td>{nombre[r.decision_id] ?? r.decision_id}</td>
                <td className="mono">{r.severidad}</td>
                <td className="mono">{r.ocurrencia}</td>
                <td className="mono">{r.deteccion}</td>
                <td>
                  <Prio p={r.prioridad_de_accion} t={t} />
                  {r.control_legal && r.prioridad_de_tabla !== r.prioridad_de_accion && (
                    <>
                      <br />
                      <small>
                        {plantilla(t.riesgos.controlLegal, {
                          tabla: t.riesgos.prioridad[r.prioridad_de_tabla],
                        })}
                      </small>
                    </>
                  )}
                </td>
                <td className="mono rpn">{r.rpn}</td>
                <td>
                  {m.mitigaciones.length ? (
                    <ul className="mitigaciones">
                      {m.mitigaciones.map((x, i) => (
                        <li key={i}>
                          <span>
                            {x.accion[idioma]}
                            <small>
                              {x.responsable[idioma]} ·{" "}
                              {t.riesgos.momento[x.momento]}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="campo-aviso">
                      <Aspa s={12} />
                      {t.riesgos.sinMitigacion}
                    </span>
                  )}
                </td>
                <td>
                  {r.residual ? (
                    <>
                      <span className="mono">
                        S{r.severidad} O{r.residual.ocurrencia} D
                        {r.residual.deteccion}
                      </span>{" "}
                      <Prio p={r.residual.prioridad_de_accion} t={t} />
                      <br />
                      <small>
                        {r.residual.prioridad_de_tabla !== r.residual.prioridad_de_accion
                          ? plantilla(t.riesgos.controlLegal, {
                              tabla: t.riesgos.prioridad[r.residual.prioridad_de_tabla],
                            })
                          : r.residual.baja_de_categoria
                            ? plantilla(t.riesgos.bajo, {
                                de: t.riesgos.prioridad[r.prioridad_de_tabla],
                                a: t.riesgos.prioridad[r.residual.prioridad_de_tabla],
                              })
                            : t.riesgos.igual}
                      </small>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </MarcoTabla>
    </>
  );
}

/** La tabla AIAG-VDA completa, dibujada desde el dato del paquete: lo que se muestra es lo que se aplica. */
export function TablaAccion({ t }: { t: T }) {
  // El orden sale del mínimo de cada banda: Object.keys pone «1» (un índice entero) primero y lo dejaría al final.
  const ordenadas = (b: Record<string, [number, number]>) => Object.keys(b).sort((x, y) => b[x]![0] - b[y]![0]);
  const S = ordenadas(TABLA_AIAG_VDA.bandas.severidad);
  const O = ordenadas(TABLA_AIAG_VDA.bandas.ocurrencia);
  const D = ordenadas(TABLA_AIAG_VDA.bandas.deteccion);
  return (
    <details className="lectura-seccion">
      <summary>{t.riesgos.tabla.titulo}</summary>
      <p className="kit-nota">{t.riesgos.tabla.nota}</p>
      <p className="pista-tabla">{t.riesgos.desliza}</p>
      <MarcoTabla etiqueta={t.riesgos.tabla.titulo}>
        <table className="tabla tabla-accion">
          <thead>
            <tr>
              <th>
                {t.riesgos.tabla.severidad} · {t.riesgos.tabla.ocurrencia}
              </th>
              {D.map((d) => (
                <th key={d}>
                  {t.riesgos.tabla.deteccion} {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {S.flatMap((s) =>
              O.map((o) => (
                <tr key={`${s}|${o}`}>
                  <th scope="row">
                    {plantilla(t.riesgos.tabla.fila, { s, o })}
                  </th>
                  {D.map((d) => (
                    <td key={d}>
                      <Prio p={TABLA_AIAG_VDA.tabla[s]![o]![d]!} t={t} />
                    </td>
                  ))}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </MarcoTabla>
    </details>
  );
}

/** Los supuestos con su prueba barata, planificada para el equipo del caso (la app no la ejecuta). */
export function TarjetasSupuestos({
  supuestos,
  nombre,
  alertas,
  idioma,
  t,
}: {
  supuestos: Plan["supuestos"];
  nombre: Record<string, string>;
  alertas: AlertaDelPlan[];
  idioma: Idioma;
  t: T;
}) {
  const vencidos = new Set(
    alertas.filter((a) => a.tipo === "supuesto-vencido").map((a) => a.id),
  );
  return (
    <div className="kit-grid">
      {supuestos.map((q) => (
        <article key={q.id} id={`s-${q.id}`} className={`tarjeta supuesto supuesto-${q.estado}`}>
          <header className="kit-fila">
            <span className="cod mono">{q.id}</span>
            <span
              className={`insignia${q.estado === "confirmado" ? "" : q.estado === "refutado" ? " insignia-llena" : " insignia-punteada"}`}
            >
              {q.estado === "confirmado" ? (
                <Ok s={12} />
              ) : q.estado === "refutado" ? (
                <Aspa s={12} />
              ) : (
                <Pendiente s={12} />
              )}
              {t.supuestos.estados[q.estado]}
            </span>
            <span className="mono">
              {plantilla(t.supuestos.criticidad, {
                c: t.supuestos.niveles[q.criticidad],
              })}
            </span>
          </header>
          <h3>{q.enunciado[idioma]}</h3>
          <dl className="evidencia-meta">
            <div>
              <dt>{t.supuestos.pruebaBarata}</dt>
              <dd>{q.prueba_barata[idioma]}</dd>
            </div>
            <div>
              <dt>{t.supuestos.tareaPara}</dt>
              <dd>
                {q.responsable[idioma]} ·{" "}
                <span className="mono">
                  {q.vence
                    ? `${plantilla(t.supuestos.vence, { fecha: q.vence })} · `
                    : ""}
                  {plantilla(t.supuestos.costo, {
                    c: t.supuestos.costos[q.costo_prueba],
                  })}
                </span>
              </dd>
            </div>
            <div>
              <dt>{t.supuestos.sostiene}</dt>
              <dd>{q.decisiones.map((d) => nombre[d] ?? d).join(" · ")}</dd>
            </div>
          </dl>
          {q.estado === "sin_probar" && q.criticidad === "alta" && (
            <p className="campo-aviso">
              <Alerta s={12} />
              {t.supuestos.alertaCritico}
            </p>
          )}
          {vencidos.has(q.id) && (
            <p className="campo-aviso">
              <Alerta s={12} />
              {t.supuestos.vencido}
            </p>
          )}
          {q.estado === "refutado" && (
            <p className="campo-aviso">
              <Aspa s={12} />
              {t.supuestos.refutado}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

/** La aprobación del plan: el sello si ya está aprobado; si no, el comando que arma la pantalla, o lo que lo bloquea. */
export function AprobarPlan({
  plan,
  comando,
  bloqueos,
  idioma,
}: {
  plan: Plan;
  /** El comando armado, o null si hay bloqueos. */
  comando: string | null;
  bloqueos: string[];
  idioma: Idioma;
}) {
  const T = textos(idioma);
  const t = T.caso.decisiones;
  if (plan.estado_aprobacion === "aprobado" && plan.aprobacion) {
    const h = huellaCorta(plan.aprobacion.huella);
    return (
      <section className="seccion" id="aprobar" aria-labelledby="apr-t">
        <h2 id="apr-t">{t.aprobar.titulo}</h2>
        <p className="veredicto" role="status">
          <b>
            <Ok s={16} />
            {t.aprobar.sello.titulo}
          </b>
          <span className="huella">
            {plantilla(t.aprobar.sello.detalle, {
              fecha: plan.aprobacion.fecha,
              inicio: h.inicio,
              fin: h.fin,
            })}
          </span>
        </p>
      </section>
    );
  }
  return (
    <section className="seccion" id="aprobar" aria-labelledby="apr-t">
      <h2 id="apr-t">{t.aprobar.titulo}</h2>
      <p className="kit-nota">{t.aprobar.nota}</p>
      {bloqueos.length > 0 ? (
        <div className="veredicto veredicto-alerta" role="alert">
          <b>
            <Aspa s={16} />
            {t.aprobar.bloqueado}
          </b>
          <ul>
            {bloqueos.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : (
        comando && (
          <>
            <h3>{t.aprobar.comandoTitulo}</h3>
            <Comando
              texto={comando}
              copiar={T.investigador.comando.copiar}
              copiado={T.investigador.comando.copiado}
              nota={t.aprobar.comandoNota}
            />
          </>
        )
      )}
    </section>
  );
}
