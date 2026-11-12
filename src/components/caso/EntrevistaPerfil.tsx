"use client";

import { useId, useState } from "react";
import { perfilDeEntrevista, type ConvencionEntrevista } from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { centesimasAPuntos } from "@/lib/investigador/comando-caso";
import type { Textos } from "@/lib/i18n";
import { Alerta, Ok } from "./Iconos";
import { MarcoTabla } from "./MarcoTabla";

export type TextosEntrevista = Textos["caso"]["perfil"]["entrevista"];

/** La convención con los textos ya en el idioma de la página: la pantalla no elige texto, lo recibe. */
export interface DatosEntrevista {
  introduccion: string;
  niveles: readonly { id: string; valor: number; texto: string }[];
  conserva_restricciones_desde: number;
  preguntas: readonly { id: string; criterio_id: string; texto: string }[];
}

export interface PropsEntrevista {
  idioma: "es" | "en";
  t: TextosEntrevista;
  datos: DatosEntrevista;
  criterios: readonly { id: string; nombre: string }[];
  /** Pasa los pesos propuestos (centésimas por criterio) y los criterios cuyas restricciones se conservan al editor del perfil. */
  usar: (pesos: Record<string, number>, conservan: readonly string[]) => void;
}

/**
 * S9 (F1): el entrevistador. Una pregunta por criterio, sin nombrar ninguna plataforma, con una escala común de importancia; con
 * todo respondido, el núcleo (`perfilDeEntrevista`, enteros) propone los pesos y qué restricciones se conservan, con origen
 * `entrevista`. Nada se guarda ni se aprueba aquí: «usar» solo llena el editor, y el comando de siempre (que arma el editor y
 * corre una persona) los vuelve declarados. Sin modelo: es código y dato.
 */
export function EntrevistaPerfil({ idioma, t, datos, criterios, usar }: PropsEntrevista) {
  const uid = useId();
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const nombre = new Map(criterios.map((c) => [c.id, c.nombre]));
  const conv: ConvencionEntrevista = datos;
  const ids = criterios.map((c) => c.id);
  const porCriterio = new Map(datos.preguntas.map((p) => [p.criterio_id, p]));
  const preguntas = criterios.flatMap((c) => (porCriterio.has(c.id) ? [porCriterio.get(c.id)!] : []));
  const perfil = perfilDeEntrevista(conv, ids, respuestas);
  const hechos = ids.filter((c) => respuestas[c] !== undefined).length;

  if (preguntas.length === 0) return null;
  return (
    <details className="editor-grupo entrevista-perfil" data-entrevista>
      <summary>{t.titulo}</summary>
      <p className="kit-nota">{t.nota}</p>
      <p className="kit-nota">{datos.introduccion}</p>
      <p className="campo-aviso" role="status" data-entrevista-progreso>
        {plantilla(t.progreso, { hechos, total: ids.length })}
      </p>

      {preguntas.map((p) => (
        <fieldset key={p.id} className="editor-decision" data-pregunta={p.id}>
          <legend>{p.texto}</legend>
          {datos.niveles.map((n) => (
            <label key={n.id} className="editor-opcion">
              <input
                type="radio"
                name={`${uid}-${p.id}`}
                checked={respuestas[p.criterio_id] === n.id}
                onChange={() => setRespuestas({ ...respuestas, [p.criterio_id]: n.id })}
              />
              <span>{n.texto}</span>
            </label>
          ))}
        </fieldset>
      ))}

      {perfil.tipo === "incompleta" && (
        <p className="campo-aviso" data-entrevista-faltan>
          <Alerta />
          {plural(t.faltan, perfil.faltan)}
        </p>
      )}
      {perfil.tipo === "sin-prioridad" && (
        <p className="campo-aviso" data-entrevista-sin-prioridad>
          <Alerta />
          {t.sinPrioridad}
        </p>
      )}
      {perfil.tipo === "completa" && (
        <div data-entrevista-propuesta>
          <MarcoTabla etiqueta={t.tabla}>
            <table>
              <caption className="sr-only">{t.tabla}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.criterio}</th>
                  <th scope="col">{t.peso}</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map((c) => (
                  <tr key={c.id} data-peso-entrevista={c.id}>
                    <th scope="row">{c.nombre}</th>
                    <td className="mono">{centesimasAPuntos(perfil.pesos.find((x) => x.criterio_id === c.id)!.peso_centesimas, idioma)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MarcoTabla>
          <p className="campo-aviso" role="status" data-entrevista-conserva>
            <Ok />
            {perfil.conserva_restricciones.length === 0
              ? t.conservaNinguna
              : plantilla(t.conserva, { criterios: perfil.conserva_restricciones.map((c) => nombre.get(c) ?? c).join(", ") })}
          </p>
          <button
            type="button"
            className="boton"
            data-usar-entrevista
            onClick={() => usar(Object.fromEntries(perfil.pesos.map((p) => [p.criterio_id, p.peso_centesimas])), perfil.conserva_restricciones)}
          >
            {t.usar}
          </button>
        </div>
      )}
      <p className="kit-nota">{t.declaracion}</p>
    </details>
  );
}
