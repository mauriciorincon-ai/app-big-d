// V16 «el mapa se dibuja» (CONTRATO v0.4.0 § 7, § 5.6) y las cuatro edades de la matriz de envejecimiento.
// Ninguna regla V1–V15 mira si los textos caben: V16 dibuja las vistas del mapa (nivel 1, nivel 2, cada
// recorrido y la ventana de cada elemento activable del nivel 1) en cada edad y devuelve sus avisos de
// geometría. Dibujar pide las cadenas de interfaz (`texts`): sin ellas V16 no corre y el informe lo declara,
// como V15 sin cobertura. Cada aviso se dice una vez: en la primera vista y la primera edad que lo muestran.
import { layout } from "../layout";
import type { TextosMotor, Vista } from "../layout/tipos";
import type { Gramatica, Mapa } from "../tipos";
import { sumarDias } from "../util/fechas";

/**
 * Las cuatro edades en que un mapa cambia de aspecto (§ 5.6): hoy, el día en que su nodo más viejo pasa a
 * «por revisar», el día en que vence y +100 días (la insignia de tres cifras). «Hoy» es la fecha de consulta
 * si se entrega; si no, la verificación más reciente del mapa (el primer día en que se puede consultar).
 */
export function agingDates(map: Mapa, grammar: Gramatica, queryDate?: string): string[] {
  const fechas = map.nodos.map((n) => n.fecha_verificacion).sort();
  const vieja = fechas[0];
  const hoy = queryDate ?? fechas[fechas.length - 1];
  if (!vieja || !hoy) return queryDate ? [queryDate] : [];
  const edades = [hoy, sumarDias(vieja, grammar.vigencia.umbral_revisar_dias), sumarDias(vieja, grammar.vigencia.umbral_vencido_dias), sumarDias(hoy, 100)];
  return edades.filter((f, i) => edades.indexOf(f) === i);
}

/** Los avisos de dibujo del mapa en sus cuatro edades: «<vista>[ · el <fecha>] · <aviso>». */
export function avisosV16(map: Mapa, grammar: Gramatica, options: { texts: Record<string, TextosMotor>; queryDate?: string }): string[] {
  type Pedido = { vista: Vista; nombre: string; recorrido?: string; group?: string };
  const vistas: Pedido[] = [
    { vista: "nivel-1", nombre: "nivel-1" },
    { vista: "nivel-2", nombre: "nivel-2" },
    ...map.recorridos.map((r) => ({ vista: "recorrido" as const, nombre: `recorrido ${r.id}`, recorrido: r.id })),
  ];
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const [k, fecha] of agingDates(map, grammar, options.queryDate).entries()) {
    const nivel1 = layout(map, grammar, "nivel-1", { texts: options.texts, queryDate: fecha });
    const ventanas: Pedido[] = nivel1.vigencia.elementos.map((e) => ({ vista: "bloque", nombre: `ventana ${e.id}`, group: e.id }));
    for (const { vista, nombre, recorrido, group } of [...vistas, ...ventanas]) {
      const geo = vista === "nivel-1" ? nivel1 : layout(map, grammar, vista, { texts: options.texts, queryDate: fecha, recorrido, group });
      for (const a of geo.avisos) {
        if (vistos.has(a)) continue;
        vistos.add(a);
        out.push(`${nombre}${k === 0 ? "" : ` · el ${fecha}`} · ${a}`);
      }
    }
  }
  return out;
}
