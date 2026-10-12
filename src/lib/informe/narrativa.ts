import {
  medirLectura,
  type AlertaEvidencia,
  type Lectura,
  type TerminoAExplicar,
} from "@/engine";
import { plantilla, plural } from "@/lib/atlas/plantilla";
import { brecha, lista, peso, porcentaje } from "@/lib/caso/formato";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Plan } from "@/lib/datos/plan";
import { textos, type Idioma } from "@/lib/i18n";
import type { Informe } from "./construir";

// La narrativa del informe (S6, C20, X4): TODO texto sale de plantillas redactadas en cada idioma (src/lib/i18n) llenadas con
// las cifras del modelo del informe, que es uno solo. Ningún modelo de lenguaje redacta nada: el español y el inglés llevan
// las mismas cifras porque las dos lenguas leen el mismo modelo.

export interface NombresInforme {
  plataforma: Record<string, string>;
  decision: Record<string, string>;
  /** El modo de falla de cada riesgo, tal como lo redacta el plan. */
  riesgo: Record<string, string>;
  supuesto: Record<string, string>;
}

export function nombresDe(
  informe: Informe,
  plan: Plan,
  idioma: Idioma,
): NombresInforme {
  const c = informe.evaluacion.congelada.contenido;
  return {
    plataforma: Object.fromEntries(
      c.plataformas.map((p) => [p.id, p.nombre[idioma]]),
    ),
    decision: Object.fromEntries(
      plan.decisiones.map((d) => [d.id, d.pregunta[idioma]]),
    ),
    riesgo: Object.fromEntries(
      plan.modos_de_falla.map((m) => [m.id, m.modo[idioma]]),
    ),
    supuesto: Object.fromEntries(
      plan.supuestos.map((s) => [s.id, s.enunciado[idioma]]),
    ),
  };
}

/** El motivo por el que la comparación no puntúa, en palabras del idioma. */
export function motivoDeComparacion(motivo: string, idioma: Idioma): string {
  const m = textos(idioma).caso.decisiones.ficha.motivos as Record<
    string,
    string
  >;
  return m[motivo] ?? m.otro!;
}

/** El párrafo líder de § 1: el que el gate de lectura mide contra el presupuesto de E-13. */
export function parrafoResumen(
  informe: Informe,
  n: NombresInforme,
  idioma: Idioma,
): string {
  const t = textos(idioma).caso.informe.resumen.parrafo;
  const r = informe.modelo.resumen;
  const y = textos(idioma).caso.y;
  const cierre = plantilla(t.cierre, {
    supuestos: plural(t.supuestos, r.n_supuestos_por_probar),
    unaVia: plural(t.unaVia, r.n_una_via),
    altos: plural(t.altos, r.n_altos),
  });
  const v = r.veredicto;
  const nom = (id: string) => n.plataforma[id] ?? id;
  if (v.tipo === "sin-comparacion")
    return plantilla(t.sinComparacion, {
      motivo: motivoDeComparacion(v.motivo, idioma),
      cierre,
    });
  if (v.tipo === "empate-tecnico")
    return plantilla(t.empate, {
      plataformas: lista(v.plataformas.map(nom), y),
      brecha: brecha(v.brecha_unidades, r.escala_max, idioma),
      umbral: peso(informe.modelo.ficha.umbrales.empate_centesimas, idioma),
      cierre,
    });
  if (!v.segunda)
    return plantilla(t.unica, { ganadora: nom(v.plataforma_id), cierre });
  const comun = {
    ganadora: nom(v.plataforma_id),
    brecha: brecha(v.brecha_unidades, r.escala_max, idioma),
    segunda: nom(v.segunda),
    cierre,
  };
  const rb = r.robustez;
  return rb
    ? plantilla(t.ganadora, {
        ...comun,
        pct: porcentaje(rb.primera_unidades, rb.total_unidades, idioma),
      })
    : plantilla(t.ganadoraSinSimulacion, comun);
}

/** § 10 por plantilla: «pasaron doce meses…» con los riesgos de mayor prioridad. Va marcado como generado. */
export function relatoGenerado(
  informe: Informe,
  n: NombresInforme,
  idioma: Idioma,
): string {
  const t = textos(idioma).caso.informe.relato;
  const ids = informe.modelo.resumen.riesgos_principales;
  if (!ids.length) return t.sinRiesgos;
  return plantilla(t.plantilla, {
    riesgos: ids.map((id) => n.riesgo[id] ?? id).join("; "),
  });
}

/** Una alerta de evidencia en palabras del idioma. */
export function textoDeAlerta(
  a: AlertaEvidencia,
  n: NombresInforme,
  idioma: Idioma,
  madurez: Record<string, string>,
): string {
  const t = textos(idioma).caso.informe.alertas;
  return plantilla(t[a.motivo], {
    evidencia: a.evidencia_id,
    plataforma: n.plataforma[a.plataforma_id] ?? a.plataforma_id,
    dias: a.dias,
    madurez: madurez[a.madurez] ?? a.madurez,
  });
}

/** Los términos a explicar de un idioma: los de la gramática del atlas y los del glosario del informe. */
export function terminosDe(
  k: Conocimiento,
  idioma: Idioma,
): TerminoAExplicar[] {
  return [
    ...(k.gramatica.terminos_a_explicar?.[idioma] ?? []).map((termino) => ({
      id: termino,
      formas: [termino],
    })),
    ...k.informe.glosario.map((g) => ({ id: g.id, formas: g.formas[idioma] })),
  ];
}

export interface LecturaDelResumen {
  texto: string;
  lectura: Lectura;
  /** Términos que aparecen y no tienen entrada en el glosario del informe: un término que no se explica no se publica. */
  sinExplicar: string[];
}

/** El párrafo de § 1 medido contra el presupuesto de lectura del dato. Lo usan la página y el gate de publicación. */
export function lecturaDelResumen(
  k: Conocimiento,
  informe: Informe,
  plan: Plan,
  idioma: Idioma,
): LecturaDelResumen {
  const texto = parrafoResumen(
    informe,
    nombresDe(informe, plan, idioma),
    idioma,
  );
  const lectura = medirLectura(
    texto,
    idioma,
    k.informe.lectura,
    terminosDe(k, idioma),
  );
  const explicados = new Set(k.informe.glosario.map((g) => g.id));
  return {
    texto,
    lectura,
    sinExplicar: lectura.terminos.filter((id) => !explicados.has(id)),
  };
}
