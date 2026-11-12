"use client";

import { useSyncExternalStore } from "react";
import {
  paresCanonicos,
  pesosPorPares,
  type ConvencionPares,
} from "@/engine/pares";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import {
  consultaPares,
  gruposDe,
  juiciosDe,
  leerGrupo,
  leerPares,
  type ValorPar,
} from "@/lib/caso/estado-pares";
import { milesimas } from "@/lib/caso/formato";
import { centesimasAPuntos } from "@/lib/investigador/comando-caso";
import type { Textos } from "@/lib/i18n";
import {
  consultaDelCliente,
  consultaDelServidor,
  escribirConsulta,
  suscribirConsulta,
} from "./consulta-url";
import { Alerta, Ok } from "./Iconos";
import { MarcoTabla } from "./MarcoTabla";

export type TextosPares = Textos["caso"]["perfil"]["pares"];

export interface PropsPares {
  idioma: "es" | "en";
  t: TextosPares;
  conv: ConvencionPares;
  criterios: readonly { id: string; nombre: string }[];
  /** Pasa los pesos propuestos (centésimas por criterio) al editor del perfil. */
  usar: (pesos: Record<string, number>) => void;
}

/**
 * D7 (S8): una vía alterna para proponer los pesos del perfil, por pares (escala 1–9 del dato). Se avanza por grupos y el
 * avance vive en la URL; con todos los pares juzgados el núcleo propone los pesos (enteros, 10 000 centésimas) y la razón
 * de consistencia, que sobre el umbral AVISA con ícono y texto, sin bloquear. Nada se aprueba aquí: «usar» solo llena el
 * editor, y el comando de siempre los vuelve declarados.
 */
export function ComparacionPares({
  idioma,
  t,
  conv,
  criterios,
  usar,
}: PropsPares) {
  const nombre = new Map(criterios.map((c) => [c.id, c.nombre]));
  const pares = paresCanonicos(criterios.map((c) => c.id));
  const grupos = gruposDe(pares);
  const consulta = useSyncExternalStore(
    suscribirConsulta,
    consultaDelCliente,
    consultaDelServidor,
  );
  const valores = leerPares(consulta, pares.length, conv.escala_max);
  const grupo = leerGrupo(consulta, grupos.length);
  const hechos = valores.filter((v) => v !== null).length;
  const resultado = pesosPorPares(
    criterios.map((c) => c.id),
    juiciosDe(pares, valores),
    conv,
  );

  const fijar = (vs: readonly ValorPar[], g: number) =>
    escribirConsulta(consultaPares(vs, g, window.location.search));
  const top = conv.escala_max - 1;
  /** De «b importa 9 veces más» a «a importa 9 veces más», pasando por «igual»: el orden de la escala, sin saltos. */
  const opcionesDe = (na: string, nb: string) => [
    ...Array.from({ length: top }, (_, i) => ({ v: -(top - i), texto: plantilla(t.importaMas, { criterio: nb, k: top - i + 1 }) })),
    { v: 0, texto: t.igual },
    ...Array.from({ length: top }, (_, i) => ({ v: i + 1, texto: plantilla(t.importaMas, { criterio: na, k: i + 2 }) })),
  ];

  if (pares.length === 0) return null;
  return (
    <details className="editor-grupo comparacion-pares" data-pares>
      <summary>{t.titulo}</summary>
      <p className="kit-nota">{t.nota}</p>
      <p className="kit-nota">{t.escala}</p>
      <p className="campo-aviso" role="status" data-pares-progreso>
        {plantilla(t.progreso, { hechos, total: pares.length })}
      </p>

      {grupos.length > 0 && (
        <fieldset className="editor-grupo" data-pares-grupo={grupo + 1}>
          <legend>
            {plantilla(t.grupo, {
              k: grupo + 1,
              n: grupos.length,
              criterio: nombre.get(pares[grupos[grupo]![0]!]![0]) ?? "",
            })}
          </legend>
          {grupos[grupo]!.map((i) => {
            const [a, b] = pares[i]!;
            const na = nombre.get(a) ?? a;
            const nb = nombre.get(b) ?? b;
            const opciones = opcionesDe(na, nb);
            const v = valores[i];
            return (
              <label
                key={`${a}|${b}`}
                className="editor-campo par"
                data-par={`${a}|${b}`}
              >
                <span>{plantilla(t.parDe, { a: na, b: nb })}</span>
                <select
                  value={v === null || v === undefined ? "" : String(v)}
                  onChange={(e) => {
                    const nuevos = [...valores];
                    nuevos[i] =
                      e.target.value === "" ? null : Number(e.target.value);
                    fijar(nuevos, grupo);
                  }}
                >
                  <option value="">{t.sinJuzgar}</option>
                  {opciones.map((o) => (
                    <option key={o.v} value={String(o.v)}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <div className="kit-fila">
            <button
              type="button"
              className="boton boton-sec"
              disabled={grupo === 0}
              onClick={() => fijar(valores, grupo - 1)}
            >
              {t.anterior}
            </button>
            <button
              type="button"
              className="boton boton-sec"
              disabled={grupo === grupos.length - 1}
              onClick={() => fijar(valores, grupo + 1)}
            >
              {t.siguiente}
            </button>
          </div>
        </fieldset>
      )}

      {resultado.tipo === "incompleta" ? (
        <p className="campo-aviso" data-pares-faltan>
          <Alerta />
          {plural(t.faltan, resultado.faltan)}
        </p>
      ) : (
        <div data-pares-propuesta>
          <MarcoTabla etiqueta={t.tabla}>
            <table>
              <caption className="sr-only">
                {t.tabla}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t.criterio}</th>
                  <th scope="col">{t.peso}</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map((c) => (
                  <tr key={c.id} data-peso-par={c.id}>
                    <th scope="row">{c.nombre}</th>
                    <td className="mono">
                      {centesimasAPuntos(
                        resultado.pesos.find((p) => p.criterio_id === c.id)!
                          .peso_centesimas,
                        idioma,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MarcoTabla>
          {resultado.razon_milesimas === null ? (
            <p className="campo-aviso" data-pares-razon="nula">
              <Ok />
              {t.sinRazon}
            </p>
          ) : (
            <p
              className="campo-aviso"
              data-pares-razon={
                resultado.consistente ? "consistente" : "inconsistente"
              }
            >
              {resultado.consistente ? <Ok /> : <Alerta />}
              <span>
                {plantilla(t.razon, {
                  razon: milesimas(resultado.razon_milesimas, idioma),
                  umbral: milesimas(conv.umbral_razon_milesimas, idioma),
                })}
                {" · "}
                {resultado.consistente ? t.consistente : t.inconsistente}
              </span>
            </p>
          )}
          <button
            type="button"
            className="boton"
            data-usar-pares
            onClick={() =>
              usar(
                Object.fromEntries(
                  resultado.pesos.map((p) => [
                    p.criterio_id,
                    p.peso_centesimas,
                  ]),
                ),
              )
            }
          >
            {t.usar}
          </button>
        </div>
      )}
      <p className="kit-nota">{t.declaracion}</p>
    </details>
  );
}
