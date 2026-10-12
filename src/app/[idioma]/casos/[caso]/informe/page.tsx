import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Matriz,
  ProsContrasVista,
  Totales,
  type Nombres,
} from "@/components/caso/Comparacion";
import { Ok, Pendiente } from "@/components/caso/Iconos";
import {
  Alertas,
  TablaRiesgos,
  TarjetasSupuestos,
} from "@/components/plan/Plan";
import {
  Alistamiento,
  AlistamientoCompacto,
  Fases,
  HojaCompacta,
} from "@/components/informe/Hoja";
import {
  AlertasEvidencia,
  Ficha,
  Implicitas,
  Relato,
  RobustezEstatica,
  Resumen,
  Sec,
  SeccionCaso,
  TablaDecisiones,
} from "@/components/informe/Informe";
import { Imprimir } from "@/components/informe/Imprimir";
import { Meta } from "@/components/Meta";
import { Pestanas } from "@/components/Pestanas";
import { SECCIONES } from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { conocimiento } from "@/lib/caso/casos";
import { huellaCorta } from "@/lib/caso/formato";
import { pestanasCaso } from "@/lib/caso/rutas";
import { esIdioma, textos } from "@/lib/i18n";
import { construirInforme } from "@/lib/informe/construir";
import {
  lecturaDelResumen,
  motivoDeComparacion,
  nombresDe,
  parrafoResumen,
  relatoGenerado,
} from "@/lib/informe/narrativa";
import { motivosDeBorrador, vistaHoja } from "@/lib/informe/vista";
import "@/styles/informe.css";

// 10 Hoja de ruta e informe (maqueta informe.html; C19–C20): las fases por dependencias con cada ítem y su origen, el
// alistamiento por categoría y el informe de 14 secciones, en el idioma de la página, imprimible. Lo calcula el núcleo en el
// build; el texto sale de plantillas redactadas en cada idioma, jamás de un modelo de lenguaje. Con perfil o plan sin aprobar
// el informe lo dice arriba: es un borrador, no el informe final (RF-05.5).
export const dynamicParams = false;

export function generateStaticParams() {
  return conocimiento().planes.map((p) => ({ caso: p.caso_id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[idioma]/casos/[caso]/informe">): Promise<Metadata> {
  const { idioma, caso } = await params;
  const c = conocimiento().casos.find((x) => x.id === caso);
  if (!esIdioma(idioma) || !c) return {};
  return { title: `${c.nombre[idioma]} · ${textos(idioma).secciones.informe}` };
}

export default async function InformePagina({
  params,
}: PageProps<"/[idioma]/casos/[caso]/informe">) {
  const { idioma, caso: id } = await params;
  const k = conocimiento();
  const caso = k.casos.find((x) => x.id === id);
  const plan = k.planes.find((p) => p.caso_id === id);
  if (!esIdioma(idioma) || !caso || !plan) notFound();
  const T = textos(idioma);
  const t = T.caso.informe;
  const tD = T.caso.decisiones;
  const tC = T.caso.comparacion;
  const informe = construirInforme(k, caso, plan);
  const { modelo, evaluacion } = informe;
  const { congelada, entrada, resultado: r, simulacion } = evaluacion;
  const c = congelada.contenido;
  const nombres = nombresDe(informe, plan, idioma);
  const vista = vistaHoja(informe, plan, idioma);
  const parrafo = parrafoResumen(informe, nombres, idioma);
  const { lectura } = lecturaDelResumen(k, informe, plan, idioma);
  const borrador = modelo.estado.tipo === "borrador";
  const motivos = motivosDeBorrador(informe, idioma);
  const aprobado = caso.estado_aprobacion === "aprobado";

  const nombresComp: Nombres = {
    plataforma: nombres.plataforma,
    criterio: Object.fromEntries(
      c.criterios.map((x) => [x.id, x.nombre[idioma]]),
    ),
    evidencia: Object.fromEntries(
      c.evidencias.map((e) => [e.id, e.afirmacion[idioma]]),
    ),
    madurez: Object.fromEntries(
      k.gramatica.escala_madurez.map((m) => [m.id, m.nombre[idioma]]),
    ),
  };
  const max = entrada.base.escala.max;
  const escala = c.escalas.find((e) => e.id === c.criterios[0]?.escala_id);
  const topeNoDisponible = Math.max(
    ...(escala?.tope_por_madurez
      .filter((x) => !x.disponible)
      .map((x) => x.tope) ?? [-1]),
  );
  const glosario = k.informe.glosario
    .filter((g) => lectura.terminos.includes(g.id))
    .map((g) => ({
      id: g.id,
      termino: g.termino[idioma],
      explicacion: g.explicacion[idioma],
    }));
  const opcionDe = Object.fromEntries(
    plan.decisiones.flatMap((d) =>
      d.opciones_por_plataforma.map((o) => [
        `${d.id}|${o.plataforma_id}`,
        o.texto[idioma],
      ]),
    ),
  );
  const relatoHumano = k.relatos.find((x) => x.caso_id === caso.id);
  const huella = huellaCorta(informe.huella_entradas);
  const versionTexto =
    congelada.version === "base-viva" ? t.ficha.baseViva : congelada.version;
  const motivoComparacion =
    r.tipo === "no-evaluable"
      ? motivoDeComparacion(r.motivos[0]?.motivo ?? "otro", idioma)
      : "";
  const seccion = (s: (typeof SECCIONES)[number]) => ({
    id: s,
    n: SECCIONES.indexOf(s) + 1,
    titulo: t.informe.secciones[s]!,
  });
  const cabecera = plantilla(t.informe.cabecera, {
    estado: borrador ? t.meta.borrador : t.meta.final,
    fecha: caso.fecha_evaluacion,
  });

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{caso.nombre[idioma]}</h1>
          <p className="sub">{t.sub}</p>
          <Meta
            items={[
              <b key="e">
                {borrador ? <Pendiente /> : <Ok />}
                {borrador ? t.meta.borrador : t.meta.final}
              </b>,
              [
                plural(t.meta.items, vista.conteo.items),
                plural(t.meta.fases, vista.conteo.fases),
                vista.conteo.sinFase
                  ? plantilla(t.meta.sinFase, { n: vista.conteo.sinFase })
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
              plantilla(tC.evaluacion, { fecha: caso.fecha_evaluacion }),
              <span key="h" className="huella">
                sha256 <b>{huella.inicio}</b>…{huella.fin}
              </span>,
            ]}
          />
        </div>
      </div>
      <Pestanas
        etiqueta={T.secciones.etiqueta}
        pestanas={pestanasCaso(T.secciones, idioma, caso.id, "informe", true)}
      />

      {borrador && (
        <div className="veredicto veredicto-alerta" role="status" data-borrador>
          <b>
            <Pendiente s={16} />
            {t.borrador.titulo}
          </b>
          <span>
            {plantilla(t.borrador.cuerpo, { motivos: motivos.join("; ") })}
          </span>
        </div>
      )}

      <ul className="niveles kit-niveles" aria-label={t.vistas.etiqueta}>
        {(
          [
            ["a", "#hoja", t.vistas.hoja],
            ["b", "#alistamiento", t.vistas.alistamiento],
            ["c", "#informe", t.vistas.informe],
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

      <section
        className="seccion solo-pantalla"
        id="hoja"
        aria-labelledby="hoja-t"
      >
        <h2 id="hoja-t">{t.hoja.titulo}</h2>
        <p className="kit-nota">{t.hoja.nota}</p>
        <Fases vista={vista} t={t} />
        <p className="kit-nota">{t.hoja.regla}</p>
      </section>

      <section
        className="seccion solo-pantalla"
        id="alistamiento"
        aria-labelledby="ali-t"
      >
        <h2 id="ali-t">{t.alistamiento.titulo}</h2>
        <p className="kit-nota">{t.alistamiento.nota}</p>
        <Alistamiento vista={vista} t={t} />
      </section>

      <section className="seccion" id="informe" aria-labelledby="inf-t">
        <h2 id="inf-t">{t.informe.titulo}</h2>
        <p className="kit-nota solo-pantalla">{t.informe.nota}</p>
        <Imprimir etiqueta={t.informe.imprimir} nota={t.informe.imprimirNota} />
        <div className="informe-marco">
          <nav className="inf-indice" aria-label={t.informe.indice}>
            <b>{t.informe.indice}</b>
            <ol>
              {SECCIONES.map((s, i) => (
                <li key={s}>
                  <a href={`#sec-${s}`}>
                    <span className="mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {t.informe.secciones[s]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="informe">
            <header className="inf-cabeza">
              <span className="ojo">{cabecera}</span>
              <p className="inf-titulo">{caso.nombre[idioma]}</p>
              <p className="meta mono">
                {plantilla(tC.evaluacion, { fecha: caso.fecha_evaluacion })} ·{" "}
                {versionTexto} · sha256 {huella.inicio}…{huella.fin}
              </p>
              <p className="inf-cabeza-pag">
                {plantilla(t.informe.pie, { caso: caso.nombre[idioma] })}
              </p>
            </header>
            {borrador && (
              <p className="campo-aviso">
                {t.borrador.titulo}: {motivos.join("; ")}.
              </p>
            )}

            <Sec {...seccion("resumen")}>
              <Resumen
                parrafo={parrafo}
                lectura={lectura}
                informe={informe}
                nombres={nombres}
                glosario={glosario}
                nombreRiesgo={nombres.riesgo}
                prioridad={tD.riesgos.prioridad}
                motivoTexto={motivoComparacion}
                y={T.caso.y}
                tc={tC}
                idioma={idioma}
                t={t}
              />
            </Sec>
            <Sec {...seccion("caso")}>
              <SeccionCaso
                caso={caso}
                nombreCriterio={nombresComp.criterio}
                nombrePlataforma={nombres.plataforma}
                idioma={idioma}
                t={t}
                y={T.caso.y}
              />
            </Sec>
            <Sec {...seccion("matriz")}>
              {r.tipo === "evaluado" ? (
                <>
                  <Totales
                    r={r}
                    idioma={idioma}
                    t={tC.totales}
                    y={T.caso.y}
                    nombres={nombresComp}
                    max={max}
                    umbral={entrada.base.convenciones.umbral_empate_centesimas}
                    sello={plantilla(tC.totales.sello, {
                      perfil: aprobado ? tC.perfilAprobado : tC.perfilBorrador,
                      version: congelada.version,
                      fecha: caso.fecha_evaluacion,
                    })}
                  />
                  <Matriz
                    r={r}
                    pesos={entrada.caso.pesos}
                    idioma={idioma}
                    t={tC.matriz}
                    tEsencial={tC.totales.esencial}
                    nombres={nombresComp}
                    max={max}
                    niveles={(escala?.niveles ?? []).map((x) => ({
                      valor: x.valor,
                      nombre: x.nombre[idioma],
                    }))}
                    topeNoDisponible={topeNoDisponible}
                    vigencia={T.caso.vigencia}
                  />
                </>
              ) : (
                <p className="kit-nota">{t.matriz.sin}</p>
              )}
            </Sec>
            <Sec {...seccion("pros-contras")}>
              {r.tipo === "evaluado" ? (
                <ProsContrasVista
                  r={r}
                  t={tC.pros}
                  nombres={nombresComp}
                  max={max}
                  anclas={{
                    destaca:
                      entrada.base.convenciones.pros_contras.ancla_destaca,
                    corta: entrada.base.convenciones.pros_contras.ancla_corta,
                  }}
                />
              ) : (
                <p className="kit-nota">{t.matriz.sin}</p>
              )}
            </Sec>
            <Sec {...seccion("robustez")}>
              {r.tipo === "evaluado" ? (
                <RobustezEstatica
                  r={r}
                  simulacion={simulacion}
                  nombreCriterio={nombresComp.criterio}
                  nombrePlataforma={nombres.plataforma}
                  declaracion={k.convenciones.declaracion[idioma]}
                  tc={tC}
                  t={t}
                  idioma={idioma}
                />
              ) : (
                <p className="kit-nota">{t.robustez.sin}</p>
              )}
            </Sec>
            <Sec {...seccion("decisiones")}>
              <TablaDecisiones
                informe={informe}
                plan={plan}
                nombres={nombres}
                opcionDe={opcionDe}

                t={t}
                td={tD}
              />
            </Sec>
            <Sec {...seccion("implicitas")}>
              <Implicitas caso={caso} plan={plan} idioma={idioma} t={t} />
            </Sec>
            <Sec {...seccion("riesgos")}>
              <TablaRiesgos
                riesgos={informe.resultadoPlan.riesgos}
                plan={plan}
                nombre={nombres.decision}
                idioma={idioma}
                t={tD}
              />
              <p className="kit-nota">{tD.riesgos.origen}</p>
            </Sec>
            <Sec {...seccion("supuestos")}>
              <TarjetasSupuestos
                supuestos={plan.supuestos}
                nombre={nombres.decision}
                alertas={informe.resultadoPlan.alertas}
                idioma={idioma}
                t={tD}
              />
            </Sec>
            <Sec {...seccion("relato")}>
              <Relato
                generado={relatoGenerado(informe, nombres, idioma)}
                humano={relatoHumano}
                idioma={idioma}
                t={t}
              />
            </Sec>
            <Sec {...seccion("hoja-de-ruta")}>
              <HojaCompacta vista={vista} t={t} />
            </Sec>
            <Sec {...seccion("alistamiento")}>
              <AlistamientoCompacto vista={vista} t={t} />
            </Sec>
            <Sec {...seccion("alertas")}>
              <h3>{t.alertas.evidencias}</h3>
              <AlertasEvidencia
                alertas={modelo.alertas.evidencias}
                nombres={nombres}
                madurez={nombresComp.madurez}
                idioma={idioma}
                t={t}
              />
              <h3>{t.alertas.plan}</h3>
              <Alertas
                alertas={modelo.alertas.plan}
                nombre={nombres.decision}
                nombrePlataforma={nombres.plataforma}
                supuestos={plan.supuestos}
                idioma={idioma}
                t={tD}
              />
            </Sec>
            <Sec {...seccion("reproducibilidad")}>
              <Ficha
                informe={informe}
                versionTexto={versionTexto}
                huella={informe.huella_entradas}
                t={t}
              />
            </Sec>
          </article>
        </div>
      </section>
    </>
  );
}
