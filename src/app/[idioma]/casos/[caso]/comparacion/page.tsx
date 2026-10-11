import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoEvaluable, ProsContrasVista, Matriz, Totales, type Nombres } from "@/components/caso/Comparacion";
import { Exploracion } from "@/components/caso/Exploracion";
import { Ok, Pendiente } from "@/components/caso/Iconos";
import { Meta } from "@/components/Meta";
import { Pestanas } from "@/components/Pestanas";
import { plantilla } from "@/lib/atlas/plantilla";
import { conocimiento, evaluacionDe } from "@/lib/caso/casos";
import { huellaCorta, lista } from "@/lib/caso/formato";
import { pestanasCaso, rutaBase, rutaCaso } from "@/lib/caso/rutas";
import { esIdioma, textos } from "@/lib/i18n";
import "@/styles/secciones.css";
import "@/styles/caso.css";

// 08 Comparación (maqueta comparacion.html; RF-04, C11–C14): el resultado del núcleo para el caso contra su instantánea.
// Si el caso no se puede comparar (perfil en borrador, sin evidencia aprobada, todas descartadas), lo dice y dice qué
// falta: jamás puntúa a medias. Si se puede: veredicto y totales, la matriz, la sensibilidad y la robustez (que se
// exploran en el navegador con el mismo núcleo) y los pros y contras.
export const dynamicParams = false;

export function generateStaticParams() {
  return conocimiento().casos.map((c) => ({ caso: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/[idioma]/casos/[caso]/comparacion">): Promise<Metadata> {
  const { idioma, caso } = await params;
  const c = conocimiento().casos.find((x) => x.id === caso);
  if (!esIdioma(idioma) || !c) return {};
  return { title: `${c.nombre[idioma]} · ${textos(idioma).secciones.comparacion}` };
}

export default async function Comparacion({ params }: PageProps<"/[idioma]/casos/[caso]/comparacion">) {
  const { idioma, caso: id } = await params;
  const k = conocimiento();
  const caso = k.casos.find((x) => x.id === id);
  if (!esIdioma(idioma) || !caso) notFound();
  const T = textos(idioma);
  const t = T.caso.comparacion;
  const { congelada, entrada, resultado: r, simulacion } = evaluacionDe(k, caso);
  const c = congelada.contenido;
  const max = entrada.base.escala.max;
  const nombres: Nombres = {
    plataforma: Object.fromEntries(c.plataformas.map((p) => [p.id, p.nombre[idioma]])),
    criterio: Object.fromEntries(c.criterios.map((x) => [x.id, x.nombre[idioma]])),
    evidencia: Object.fromEntries(c.evidencias.map((e) => [e.id, e.afirmacion[idioma]])),
    madurez: Object.fromEntries(k.gramatica.escala_madurez.map((m) => [m.id, m.nombre[idioma]])),
  };
  const nomP = (p: string) => nombres.plataforma[p] ?? p;
  const restriccion = new Map(caso.restricciones.map((x) => [x.id, x.descripcion[idioma]]));
  const aprobado = caso.estado_aprobacion === "aprobado";
  const huella = huellaCorta(congelada.huella);
  const evaluadas = r.tipo === "evaluado" ? r.evaluadas.length : c.plataformas.length - r.descartadas.length;
  const sub = [
    plantilla((r.tipo === "evaluado" ? t.sub : t.subPendiente)[evaluadas === 1 ? 0 : 1], { n: T.caso.numeros[evaluadas] ?? String(evaluadas) }),
    r.descartadas.length ? plantilla(r.descartadas.length === 1 ? t.fuera[0] : t.fuera[1], { plataformas: lista(r.descartadas.map((d) => nomP(d.plataforma_id)), T.caso.y) }) : null,
    t.reproducible,
  ]
    .filter(Boolean)
    .join(" ");
  const escala = c.escalas.find((e) => e.id === c.criterios[0]?.escala_id);
  const topeNoDisponible = Math.max(...(escala?.tope_por_madurez.filter((x) => !x.disponible).map((x) => x.tope) ?? [-1]));

  return (
    <>
      <div className="encabezado">
        <div>
          <span className="ojo">{t.ojo}</span>
          <h1>{caso.nombre[idioma]}</h1>
          <p className="sub">{sub}</p>
          <Meta
            items={[
              <b key="p">
                {aprobado ? <Ok /> : <Pendiente />}
                {aprobado ? t.perfilAprobado : t.perfilBorrador}
              </b>,
              congelada.version === "base-viva" ? t.baseViva : plantilla(t.instantanea, { version: congelada.version }),
              <span key="h" className="huella">
                sha256 <b>{huella.inicio}</b>…{huella.fin}
              </span>,
              plantilla(t.evaluacion, { fecha: caso.fecha_evaluacion }),
              ...r.descartadas.map((d) => plantilla(t.eliminada, { plataforma: nomP(d.plataforma_id), restriccion: lista(d.restricciones.map((x) => restriccion.get(x) ?? x), T.caso.y) })),
            ]}
          />
        </div>
      </div>
      <Pestanas etiqueta={T.secciones.etiqueta} pestanas={pestanasCaso(T.secciones, idioma, caso.id, "comparacion")} />

      {r.tipo === "no-evaluable" ? (
        <NoEvaluable motivos={r.motivos} idioma={idioma} t={t.noEvaluable} nombres={nombres} criteriosPorPlataforma={caso.criterios.length} rutaPerfil={rutaCaso(idioma, caso.id)} rutaBase={rutaBase(idioma)} />
      ) : (
        <>
          <ul className="niveles kit-niveles" aria-label={t.vistas.etiqueta}>
            {(
              [
                ["a", "#totales", t.vistas.totales],
                ["b", "#sens", t.vistas.sensibilidad],
                ["c", "#rob", t.vistas.robustez],
                ["d", "#pros", t.vistas.pros],
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
          <section className="seccion" id="totales" aria-labelledby="tot-t">
            <h2 id="tot-t">{t.totales.titulo}</h2>
            <Totales
              r={r}
              idioma={idioma}
              t={t.totales}
              y={T.caso.y}
              nombres={nombres}
              max={max}
              umbral={entrada.base.convenciones.umbral_empate_centesimas}
              sello={plantilla(t.totales.sello, { perfil: aprobado ? t.perfilAprobado : t.perfilBorrador, version: congelada.version, fecha: caso.fecha_evaluacion })}
            />
          </section>
          <section className="seccion" aria-labelledby="mat-t">
            <h2 id="mat-t">{t.matriz.titulo}</h2>
            <Matriz
              r={r}
              pesos={entrada.caso.pesos}
              idioma={idioma}
              t={t.matriz}
              tEsencial={t.totales.esencial}
              nombres={nombres}
              max={max}
              niveles={(escala?.niveles ?? []).map((x) => ({ valor: x.valor, nombre: x.nombre[idioma] }))}
              topeNoDisponible={topeNoDisponible}
              vigencia={T.caso.vigencia}
            />
          </section>
          <Exploracion idioma={idioma} t={{ s: t.sensibilidad, r: t.robustez, esencial: t.totales.esencial, y: T.caso.y }} entrada={entrada} resultado={r} simulacion={simulacion} nombres={{ plataforma: nombres.plataforma, criterio: nombres.criterio }} />
          <section className="seccion" id="pros" aria-labelledby="pros-t">
            <h2 id="pros-t">{t.pros.titulo}</h2>
            <ProsContrasVista r={r} t={t.pros} nombres={nombres} max={max} anclas={{ destaca: entrada.base.convenciones.pros_contras.ancla_destaca, corta: entrada.base.convenciones.pros_contras.ancla_corta }} />
          </section>
        </>
      )}
    </>
  );
}
