// S9 (F1): el entrevistador, en aritmética ENTERA (regla dura 1). Cada pregunta del dato (data/convenciones/entrevista.yaml)
// se responde con un nivel de una escala común; el valor del nivel es lo que pesa el criterio. El perfil propuesto reparte
// 10 000 centésimas en proporción a esos valores con el resto mayor y desempate por id del criterio, nunca por posición:
// reordenar los criterios o las plataformas no cambia ningún byte (regla dura 5). Sin modelo, sin reloj, sin flotantes.
// El resultado es una PROPUESTA con origen `entrevista`; solo el comando de aprobación la vuelve declarada.

export const ORIGEN_ENTREVISTA = "entrevista" as const;
export const TOTAL_CENTESIMAS = 10_000;

/** La convención del dato: la escala de importancia y desde qué valor se conservan las restricciones de un criterio. */
export interface ConvencionEntrevista {
  niveles: readonly { id: string; valor: number }[];
  conserva_restricciones_desde: number;
  preguntas: readonly { id: string; criterio_id: string }[];
}

export type PerfilDeEntrevista =
  | { tipo: "incompleta"; faltan: number; total: number }
  /** Todas las respuestas valen 0: no hay con qué repartir; la persona lo ve y vuelve a responder o usa otra vía. */
  | { tipo: "sin-prioridad" }
  | {
      tipo: "completa";
      origen: typeof ORIGEN_ENTREVISTA;
      /** Por id de criterio (orden de unidades de código), en centésimas que suman 10 000. */
      pesos: { criterio_id: string; peso_centesimas: number }[];
      /** Los criterios cuyas restricciones se conservan, por id. */
      conserva_restricciones: string[];
    };

const porCodigo = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * `respuestas`: criterio_id → id del nivel. `criterios`: los del caso. Un criterio del caso sin pregunta o con una respuesta
 * que no es un nivel cuenta como sin responder.
 */
export function perfilDeEntrevista(
  conv: ConvencionEntrevista,
  criterios: readonly string[],
  respuestas: Readonly<Record<string, string | undefined>>,
): PerfilDeEntrevista {
  const valor = new Map(conv.niveles.map((n) => [n.id, n.valor]));
  const ids = [...new Set(criterios)].sort(porCodigo);
  const valores = ids.map((c) => {
    const r = respuestas[c];
    const v = r === undefined ? undefined : valor.get(r);
    return v === undefined ? null : v;
  });
  const faltan = valores.filter((v) => v === null).length;
  if (faltan > 0) return { tipo: "incompleta", faltan, total: ids.length };
  const vs = valores as number[];
  const suma = vs.reduce((s, v) => s + v, 0);
  if (suma === 0) return { tipo: "sin-prioridad" };

  // Resto mayor: base = ⌊10 000·v / suma⌋; lo que sobra va de uno en uno a los restos mayores (empate: id menor primero).
  const base = vs.map((v) => Math.floor((TOTAL_CENTESIMAS * v) / suma));
  const resto = vs.map((v) => (TOTAL_CENTESIMAS * v) % suma);
  let sobran = TOTAL_CENTESIMAS - base.reduce((s, b) => s + b, 0);
  const orden = ids.map((_, i) => i).sort((a, b) => resto[b]! - resto[a]! || porCodigo(ids[a]!, ids[b]!));
  for (const i of orden) {
    if (sobran === 0) break;
    base[i]! += 1;
    sobran -= 1;
  }
  return {
    tipo: "completa",
    origen: ORIGEN_ENTREVISTA,
    pesos: ids.map((criterio_id, i) => ({ criterio_id, peso_centesimas: base[i]! })),
    conserva_restricciones: ids.filter((_, i) => vs[i]! >= conv.conserva_restricciones_desde),
  };
}
