import type { ReactNode } from "react";
import { Alerta, Aspa, Ok } from "@/components/caso/Iconos";
import { contar, falladas, publicable, sembradosDetectados, type FilaValidacion, type Validacion } from "@/engine";
import { plantilla } from "@/lib/atlas/plantilla";
import { huellaCorta } from "@/lib/caso/formato";
import type { Idioma, Textos } from "@/lib/i18n";

// El instrumento en pantalla (maqueta instrumento.html; C15): el veredicto de publicación, las filas de validación y, si algo
// no pasó, el bloqueo. Presentación pura de un `Validacion`: no valida nada (eso lo hace `pnpm build`, RF-09.4). El estado
// rojo y el bloqueo no se publican nunca (el build se detiene antes), así que se prueban con una validación de ejemplo.

type T = Textos["instrumento"];
const cuenta = (filas: readonly { ok: boolean }[]) => {
  const c = contar(filas);
  return `${c.ok}/${c.total}`;
};

/** Una fila de validación: símbolo + texto + detalle (el color nunca va solo, regla 13); la fallida lleva borde discontinuo. */
export function FilaDeValidacion({ fila, idioma, extra }: { fila: FilaValidacion; idioma: Idioma; extra?: ReactNode }) {
  return (
    <li className={fila.ok ? "val" : "val val-falla"} data-ok={fila.ok ? "true" : "false"} data-validacion={fila.id}>
      {fila.ok ? <Ok /> : <Aspa />}
      <span>
        {fila.descripcion[idioma]}
        <small>
          {fila.detalle[idioma]}
          {extra}
        </small>
      </span>
    </li>
  );
}

function Bloque({ id, titulo, nota, conteo, falla, children }: { id: string; titulo: string; nota: string; conteo: ReactNode; falla?: boolean; children: ReactNode }) {
  return (
    <section className="seccion" aria-labelledby={`${id}-t`} data-bloque={id}>
      <h2 id={`${id}-t`}>{titulo}</h2>
      <p className="kit-nota">{nota}</p>
      <p className="conteo">
        <span className={falla ? "conteo-falla" : undefined}>{conteo}</span>
      </p>
      <ul className="pros val-lista">{children}</ul>
    </section>
  );
}

/** El bloqueo de publicación (DS v0.6): qué falló y qué no sale hasta volver a verde. */
export function BloqueoDePublicacion({ v, t, idioma }: { v: Validacion; t: T; idioma: Idioma }) {
  const nombres = { referencias: t.referencias.titulo, propiedades: t.propiedades.titulo, sembrados: t.sembrados.titulo, aprobaciones: t.aprobaciones.titulo };
  return (
    <div className="bloqueo" role="alert" data-bloqueo>
      <p className="ojo">{t.bloqueo.ojo}</p>
      <h2>
        <Aspa s={20} /> {t.bloqueo.titulo}
      </h2>
      <ul className="pros">
        {falladas(v).map(({ bloque, fila }) => (
          <li key={`${bloque}-${fila.id}`}>
            <Aspa />
            <span>{plantilla(t.bloqueo.fila, { bloque: nombres[bloque], descripcion: fila.descripcion[idioma], detalle: fila.detalle[idioma] })}</span>
          </li>
        ))}
        <li>
          <Alerta />
          <span>{t.bloqueo.salida}</span>
        </li>
        <li>
          <Alerta />
          <span>{t.bloqueo.nada}</span>
        </li>
        <li>
          <Alerta />
          <span>{t.bloqueo.destrabar}</span>
        </li>
      </ul>
    </div>
  );
}

export function PanelDeValidacion({ v, t, idioma }: { v: Validacion; t: T; idioma: Idioma }) {
  const verde = publicable(v);
  const s = sembradosDetectados(v);
  const huella = v.huellaNucleo ? huellaCorta(v.huellaNucleo) : null;
  return (
    <>
      <div className={verde ? "veredicto" : "veredicto veredicto-alerta"} role={verde ? undefined : "alert"} data-estado={verde ? "verde" : "rojo"}>
        <b>
          {verde ? <Ok /> : <Aspa />}
          {verde ? t.verde : t.rojo}
        </b>
        <span className="mono">
          {plantilla(t.resumen, { referencias: cuenta(v.referencias), propiedades: cuenta(v.propiedades), sembrados: `${s.ok}/${s.total}`, aprobaciones: cuenta(v.aprobaciones) })}
        </span>
      </div>
      {!verde && <BloqueoDePublicacion v={v} t={t} idioma={idioma} />}
      <div className="kit-grid">
        <Bloque id="referencias" titulo={t.referencias.titulo} nota={t.referencias.nota} conteo={cuenta(v.referencias).replace("/", " / ")} falla={v.referencias.some((f) => !f.ok)}>
          {v.referencias.map((f) => (
            <FilaDeValidacion key={f.id} fila={f} idioma={idioma} />
          ))}
        </Bloque>
        <Bloque id="propiedades" titulo={t.propiedades.titulo} nota={t.propiedades.nota} conteo={cuenta(v.propiedades).replace("/", " / ")} falla={v.propiedades.some((f) => !f.ok)}>
          {v.propiedades.map((f) => (
            <FilaDeValidacion key={f.id} fila={f} idioma={idioma} extra={<> · {plantilla(t.propiedades.corridas, { corridas: f.corridas, semilla: f.semilla })}</>} />
          ))}
        </Bloque>
      </div>
      <Bloque id="sembrados" titulo={t.sembrados.titulo} nota={t.sembrados.nota} conteo={plantilla(t.sembrados.detectados, { ok: s.ok, total: s.total })} falla={s.ok < s.total}>
        {v.sembrados.map((f) => (
          <FilaDeValidacion key={f.id} fila={f} idioma={idioma} />
        ))}
      </Bloque>
      <Bloque id="aprobaciones" titulo={t.aprobaciones.titulo} nota={t.aprobaciones.nota} conteo={cuenta(v.aprobaciones).replace("/", " / ")} falla={v.aprobaciones.some((f) => !f.ok)}>
        {v.aprobaciones.map((f) => (
          <FilaDeValidacion key={f.id} fila={f} idioma={idioma} />
        ))}
      </Bloque>
      <section className="seccion" aria-labelledby="motores-t" data-bloque="motores">
        <h2 id="motores-t">{t.motores.titulo}</h2>
        <p className="kit-nota">{t.motores.nota}</p>
        <p className="mono">
          {huella ? (
            <span className="huella">
              {t.huellaNucleo} sha256 <b>{huella.inicio}</b>…{huella.fin}
            </span>
          ) : (
            t.motores.sinHuella
          )}
        </p>
      </section>
    </>
  );
}
