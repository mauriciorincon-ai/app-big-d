"use client";

import { useId, useState } from "react";
import { Comando } from "@/components/investigador/Copiar";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import {
  centesimasAPuntos,
  comandoAprobarCaso,
  problemasDelPerfil,
  puntosACentesimas,
  type DecisionesPerfil,
  type PerfilEditable,
} from "@/lib/investigador/comando-caso";
import { Alerta, Ok } from "./Iconos";

/** Los textos de la interfaz (T.caso.perfil.editor) y del botón de copiar (T.comando), ya en el idioma de la página. */
export interface TextosEditor {
  titulo: string;
  nota: string;
  pesos: string;
  puntos: string;
  rangoPct: string;
  pesoDe: string;
  rangoDe: string;
  pesoInvalido: string;
  rangoInvalido: string;
  sumaMal: string;
  restricciones: string;
  restriccionesNota: string;
  decisiones: string;
  faltan: readonly [string, string];
  comandoTitulo: string;
  comandoNota: string;
  sinComando: string;
  suma: string;
  sumaBien: string;
  copiar: string;
  copiado: string;
  sinResponder: string;
}

export interface DatosEditor {
  idioma: "es" | "en";
  /** La huella del borrador sobre el que se arma el comando: si el archivo cambia antes de correrlo, el script se niega. */
  desde: string;
  perfil: PerfilEditable;
  criterios: readonly { id: string; nombre: string; esencial: boolean }[];
  restricciones: readonly { id: string; texto: string }[];
  decisiones: readonly {
    id: string;
    pregunta: string;
    opciones: readonly { id: string; texto: string }[];
  }[];
}

const enteroPct = (s: string): number | null =>
  /^\d{1,3}$/.test(s.trim()) && Number(s) <= 100 ? Number(s) : null;

/**
 * El perfil en borrador, ajustable (S4, D-S4-04): la persona fija pesos, rangos, restricciones y respuestas, y la página ARMA el
 * comando que ella corre en su terminal (regla 2: la pantalla lo arma, ningún agente lo redacta). Nada se guarda ni se aprueba
 * aquí. Sin `style` en línea (CSP); los valores son texto hasta que se pasan a enteros, sin flotantes.
 */
export function EditorPerfil({
  datos,
  t,
}: {
  datos: DatosEditor;
  t: TextosEditor;
}) {
  const { idioma, perfil } = datos;
  const uid = useId();
  const [pesos, setPesos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      perfil.criterios.map((k) => [
        k.criterio_id,
        centesimasAPuntos(k.peso_centesimas, idioma),
      ]),
    ),
  );
  const [rangos, setRangos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      perfil.criterios.map((k) => [
        k.criterio_id,
        String(k.rango_relativo_pct),
      ]),
    ),
  );
  const [conserva, setConserva] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(perfil.restricciones.map((r) => [r.id, true])),
  );
  const [respuestas, setRespuestas] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      perfil.decisiones_implicitas.flatMap((d) =>
        d.respuesta === null ? [] : [[d.id, d.respuesta] as const],
      ),
    ),
  );

  const centesimas = Object.fromEntries(
    perfil.criterios.map((k) => [
      k.criterio_id,
      puntosACentesimas(pesos[k.criterio_id] ?? ""),
    ]),
  );
  const pcts = Object.fromEntries(
    perfil.criterios.map((k) => [
      k.criterio_id,
      enteroPct(rangos[k.criterio_id] ?? ""),
    ]),
  );
  const textoValido = perfil.criterios.every(
    (k) => centesimas[k.criterio_id] !== null && pcts[k.criterio_id] !== null,
  );
  const suma = perfil.criterios.reduce(
    (s, k) => s + (centesimas[k.criterio_id] ?? 0),
    0,
  );
  const faltan = perfil.decisiones_implicitas.filter(
    (d) => respuestas[d.id] === undefined,
  ).length;

  let comando: string | null = null;
  if (textoValido) {
    const d: DecisionesPerfil = {
      pesos: Object.fromEntries(
        perfil.criterios.map((k) => [
          k.criterio_id,
          centesimas[k.criterio_id]!,
        ]),
      ),
      rangos: Object.fromEntries(
        perfil.criterios.map((k) => [k.criterio_id, pcts[k.criterio_id]!]),
      ),
      restricciones: perfil.restricciones
        .filter((r) => conserva[r.id])
        .map((r) => r.id),
      respuestas,
    };
    if (problemasDelPerfil(perfil, d).length === 0)
      comando = comandoAprobarCaso(perfil, datos.desde, d);
  }

  return (
    <section
      className="seccion editor-perfil"
      aria-labelledby={`${uid}-t`}
      data-editor-perfil
    >
      <h2 id={`${uid}-t`}>{t.titulo}</h2>
      <p className="kit-nota">{t.nota}</p>

      <fieldset className="editor-grupo">
        <legend>{t.pesos}</legend>
        <ul className="filas editor-pesos">
          {datos.criterios.map((k) => {
            const malPeso = centesimas[k.id] === null;
            const malRango = pcts[k.id] === null;
            return (
              <li
                key={k.id}
                className="editor-fila"
                data-criterio-editor={k.id}
              >
                <b className="editor-nombre">{k.nombre}</b>
                <label className="editor-campo">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={pesos[k.id] ?? ""}
                    aria-label={plantilla(t.pesoDe, { criterio: k.nombre })}
                    aria-invalid={malPeso}
                    aria-describedby={malPeso ? `${uid}-${k.id}-p` : undefined}
                    onChange={(e) =>
                      setPesos({ ...pesos, [k.id]: e.target.value })
                    }
                  />
                  <span>{t.puntos}</span>
                </label>
                <label className="editor-campo">
                  <span aria-hidden="true">±</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={rangos[k.id] ?? ""}
                    aria-label={plantilla(t.rangoDe, { criterio: k.nombre })}
                    aria-invalid={malRango}
                    aria-describedby={malRango ? `${uid}-${k.id}-r` : undefined}
                    onChange={(e) =>
                      setRangos({ ...rangos, [k.id]: e.target.value })
                    }
                  />
                  <span>%</span>
                </label>
                {malPeso && (
                  <p
                    id={`${uid}-${k.id}-p`}
                    className="campo-aviso editor-error"
                  >
                    <Alerta />
                    {t.pesoInvalido}
                  </p>
                )}
                {malRango && (
                  <p
                    id={`${uid}-${k.id}-r`}
                    className="campo-aviso editor-error"
                  >
                    <Alerta />
                    {t.rangoInvalido}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <div className="suma" data-suma-editor>
          <span>{t.suma}</span>
          <span className="mono">{centesimasAPuntos(suma, idioma)}</span>
          <span className="campo-aviso" role="status">
            {textoValido && suma === 10_000 ? <Ok /> : <Alerta />}
            {textoValido && suma === 10_000
              ? t.sumaBien
              : plantilla(t.sumaMal, { suma: centesimasAPuntos(suma, idioma) })}
          </span>
        </div>
      </fieldset>

      {datos.restricciones.length > 0 && (
        <fieldset className="editor-grupo">
          <legend>{t.restricciones}</legend>
          <p className="kit-nota">{t.restriccionesNota}</p>
          {datos.restricciones.map((r) => (
            <label
              key={r.id}
              className="editor-opcion"
              data-restriccion-editor={r.id}
            >
              <input
                type="checkbox"
                checked={conserva[r.id] ?? false}
                onChange={(e) =>
                  setConserva({ ...conserva, [r.id]: e.target.checked })
                }
              />
              <span>{r.texto}</span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="editor-grupo">
        <legend>{t.decisiones}</legend>
        {datos.decisiones.map((d) => (
          <fieldset
            key={d.id}
            className="editor-decision"
            data-decision-editor={d.id}
          >
            <legend>{d.pregunta}</legend>
            {d.opciones.map((o) => (
              <label key={o.id} className="editor-opcion">
                <input
                  type="radio"
                  name={`${uid}-${d.id}`}
                  checked={respuestas[d.id] === o.id}
                  onChange={() =>
                    setRespuestas({ ...respuestas, [d.id]: o.id })
                  }
                />
                <span>{o.texto}</span>
              </label>
            ))}
            {respuestas[d.id] === undefined && (
              <p className="campo-aviso">
                <Alerta />
                {t.sinResponder}
              </p>
            )}
          </fieldset>
        ))}
        {faltan > 0 && (
          <p className="campo-aviso" role="status">
            <Alerta />
            {plural(t.faltan, faltan)}
          </p>
        )}
      </fieldset>

      <h3>{t.comandoTitulo}</h3>
      {comando ? (
        <Comando
          texto={comando}
          copiar={t.copiar}
          copiado={t.copiado}
          nota={t.comandoNota}
        />
      ) : (
        <p className="campo-aviso" data-sin-comando>
          <Alerta />
          {t.sinComando}
        </p>
      )}
    </section>
  );
}
