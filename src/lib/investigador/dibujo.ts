import { layout, type Gramatica, type Mapa, type Vista } from "diagramador";
import { textosMotor } from "@/lib/atlas";

/**
 * ¿Se dibuja? El nivel 1, el nivel 2 y cada recorrido, sin un solo aviso de geometría. El build del atlas
 * (src/lib/atlas/vistas.ts) se niega a publicar un dibujo con avisos, así que un mapa que no se dibuja no se
 * puede proponer ni aprobar: el investigador lo sabe al validar (y corrige, p. ej., un nombre que no cabe) y
 * la aprobación lo vuelve a mirar sobre lo que quedó tras las decisiones. Cada aviso dice la vista y qué
 * texto o pieza no encuentra lugar.
 */
export function avisosDeDibujo(mapa: Mapa, gramatica: Gramatica, fechaConsulta: string): string[] {
  const textos = textosMotor();
  const vistas: { vista: Vista; recorrido?: string }[] = [
    { vista: "nivel-1" },
    { vista: "nivel-2" },
    ...mapa.recorridos.map((r) => ({ vista: "recorrido" as const, recorrido: r.id })),
  ];
  const avisos = vistas.flatMap(({ vista, recorrido }) =>
    layout(mapa, gramatica, vista, { textos, fechaConsulta, recorrido }).avisos.map((a) => `dibujo · ${recorrido ? `recorrido ${recorrido}` : vista} · ${a}`),
  );
  // El nivel 2 y el recorrido comparten las cajas: el mismo aviso llega una vez por vista y basta decirlo una.
  const vistos = new Set<string>();
  return avisos.filter((a) => {
    const clave = a.slice(a.indexOf(" · ", 9) + 3);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
