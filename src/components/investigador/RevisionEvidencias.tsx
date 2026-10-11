"use client";

import { useState } from "react";
import { Alerta, Aspa, Ok, Pendiente } from "@/components/caso/Iconos";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import type { Textos } from "@/lib/i18n";
import { comandoAprobar } from "@/lib/investigador/comando";
import type { EvidenciaVista, PropuestaEvidenciasVista, VerificacionVista } from "@/lib/investigador/revision";
import { Comando } from "./Copiar";

type T = Textos["investigador"];
type TE = T["evidencias"];
type Nivel = PropuestaEvidenciasVista["niveles"][number];
type Decision = "aprobada" | "rechazada" | undefined;

/**
 * La regla de 0 a 4 de una evidencia (boceto M1, aprobado el 2026-10-05): el puntaje propuesto (borde grueso, glifo y
 * «propuesto»), lo que su madurez no deja contar en rayado y, si el tope lo baja, el nivel que cuenta (borde punteado y
 * «cuenta»). El color nunca va solo.
 */
export function Regla({ e, niveles, te }: { e: EvidenciaVista; niveles: Nivel[]; te: TE }) {
  const cuenta = Math.min(e.puntaje, e.tope);
  const conVistaPrevia = Math.min(e.puntaje, e.topeConVistaPrevia);
  const maximo = niveles.at(-1)?.valor ?? e.puntaje;
  return (
    <>
      <ol className="escala-tira" aria-label={plantilla(te.regla.etiqueta, { p: e.puntaje })}>
        {niveles.map((n) => {
          const propuesto = n.valor === e.puntaje;
          const marcaCuenta = cuenta !== e.puntaje && n.valor === cuenta;
          const clase = [propuesto && "propuesto", n.valor > e.tope && "sobre-tope", marcaCuenta && "cuenta"].filter(Boolean).join(" ");
          return (
            <li key={n.valor} className={clase || undefined} aria-current={propuesto ? "true" : undefined}>
              <b>{n.valor}</b>
              <span>{n.nombre}</span>
              {propuesto && (
                <i>
                  <Ok s={12} />
                  {te.regla.propuesto}
                </i>
              )}
              {marcaCuenta && <i>{te.regla.cuenta}</i>}
            </li>
          );
        })}
      </ol>
      {e.tope < maximo && (
        <p className="tope-nota">
          {plantilla(te.regla.rayado, { madurez: e.madurez.toLowerCase(), cuenta })}
          {conVistaPrevia !== cuenta ? plantilla(te.regla.rayadoVistaPrevia, { cuenta: conVistaPrevia }) : ""}.
        </p>
      )}
    </>
  );
}

function Verificacion({ v, tp }: { v: VerificacionVista; tp: T["propuesta"] }) {
  return (
    <span className="verif">
      <b>
        {!v ? <Pendiente s={14} /> : v.resultado === "verificada" ? <Ok s={14} /> : v.resultado === "no-encontrada" ? <Aspa s={14} /> : <Alerta s={14} />}
        {!v ? tp.estado.porDecidir : v.resultado === "verificada" ? tp.verif.verificada : v.resultado === "no-encontrada" ? tp.verif.noEncontrada : tp.verif.noVerificable}
      </b>
      {v && (
        <span className="mono">
          curl · {v.http ?? "—"}
          {v.sha256 ? ` · sha256 ${v.sha256.slice(0, 8)}…` : ""}
          {v.motivo ? ` · ${v.motivo}` : ""}
          {v.resultado === "no-encontrada" ? ` · ${tp.verif.rechazadaPorCodigo}` : ""}
        </span>
      )}
    </span>
  );
}

function Tarjeta({ e, d, niveles, t, decidir }: { e: EvidenciaVista; d: Decision; niveles: Nivel[]; t: T; decidir: (x: Decision) => void }) {
  const te = t.evidencias;
  const tp = t.propuesta;
  const porCodigo = e.resultado === "no-encontrada";
  const nivel = niveles.find((n) => n.valor === e.puntaje);
  const adyacentes = [e.puntaje - 1, e.puntaje + 1].filter((x) => niveles.some((n) => n.valor === x));
  const varias = e.fuentes.length > 1;
  return (
    <article className="afirmacion evidencia-rev" data-evidencia={e.id} data-rechazada={d === "rechazada" ? "" : undefined}>
      <header>
        <span className="cod">{e.id}</span>
        <span className="mono">{e.evidencia}</span>
        {e.cambio !== "nueva" && <span className="diff-marca">{te.cambio[e.cambio]}</span>}
        <span className={`insignia${d === "rechazada" ? " insignia-llena" : d ? "" : " insignia-punteada"}`}>
          {d === "aprobada" ? <Ok s={12} /> : d ? null : <Pendiente s={12} />}
          {d === "aprobada" ? tp.estado.aprobada : d === "rechazada" ? tp.estado.rechazada : tp.estado.porDecidir}
        </span>
      </header>
      <p className="afirmacion-sobre">
        {e.criterio} <span className="mono">· {te.tipoCriterio[e.tipo]}</span>
      </p>
      <p className="evidencia-afirma">{e.afirmacion}</p>
      <Regla e={e} niveles={niveles} te={te} />
      {nivel && (
        <p className="ancla">
          <b>
            {e.puntaje} · {nivel.nombre}.
          </b>{" "}
          {nivel.descripcion}
        </p>
      )}
      <p className="porque">
        <b>{plantilla(te.regla.porQue, { p: e.puntaje, adyacentes: adyacentes.join(te.regla.ni) })}</b> {e.justificacion}
      </p>
      {e.fuentes.map((f, k) => (
        <div key={k} className="evidencia-fuente">
          {varias && <p className="ojo">{plantilla(te.fuenteN, { n: k + 1 })}</p>}
          <blockquote className={`evidencia-cita${f.verificacion?.resultado === "verificada" ? "" : " evidencia-no-verificada"}`} lang="">
            «{f.cita.texto}»
          </blockquote>
          <Verificacion v={f.verificacion} tp={tp} />
        </div>
      ))}
      <dl className="evidencia-meta">
        {e.fuentes.map((f, k) => (
          <div key={`f${k}`}>
            <dt>{varias ? plantilla(te.fuenteN, { n: k + 1 }) : te.meta.fuente}</dt>
            <dd>
              <a href={f.cita.url} rel="noreferrer noopener" target="_blank">
                {f.cita.titulo}
              </a>{" "}
              <span className="mono">
                {tp.tipoFuente[f.cita.tipo]}
                {f.fecha ? ` · ${f.fecha}` : ""}
              </span>
            </dd>
          </div>
        ))}
        <div>
          <dt>{te.meta.madurez}</dt>
          <dd>{e.madurez}</dd>
        </div>
        <div>
          <dt>{te.meta.conflicto}</dt>
          <dd>{[...new Set(e.fuentes.map((f) => f.cita.conflicto))].join(" · ")}</dd>
        </div>
        <div>
          <dt>{te.meta.componentes}</dt>
          <dd>{e.componentes.join(", ")}</dd>
        </div>
        {e.limitaciones.length > 0 && (
          <div>
            <dt>{te.meta.limitaciones}</dt>
            <dd>{e.limitaciones.join(" ")}</dd>
          </div>
        )}
        {e.esencial && (
          <div>
            <dt>{te.meta.esencial}</dt>
            <dd>{te.meta.esencialSi}</dd>
          </div>
        )}
      </dl>
      {!porCodigo && (
        <footer>
          <span className="decidir" role="group" aria-label={e.id}>
            <button type="button" className="boton" aria-pressed={d === "aprobada"} onClick={() => decidir("aprobada")}>
              {tp.aprobar}
            </button>
            <button type="button" className="boton boton-sec" aria-pressed={d === "rechazada"} onClick={() => decidir("rechazada")}>
              {tp.rechazar}
            </button>
          </span>
        </footer>
      )}
    </article>
  );
}

/**
 * Revisión de una propuesta de evidencias (D-S3-10; boceto M1, docs/propuestas-de-diseno/revision-evidencias.html). La
 * pantalla es estática: nada se aprueba aquí; cada decisión arma el comando que corre una persona. Ninguna evidencia viene
 * aprobada de entrada (el código comprueba la cita, no el puntaje); la que tiene una cita que el código no encontró queda
 * rechazada sin opción.
 */
export function RevisionEvidencias({ propuesta, plataforma, t }: { propuesta: PropuestaEvidenciasVista; plataforma: string; t: T }) {
  const { carpeta, evidencias, niveles } = propuesta;
  const te = t.evidencias;
  const [decision, setDecision] = useState<Record<string, Decision>>(() => Object.fromEntries(evidencias.map((e) => [e.id, e.resultado === "no-encontrada" ? "rechazada" : undefined])));
  const grupos: [string, EvidenciaVista[]][] = [
    [te.grupos.decidir, evidencias.filter((e) => e.resultado !== "verificada" && e.resultado !== "no-encontrada")],
    [te.grupos.verificadas, evidencias.filter((e) => e.resultado === "verificada")],
    [te.grupos.rechazadas, evidencias.filter((e) => e.resultado === "no-encontrada")],
  ];
  const faltan = evidencias.filter((e) => !decision[e.id]).length;
  const aprobadas = evidencias.filter((e) => decision[e.id] === "aprobada").map((e) => e.id);
  const rechazadas = evidencias.filter((e) => decision[e.id] === "rechazada").map((e) => e.id);

  return (
    <>
      <details className="escala-ref">
        <summary>{te.escala.resumen}</summary>
        <ol className="escala-anclas">
          {niveles.map((n) => (
            <li key={n.valor}>
              <b>
                {n.valor} · {n.nombre}.
              </b>{" "}
              {n.descripcion}
            </li>
          ))}
        </ol>
        <p className="kit-nota">{plantilla(te.escala.tope, { tope: propuesta.topeNoDisponible })}</p>
      </details>
      {grupos
        .filter(([, xs]) => xs.length)
        .map(([titulo, xs]) => (
          <section key={titulo} className="grupo-afirmaciones" aria-label={titulo}>
            <h3 className="ojo">
              {titulo} · {xs.length}
            </h3>
            <div className="kit-grid">
              {xs.map((e) => (
                <Tarjeta key={e.id} e={e} d={decision[e.id]} niveles={niveles} t={t} decidir={(d) => setDecision((x) => ({ ...x, [e.id]: d }))} />
              ))}
            </div>
          </section>
        ))}
      <section className="aprobar" aria-labelledby="aprobar-ev-t">
        <h3 id="aprobar-ev-t">{t.propuesta.comandoTitulo}</h3>
        {faltan ? (
          <p className="kit-nota" aria-live="polite">
            {plural(te.faltan, faltan)}
          </p>
        ) : (
          <Comando texto={comandoAprobar(carpeta, aprobadas, rechazadas)} copiar={t.comando.copiar} copiado={t.comando.copiado} nota={plantilla(te.comandoNota, { plataforma })} />
        )}
      </section>
    </>
  );
}
