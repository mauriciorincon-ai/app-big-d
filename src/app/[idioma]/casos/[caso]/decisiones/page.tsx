import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ControlLienzo } from "@/components/atlas/ControlLienzo";
import { PanelFicha } from "@/components/atlas/PanelFicha";
import { Ok, Pendiente } from "@/components/caso/Iconos";
import { Meta } from "@/components/Meta";
import { Pestanas } from "@/components/Pestanas";
import {
  Alertas,
  AprobarPlan,
  Leyenda,
  LecturaOndas,
  TablaAccion,
  TablaRiesgos,
  TarjetasSupuestos,
} from "@/components/plan/Plan";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { conocimiento } from "@/lib/caso/casos";
import { lista } from "@/lib/caso/formato";
import { pestanasCaso } from "@/lib/caso/rutas";
import { huellaPlan } from "@/lib/datos/instantanea";
import { esIdioma, textos } from "@/lib/i18n";
import { comandoAprobarPlan } from "@/lib/investigador/comando-plan";
import { vistaDecisiones } from "@/lib/plan/vista";
import "@/styles/secciones.css";
import "@/styles/caso.css";
import "@/styles/decisiones.css";

// 09 Decisiones y riesgos (maqueta decisiones.html; C16–C18): el plan del caso. Las decisiones por ondas con las de una
// vía primero, la ficha de cada una con lo que dice la base aprobada de cada plataforma, los riesgos por prioridad de
// acción con su mitigación y su residual, y los supuestos con su prueba barata (una tarea para el equipo: la app no la
// ejecuta). Lo calcula el núcleo en el build; el plan se aprueba con un comando que corre una persona.
export const dynamicParams = false;

export function generateStaticParams() {
  return conocimiento().planes.map((p) => ({ caso: p.caso_id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[idioma]/casos/[caso]/decisiones">): Promise<Metadata> {
  const { idioma, caso } = await params;
  const c = conocimiento().casos.find((x) => x.id === caso);
  if (!esIdioma(idioma) || !c) return {};
  return {
    title: `${c.nombre[idioma]} · ${textos(idioma).secciones.decisiones}`,
  };
}

export default async function Decisiones({
  params,
}: PageProps<"/[idioma]/casos/[caso]/decisiones">) {
  const { idioma, caso: id } = await params;
  const k = conocimiento();
  const caso = k.casos.find((x) => x.id === id);
  const plan = k.planes.find((p) => p.caso_id === id);
  if (!esIdioma(idioma) || !caso || !plan) notFound();
  const T = textos(idioma);
  const t = T.caso.decisiones;
  const v = vistaDecisiones(k, caso, plan, idioma);
  const { resultado: r } = v;
  const aprobado = plan.estado_aprobacion === "aprobado";

  const altos = r.riesgos.filter(
    (x) => x.prioridad_de_accion === "alta",
  ).length;
  const sinProbar = plan.supuestos.filter(
    (s) => s.estado === "sin_probar",
  ).length;
  const unaVia = plan.decisiones.filter(
    (d) => d.reversibilidad === "una_via",
  ).length;
  const implicitas = plan.decisiones.filter((d) => d.implicita).length;
  const bloqueos = r.informe.bloqueantes.map((b) =>
    plantilla(t.aprobar.bloqueantes[b.tipo], { ids: lista(b.ids, T.caso.y) }),
  );
  const alta = r.riesgos.filter((x) => x.bloqueante);
  const comando =
    r.aprobable && !aprobado
      ? comandoAprobarPlan(plan.caso_id, huellaPlan(plan))
      : null;

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{caso.nombre[idioma]}</h1>
          <p className="sub">{t.sub}</p>
          <Meta
            items={[
              <b key="p">
                {aprobado ? <Ok /> : <Pendiente />}
                {aprobado ? t.planAprobado : t.planBorrador}
              </b>,
              [
                plural(t.meta.decisiones, plan.decisiones.length),
                plantilla(t.meta.unaVia, { n: unaVia }),
                plural(t.meta.implicitas, implicitas),
              ].join(" · "),
              [
                plural(t.meta.riesgos, plan.modos_de_falla.length),
                plantilla(t.meta.altos, { n: altos }),
              ].join(" · "),
              [
                plural(t.meta.supuestos, plan.supuestos.length),
                plantilla(t.meta.sinProbar, { n: sinProbar }),
              ].join(" · "),
              plantilla(t.evaluacion, { fecha: caso.fecha_evaluacion }),
            ]}
          />
        </div>
      </div>
      <Pestanas
        etiqueta={T.secciones.etiqueta}
        pestanas={pestanasCaso(T.secciones, idioma, caso.id, "decisiones")}
      />

      <ul className="niveles kit-niveles" aria-label={t.vistas.etiqueta}>
        {(
          [
            ["a", "#ondas", t.vistas.decisiones],
            ["b", "#riesgos", t.vistas.riesgos],
            ["c", "#supuestos", t.vistas.supuestos],
          ] as const
        ).map(([n, ruta, texto]) => (
          <li key={n}>
            <a href={ruta}>
              <span className="n">{n}</span>
              {texto}
            </a>
          </li>
        ))}
      </ul>

      <section className="seccion" id="ondas" aria-labelledby="ond-t">
        <h2 id="ond-t">{t.ondas.titulo}</h2>
        <p className="kit-nota">{t.ondas.nota}</p>
        {v.cicloNombres && (
          <div className="veredicto veredicto-alerta" role="alert">
            <b>{t.ciclo.alerta}</b>
            <span>{v.cicloNombres.join(" → ")}</span>
            <span className="mono">
              {plantilla(t.ciclo.calculo, {
                ondas: r.informe.ondas.length,
                sin: v.sinOnda.length,
              })}
            </span>
          </div>
        )}
        {v.cicloNombres && <p className="kit-nota">{t.ciclo.nota}</p>}
        <Leyenda t={t} />
        <section className="mapa" id="mapa" aria-label={t.ondas.titulo}>
          <ul className="indice" aria-label={t.ondas.indice}>
            {v.ondas.columnas.map((c, i) => (
              <li key={c.id}>
                <button type="button" data-col={c.id} data-x={c.x}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  {c.titulo}
                </button>
              </li>
            ))}
          </ul>
          <p className="pista">{t.ondas.pista}</p>
          <a className="saltar-diagrama" href="#lectura">
            {t.ondas.saltar}
          </a>
          <div className="lienzo-marco">
            {/* El SVG lo generó el build desde el plan validado (ondas-svg.ts); no lleva datos del visitante. */}
            <div
              className="lienzo"
              tabIndex={0}
              role="region"
              aria-label={t.ondas.lienzo}
              dangerouslySetInnerHTML={{ __html: v.ondas.svg }}
            />
          </div>
        </section>
        <LecturaOndas filas={v.lectura} t={t} />
      </section>
      <ControlLienzo mapa="mapa" />
      <PanelFicha
        fichas={v.fichas}
        titulo={t.ficha.titulo}
        cerrar={t.ficha.cerrar}
        objetivo=".lienzo .dd-dec"
        clave="data-decision"
      />

      {r.alertas.length > 0 && (
        <section className="seccion" id="alertas" aria-labelledby="ale-t">
          <h2 id="ale-t">{t.alertas.titulo}</h2>
          <Alertas
            alertas={r.alertas}
            nombre={v.nombre}
            nombrePlataforma={v.nombrePlataforma}
            supuestos={plan.supuestos}
            idioma={idioma}
            t={t}
          />
        </section>
      )}

      <section className="seccion" id="riesgos" aria-labelledby="rie-t">
        <h2 id="rie-t">{t.riesgos.titulo}</h2>
        <p className="kit-nota">{t.riesgos.nota}</p>
        {alta.length > 0 && (
          <div className="veredicto veredicto-alerta" role="alert">
            <b>{t.riesgos.alertaTitulo}</b>
            <span>
              {plantilla(t.riesgos.alertaCuerpo, {
                ids: lista(
                  alta.map((x) => x.id),
                  T.caso.y,
                ),
              })}
            </span>
          </div>
        )}
        <TablaRiesgos
          riesgos={r.riesgos}
          plan={plan}
          nombre={v.nombre}
          idioma={idioma}
          t={t}
        />
        <p className="leyenda-inline">
          <span>{t.riesgos.orden}</span>
        </p>
        <p className="kit-nota">{t.riesgos.origen}</p>
        <TablaAccion t={t} />
      </section>

      <section className="seccion" id="supuestos" aria-labelledby="sup-t">
        <h2 id="sup-t">{t.supuestos.titulo}</h2>
        <TarjetasSupuestos
          supuestos={plan.supuestos}
          nombre={v.nombre}
          alertas={r.alertas}
          idioma={idioma}
          t={t}
        />
        <p className="kit-nota">{t.supuestos.nota}</p>
      </section>

      <AprobarPlan
        plan={plan}
        comando={comando}
        bloqueos={bloqueos}
        idioma={idioma}
      />
    </>
  );
}
