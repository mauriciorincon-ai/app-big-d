import escalas from "instrumentos-de-plan/datos/escalas.json";
import { comparacionDe, planDe, type ResultadoPlan } from "@/engine";
import { plantilla } from "@/lib/atlas/plantilla";
import { evaluacionDe } from "@/lib/caso/casos";
import { lista } from "@/lib/caso/formato";
import { esc } from "@/lib/html";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Caso } from "@/lib/datos/conocimiento";
import type { Decision, Plan } from "@/lib/datos/plan";
import { textos, type Idioma } from "@/lib/i18n";
import { svgOndas, type NodoOndas, type SalidaOndas } from "./ondas-svg";

// El plan del caso como lo muestra su pantalla (S5, `decisiones.html`): el núcleo (`planDe`) calcula; aquí solo se
// ordena para mostrar, se redactan los textos de cada idioma desde el diccionario y el dato, se dibuja el diagrama de
// ondas y se generan las fichas del panel lateral (HTML escapado, sin datos del visitante). Nada se inventa: cada opción
// por plataforma sale del dato del plan, que solo cita evidencia aprobada.

const SVG = (cuerpo: string) => `<svg viewBox="-8 -8 16 16" width="14" height="14" aria-hidden="true" focusable="false">${cuerpo}</svg>`;
const ICONO_ALERTA = SVG('<circle r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0,-5 V1.5 M0,4.2 V4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>');
const ICONO_PENDIENTE = SVG('<circle r="7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2"/>');
const TRATO = escalas.reversibilidad as Record<
  string,
  { es: string; en: string }
>;

export interface FilaLectura {
  etiqueta: string;
  items: string[];
}
export interface VistaDecisiones {
  resultado: ResultadoPlan;
  /** Nombre (la pregunta) de cada decisión, en el idioma de la página. */
  nombre: Record<string, string>;
  nombrePlataforma: Record<string, string>;
  ondas: SalidaOndas;
  lectura: FilaLectura[];
  /** HTML de la ficha de cada decisión, para el panel lateral. */
  fichas: Record<string, string>;
  /** El camino del ciclo con los nombres, o null. */
  cicloNombres: string[] | null;
  sinOnda: string[];
}

/** El nombre de lo que origina una decisión: su capacidad o su criterio, en la base del caso. */
function origenDe(d: Decision, k: Conocimiento, idioma: Idioma): string {
  const cap = k.capacidades.find((c) => c.id === d.capacidad_id);
  const crit = k.criterios.find((c) => c.id === d.criterio_id);
  return (cap ?? crit)?.nombre[idioma] ?? "";
}

export function vistaDecisiones(
  k: Conocimiento,
  caso: Caso,
  plan: Plan,
  idioma: Idioma,
): VistaDecisiones {
  const t = textos(idioma).caso.decisiones;
  const ev = evaluacionDe(k, caso);
  const comparacion = comparacionDe(ev.resultado);
  const resultado = planDe({
    decisiones: plan.decisiones,
    modos_de_falla: plan.modos_de_falla,
    supuestos: plan.supuestos,
    fecha_evaluacion: caso.fecha_evaluacion,
    comparacion,
  });
  const c = ev.congelada.contenido;
  const nombrePlataforma = Object.fromEntries(
    c.plataformas.map((p) => [p.id, p.nombre[idioma]]),
  );
  const nombre = Object.fromEntries(
    plan.decisiones.map((d) => [d.id, d.pregunta[idioma]]),
  );
  const porId = new Map(plan.decisiones.map((d) => [d.id, d]));
  const calc = new Map(resultado.decisiones.map((d) => [d.id, d]));
  const y = textos(idioma).caso.y;

  // --- diagrama ---
  const sinOnda = resultado.decisiones
    .filter((d) => d.onda === null)
    .map((d) => d.id);
  const informe = resultado.informe;
  const columnas = [
    ...informe.ondas.map((ids, i) => ({
      titulo: plantilla(t.ondas.onda, { n: i + 1 }),
      sub: i === 0 ? t.ondas.primera : plantilla(t.ondas.siguiente, { n: i }),
      ids,
    })),
    ...(sinOnda.length
      ? [{ titulo: t.ondas.sinOnda, sub: t.ondas.sinOndaSub, ids: sinOnda }]
      : []),
  ];
  const nodos: Record<string, NodoOndas> = {};
  for (const d of plan.decisiones) {
    const r = calc.get(d.id)!;
    const enCiclo = r.en_ciclo;
    const sinProbar = r.supuestos_sin_probar.length > 0;
    nodos[d.id] = {
      id: d.id,
      nombre: d.pregunta[idioma],
      reversibilidad: d.reversibilidad,
      implicita: d.implicita,
      estado: t.estado[d.estado],
      sinProbar,
      aria: `${d.pregunta[idioma]}. ${t.reversibilidad[d.reversibilidad]}. ${t.estado[d.estado]}.${d.implicita ? t.tarjeta.ariaImplicita : ""}${enCiclo ? t.tarjeta.ariaCiclo : ""}${sinProbar ? t.tarjeta.ariaSinProbar : ""}`,
    };
  }
  const ondas = svgOndas({
    id: "ondas",
    idioma,
    columnas,
    nodos,
    depende_de: Object.fromEntries(
      plan.decisiones.map((d) => [d.id, d.depende_de]),
    ),
    ciclo: informe.ciclo ?? [],
    bloqueadas: sinOnda,
    etiquetas: {
      reversibilidad: t.reversibilidad,
      implicita: t.tarjeta.implicita,
      sinProbar: t.tarjeta.sinProbar,
      enCiclo: t.tarjeta.enCiclo,
      sinOnda: t.tarjeta.sinOnda,
    },
    aria: informe.ciclo
      ? plantilla(t.ondas.ariaCiclo, { n: sinOnda.length })
      : plantilla(t.ondas.aria, {
          n: plan.decisiones.length,
          ondas: informe.ondas.length,
        }),
  });
  // S5-B-11: como el atlas (D11), un diagrama con una línea que atraviesa una tarjeta ajena no se publica.
  if (ondas.cruces > 0)
    throw new Error(`decisiones · diagrama de ondas · ${ondas.cruces} línea(s) atraviesan una tarjeta ajena (D11): el diagrama no se publica`);

  // --- lectura en texto (G10) ---
  const linea = (id: string) => {
    const d = porId.get(id)!;
    const dep = d.depende_de.length
      ? plantilla(t.ondas.dependeDe, {
          nombres: d.depende_de.map((x) => nombre[x] ?? x).join(", "),
        })
      : "";
    return `${d.pregunta[idioma]} (${t.reversibilidad[d.reversibilidad]}${dep})`;
  };
  const lectura: FilaLectura[] = [
    ...informe.ondas.map((ids, i) => ({
      etiqueta: plantilla(t.ondas.ondaN, { n: i + 1 }),
      items: ids.map(linea),
    })),
    ...(sinOnda.length
      ? [
          {
            etiqueta:
              t.ondas.sinOnda.charAt(0) +
              t.ondas.sinOnda.slice(1).toLowerCase(),
            items: sinOnda.map(linea),
          },
        ]
      : []),
  ];
  const cicloNombres = informe.ciclo
    ? informe.ciclo.map((id) => nombre[id] ?? id)
    : null;
  if (cicloNombres && sinOnda.length) lectura[lectura.length - 1]!.items.push(plantilla(t.ondas.cicloDe, { camino: cicloNombres.join(" → ") }));

  // --- fichas ---
  const restriccionDe = (plataforma: string) =>
    caso.restricciones.flatMap((r) =>
      r.elimina
        .filter((e) => e.plataforma_id === plataforma)
        .map((e) => e.razon[idioma]),
    )[0];
  const motivo =
    resultado.comparacion.tipo === "sin-comparacion"
      ? ((t.ficha.motivos as Record<string, string>)[resultado.comparacion.motivo] ??
        t.ficha.motivos.otro)
      : "";
  const fichas: Record<string, string> = {};
  for (const d of plan.decisiones) {
    const r = calc.get(d.id)!;
    const riesgos = resultado.riesgos.filter((x) => x.decision_id === d.id);
    const sups = plan.supuestos.filter((s) => s.decisiones.includes(d.id));
    const trato = TRATO[d.reversibilidad]?.[idioma] ?? "";
    const dep = d.depende_de.length
      ? plantilla(t.ficha.dependeDe, {
          nombres: d.depende_de.map((x) => esc(nombre[x] ?? x)).join(", "),
        })
      : t.ficha.noDepende;
    const opciones = c.plataformas
      .map((p) => {
        const o = d.opciones_por_plataforma.find(
          (x) => x.plataforma_id === p.id,
        );
        if (!o)
          return `<div class="opcion-fuera"><dt>${esc(p.nombre[idioma])}</dt><dd>${esc(plantilla(t.ficha.fuera, { razon: restriccionDe(p.id) ?? "" }))}</dd></div>`;
        const citas = o.citas
          .map(
            (ci) =>
              `<small class="cita">${esc(t.ficha.evidencia)}: <span class="cod">${esc(ci.evidencia_id)}</span>${ci.componentes?.length ? ` · ${esc(ci.componentes.join(", "))}` : ""}</small>`,
          )
          .join("");
        return `<div><dt>${esc(p.nombre[idioma])}</dt><dd>${esc(o.texto[idioma])}${o.sin_fuente ? `<small class="campo-aviso">${esc(t.ficha.sinFuente)}</small>` : citas}</dd></div>`;
      })
      .join("");
    const planificadas = r.planificadas.map((pid) => {
      const o = d.opciones_por_plataforma.find((x) => x.plataforma_id === pid)!;
      return `<li><b>${esc(nombrePlataforma[pid] ?? pid)}</b> ${esc(o.texto[idioma])}</li>`;
    });
    const nota =
      resultado.comparacion.tipo === "empate-tecnico"
        ? plantilla(t.ficha.paraEmpate, {
            plataformas: lista(
              r.planificadas.map((x) => nombrePlataforma[x] ?? x),
              y,
            ),
          })
        : resultado.comparacion.tipo === "ganadora"
          ? plantilla(t.ficha.paraGanadora, {
              plataformas: lista(
                r.planificadas.map((x) => nombrePlataforma[x] ?? x),
                y,
              ),
            })
          : plantilla(t.ficha.sinComparacion, { motivo });
    fichas[d.id] =
      `<article class="ficha-nodo ficha-dec" data-ficha="${esc(d.id)}">
  <p class="ficha-tipo"><span class="cod">${esc(t.reversibilidad[d.reversibilidad].toUpperCase())}</span> · ${esc(origenDe(d, k, idioma))}</p>
  <h2>${esc(d.pregunta[idioma])}</h2>
  <p class="ficha-lider">${esc(trato)}</p>
  <p class="meta"><span>${esc(t.estado[d.estado])}</span>${d.implicita ? `<span class="punto">·</span><span>${esc(t.ficha.implicita)}</span>` : ""}<span class="punto">·</span><span>${dep}</span></p>
  <p class="kit-nota">${esc(d.razon_reversibilidad[idioma])}</p>
  <h3>${esc(t.ficha.opciones)}</h3>
  <dl class="opciones">${opciones}</dl>
  <h3>${esc(t.ficha.recomendada)}</h3>
  ${planificadas.length ? `<ul class="pros">${planificadas.join("")}</ul>` : ""}<p class="kit-nota">${esc(nota)}</p>
  ${sups.length ? `<h3>${esc(t.ficha.supuestos)}</h3><ul class="pros">${sups.map((s) => `<li>${s.estado === "sin_probar" ? ICONO_ALERTA : ICONO_PENDIENTE}<span>${esc(s.enunciado[idioma])}<small>${esc(t.supuestos.estados[s.estado])} · ${esc(plantilla(t.ficha.prueba, { texto: s.prueba_barata[idioma] }))}</small></span></li>`).join("")}</ul>` : ""}
  ${
    riesgos.length
      ? `<h3>${esc(t.ficha.riesgos)}</h3><ul class="pros">${riesgos
          .map((x) => {
            const m = plan.modos_de_falla.find((q) => q.id === x.id)!;
            return `<li>${x.prioridad_de_accion === "alta" ? ICONO_ALERTA : ICONO_PENDIENTE}<span>${esc(m.modo[idioma])}<small>S${x.severidad} O${x.ocurrencia} D${x.deteccion} · ${esc(plantilla(t.ficha.prioridad, { p: t.riesgos.prioridad[x.prioridad_de_accion] }))}${x.mitigado ? "" : ` · ${esc(t.ficha.sinMitigacion)}`}</small></span></li>`;
          })
          .join("")}</ul>`
      : ""
  }
</article>`;
  }
  return {
    resultado,
    nombre,
    nombrePlataforma,
    ondas,
    lectura,
    fichas,
    cicloNombres,
    sinOnda,
  };
}
