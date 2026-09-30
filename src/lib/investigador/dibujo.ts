import { layout, type Gramatica, type Mapa, type Vista } from "diagramador";
import { textosMotor } from "@/lib/atlas";
import { sumarDias } from "@/lib/datos";

/**
 * ¿Se dibuja? El nivel 1, el nivel 2, cada recorrido y la ventana de cada elemento del nivel 1 (vista
 * «bloque»), sin un solo aviso de geometría ni un flujo que atraviese una caja ajena (D11). El build del atlas
 * (src/lib/atlas/vistas.ts) se niega a publicar un dibujo con avisos, así que un mapa que no se dibuja no se
 * puede proponer ni aprobar: el investigador lo sabe al validar (y corrige, p. ej., un nombre que no cabe) y
 * la aprobación lo vuelve a mirar sobre lo que quedó tras las decisiones. Cada aviso dice la vista y qué
 * texto o pieza no encuentra lugar.
 *
 * Y se dibuja en TRES fechas: la dada, el día en que lo más viejo pasa a «por revisar» y el día en que vence.
 * Las insignias de vigencia ocupan lugar; un mapa que hoy cabe podía romper el build el día en que envejecía
 * (C-1 de la auditoría del S1). Un aviso que solo aparece al envejecer lleva la fecha.
 */
export function avisosDeDibujo(mapa: Mapa, gramatica: Gramatica, fechaConsulta: string): string[] {
  const textos = textosMotor();
  const vieja = mapa.nodos.map((n) => n.fecha_verificacion).sort()[0];
  const fechas = [
    fechaConsulta,
    ...(vieja ? [sumarDias(vieja, gramatica.vigencia.umbral_revisar_dias), sumarDias(vieja, gramatica.vigencia.umbral_vencido_dias)] : []),
  ];
  type Pedido = { vista: Vista; nombre: string; recorrido?: string; grupo?: string };
  const vistas: Pedido[] = [
    { vista: "nivel-1", nombre: "nivel-1" },
    { vista: "nivel-2", nombre: "nivel-2" },
    ...mapa.recorridos.map((r) => ({ vista: "recorrido" as const, nombre: `recorrido ${r.id}`, recorrido: r.id })),
  ];
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const [k, fecha] of fechas.entries()) {
    const nivel1 = layout(mapa, gramatica, "nivel-1", { textos, fechaConsulta: fecha });
    const grupos: Pedido[] = nivel1.vigencia.elementos.map((e) => ({ vista: "bloque", nombre: `ventana ${e.id}`, grupo: e.id }));
    for (const { vista, nombre, recorrido, grupo } of [...vistas, ...grupos]) {
      const geo = vista === "nivel-1" ? nivel1 : layout(mapa, gramatica, vista, { textos, fechaConsulta: fecha, recorrido, grupo });
      // `geo.avisos` ya trae D11 (el motor lo suma desde la auditoría del S1, M-1).
      for (const a of geo.avisos) {
        // El nivel 2 y el recorrido comparten las cajas, y una fecha repite lo que ya dijo otra: cada aviso
        // se dice una vez, en la primera vista y la primera fecha que lo muestran.
        if (vistos.has(a)) continue;
        vistos.add(a);
        out.push(`dibujo · ${nombre}${k === 0 ? "" : ` · el ${fecha}`} · ${a}`);
      }
    }
  }
  return out;
}
