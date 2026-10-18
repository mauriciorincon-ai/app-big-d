import type { ItemDeRuta } from "@/engine";
import { plantilla } from "@/lib/atlas/plantilla";
import { lista } from "@/lib/caso/formato";
import { CATEGORIAS } from "@/lib/datos/informe";
import type { Plan } from "@/lib/datos/plan";
import { textos, type Idioma } from "@/lib/i18n";
import type { Informe } from "./construir";
import { nombresDe } from "./narrativa";

// La hoja de ruta y el alistamiento como los muestra la pantalla (S6, `informe.html`): el núcleo (`hojaDeRuta`) reparte; aquí
// solo se redacta cada ítem desde las plantillas del idioma y el dato del plan, y se agrupa para pintar. Cada ítem trae su
// origen y su criterio de cumplido: no existe un ítem sin ellos (regla dura 9).

export interface ItemVista {
  id: string;
  tipo: "tarea" | "verificacion_alistamiento";
  estado: "pendiente" | "hecho" | "bloqueado";
  descripcion: string;
  origen: {
    tipo: "decision" | "mitigacion" | "supuesto";
    texto: string;
    ancla: string;
  };
  unaVia: boolean;
  cumplido: string;
  bloqueo: string | null;
  responsable: string | null;
  momento: string | null;
  /** Las verificaciones que van antes de esta decisión (E-10). */
  antes: string[];
  categoria: string;
}

export interface FaseVista {
  fase: number;
  titulo: string;
  items: ItemVista[];
}

export interface VistaHoja {
  fases: FaseVista[];
  sinFase: ItemVista[];
  ciclo: string | null;
  /** Solo las verificaciones de alistamiento, por categoría (§ 12.12); las categorías sin ítems no salen. */
  alistamiento: {
    categoria: string;
    nombre: string;
    hechos: number;
    total: number;
    items: ItemVista[];
  }[];
  /** Cuántos ítems y en cuántas fases, para el encabezado. */
  conteo: { items: number; fases: number; sinFase: number };
}

export function vistaHoja(
  informe: Informe,
  plan: Plan,
  idioma: Idioma,
): VistaHoja {
  const t = textos(idioma).caso.informe;
  const n = nombresDe(informe, plan, idioma);
  const modos = new Map(plan.modos_de_falla.map((m) => [m.id, m]));
  const supuestos = new Map(plan.supuestos.map((s) => [s.id, s]));
  const decisiones = new Map(plan.decisiones.map((d) => [d.id, d]));
  const hoja = informe.hoja;

  const efecto = (it: ItemDeRuta): string => {
    const c = it.criterio_de_cumplido;
    if (c.clave !== "mitigacion") return "";
    const partes = [
      c.ocurrencia
        ? plantilla(t.item.efecto.ocurrencia, {
            de: c.ocurrencia[0],
            a: c.ocurrencia[1],
          })
        : null,
      c.deteccion
        ? plantilla(t.item.efecto.deteccion, {
            de: c.deteccion[0],
            a: c.deteccion[1],
          })
        : null,
    ].filter((x): x is string => x !== null);
    return partes.join(" · ");
  };

  const item = (it: ItemDeRuta): ItemVista => {
    const o = it.origen;
    const c = it.criterio_de_cumplido;
    let descripcion = "";
    let origen: ItemVista["origen"];
    let responsable: string | null = null;
    let momento: string | null = null;
    if (o.tipo === "decision") {
      descripcion = plantilla(t.item.descripcion.decision, {
        texto: n.decision[o.id] ?? o.id,
      });
      origen = {
        tipo: "decision",
        texto: plantilla(t.item.origen.decision, { id: o.id }),
        ancla: `#d-${o.id}`,
      };
    } else if (o.tipo === "mitigacion") {
      const m = modos.get(o.id)!.mitigaciones[o.indice]!;
      descripcion = plantilla(t.item.descripcion.mitigacion, {
        texto: m.accion[idioma],
      });
      responsable = m.responsable[idioma];
      momento = t.item.momento[m.momento];
      origen = {
        tipo: "mitigacion",
        texto: plantilla(t.item.origen.mitigacion, { id: o.id }),
        ancla: `#r-${o.id}`,
      };
    } else {
      const s = supuestos.get(o.id)!;
      descripcion = plantilla(t.item.descripcion.supuesto, {
        texto: s.prueba_barata[idioma],
      });
      responsable = s.responsable[idioma];
      origen = {
        tipo: "supuesto",
        texto: plantilla(t.item.origen.supuesto, {
          nombre: n.supuesto[o.id] ?? o.id,
        }),
        ancla: `#s-${o.id}`,
      };
    }
    const cumplido = plantilla(t.item.cumplido, {
      criterio:
        c.clave === "decision"
          ? t.item.criterio.decision
          : c.clave === "supuesto"
            ? t.item.criterio.supuesto
            : efecto(it)
              ? plantilla(t.item.criterio.mitigacion, { efecto: efecto(it) })
              : t.item.criterio.mitigacionSinCifra,
    });
    const antes =
      o.tipo === "decision"
        ? hoja.items
            .filter(
              (x) =>
                x.origen.tipo === "supuesto" &&
                supuestos.get(x.origen.id)!.decisiones.includes(o.id),
            )
            .map((x) => x.id)
        : [];
    return {
      id: it.id,
      tipo: it.tipo,
      estado: it.estado,
      descripcion,
      origen,
      unaVia:
        o.tipo === "decision" &&
        decisiones.get(o.id)!.reversibilidad === "una_via",
      cumplido,
      bloqueo: it.bloqueo
        ? it.bloqueo.tipo === "ciclo"
          ? t.item.bloqueo.ciclo
          : plantilla(t.item.bloqueo.riesgo, { id: it.bloqueo.id })
        : null,
      responsable:
        responsable === null
          ? null
          : plantilla(t.item.responsable, { nombre: responsable }),
      momento,
      antes,
      categoria: it.categoria,
    };
  };

  const porId = new Map(hoja.items.map((i) => [i.id, item(i)]));
  const fases: FaseVista[] = hoja.fases.map((f) => ({
    fase: f.fase,
    titulo: plantilla(t.hoja.fase[f.tipo], { n: f.fase }),
    items: f.items.map((id) => porId.get(id)!),
  }));
  const verificaciones = hoja.items
    .filter((i) => i.tipo === "verificacion_alistamiento")
    .map((i) => porId.get(i.id)!);
  return {
    fases,
    sinFase: hoja.sin_fase.map((id) => porId.get(id)!),
    ciclo: hoja.ciclo
      ? plantilla(t.hoja.ciclo, {
          camino: hoja.ciclo.map((id) => n.decision[id] ?? id).join(" → "),
        })
      : null,
    alistamiento: CATEGORIAS.map((categoria) => {
      const items = verificaciones.filter((v) => v.categoria === categoria);
      return {
        categoria,
        nombre: t.alistamiento.categorias[categoria] ?? categoria,
        hechos: items.filter((x) => x.estado === "hecho").length,
        total: items.length,
        items,
      };
    }).filter((c) => c.total > 0),
    conteo: {
      items: hoja.items.length,
      fases: hoja.fases.length,
      sinFase: hoja.sin_fase.length,
    },
  };
}

/** Los motivos de borrador escritos en el idioma, para la banda de arriba y el encabezado. */
export function motivosDeBorrador(informe: Informe, idioma: Idioma): string[] {
  const t = textos(idioma).caso.informe.borrador.motivos;
  const y = textos(idioma).caso.y;
  return informe.modelo.estado.motivos.map((m) =>
    m.tipo === "bloqueado"
      ? plantilla(t.bloqueado, { ids: lista(m.ids, y) })
      : t[m.tipo],
  );
}
