import Link from "next/link";
import { MarcaVigencia } from "@/components/atlas/MarcaVigencia";
import type { ItemProsContras, Motivo, PesoCaso, Resultado } from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { brecha, decimasDe, lista, peso, puntos } from "@/lib/caso/formato";
import type { Idioma, Textos } from "@/lib/i18n";
import { BarraTotal } from "./Barras";
import { Alerta, Aspa, Chevron, Estrella, Ok } from "./Iconos";
import { MarcoTabla } from "./MarcoTabla";

// Las vistas estáticas de la comparación (maqueta comparacion.html): el bloqueo honesto cuando no se puede comparar, el
// veredicto con los totales, la matriz de puntajes y los pros y contras. Todo sale del resultado del núcleo; aquí solo
// se escribe. La sensibilidad y la robustez, que se mueven, viven en Exploracion.tsx.

type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
type TC = Textos["caso"]["comparacion"];

export interface Nombres {
  plataforma: Record<string, string>;
  criterio: Record<string, string>;
  /** La afirmación de cada evidencia, en el idioma de la página. */
  evidencia: Record<string, string>;
  madurez: Record<string, string>;
}

const n = (m: Record<string, string>, id: string) => m[id] ?? id;

export function NoEvaluable({ motivos, idioma, t, nombres, criteriosPorPlataforma, rutaPerfil, rutaBase }: { motivos: Motivo[]; idioma: Idioma; t: TC["noEvaluable"]; nombres: Nombres; criteriosPorPlataforma: number; rutaPerfil: string; rutaBase: string }) {
  void idioma;
  return (
    <div className="estado estado-error" role="status" data-estado="no-evaluable">
      <h2>{t.titulo}</h2>
      <ul className="pros">
        {motivos.map((m) => {
          if (m.motivo === "perfil-en-borrador")
            return (
              <li key={m.motivo} data-motivo={m.motivo}>
                <Alerta />
                <span>{t.borrador}</span>
              </li>
            );
          if (m.motivo === "todas-descartadas")
            return (
              <li key={m.motivo} data-motivo={m.motivo}>
                <Aspa />
                <span>{t.todasDescartadas}</span>
              </li>
            );
          const por = new Map<string, number>();
          for (const f of m.faltantes) por.set(f.plataforma_id, (por.get(f.plataforma_id) ?? 0) + 1);
          return (
            <li key={m.motivo} data-motivo={m.motivo}>
              <Alerta />
              <span>
                {plural(t.faltaEvidencia, m.faltantes.length)}
                {[...por].map(([p, k]) => (
                  <small key={p} data-plataforma={p}>
                    {plantilla(k === 1 ? t.faltaPorPlataforma[0] : t.faltaPorPlataforma[1], { plataforma: n(nombres.plataforma, p), n: k, total: criteriosPorPlataforma })}
                  </small>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="kit-fila">
        <Link className="enlace-boton" href={rutaPerfil}>
          {t.verPerfil}
          <Chevron />
        </Link>
        <Link className="enlace-boton" href={rutaBase}>
          {t.verBase}
          <Chevron />
        </Link>
      </p>
    </div>
  );
}

export function Totales({ r, idioma, t, y, nombres, max, umbral, sello }: { r: Evaluado; idioma: Idioma; t: TC["totales"]; y: string; nombres: Nombres; max: number; umbral: number; sello: string }) {
  const [p1, p2] = r.orden;
  const nom = (id: string) => n(nombres.plataforma, id);
  const umbralTxt = peso(umbral, idioma);
  const v = r.veredicto;
  const lim = new Map(r.limitantes.map((l) => [l.plataforma_id, l]));
  const exactos = r.orden.filter((p) => p.posicion === 1);
  let frase: string;
  if (v.tipo === "unica") frase = plantilla(t.unica, { a: nom(v.plataforma_id) });
  else if (v.tipo === "ganadora-clara") frase = plantilla(t.clara, { a: nom(v.plataforma_id), b: nom(p2!.plataforma_id), brecha: brecha(v.brecha_unidades, max, idioma), umbral: umbralTxt });
  else frase = v.plataformas.length === 2 ? plantilla(t.empate, { a: nom(v.plataformas[0]!), b: nom(v.plataformas[1]!), brecha: brecha(v.brecha_unidades, max, idioma), umbral: umbralTxt }) : plantilla(t.empateVarias, { lista: lista(v.plataformas.map(nom), y), umbral: umbralTxt });
  let desempate: string | null = null;
  // El leximin solo ordena a igual total (D-S3-06): con totales distintos dentro de la banda no hay nada que desempatar.
  if (p1 && p2 && p1.unidades === p2.unidades) desempate = exactos.length > 1 ? plantilla(t.exacto, { lista: lista(exactos.map((p) => nom(p.plataforma_id)), y) }) : plantilla(t.leximinOrdena, { a: nom(p1.plataforma_id) });
  const banda = v.tipo === "unica" ? null : Math.max(0, decimasDe(p1!.unidades, max) - umbral / 10);
  return (
    <>
      <div className="veredicto" data-veredicto={v.tipo}>
        <b>
          {v.tipo === "ganadora-clara" ? <Ok /> : <Alerta />}
          {t.veredicto[v.tipo === "empate-tecnico" ? "empate" : v.tipo === "ganadora-clara" ? "clara" : "unica"]}
        </b>
        <span>
          {frase}
          {desempate && ` ${desempate}`}
        </span>
        <span className="mono">{sello}</span>
      </div>
      <ul className="filas totales">
        {r.orden.map((p) => {
          const l = lim.get(p.plataforma_id);
          return (
            <li key={p.plataforma_id} data-plataforma={p.plataforma_id} data-posicion={p.posicion}>
              <span className="total-nombre">
                <b>
                  <span className="puesto">{p.posicion} · </span>
                  {nom(p.plataforma_id)}
                </b>
                {l && (
                  <small>
                    {t.minimo} <b>{`${p.leximin[0]}/${max}`}</b> · {t.limitante}: {n(nombres.evidencia, l.evidencia_id)}
                  </small>
                )}
              </span>
              <BarraTotal decimas={decimasDe(p.unidades, max)} banda={banda} etiqueta={plantilla(t.barra, { plataforma: nom(p.plataforma_id), total: puntos(p.unidades, max, idioma) })} />
              <span className="total-valor">{puntos(p.unidades, max, idioma)}</span>
              <a className="enlace-boton" href="#matriz">
                {t.verPuntajes}
                <Chevron />
              </a>
            </li>
          );
        })}
      </ul>
      <p className="leyenda-inline">
        {banda !== null && <span>{plantilla(t.banda, { umbral: umbralTxt })}</span>}
        <span>
          <Estrella titulo={t.esencial} />
          {t.esencial}
        </span>
      </p>
    </>
  );
}

export function Matriz({ r, pesos, idioma, t, tEsencial, nombres, max, niveles, topeNoDisponible, vigencia }: { r: Evaluado; pesos: PesoCaso[]; idioma: Idioma; t: TC["matriz"]; tEsencial: string; nombres: Nombres; max: number; niveles: { valor: number; nombre: string }[]; topeNoDisponible: number; vigencia: Textos["caso"]["vigencia"] }) {
  const lim = new Set(r.limitantes.map((l) => `${l.plataforma_id}|${l.criterio_id}`));
  const celda = (p: string, c: string) => r.celdas.find((x) => x.plataforma_id === p && x.criterio_id === c)!;
  const plataformas = r.orden.map((p) => p.plataforma_id);
  const suma = pesos.reduce((s, p) => s + p.peso, 0);
  return (
    <>
      <p className="kit-nota">{plantilla(t.nota, { max })}</p>
      <MarcoTabla etiqueta={t.titulo} id="matriz">
        <table className="tabla matriz">
          <thead>
            <tr>
              <th scope="col">{t.criterio}</th>
              <th scope="col">{t.peso}</th>
              {plataformas.map((p) => (
                <th key={p} scope="col">
                  {n(nombres.plataforma, p)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pesos.map((w) => {
              const fila = plataformas.map((p) => celda(p, w.criterio_id));
              const mejor = Math.max(...fila.map((c) => c.puntaje));
              const unica = fila.filter((c) => c.puntaje === mejor).length === 1 && plataformas.length > 1;
              return (
                <tr key={w.criterio_id} data-criterio={w.criterio_id}>
                  <th scope="row">
                    {n(nombres.criterio, w.criterio_id)}
                    {w.esencial && <Estrella titulo={tEsencial} />}
                  </th>
                  <td className="mono">{peso(w.peso, idioma)}</td>
                  {fila.map((c) => (
                    <td key={c.plataforma_id} className="mono" data-mejor={unica && c.puntaje === mejor ? "" : undefined} data-limitante={lim.has(`${c.plataforma_id}|${c.criterio_id}`) ? "" : undefined}>
                      <span className="cap">
                        {c.puntaje}
                        <small>/{max}</small>
                        {c.tope_aplicado && <span className="solo-lector"> ({t.tope})</span>}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              <th scope="row">{t.total}</th>
              <th className="mono">{peso(suma, idioma)}</th>
              {r.orden.map((p) => (
                <th key={p.plataforma_id} className="mono">
                  {puntos(p.unidades, max, idioma)}
                </th>
              ))}
            </tr>
          </tbody>
        </table>
      </MarcoTabla>
      <p className="leyenda-inline">
        <span>{t.mejor}</span>
        <span>{t.limitante}</span>
        <span>{plantilla(t.formula, { max })}</span>
      </p>
      {r.alertas.length > 0 && (
        <div className="alertas-vigencia">
          <h3>{t.alertas}</h3>
          <ul className="pros">
            {r.alertas.map((a) => (
              <li key={`${a.evidencia_id}|${a.motivo}`} data-motivo={a.motivo}>
                {a.motivo === "madurez" ? <Alerta /> : <MarcaVigencia estado={a.motivo === "vencida" ? "vencido" : "revisar"} />}
                <span>
                  {a.motivo === "madurez"
                    ? plantilla(t.alertaMadurez, { plataforma: n(nombres.plataforma, a.plataforma_id), criterio: n(nombres.criterio, a.criterio_id), madurez: n(nombres.madurez, a.madurez), evidencia: a.evidencia_id })
                    : plantilla(t.alerta, { plataforma: n(nombres.plataforma, a.plataforma_id), criterio: n(nombres.criterio, a.criterio_id), estado: a.motivo === "vencida" ? vigencia.vencido : vigencia.revisar, dias: a.dias, evidencia: a.evidencia_id })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <details className="lectura-seccion escala">
        <summary>{plantilla(t.escala, { max })}</summary>
        <ul className="pros">
          {niveles.map((x) => (
            <li key={x.valor}>
              <span className="mono">{x.valor}</span>
              <span>
                {x.nombre}
                {x.valor === topeNoDisponible && <small>{t.topeNota}</small>}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

export function ProsContrasVista({ r, t, nombres, max, anclas }: { r: Evaluado; t: TC["pros"]; nombres: Nombres; max: number; anclas: { destaca: number; corta: number } }) {
  // En «se queda corta», «la mejor del conjunto» confunde (la mejor de un criterio en que todas quedan cortas): no se dice.
  const item = (x: ItemProsContras, corta = false) => {
    const extra = [x.la_mejor && !corta && t.mejor, x.esencial && t.esencial, x.tope_aplicado && plantilla(t.tope, { madurez: n(nombres.madurez, x.madurez) })].filter(Boolean).join(", ");
    return `${plantilla(t.item, { criterio: n(nombres.criterio, x.criterio_id), p: x.puntaje, max })}${extra ? `: ${extra}` : ""}`;
  };
  const porId = new Map(r.pros_contras.map((p) => [p.plataforma_id, p]));
  return (
    <>
      <div className={`kit-grid${r.orden.length >= 3 ? " tres" : ""}`}>
        {r.orden.map(({ plataforma_id }) => {
          const pc = porId.get(plataforma_id)!;
          return (
            <div key={plataforma_id} className="tarjeta pros-de" data-plataforma={plataforma_id}>
              <h3>{n(nombres.plataforma, plataforma_id)}</h3>
              <p className="ojo">{t.destaca}</p>
              {pc.destaca.length ? (
                <ul className="pros">
                  {pc.destaca.map((x) => (
                    <li key={x.criterio_id}>
                      <Ok />
                      <span>{item(x)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="kit-nota">{t.nadaDestaca}</p>
              )}
              <p className="ojo">{t.corta}</p>
              {pc.corta.length ? (
                <ul className="pros">
                  {pc.corta.map((x) => (
                    <li key={x.criterio_id}>
                      <Alerta />
                      <span>{item(x, true)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="kit-nota">{t.nadaCorta}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="kit-nota">{plantilla(t.nota, { destaca: anclas.destaca, corta: anclas.corta, max })}</p>
    </>
  );
}
