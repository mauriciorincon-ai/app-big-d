import type { ReactNode } from "react";
import { Aspa, Ok, Pendiente } from "@/components/caso/Iconos";
import { plantilla } from "@/lib/atlas/plantilla";
import type { ItemVista, VistaHoja } from "@/lib/informe/vista";
import type { Textos } from "@/lib/i18n";

type T = Textos["caso"]["informe"];

// La hoja de ruta y el alistamiento (S6, `informe.html`): fases con sus ítems, cada uno con su tipo, su estado (glifo y
// palabra, nunca solo color), de dónde viene y cuándo está cumplido. Sin lógica: todo llega redactado desde la capa de vista.

const Estado = ({ estado, t }: { estado: ItemVista["estado"]; t: T }) => (
  <span className="item-estado">
    {estado === "hecho" ? (
      <Ok s={13} />
    ) : estado === "bloqueado" ? (
      <Aspa s={13} />
    ) : (
      <Pendiente s={13} />
    )}
    {t.item.estado[estado]}
  </span>
);

/** Un ítem de la hoja de ruta con su origen enlazado a donde se explica (decisión, riesgo o supuesto). */
export function Item({ i, t }: { i: ItemVista; t: T }) {
  return (
    <li className={`item item-${i.estado}`} id={`i-${i.id}`}>
      <div className="item-cab">
        <span className="cod mono">{i.id}</span>
        <span className="item-tipo">
          {i.tipo === "tarea" ? t.item.tipo.tarea : t.item.tipo.verificacion}
        </span>
        {i.unaVia && <span className="rev rev-una_via">{t.item.unaVia}</span>}
        <Estado estado={i.estado} t={t} />
      </div>
      <b>{i.descripcion}</b>
      <div className="item-origen">
        <a className={`origen origen-${i.origen.tipo}`} href={i.origen.ancla}>
          {i.origen.texto}
        </a>
        {i.momento && <span className="mono">{i.momento}</span>}
        {i.antes.length > 0 && (
          <span className="mono">
            {plantilla(t.item.antes, { ids: i.antes.join(", ") })}
          </span>
        )}
      </div>
      <small>{i.cumplido}</small>
      {i.responsable && <small>{i.responsable}</small>}
      {i.bloqueo && <p className="campo-aviso">{i.bloqueo}</p>}
    </li>
  );
}

export function Fases({ vista, t }: { vista: VistaHoja; t: T }) {
  return (
    <>
      {vista.ciclo && (
        <div className="veredicto veredicto-alerta" role="alert">
          <b>{vista.ciclo}</b>
          <span>{t.hoja.sinFaseNota}</span>
        </div>
      )}
      <ol className="fases">
        {vista.fases.map((f) => (
          <li key={f.fase} className="fase" id={`fase-${f.fase}`}>
            <h3>{f.titulo}</h3>
            <ul className="items">
              {f.items.map((i) => (
                <Item key={i.id} i={i} t={t} />
              ))}
            </ul>
          </li>
        ))}
        {vista.sinFase.length > 0 && (
          <li className="fase fase-sin" id="fase-sin">
            <h3>{t.hoja.sinFase}</h3>
            <ul className="items">
              {vista.sinFase.map((i) => (
                <Item key={i.id} i={i} t={t} />
              ))}
            </ul>
          </li>
        )}
      </ol>
    </>
  );
}

export function Alistamiento({ vista, t }: { vista: VistaHoja; t: T }) {
  return (
    <div className="kit-grid alist">
      {vista.alistamiento.map((c) => (
        <article
          key={c.categoria}
          className="tarjeta"
          id={`cat-${c.categoria}`}
        >
          <h3>
            <span>{c.nombre}</span>
            <span className="mono">
              {plantilla(t.alistamiento.progreso, { k: c.hechos, n: c.total })}
            </span>
          </h3>
          <ul className="items">
            {c.items.map((i) => (
              <Item key={i.id} i={i} t={t} />
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/** Las secciones 11 y 12 del informe: la misma hoja en pocas líneas por ítem, para el papel. */
export function HojaCompacta({ vista, t }: { vista: VistaHoja; t: T }) {
  const fila = (i: ItemVista): ReactNode => (
    <li key={i.id}>
      <span className="cod mono">{i.id}</span> {i.descripcion}{" "}
      <span className="mono">
        · {i.origen.texto} · {t.item.estado[i.estado]}
      </span>
    </li>
  );
  return (
    <>
      {vista.fases.map((f) => (
        <div key={f.fase}>
          <h3>{f.titulo}</h3>
          <ul className="inf-lista">{f.items.map(fila)}</ul>
        </div>
      ))}
      {vista.sinFase.length > 0 && (
        <div>
          <h3>{t.hoja.sinFase}</h3>
          <ul className="inf-lista">{vista.sinFase.map(fila)}</ul>
        </div>
      )}
    </>
  );
}

export function AlistamientoCompacto({ vista, t }: { vista: VistaHoja; t: T }) {
  return (
    <>
      {vista.alistamiento.map((c) => (
        <div key={c.categoria}>
          <h3>
            {c.nombre}{" "}
            <span className="mono">
              {plantilla(t.alistamiento.progreso, { k: c.hechos, n: c.total })}
            </span>
          </h3>
          <ul className="inf-lista">
            {c.items.map((i) => (
              <li key={i.id}>
                <span className="cod mono">{i.id}</span> {i.descripcion}{" "}
                <span className="mono">· {i.cumplido}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
