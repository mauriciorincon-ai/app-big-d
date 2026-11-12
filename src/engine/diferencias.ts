// D2 (S8): las diferencias entre dos instantáneas de la base, en el núcleo (puro, sin `node:crypto`, igual en el navegador).
// Por id de evidencia: nueva, modificada con los campos que cambiaron, retirada; y, por caso, si su resultado cambia de
// ganadora, de empate o de bloqueo al evaluarlo con una y con otra. Orden total y estable: ids y campos por unidades de
// código, nunca por el orden del archivo. Los campos se comparan por su JSON canónico (RFC 8785): un orden de claves
// distinto no es un cambio. Patrón: el `diff` del diagramador (nodos por nombre, orden total).
import { canonicoEstricto } from "./canonico";
import type { Resultado } from "./tipos";

const porUnidades = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export interface DiferenciaEvidencias {
  nuevas: string[];
  modificadas: { id: string; campos: string[] }[];
  retiradas: string[];
}

/** Las evidencias de `ahora` frente a `antes`, por id. Lanza si un id se repite en un lado. */
export function diferenciasEvidencias(
  antes: readonly { id: string }[],
  ahora: readonly { id: string }[],
): DiferenciaEvidencias {
  const mapa = (xs: readonly { id: string }[], lado: string) => {
    const m = new Map<string, Record<string, unknown>>();
    for (const x of xs) {
      if (m.has(x.id))
        throw new Error(
          `diferencias: la evidencia «${x.id}» aparece dos veces en ${lado}`,
        );
      m.set(x.id, x as unknown as Record<string, unknown>);
    }
    return m;
  };
  const a = mapa(antes, "la primera instantánea");
  const b = mapa(ahora, "la segunda instantánea");
  const ids = [...new Set([...a.keys(), ...b.keys()])].sort(porUnidades);
  const out: DiferenciaEvidencias = {
    nuevas: [],
    modificadas: [],
    retiradas: [],
  };
  for (const id of ids) {
    const x = a.get(id);
    const y = b.get(id);
    if (!x) out.nuevas.push(id);
    else if (!y) out.retiradas.push(id);
    else {
      const campos = [...new Set([...Object.keys(x), ...Object.keys(y)])]
        .sort(porUnidades)
        .filter(
          (k) =>
            (k in x ? canonicoEstricto(x[k]) : "∅") !==
            (k in y ? canonicoEstricto(y[k]) : "∅"),
        );
      if (campos.length) out.modificadas.push({ id, campos });
    }
  }
  return out;
}

/** Lo que un resultado dice en una línea: la ganadora (o null), el empate, las descartadas y por qué no se evaluó. */
export interface ResumenResultado {
  evaluable: boolean;
  ganadora: string | null;
  /** Las plataformas en empate técnico, por id; vacía si no hay empate. */
  empate: string[];
  /** Las plataformas descartadas por una restricción, por id. */
  descartadas: string[];
  /** Por qué no se evaluó (vacía si se evaluó), en el orden del núcleo. */
  motivos: string[];
  /** Qué evidencia falta («plataforma|criterio», por unidades de código): dos instantáneas pueden faltar en parejas distintas. */
  faltantes: string[];
}

export function resumenResultado(r: Resultado): ResumenResultado {
  const descartadas = r.descartadas
    .map((d) => d.plataforma_id)
    .sort(porUnidades);
  if (r.tipo === "no-evaluable")
    return {
      evaluable: false,
      ganadora: null,
      empate: [],
      descartadas,
      motivos: r.motivos.map((m) => m.motivo),
      faltantes: r.motivos
        .flatMap((m) =>
          m.motivo === "falta-evidencia"
            ? m.faltantes.map((f) => `${f.plataforma_id}|${f.criterio_id}`)
            : [],
        )
        .sort(porUnidades),
    };
  const v = r.veredicto;
  return {
    evaluable: true,
    ganadora: v.tipo === "empate-tecnico" ? null : v.plataforma_id,
    empate:
      v.tipo === "empate-tecnico" ? [...v.plataformas].sort(porUnidades) : [],
    descartadas,
    motivos: [],
    faltantes: [],
  };
}

export interface ImpactoEnCaso {
  antes: ResumenResultado;
  ahora: ResumenResultado;
  cambia_ganadora: boolean;
  cambia_empate: boolean;
  /** Cambia lo que deja fuera o impide evaluar: descartadas, evaluable, motivos y qué evidencia falta. */
  cambia_bloqueo: boolean;
}

/** El mismo caso evaluado con la instantánea de antes y con la de ahora. */
export function impactoEnCaso(
  antes: Resultado,
  ahora: Resultado,
): ImpactoEnCaso {
  const a = resumenResultado(antes);
  const b = resumenResultado(ahora);
  const igual = (x: unknown, y: unknown) =>
    canonicoEstricto(x) === canonicoEstricto(y);
  return {
    antes: a,
    ahora: b,
    cambia_ganadora: a.ganadora !== b.ganadora,
    cambia_empate: !igual(a.empate, b.empate),
    cambia_bloqueo:
      a.evaluable !== b.evaluable ||
      !igual(a.descartadas, b.descartadas) ||
      !igual(a.motivos, b.motivos) ||
      !igual(a.faltantes, b.faltantes),
  };
}
