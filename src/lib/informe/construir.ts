import pkg from "../../../package.json";
import {
  comparacionDe,
  modeloInforme,
  type EntradaInforme,
  type EntradaRuta,
  type HojaDeRuta,
  type ModeloInforme,
  type ResultadoPlan,
} from "@/engine";
import { evaluacionDe, type Evaluacion } from "@/lib/caso/casos";
import type { Conocimiento } from "@/lib/datos/cargar-conocimiento";
import type { Caso } from "@/lib/datos/conocimiento";
import { huellaCaso, huellaDe, huellaPlan } from "@/lib/datos/instantanea";
import type { Plan } from "@/lib/datos/plan";
import { hojaDeRutaDe, resultadoDelPlan } from "./entrada";

// El informe de un caso (S6, C19–C20): junta lo que el núcleo ya calculó —la comparación, el plan, la hoja de ruta, las
// alertas de evidencia— y lo entrega a la página y al gate de lectura. No calcula nada propio salvo la huella de entradas
// (RF-06.5), que necesita SHA-256 y por eso vive aquí y no en el núcleo.

export interface Informe {
  evaluacion: Evaluacion;
  resultadoPlan: ResultadoPlan;
  entradaRuta: EntradaRuta;
  hoja: HojaDeRuta;
  entrada: EntradaInforme;
  modelo: ModeloInforme;
  /** SHA-256 del texto canónico (RFC 8785) de lo que el informe usó: perfil, plan, método, convenciones del informe e instantánea. */
  huella_entradas: string;
}

export function construirInforme(
  k: Conocimiento,
  caso: Caso,
  plan: Plan,
): Informe {
  const evaluacion = evaluacionDe(k, caso);
  const { congelada, entrada: ent, resultado, simulacion } = evaluacion;
  const resultadoPlan = resultadoDelPlan(plan, caso, comparacionDe(resultado));
  const { entrada: entradaRuta, hoja } = hojaDeRutaDe(
    plan,
    k.informe.categorias,
    resultadoPlan,
  );

  const c = congelada.contenido;
  const eliminadas = new Set(
    caso.restricciones.flatMap((r) => r.elimina.map((e) => e.plataforma_id)),
  );
  const escala = c.escalas.find((e) => e.id === c.criterios[0]?.escala_id);
  const conv = ent.base.convenciones;
  const entrada: EntradaInforme = {
    perfil_aprobado: caso.estado_aprobacion === "aprobado",
    plan_aprobado: plan.estado_aprobacion === "aprobado",
    resultado,
    simulacion,
    plan: resultadoPlan,
    hoja,
    escala_max: ent.base.escala.max,
    fecha_evaluacion: caso.fecha_evaluacion,
    evidencias: c.evidencias
      .filter(
        (e) =>
          e.estado_aprobacion === "aprobada" &&
          !eliminadas.has(e.plataforma_id),
      )
      .map((e) => ({
        id: e.id,
        plataforma_id: e.plataforma_id,
        fecha_verificacion: e.fecha_verificacion,
        madurez: e.madurez,
        fuente_oficial: e.fuentes.some((f) => f.tipo === "oficial"),
      })),
    vigencia: conv.vigencia,
    madurez_disponible: Object.fromEntries(
      (escala?.tope_por_madurez ?? []).map((t) => [t.madurez, t.disponible]),
    ),
    ficha: {
      instantanea: congelada.version,
      version_app: pkg.version,
      semilla: conv.simulacion.semilla,
      semillas_estabilidad: conv.simulacion.semillas_estabilidad,
      aceptadas: conv.simulacion.aceptadas,
      umbrales: {
        empate_centesimas: conv.umbral_empate_centesimas,
        robusta_pct: conv.robustez.robusta_pct,
        fragil_pct: conv.robustez.fragil_pct,
        revisar_dias: conv.vigencia.revisar_dias,
        vencido_dias: conv.vigencia.vencido_dias,
      },
    },
  };
  const huella_entradas = huellaDe({
    perfil: huellaCaso(caso),
    plan: huellaPlan(plan),
    metodo: huellaDe(k.convenciones),
    informe: huellaDe(k.informe),
    instantanea: congelada.huella,
  });
  return {
    evaluacion,
    resultadoPlan,
    entradaRuta,
    hoja,
    entrada,
    modelo: modeloInforme(entrada),
    huella_entradas,
  };
}
