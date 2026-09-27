"use client";

import { useMemo, useState } from "react";
import { comandoAprobar } from "@/lib/investigador/comando";
import type { AfirmacionVista } from "@/lib/investigador/revision";
import type { Textos } from "@/lib/i18n";
import { plural } from "@/lib/atlas/plantilla";
import { Comando } from "./Copiar";

type T = Textos["investigador"];
type Decision = "aprobada" | "rechazada" | undefined;

/**
 * Revisión afirmación por afirmación (maqueta: `investigador.html`, estado «propuesta con cambios»). La
 * pantalla es estática: nada se aprueba aquí; cada decisión arma el comando que corre una persona. De
 * entrada: lo verificado por el código va aprobado, lo que el código no pudo verificar espera la decisión
 * humana, y lo que el código no encontró queda rechazado sin opción.
 */
export function RevisionPropuesta({ carpeta, afirmaciones, t }: { carpeta: string; afirmaciones: AfirmacionVista[]; t: T }) {
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
                    <p className="evidencia-afirma">{a.enunciado}</p>
                    <blockquote className={`evidencia-cita${v?.resultado === "verificada" ? "" : " evidencia-no-verificada"}`} lang="">
                      «{a.cita.texto}»
                    </blockquote>
                    <span className="verif">
                      <b>{!v ? tp.estado.porDecidir : v.resultado === "verificada" ? tp.verif.verificada : v.resultado === "no-encontrada" ? tp.verif.noEncontrada : tp.verif.noVerificable}</b>
                      {v && (
                        <span className="mono">
                          curl · {v.http ?? "—"}
                          {v.sha256 ? ` · sha256 ${v.sha256.slice(0, 8)}…` : ""}
                          {v.motivo ? ` · ${v.motivo}` : ""}
                          {porCodigo ? ` · ${tp.verif.rechazadaPorCodigo}` : ""}
                        </span>
                      )}
                    </span>
                    <footer>
                      <a href={a.cita.url} rel="noreferrer noopener" target="_blank">
                        {a.cita.titulo}
                      </a>
                      <span className="mono">
                        {tp.tipoFuente[a.cita.tipo]} · {a.cita.conflicto}
                      </span>
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
      <section className="aprobar" aria-labelledby="aprobar-t">
        <h3 id="aprobar-t">{tp.comandoTitulo}</h3>
        {faltan ? (
          <p className="kit-nota" aria-live="polite">
            {plural(tp.faltan, faltan)}
          </p>
        ) : (
          <Comando texto={comandoAprobar(carpeta, aprobadas, rechazadas)} copiar={t.comando.copiar} copiado={t.comando.copiado} nota={tp.comandoNota} />
        )}
      </section>
    </>
  );
}
