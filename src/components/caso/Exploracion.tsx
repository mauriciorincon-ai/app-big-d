"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { evaluar } from "@/engine/evaluar";
import type { Peticion, Respuesta } from "@/engine/protocolo";
import { comparar, racional } from "@/engine/racional";
import { totalesCon } from "@/engine/sensibilidad";
import { entradaSimulacion, rangoEntero, type ResultadoSimulacion } from "@/engine/simulacion";
import type { Entrada, Evento, Resultado, Sensibilidad } from "@/engine/tipos";
import { plantilla } from "@/lib/atlas/plantilla";
import { consultaExploracion, estadoExploracion, type EstadoExploracion } from "@/lib/caso/estado-exploracion";
import { pesosExplorados } from "@/lib/caso/explorar";
import { entero, lista, ordinal, peso, porcentaje, porMil, puntosRacional, semiamplitud } from "@/lib/caso/formato";
import { esRespuesta } from "@/lib/caso/respuesta";
import type { Idioma, Textos } from "@/lib/i18n";
import { BarraMini, BarraPeso } from "./Barras";
import { Alerta, Estrella, Ok } from "./Iconos";
import { MarcoTabla } from "./MarcoTabla";

// Sensibilidad de un factor y robustez por simulación (maqueta comparacion.html, vistas b y c; D-S3-06 a D-S3-08). El
// criterio y el peso explorados viven en la URL; los totales y los eventos salen de la fórmula racional exacta del
// núcleo, sin barrido. La robustez con los pesos del perfil llega calculada en el build; al explorar otro peso, el Worker
// la recalcula con los pesos enteros repartidos por restos mayores, por pasos, cancelable, y la pantalla lee cada
// mensaje con la guarda del contrato (sin Zod en el navegador). Nada de esto puntúa: el núcleo ya puntuó.

type Evaluado = Extract<Resultado, { tipo: "evaluado" }>;
type TC = Textos["caso"]["comparacion"];

/** Intentos por paso del Worker: entre paso y paso cede el turno (cancelar llega a tiempo) y avisa el progreso. */
const INTENTOS_POR_PASO = 4000;
/** Espera tras el último movimiento antes de escribir la URL y simular (history.replaceState tiene cupo en Safari). */
const ESPERA_MS = 300;

const oyentes = new Set<() => void>();
function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("popstate", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("popstate", avisar);
  };
}
function escribir(consulta: string) {
  if (consulta === window.location.search) return;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${consulta}${window.location.hash}`);
  for (const avisar of oyentes) avisar();
}

const clave = (e: EstadoExploracion) => `${e.criterio}|${e.t}`;

interface Mostrada {
  res: ResultadoSimulacion;
  /** Los pesos con que se simuló, en el orden de `res.criterios`. */
  pesos: number[];
  etiqueta: string;
  delPerfil: boolean;
}

type Robustez =
  | { clave: string; estado: "curso"; progreso: Extract<Respuesta, { tipo: "progreso" }> | null }
  | { clave: string; estado: "listo"; mostrada: Mostrada }
  | { clave: string; estado: "cancelada" }
  | { clave: string; estado: "error"; mensaje: string };

export interface PropsExploracion {
  idioma: Idioma;
  t: { s: TC["sensibilidad"]; r: TC["robustez"]; esencial: string; y: string };
  entrada: Entrada;
  resultado: Evaluado;
  simulacion: ResultadoSimulacion | null;
  nombres: { plataforma: Record<string, string>; criterio: Record<string, string> };
}

export function Exploracion({ idioma, t, entrada, resultado, simulacion, nombres }: PropsExploracion) {
  const { caso, base } = entrada;
  const max = base.escala.max;
  const paso = base.convenciones.sensibilidad.paso_centesimas;
  const umbral = peso(base.convenciones.umbral_empate_centesimas, idioma);
  const nomP = (id: string) => nombres.plataforma[id] ?? id;
  const nomC = (id: string) => nombres.criterio[id] ?? id;
  const pesoDe = (c: string) => caso.pesos.find((p) => p.criterio_id === c)!;

  const consulta = useSyncExternalStore(
    suscribir,
    () => window.location.search,
    () => "",
  );
  const desdeUrl = estadoExploracion(consulta, caso.pesos, resultado.sensibilidad, paso);
  // Mientras se arrastra el control, el peso vive aquí; la URL se escribe al soltar (o tras la espera).
  const [arrastre, setArrastre] = useState<EstadoExploracion | null>(null);
  const actual = arrastre && arrastre.criterio === desdeUrl.criterio ? arrastre : desdeUrl;
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fijar = (e: EstadoExploracion, inmediato: boolean) => {
    if (espera.current) clearTimeout(espera.current);
    setArrastre(e);
    const escribirYa = () => {
      escribir(consultaExploracion(e, caso.pesos, window.location.search));
      setArrastre(null);
    };
    if (inmediato) escribirYa();
    else espera.current = setTimeout(escribirYa, ESPERA_MS);
  };

  const s = resultado.sensibilidad.find((x) => x.criterio_id === actual.criterio)!;
  const w = pesoDe(actual.criterio);

  // ── Robustez: la del perfil viene del build; la de un peso explorado, del Worker ─────────────────────────────────
  const delPerfil: Mostrada | null = simulacion ? { res: simulacion, pesos: [...caso.pesos].sort((a, b) => (a.criterio_id < b.criterio_id ? -1 : 1)).map((p) => p.peso), etiqueta: t.r.pesosPerfil, delPerfil: true } : null;
  const [rob, setRob] = useState<Robustez | null>(null);
  const [ultima, setUltima] = useState<Mostrada | null>(null);
  const trabajador = useRef<Worker | null>(null);
  const vigente = useRef<{ id: number; clave: string; pesos: number[]; etiqueta: string } | null>(null);
  const contador = useRef(0);

  const confirmado = clave(desdeUrl);
  const esDelPerfil = desdeUrl.t === pesoDe(desdeUrl.criterio).peso;

  useEffect(() => {
    if (!simulacion || esDelPerfil) {
      if (vigente.current && trabajador.current) trabajador.current.postMessage({ tipo: "cancelar", id: vigente.current.id } satisfies Peticion);
      vigente.current = null;
      return;
    }
    const pesos = pesosExplorados(caso.pesos, desdeUrl.criterio, desdeUrl.t);
    const e2: Entrada = { caso: { ...caso, pesos }, base };
    const r2 = evaluar(e2);
    const es = r2.tipo === "evaluado" ? entradaSimulacion(e2, r2) : null;
    if (!es) return;
    if (!trabajador.current) {
      const nuevo = new Worker(new URL("../../workers/simulacion.worker.ts", import.meta.url), { type: "module" });
      nuevo.onmessage = (ev: MessageEvent<unknown>) => {
        const m = ev.data;
        const v = vigente.current;
        if (!esRespuesta(m) || !v || m.id !== v.id) return;
        if (m.tipo === "progreso") setRob({ clave: v.clave, estado: "curso", progreso: m });
        else if (m.tipo === "error") setRob({ clave: v.clave, estado: "error", mensaje: m.mensaje });
        else {
          const mostrada = { res: m.resultado, pesos: v.pesos, etiqueta: v.etiqueta, delPerfil: false };
          setRob({ clave: v.clave, estado: "listo", mostrada });
          setUltima(mostrada);
          vigente.current = null;
        }
      };
      trabajador.current = nuevo;
    }
    const id = ++contador.current;
    vigente.current = { id, clave: confirmado, pesos: es.pesos, etiqueta: plantilla(t.r.pesosExplorados, { criterio: nomC(desdeUrl.criterio), t: peso(desdeUrl.t, idioma) }) };
    trabajador.current.postMessage({ tipo: "simular", id, entrada: es, paso: INTENTOS_POR_PASO } satisfies Peticion);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la simulación depende solo del estado confirmado en la URL
  }, [confirmado]);

  useEffect(
    () => () => {
      trabajador.current?.terminate();
      if (espera.current) clearTimeout(espera.current);
    },
    [],
  );

  const cancelar = () => {
    const v = vigente.current;
    if (!v || !trabajador.current) return;
    trabajador.current.postMessage({ tipo: "cancelar", id: v.id } satisfies Peticion);
    vigente.current = null;
    setRob({ clave: v.clave, estado: "cancelada" });
  };

  const respaldo = ultima ?? delPerfil;
  let robustez: ReactNode;
  if (!simulacion || !delPerfil) robustez = <p className="kit-nota">{t.r.noAplica}</p>;
  else if (esDelPerfil) robustez = <VistaRobustez m={delPerfil} {...{ idioma, t, resultado, nombres, base: entrada.base, umbral, s: resultado.sensibilidad, pesosCaso: caso.pesos }} />;
  else if (rob?.clave === confirmado && rob.estado === "listo") robustez = <VistaRobustez m={rob.mostrada} {...{ idioma, t, resultado, nombres, base: entrada.base, umbral, s: resultado.sensibilidad, pesosCaso: caso.pesos }} />;
  else if (rob?.clave === confirmado && rob.estado === "error") robustez = <div className="estado estado-error" role="alert"><p>{plantilla(t.r.error, { mensaje: rob.mensaje })}</p></div>;
  else if (rob?.clave === confirmado && rob.estado === "cancelada")
    robustez = (
      <>
        <p className="campo-aviso" role="status">
          <Alerta />
          {plantilla(t.r.cancelada, { pesos: plantilla(t.r.pesosExplorados, { criterio: nomC(desdeUrl.criterio), t: peso(desdeUrl.t, idioma) }), anteriores: respaldo!.etiqueta })}
        </p>
        <VistaRobustez m={respaldo!} {...{ idioma, t, resultado, nombres, base: entrada.base, umbral, s: resultado.sensibilidad, pesosCaso: caso.pesos }} />
      </>
    );
  else {
    const p = rob?.clave === confirmado && rob.estado === "curso" ? rob.progreso : null;
    const objetivo = base.convenciones.simulacion.aceptadas;
    const semillas = 1 + base.convenciones.simulacion.semillas_estabilidad.length;
    const hechas = p ? p.indice * p.objetivo + p.aceptadas : 0;
    robustez = (
      <div className="estado" role="status" data-simulacion="curso">
        <b>{t.r.curso}</b>
        <p className="mono">{plantilla(t.r.progreso, { a: entero(p?.aceptadas ?? 0, idioma), K: entero(objetivo, idioma), semilla: p?.semilla ?? base.convenciones.simulacion.semilla, i: (p?.indice ?? 0) + 1, n: semillas })}</p>
        <progress className="progreso" value={hechas} max={semillas * objetivo} aria-label={t.r.curso} />
        <p>{t.r.cursoNota}</p>
        <button type="button" className="boton boton-sec" onClick={cancelar}>
          {t.r.cancelar}
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="seccion" id="sens" aria-labelledby="sens-t">
        <h2 id="sens-t">{t.s.titulo}</h2>
        <p className="kit-nota">{t.s.nota}</p>
        <div className="filtros">
          <label className="campo">
            <span className="campo-etiqueta">{t.s.criterio}</span>
            <span className="select">
              <select value={actual.criterio} onChange={(ev) => fijar({ criterio: ev.target.value, t: pesoDe(ev.target.value).peso }, true)}>
                {caso.pesos.map((p) => (
                  <option key={p.criterio_id} value={p.criterio_id}>
                    {`${nomC(p.criterio_id)} · ${peso(p.peso, idioma)}`}
                  </option>
                ))}
              </select>
              <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M-4,-1.5 L0,2.5 L4,-1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </label>
        </div>
        <Sensibilidad1 {...{ idioma, t, s, w: w.peso, rangoPct: w.rango_pct, esencial: w.esencial, actual, fijar, nomP, nomC, resultado, entrada, max, umbral, paso }} />
      </section>
      <section className="seccion" id="rob" aria-labelledby="rob-t">
        <h2 id="rob-t">{t.r.titulo}</h2>
        <p className="kit-nota">{plantilla(t.r.nota, { K: entero(base.convenciones.simulacion.aceptadas, idioma) })}</p>
        {robustez}
      </section>
    </>
  );
}

function Sensibilidad1({ idioma, t, s, w, rangoPct, esencial, actual, fijar, nomP, nomC, resultado, entrada, max, umbral, paso }: { idioma: Idioma; t: PropsExploracion["t"]; s: Sensibilidad; w: number; rangoPct: number; esencial: boolean; actual: EstadoExploracion; fijar: (e: EstadoExploracion, inmediato: boolean) => void; nomP: (id: string) => string; nomC: (id: string) => string; resultado: Evaluado; entrada: Entrada; max: number; umbral: string; paso: number }) {
  const nombre = nomC(s.criterio_id);
  if (s.estado === "indefinida") return <p className="kit-nota">{t.s.indefinida}</p>;
  if (s.estado === "rango-vacio") {
    const ev = s.minimo_que_invierte;
    return (
      <>
        <p className="kit-nota">{t.s.rangoVacio}</p>
        {ev?.rejilla != null && <p>{plantilla(t.s.minimoQueInvierte, { t: peso(ev.rejilla, idioma), plataforma: lista(ev.despues.map(nomP), t.y) })}</p>}
      </>
    );
  }
  const [lo, hi] = rangoEntero(w, rangoPct);
  const enW = racional(w);
  const visibles = s.eventos.filter((e) => e.rejilla !== null);
  const lado = (e: Evento) => comparar(e.t, enW) < 0;
  const frase = (e: Evento): { texto: string; nota: string } => {
    const abajo = lado(e);
    const l = plantilla(abajo ? t.s.abajo : t.s.arriba, { t: peso(e.rejilla!, idioma) });
    const lejos = abajo ? e.antes : e.despues;
    const nombres = lista(lejos.map(nomP), t.y);
    if (e.tipo === "lider") return { texto: plantilla(lejos.length > 1 ? t.s.lider[1] : t.s.lider[0], { lado: l, plataformas: nombres }), nota: t.s.exacto };
    if (e.tipo === "puesto-2" || e.tipo === "puesto-3") return { texto: plantilla(lejos.length > 1 ? t.s.puesto[1] : t.s.puesto[0], { lado: l, plataformas: nombres, k: ordinal(e.tipo === "puesto-2" ? 2 : 3, idioma) }), nota: t.s.puestoNota };
    const hay = (e.tipo === "empate-entra") !== abajo;
    return { texto: plantilla(hay ? t.s.hayEmpate : t.s.noHayEmpate, { lado: l }), nota: plantilla(t.s.bandaNota, { umbral }) };
  };
  const lideres = visibles.filter((e) => e.tipo === "lider");
  const empates = visibles.filter((e) => e.tipo === "empate-entra" || e.tipo === "empate-sale");
  const puestos = visibles.filter((e) => e.tipo === "puesto-2" || e.tipo === "puesto-3");
  const filas = [...new Set([0, ...lideres.map((e) => e.rejilla!), w, s.hasta, actual.t])].filter((x) => x % paso === 0 || x === w || x === s.hasta).sort((a, b) => a - b);
  const plataformas = resultado.orden.map((p) => p.plataforma_id);
  const totales = (x: number) => totalesCon(resultado.celdas, resultado.evaluadas, entrada.caso, s.criterio_id, x);
  const primero = resultado.orden.filter((p) => p.posicion === 1).map((p) => p.plataforma_id);
  const meta = [
    s.hasta === 10_000 ? t.s.rangoTope : plantilla(t.s.rango, { hasta: peso(s.hasta, idioma) }),
    ...(lideres.length ? lideres.map((e) => plantilla(t.s.inversion, { t: peso(e.rejilla!, idioma) })) : [t.s.sinInversion]),
    ...empates.map((e) => plantilla((e.tipo === "empate-entra") !== lado(e) ? t.s.entraEmpate : t.s.saleEmpate, { t: peso(e.rejilla!, idioma) })),
  ];
  return (
    <div className="dos">
      <div className="peso">
        <div className="peso-cabeza">
          <b>
            {nombre}
            {esencial && <Estrella titulo={t.esencial} />}
          </b>
          <output className="mono" htmlFor="peso-explorado">
            {peso(actual.t, idioma)}
          </output>
        </div>
        <div className="mover">
          <BarraPeso escala={s.hasta} rango={[lo, Math.min(hi, s.hasta)]} marcas={s.eventos.filter((e) => e.tipo === "lider" || e.tipo === "empate-entra" || e.tipo === "empate-sale").map((e) => ({ t: e.t.n / e.t.d, tipo: e.tipo === "lider" ? "inversion" : "empate" }))} />
          <input
            id="peso-explorado"
            type="range"
            min={0}
            max={s.hasta}
            step={paso}
            value={actual.t}
            aria-label={plantilla(t.s.control, { criterio: nombre })}
            aria-valuetext={peso(actual.t, idioma)}
            onChange={(ev) => fijar({ criterio: s.criterio_id, t: Number(ev.target.value) }, false)}
          />
        </div>
        <p className="peso-meta">
          {meta.map((x, i) => (
            <span key={i}>
              {x}
              {i < meta.length - 1 && <span aria-hidden="true"> ·</span>}
            </span>
          ))}
        </p>
        <p className="kit-nota">{t.s.reparto}</p>
      </div>
      <div className="tarjeta">
        <h3>{t.s.cambia}</h3>
        <ul className="pros">
          {lideres.length === 0 && (
            <li>
              <Ok />
              <span>{plantilla(t.s.sigue, { plataforma: lista(primero.map(nomP), t.y) })}</span>
            </li>
          )}
          {visibles.map((e, i) => {
            const f = frase(e);
            return (
              <li key={i} data-evento={e.tipo}>
                {e.tipo === "lider" ? <Alerta /> : <Ok />}
                <span>
                  {f.texto}
                  <small>{f.nota}</small>
                </span>
              </li>
            );
          })}
          {puestos.length === 0 && plataformas.length > 2 && (
            <li>
              <Ok />
              <span>{t.s.sinCambiosPuestos}</span>
            </li>
          )}
        </ul>
        <MarcoTabla etiqueta={t.s.tabla}>
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">{t.s.peso}</th>
                {plataformas.map((p) => (
                  <th key={p} scope="col">
                    {nomP(p)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((x) => {
                const tot = new Map(totales(x).map((r) => [r.plataforma_id, r.unidades]));
                return (
                  <tr key={x} aria-current={x === actual.t ? "true" : undefined} data-peso={x}>
                    <td className="mono">
                      {peso(x, idioma)}
                      {x === w && <small> · {t.s.actual}</small>}
                      {x === actual.t && x !== w && <small> · {t.s.explorado}</small>}
                    </td>
                    {plataformas.map((p) => (
                      <td key={p} className="mono">
                        {puntosRacional(tot.get(p)!, max, idioma)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </MarcoTabla>
      </div>
    </div>
  );
}

function VistaRobustez({ m, idioma, t, resultado, nombres, base, umbral, s, pesosCaso }: { m: Mostrada; idioma: Idioma; t: PropsExploracion["t"]; resultado: Evaluado; nombres: PropsExploracion["nombres"]; base: Entrada["base"]; umbral: string; s: Sensibilidad[]; pesosCaso: Entrada["caso"]["pesos"] }) {
  const { res } = m;
  const nomP = (id: string) => nombres.plataforma[id] ?? id;
  const nomC = (id: string) => nombres.criterio[id] ?? id;
  const r = t.r;
  if (res.estado === "tope-de-intentos")
    return (
      <div className="estado estado-error" role="alert" data-simulacion="tope">
        <p>{plantilla(r.tope, { tope: entero(base.convenciones.simulacion.tope_intentos, idioma) })}</p>
      </div>
    );
  const p0 = res.semillas[0]!;
  const KL = p0.aceptadas * res.L;
  const N = res.plataformas.length;
  const idx = new Map(res.plataformas.map((p, i) => [p, i]));
  const filas = resultado.orden.map((p) => p.plataforma_id).filter((p) => idx.has(p));
  const g = res.ganadora;
  const gi = g === null ? -1 : idx.get(g)!;
  const conv = base.convenciones;
  const primeraDe = (p: string) => p0.aceptabilidad[idx.get(p)!]![0]!;
  const segunda = filas.filter((p) => p !== g).sort((a, b) => primeraDe(b) - primeraDe(a))[0];
  return (
    <div className="dos" data-simulacion="lista">
      <div>
        <p className="kit-nota">{plantilla(r.pesosDe, { pesos: m.etiqueta })}</p>
        <MarcoTabla etiqueta={r.titulo}>
          <table className="tabla acept">
            <thead>
              <tr>
                <th scope="col">{r.plataforma}</th>
                {Array.from({ length: N }, (_, k) => (
                  <th key={k} scope="col">
                    {plantilla(k === 0 ? r.primero : r.puesto, { k: ordinal(k + 1, idioma) })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => {
                const i = idx.get(p)!;
                return (
                  <tr key={p} data-plataforma={p}>
                    <th scope="row">{nomP(p)}</th>
                    {p0.aceptabilidad[i]!.map((c, k) => (
                      <td key={k} className="mono" data-gris={i === gi && k === 0 && p0.zona_gris ? "" : undefined}>
                        <BarraMini porMil={porMil(c, KL)} />
                        {porcentaje(c, KL, idioma)} %
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </MarcoTabla>
        <p className="leyenda-inline">
          <span className="umbral">{plantilla(r.umbrales, { robusta: conv.robustez.robusta_pct, fragil: conv.robustez.fragil_pct })}</span>
        </p>
      </div>
      <div className="tarjeta">
        {g === null || res.clase === null ? (
          <p>{r.sinGanadora}</p>
        ) : (
          <>
            <h3>{plantilla(r.tituloClase, { clase: r.clase[res.clase] })}</h3>
            <p>
              {plantilla(r.primera, { plataforma: nomP(g), pct: porcentaje(primeraDe(g), KL, idioma), K: entero(p0.aceptadas, idioma) })} {plantilla(r.intervalo, { ic: semiamplitud(p0.semiamplitud_centesimas ?? 0, idioma) })}
            </p>
            <p>{plantilla(r.cerca, { pct: porcentaje(p0.cerca, p0.aceptadas, idioma), umbral })}</p>
            <p>{res.estable ? plantilla(r.estable, { n: res.semillas.length - 1 }) : r.inestable}</p>
            {p0.zona_gris && <p>{r.zonaGris}</p>}
          </>
        )}
        <p className="mono">{plantilla(r.metodo, { semilla: p0.semilla, K: entero(p0.aceptadas, idioma), intentos: entero(p0.intentos, idioma) })}</p>
        {segunda && g !== null && <Creer {...{ p: segunda, m, idioma, t, nomP, nomC, primera: primeraDe(segunda), KL, aceptadas: p0.aceptadas, idx, s, pesosCaso }} />}
      </div>
    </div>
  );
}

function Creer({ p, m, idioma, t, nomP, nomC, primera, KL, aceptadas, idx, s, pesosCaso }: { p: string; m: Mostrada; idioma: Idioma; t: PropsExploracion["t"]; nomP: (id: string) => string; nomC: (id: string) => string; primera: number; KL: number; aceptadas: number; idx: Map<string, number>; s: Sensibilidad[]; pesosCaso: Entrada["caso"]["pesos"] }) {
  const r = t.r;
  const { res } = m;
  let frase: string;
  if (primera === 0) frase = plantilla(r.nunca, { K: entero(aceptadas, idioma) });
  else {
    const central = res.semillas[0]!.central[idx.get(p)!]!;
    let j = 0;
    central.forEach((c, k) => {
      if (Math.abs(c - m.pesos[k]!) > Math.abs(central[j]! - m.pesos[j]!)) j = k;
    });
    frase = plantilla(r.gana, { pct: porcentaje(primera, KL, idioma), criterio: nomC(res.criterios[j]!), central: peso(central[j]!, idioma), peso: peso(m.pesos[j]!, idioma) });
  }
  // Con los pesos del perfil, la sensibilidad dice dónde pasaría al primer lugar (el evento más cercano a su peso).
  let tendria: string | null = null;
  if (m.delPerfil) {
    const candidatos = s.flatMap((x) => (x.estado === "calculada" ? x.eventos.filter((e) => e.tipo === "lider" && e.rejilla !== null).map((e) => ({ x, e })) : []));
    const suyos = candidatos.filter(({ x, e }) => (comparar(e.t, racional(x.peso)) < 0 ? e.antes : e.despues).join() === p);
    const cerca = suyos.sort((a, b) => Math.abs(a.e.rejilla! - a.x.peso) - Math.abs(b.e.rejilla! - b.x.peso))[0];
    if (cerca) {
      const w = pesosCaso.find((x) => x.criterio_id === cerca.x.criterio_id)!;
      const [lo, hi] = rangoEntero(w.peso, w.rango_pct);
      const g = cerca.e.rejilla!;
      tendria = plantilla(r.tendria, {
        criterio: nomC(cerca.x.criterio_id),
        lado: comparar(cerca.e.t, racional(w.peso)) < 0 ? r.porDebajo : r.porEncima,
        t: peso(g, idioma),
        donde: plantilla(g >= lo && g <= hi ? r.dentroRango : r.fueraRango, { lo: peso(lo, idioma), hi: peso(hi, idioma) }),
      });
    }
  }
  return (
    <>
      <h3>{plantilla(r.creer, { plataforma: nomP(p) })}</h3>
      <p>
        {frase}
        {tendria && ` ${tendria}`}
      </p>
    </>
  );
}
