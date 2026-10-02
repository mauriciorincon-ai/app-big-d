"use client";

import { useMemo, useState } from "react";
import { comandoAprobar } from "@/lib/investigador/comando";
import type { AfirmacionVista, CitaVista, PropuestaVista, RetiroVista, VerificacionVista } from "@/lib/investigador/revision";
import type { Textos } from "@/lib/i18n";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { Comando } from "./Copiar";

type T = Textos["investigador"];
type TP = T["propuesta"];
type Decision = "aprobada" | "rechazada" | undefined;

/** La cita con su verificación por código: la misma pieza en una afirmación y en un retiro. */
function Evidencia({ cita, v, tp, extra }: { cita: CitaVista; v: VerificacionVista; tp: TP; extra?: string }) {
  return (
    <>
      <blockquote className={`evidencia-cita${v?.resultado === "verificada" ? "" : " evidencia-no-verificada"}`} lang="">
        «{cita.texto}»
      </blockquote>
      <span className="verif">
        <b>{!v ? tp.estado.porDecidir : v.resultado === "verificada" ? tp.verif.verificada : v.resultado === "no-encontrada" ? tp.verif.noEncontrada : tp.verif.noVerificable}</b>
        {v && (
          <span className="mono">
            curl · {v.http ?? "—"}
            {v.sha256 ? ` · sha256 ${v.sha256.slice(0, 8)}…` : ""}
            {v.motivo ? ` · ${v.motivo}` : ""}
            {extra ? ` · ${extra}` : ""}
          </span>
        )}
      </span>
    </>
  );
}

function Fuente({ cita, tp }: { cita: CitaVista; tp: TP }) {
  return (
    <>
      <a href={cita.url} rel="noreferrer noopener" target="_blank">
        {cita.titulo}
      </a>
      <span className="mono">
        {tp.tipoFuente[cita.tipo]} · {cita.conflicto}
      </span>
    </>
  );
}

/** Un retiro y por qué sale: su motivo con la cita que lo prueba, o el extremo que se lleva al flujo. */
function Retiro({ r, tp }: { r: RetiroVista; tp: TP }) {
  const a = r.argumento;
  return (
    <li data-retiro={r.id} data-argumento={a.tipo}>
      <p className="retiro-cabecera">
        <span className="diff-marca">{tp.entidad[r.entidad]}</span> <b>{r.nombre}</b> <span className="mono">{r.id}</span>
      </p>
      {a.tipo === "arrastre" ? (
        <p className="retiro-porque">{a.por.length > 1 ? plantilla(tp.retiros.arrastreDos, { a: a.por[0]!, b: a.por[1]! }) : plantilla(tp.retiros.arrastreUno, { a: a.por[0]! })}</p>
      ) : (
        <>
          <p className="retiro-porque">
            <span className="cod">{a.id}</span> {a.motivo}
          </p>
          <Evidencia cita={a.cita} v={a.verificacion} tp={tp} extra={a.verificacion?.resultado === "no-encontrada" ? tp.retiros.sinArgumento : undefined} />
          <p className="retiro-fuente">
            <Fuente cita={a.cita} tp={tp} />
          </p>
        </>
      )}
    </li>
  );
}

/**
 * Revisión afirmación por afirmación (maqueta: `investigador.html`, estado «propuesta con cambios»). La
 * pantalla es estática: nada se aprueba aquí; cada decisión arma el comando que corre una persona. De
 * entrada: lo verificado por el código va aprobado, lo que el código no pudo verificar espera la decisión
 * humana, y lo que el código no encontró queda rechazado sin opción.
 */
export function RevisionPropuesta({ carpeta, afirmaciones, retiros = [], t }: { carpeta: string; afirmaciones: AfirmacionVista[]; retiros?: PropuestaVista["retiros"]; t: T }) {
  const inicial = useMemo(
    () =>
      Object.fromEntries(
        afirmaciones.map((a) => [a.id, a.verificacion?.resultado === "verificada" ? "aprobada" : a.verificacion?.resultado === "no-encontrada" ? "rechazada" : undefined] as const),
      ) as Record<string, Decision>,
    [afirmaciones],
  );
  const [decision, setDecision] = useState<Record<string, Decision>>(inicial);
  const tp = t.propuesta;
  const grupos: [string, AfirmacionVista[]][] = [
    [tp.grupos.decidir, afirmaciones.filter((a) => a.verificacion?.resultado !== "verificada" && a.verificacion?.resultado !== "no-encontrada")],
    [tp.grupos.verificadas, afirmaciones.filter((a) => a.verificacion?.resultado === "verificada")],
    [tp.grupos.rechazadas, afirmaciones.filter((a) => a.verificacion?.resultado === "no-encontrada")],
  ];
  const faltan = afirmaciones.filter((a) => !decision[a.id]).length;
  const aprobadas = afirmaciones.filter((a) => decision[a.id] === "aprobada").map((a) => a.id);
  const rechazadas = afirmaciones.filter((a) => decision[a.id] === "rechazada").map((a) => a.id);
  // Un retiro cuya cita el código no encontró no tiene argumento: `aprobar` lo rechazaría, así que no se arma el comando.
  const sinArgumento = retiros.some((r) => r.argumento.tipo === "cita" && r.argumento.verificacion?.resultado === "no-encontrada");

  return (
    <>
      {grupos
        .filter(([, xs]) => xs.length)
        .map(([titulo, xs]) => (
          <section key={titulo} className="grupo-afirmaciones" aria-label={titulo}>
            <h3 className="ojo">
              {titulo} · {xs.length}
            </h3>
            <div className="kit-grid">
              {xs.map((a) => {
                const d = decision[a.id];
                const porCodigo = a.verificacion?.resultado === "no-encontrada";
                const v = a.verificacion;
                return (
                  <article key={a.id} className="afirmacion" data-afirmacion={a.id} data-rechazada={d === "rechazada" ? "" : undefined}>
                    <header>
                      <span className="cod">{a.id}</span>
                      <span className="diff-marca" data-cambio={a.cambio}>
                        {tp.entidad[a.entidad]} · {tp.cambio[a.cambio]}
                      </span>
                      <span className={`insignia${d === "rechazada" ? " insignia-llena" : d ? "" : " insignia-punteada"}`}>
                        {d === "aprobada" ? tp.estado.aprobada : d === "rechazada" ? tp.estado.rechazada : tp.estado.porDecidir}
                      </span>
                    </header>
                    {/* De qué habla (M-20): rechazarla retira ESE componente o flujo del mapa. */}
                    <p className="afirmacion-sobre">{a.nombre}</p>
                    <p className="evidencia-afirma">{a.enunciado}</p>
                    <Evidencia cita={a.cita} v={v} tp={tp} extra={porCodigo ? tp.verif.rechazadaPorCodigo : undefined} />
                    <footer>
                      <Fuente cita={a.cita} tp={tp} />
                      {!porCodigo && (
                        <span className="decidir" role="group" aria-label={a.id}>
                          <button type="button" className="boton" aria-pressed={d === "aprobada"} onClick={() => setDecision((x) => ({ ...x, [a.id]: "aprobada" }))}>
                            {tp.aprobar}
                          </button>
                          <button type="button" className="boton boton-sec" aria-pressed={d === "rechazada"} onClick={() => setDecision((x) => ({ ...x, [a.id]: "rechazada" }))}>
                            {tp.rechazar}
                          </button>
                        </span>
                      )}
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      {retiros.length > 0 && (
        <section className="grupo-afirmaciones retiros" aria-labelledby="retiros-t">
          <h3 className="ojo" id="retiros-t">
            {tp.retiros.titulo} · {retiros.length}
          </h3>
          <p className="kit-nota">{tp.retiros.nota}</p>
          <ul className="retiros-lista">
            {retiros.map((r) => (
              <Retiro key={r.id} r={r} tp={tp} />
            ))}
          </ul>
        </section>
      )}
      <section className="aprobar" aria-labelledby="aprobar-t">
        <h3 id="aprobar-t">{tp.comandoTitulo}</h3>
        {sinArgumento ? (
          <p className="kit-nota">{tp.retiros.bloquea}</p>
        ) : faltan ? (
          <p className="kit-nota" aria-live="polite">
            {plural(tp.faltan, faltan)}
          </p>
        ) : (
          <Comando texto={comandoAprobar(carpeta, aprobadas, rechazadas, retiros.map((r) => r.id))} copiar={t.comando.copiar} copiado={t.comando.copiado} nota={tp.comandoNota} />
        )}
      </section>
    </>
  );
}
