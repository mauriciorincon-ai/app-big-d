// La hoja de ruta por fases y el alistamiento (S6, C19; especificación § 6.11, RF-06.2–06.3, E-10): sobre el plan que ya
// calculó `planDe` (ondas, riesgos, ciclo), el núcleo reparte las tareas y las verificaciones en fases. Puro y entero, sin
// reloj ni azar (regla dura 1): no hay semanas porque el plan no trae duraciones y escribirlas sería falsa precisión
// (regla dura 10); la fase es el orden de las dependencias, nada más.
//
//   · Fase 0: la prueba barata de todo supuesto que sostiene una decisión de UNA VÍA (E-10: antes de decidirla, y antes de
//     cualquier otra decisión: son baratas). Cada otro supuesto va una fase antes de la primera decisión que sostiene.
//   · Fases 1..n: las ondas del plan. Una tarea por decisión en la fase de su onda.
//   · Una tarea por mitigación: la que va `antes` en la fase de su decisión; la que va `durante` o `despues`, en la siguiente
//     (si la decisión está en la última onda, eso abre una fase de seguimiento).
//   · Una verificación de alistamiento por supuesto (RF-06.3).
//   · Con un ciclo el contrato del paquete (G2) no ordena nada: ninguna decisión tiene onda, así que ninguna tiene fase y
//     todas quedan bloqueadas por el ciclo, con su camino a la vista (C16). Las mitigaciones y los supuestos cuya
//     decisión no tiene fase tampoco la tienen, salvo la prueba barata de lo que sostiene una decisión de una vía.
// Cada ítem nace de una decisión, una mitigación o un supuesto del plan, y lo dice (`origen`): no existe un ítem sin origen
// (regla dura 9). El criterio de cumplido es una clave de plantilla más sus cifras; las palabras las pone la capa de textos.
import type { DecisionDelPlan, ResultadoPlan, SupuestoDelPlan } from "./plan";

export interface DecisionDeRuta {
  id: string;
  reversibilidad: DecisionDelPlan["reversibilidad"];
  estado: DecisionDelPlan["estado"];
  /** La categoría de alistamiento (§ 6.11) de su capacidad o criterio, ya resuelta por quien llama. */
  categoria: string;
}
export interface ModoDeRuta {
  id: string;
  decision_id: string;
  ocurrencia: number;
  deteccion: number;
  mitigaciones: readonly {
    momento: "antes" | "durante" | "despues";
    efecto: { ocurrencia?: number; deteccion?: number };
  }[];
}
export interface SupuestoDeRuta {
  id: string;
  estado: SupuestoDelPlan["estado"];
  decisiones: readonly string[];
}
export interface EntradaRuta {
  decisiones: readonly DecisionDeRuta[];
  modos_de_falla: readonly ModoDeRuta[];
  supuestos: readonly SupuestoDeRuta[];
  /** Lo que `planDe` calculó sobre este mismo plan: la onda de cada decisión, el ciclo y los riesgos que bloquean. */
  plan: ResultadoPlan;
}

export type OrigenDeItem =
  | { tipo: "decision"; id: string }
  | { tipo: "mitigacion"; id: string; indice: number }
  | { tipo: "supuesto"; id: string };

export type CriterioDeCumplido =
  | { clave: "decision" }
  | {
      clave: "mitigacion";
      ocurrencia: [number, number] | null;
      deteccion: [number, number] | null;
    }
  | { clave: "supuesto" };

export type Bloqueo = { tipo: "riesgo"; id: string } | { tipo: "ciclo" };

export interface ItemDeRuta {
  /** T-nn para una tarea, V-nn para una verificación de alistamiento, por el orden de la hoja de ruta. */
  id: string;
  tipo: "tarea" | "verificacion_alistamiento";
  /** null: la deja sin fase un ciclo. */
  fase: number | null;
  origen: OrigenDeItem;
  /** La decisión de la que cuelga (para un supuesto, la primera que sostiene): su categoría es la del ítem. */
  decision_id: string;
  categoria: string;
  estado: "pendiente" | "hecho" | "bloqueado";
  criterio_de_cumplido: CriterioDeCumplido;
  bloqueo: Bloqueo | null;
}

export interface FaseDeRuta {
  fase: number;
  /** pruebas (0) · onda (una de las ondas del plan) · seguimiento (después de la última onda). */
  tipo: "pruebas" | "onda" | "seguimiento";
  items: string[];
}

export interface HojaDeRuta {
  fases: FaseDeRuta[];
  /** En el orden de la hoja de ruta: por fase, y dentro de ella supuestos, mitigaciones «antes», decisiones y el resto. */
  items: ItemDeRuta[];
  /** Los ítems que un ciclo deja sin fase (con un ciclo, todos los de decisiones y sus mitigaciones). */
  sin_fase: string[];
  /** El camino del ciclo, o null. */
  ciclo: string[] | null;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const par = (n: number) => String(n).padStart(2, "0");

type Borrador = Omit<ItemDeRuta, "id"> & {
  rango: number;
  orden: number;
  clave: string;
};

export function hojaDeRuta(e: EntradaRuta): HojaDeRuta {
  const decisiones = new Map(e.decisiones.map((d) => [d.id, d]));
  const calculada = new Map(
    e.plan.decisiones.map((d, i) => [d.id, { ...d, orden: i }]),
  );
  const ondaDe = (id: string): number | null => calculada.get(id)?.onda ?? null;
  const ordenDe = (id: string): number =>
    calculada.get(id)?.orden ?? Number.MAX_SAFE_INTEGER;
  const bloqueoDe = (id: string): Bloqueo | null => {
    // Sin onda solo hay una causa: un ciclo (el paquete no devuelve ondas parciales).
    if (calculada.get(id)?.en_ciclo || calculada.get(id)?.onda === null) return { tipo: "ciclo" };
    const r = e.plan.riesgos.find((x) => x.decision_id === id && x.bloqueante);
    return r ? { tipo: "riesgo", id: r.id } : null;
  };
  const borradores: Borrador[] = [];

  for (const d of e.decisiones) {
    const b = d.estado === "decidida" ? null : bloqueoDe(d.id);
    borradores.push({
      tipo: "tarea",
      fase: ondaDe(d.id),
      origen: { tipo: "decision", id: d.id },
      decision_id: d.id,
      categoria: d.categoria,
      estado: d.estado === "decidida" ? "hecho" : b ? "bloqueado" : "pendiente",
      criterio_de_cumplido: { clave: "decision" },
      bloqueo: b,
      rango: 2,
      orden: ordenDe(d.id),
      clave: d.id,
    });
  }

  for (const m of e.modos_de_falla) {
    const d = decisiones.get(m.decision_id);
    if (!d) continue;
    const onda = ondaDe(d.id);
    m.mitigaciones.forEach((t, indice) => {
      const antes = t.momento === "antes";
      borradores.push({
        tipo: "tarea",
        fase: onda === null ? null : antes ? onda : onda + 1,
        origen: { tipo: "mitigacion", id: m.id, indice },
        decision_id: d.id,
        categoria: d.categoria,
        estado: "pendiente",
        criterio_de_cumplido: {
          clave: "mitigacion",
          ocurrencia:
            t.efecto.ocurrencia === undefined
              ? null
              : [m.ocurrencia, t.efecto.ocurrencia],
          deteccion:
            t.efecto.deteccion === undefined
              ? null
              : [m.deteccion, t.efecto.deteccion],
        },
        bloqueo: null,
        rango: antes ? 1 : 3,
        orden: ordenDe(d.id),
        clave: `${m.id}#${String(indice).padStart(3, "0")}`,
      });
    });
  }

  for (const s of e.supuestos) {
    const sostiene = s.decisiones
      .filter((id) => decisiones.has(id))
      .sort((a, b) => ordenDe(a) - ordenDe(b) || cmp(a, b));
    if (!sostiene.length) continue;
    const ondas = sostiene.map(ondaDe).filter((o): o is number => o !== null);
    const deUnaVia = sostiene.some(
      (id) => decisiones.get(id)!.reversibilidad === "una_via",
    );
    // E-10: lo que sostiene una decisión de una vía se prueba antes de cualquier decisión; lo demás, una fase antes de la primera.
    const fase = deUnaVia
      ? 0
      : ondas.length
        ? Math.max(0, Math.min(...ondas) - 1)
        : null;
    const primera = decisiones.get(sostiene[0]!)!;
    borradores.push({
      tipo: "verificacion_alistamiento",
      fase,
      origen: { tipo: "supuesto", id: s.id },
      decision_id: primera.id,
      categoria: primera.categoria,
      estado: s.estado === "sin_probar" ? "pendiente" : "hecho",
      criterio_de_cumplido: { clave: "supuesto" },
      bloqueo: null,
      rango: 0,
      orden: ordenDe(primera.id),
      clave: s.id,
    });
  }

  borradores.sort(
    (a, b) =>
      (a.fase ?? Number.MAX_SAFE_INTEGER) -
        (b.fase ?? Number.MAX_SAFE_INTEGER) ||
      a.rango - b.rango ||
      a.orden - b.orden ||
      cmp(a.clave, b.clave),
  );

  let t = 0;
  let v = 0;
  // El rango, el orden y la clave solo sirven para ordenar: no pasan al ítem.
  const items: ItemDeRuta[] = borradores.map((x) => ({
    id: x.tipo === "tarea" ? `T-${par(++t)}` : `V-${par(++v)}`,
    tipo: x.tipo,
    fase: x.fase,
    origen: x.origen,
    decision_id: x.decision_id,
    categoria: x.categoria,
    estado: x.estado,
    criterio_de_cumplido: x.criterio_de_cumplido,
    bloqueo: x.bloqueo,
  }));

  const nOndas = e.plan.informe.ondas.length;
  const fases: FaseDeRuta[] = [];
  for (const it of items) {
    if (it.fase === null) continue;
    let f = fases.at(-1);
    if (!f || f.fase !== it.fase)
      fases.push(
        (f = {
          fase: it.fase,
          tipo:
            it.fase === 0
              ? "pruebas"
              : it.fase <= nOndas
                ? "onda"
                : "seguimiento",
          items: [],
        }),
      );
    f.items.push(it.id);
  }
  return {
    fases,
    items,
    sin_fase: items.filter((i) => i.fase === null).map((i) => i.id),
    ciclo: e.plan.informe.ciclo ? [...e.plan.informe.ciclo] : null,
  };
}

/** Los ítems cuyo origen no existe en el plan. La regla dura 9 dice que no puede haber ninguno. */
export function origenesHuerfanos(h: HojaDeRuta, e: EntradaRuta): string[] {
  const decisiones = new Set(e.decisiones.map((d) => d.id));
  const modos = new Map(e.modos_de_falla.map((m) => [m.id, m]));
  const supuestos = new Set(e.supuestos.map((s) => s.id));
  return h.items
    .filter((i) => {
      const o = i.origen;
      if (o.tipo === "decision") return !decisiones.has(o.id);
      if (o.tipo === "supuesto") return !supuestos.has(o.id);
      const m = modos.get(o.id);
      return !m || o.indice < 0 || o.indice >= m.mitigaciones.length;
    })
    .map((i) => i.id);
}
