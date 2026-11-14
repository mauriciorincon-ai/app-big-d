import type { Entrada } from "@/engine/tipos";

// S10 (F2): la entrada del núcleo que evalúa la demo pública (anexo E4; pregunta 1 a del G-Plan). Es la del caso del hospital
// sobre la base viva, con dos cambios y solo dos, cada uno con su razón:
//   1. solo las plataformas REALES publicadas: la ficticia (carnada de RNF-06) no es contenido público; sus evidencias salen
//      con ella, y una restricción que la eliminaba deja de nombrarla (el núcleo exige que lo que elimina esté en la base);
//   2. el núcleo no evalúa un perfil en borrador (RF-03.5) porque un borrador no se APRUEBA ni se presenta como resultado del
//      caso. La demo no aprueba nada: evalúa los pesos de quien la visita, que parten de los del borrador del autor, y la
//      pantalla dice «perfil en borrador del autor: mueve los pesos» y jamás «recomendada» ni «aprobada». Por eso aquí el
//      estado es el de una exploración que la persona hace con sus propios pesos. El resultado del núcleo no lleva el estado,
//      así que su huella es la de los pesos y la base, nada más.

/** La entrada de exploración de la demo: sin las plataformas de `fuera`, con el estado de una exploración propia. */
export function entradaDeExploracion(
  entrada: Entrada,
  fuera: ReadonlySet<string>,
): Entrada {
  const queda = (id: string) => !fuera.has(id);
  return {
    caso: {
      ...entrada.caso,
      estado: "aprobado",
      restricciones: entrada.caso.restricciones.map((r) => ({
        ...r,
        elimina: r.elimina.filter(queda),
      })),
    },
    base: {
      ...entrada.base,
      plataformas: entrada.base.plataformas.filter((p) => queda(p.id)),
      evidencias: entrada.base.evidencias.filter((e) => queda(e.plataforma_id)),
    },
  };
}

/** La misma entrada con otros pesos (centésimas por criterio, en el orden de `caso.pesos`). */
export function conPesos(entrada: Entrada, pesos: readonly number[]): Entrada {
  if (pesos.length !== entrada.caso.pesos.length)
    throw new Error(
      `demo: ${pesos.length} pesos para ${entrada.caso.pesos.length} criterios`,
    );
  return {
    ...entrada,
    caso: {
      ...entrada.caso,
      pesos: entrada.caso.pesos.map((p, i) => ({ ...p, peso: pesos[i]! })),
    },
  };
}

/**
 * «Probar la neutralidad» (regla dura 5): la misma entrada con las plataformas en otro orden, y sus evidencias también. La
 * vuelta `k` rota las plataformas `k` lugares y, en las vueltas impares, además las invierte; sin azar (regla dura 1).
 */
export function reordenada(entrada: Entrada, k: number): Entrada {
  const n = entrada.base.plataformas.length;
  const r = ((k % n) + n) % n;
  const rotadas = [
    ...entrada.base.plataformas.slice(r),
    ...entrada.base.plataformas.slice(0, r),
  ];
  // Invertir cada `n` vueltas (no cada vuelta impar): con N = 2 la vuelta 1 también cambia el orden.
  const plataformas = Math.floor(k / n) % 2 ? rotadas.reverse() : rotadas;
  const lugar = new Map(plataformas.map((p, i) => [p.id, i]));
  const evidencias = [...entrada.base.evidencias].sort(
    (a, b) => lugar.get(a.plataforma_id)! - lugar.get(b.plataforma_id)!,
  );
  if (Math.floor(k / n) % 2) evidencias.reverse();
  return { ...entrada, base: { ...entrada.base, plataformas, evidencias } };
}
