import { coberturaDeRangos, validate, type Gramatica, type Mapa } from "diagramador";
import { IDIOMAS } from "../i18n";
import { sinAfirmacion } from "./decisiones";
import { avisosDeDibujo } from "./dibujo";
import { esquemaPropuesta, type Propuesta } from "./esquema";
import { argumentosDeRetiro } from "./retiros";

// Validación de una propuesta del investigador, TODA por código (la skill la corre al terminar y reintenta
// hasta 2 veces; la pantalla y `aprobar` la vuelven a correr). Falla con ruta y motivo, jamás completa nada:
//   1. forma (Zod) · 2. el mapa con el diagramador, modo privado, más la cobertura de la fuente (V15)
//   3. coherencia: el mapa es «propuesta» de esa plataforma; cada afirmación habla de algo que existe; todo
//      componente y flujo tiene afirmación; la cita de un componente es una de sus fuentes, y la de un
//      flujo, una fuente de alguno de sus extremos.
//   4. retiros: con el mapa aprobado a la vista, todo lo que sale trae su argumento (src/lib/investigador/retiros.ts).
//   5. dibujo: las vistas del atlas sin avisos de geometría (un nombre que no cabe, una pieza sin lugar).

export interface Resultado {
  ok: boolean;
  fallas: string[];
  propuesta?: Propuesta;
}

export function validarPropuesta(dato: unknown, gramatica: Gramatica, rangos: readonly (readonly [number, number])[], anterior?: Mapa): Resultado {
  const forma = esquemaPropuesta.safeParse(dato);
  if (!forma.success) return { ok: false, fallas: forma.error.issues.map((i) => `${i.path.join(".") || "/"} · ${i.message}`) };
  const p = forma.data;
  const fallas: string[] = [];
  const inf = validate(p.mapa, gramatica, { mode: "privado", coverage: coberturaDeRangos(rangos) });
  for (const e of [...inf.errores, ...inf.alertas]) fallas.push(`mapa${e.ruta} · ${e.regla} · ${e.id} · ${e.mensaje}`);
  if (!inf.ok) return { ok: false, fallas, propuesta: p };
  const mapa = p.mapa as unknown as Mapa;
  if (mapa.sujeto_id !== p.plataforma) fallas.push(`mapa/sujeto_id · «${mapa.sujeto_id}» no es la plataforma investigada («${p.plataforma}»)`);
  if (mapa.estado !== "propuesta") fallas.push(`mapa/estado · una propuesta nace «propuesta», no «${mapa.estado}»`);
  for (const i of IDIOMAS) if (!gramatica.idiomas.includes(i)) fallas.push(`gramática · no declara «${i}»`);
  const ids = new Set<string>();
  for (const a of p.afirmaciones) {
    if (ids.has(a.id)) fallas.push(`afirmaciones · ${a.id} repetida`);
    ids.add(a.id);
    const nodo = a.sobre.entidad === "nodo" ? mapa.nodos.find((n) => n.id === a.sobre.id) : undefined;
    const flujo = a.sobre.entidad === "flujo" ? mapa.flujos.find((f) => f.id === a.sobre.id) : undefined;
    if (!nodo && !flujo) {
      fallas.push(`afirmaciones · ${a.id} habla de un ${a.sobre.entidad} que no está en el mapa («${a.sobre.id}»)`);
      continue;
    }
    const fuentes = nodo ? nodo.fuentes : mapa.nodos.filter((n) => n.id === flujo!.origen || n.id === flujo!.destino).flatMap((n) => n.fuentes);
    if (!fuentes.some((f) => f.url === a.cita.url)) fallas.push(`afirmaciones · ${a.id} cita ${a.cita.url}, que no es fuente de ${a.sobre.entidad === "nodo" ? "ese componente" : "ninguno de los extremos del flujo"}`);
  }
  // También en «sin novedades»: la exigencia de cita no se apaga con una bandera del modelo (A-3).
  for (const x of sinAfirmacion(mapa, p.afirmaciones)) fallas.push(`afirmaciones · ${x} no tiene ninguna afirmación que lo respalde`);
  fallas.push(...argumentosDeRetiro(anterior, mapa, p.retiros).fallas);
  fallas.push(...avisosDeDibujo(mapa, gramatica, p.fecha));
  return { ok: fallas.length === 0, fallas, propuesta: p };
}
