// `toText(map, grammar, { language, texts, queryDate? })` (G10, § 4.6): la versión en texto, en HTML, equivalente al
// dibujo, sobre un mapa YA VALIDADO (G14: sin dato válido no hay dibujo ni lectura). Lista ordenada anidada
// banda → bloque → nodo → flujos (las referencias de franja son flujos como los demás), y cada recorrido
// como lista ordenada con sus ramas. Cada `li` de nodo y de flujo lleva su
// `data-nodo` / `data-flujo`: es el oráculo con que las pruebas comparan texto y dibujo.
import type { Gramatica, Mapa, Nodo } from "../tipos";
import { ordenarPor } from "../util/orden";
import { plantilla, textoCondicion } from "../layout/escena";
import { numerarPasos, textoPapel } from "../layout/nivel2";
import type { TextosMotor } from "../layout/tipos";
import { escapar } from "../svg/serializar";
import { fraseVigencia } from "../util/vigencia";
import { idiomaPedido } from "./idioma";

export interface OpcionesTexto {
  language: string;
  texts: Record<string, TextosMotor>;
  /** Id del elemento raíz (el destino de «Saltar el diagrama» y de `aria-details`). */
  id?: string;
  /**
   * Fecha de consulta (AAAA-MM-DD): con ella, cada nodo por revisar o vencido dice sus días (§ 4.8: el
   * texto completo va también en la lectura). Lo vigente no se marca, como en el dibujo.
   */
  queryDate?: string;
}

export function toText(map: Mapa, grammar: Gramatica, opciones: OpcionesTexto): string {
  const l = opciones.language;
  const t = idiomaPedido("toText", grammar, l, opciones.texts);
  const e = (s: string) => escapar(s);
  const nodo = new Map(map.nodos.map((n) => [n.id, n]));
  const tipo = new Map(grammar.tipos_de_nodo.map((x) => [x.id, x]));
  const modo = new Map(grammar.modos_de_flujo.map((x) => [x.id, x]));
  const madurez = new Map(grammar.escala_madurez.map((x) => [x.id, x]));
  const flujos = ordenarPor(map.flujos, (f) => f.id);
  const bandas = [...(["capa", "carril", "transversal"] as const)].flatMap((c) => ordenarPor(grammar.bandas.filter((b) => b.clase === c), (b) => b.orden, (b) => b.id));
  const nodosDe = (banda: string) => ordenarPor(map.nodos.filter((n) => n.banda_id === banda), (n) => n.orden ?? Number.MAX_SAFE_INTEGER, (n) => n.id);

  const vigencia = (n: Nodo): string => {
    const frase = fraseVigencia(grammar, t, n.fecha_verificacion, opciones.queryDate);
    return frase ? ` ${e(frase)}` : "";
  };

  const itemNodo = (n: Nodo): string => {
    const m = madurez.get(n.madurez)!;
    const salen = flujos.filter((f) => f.origen === n.id);
    const entran = flujos.filter((f) => f.destino === n.id && esTransversal(f.origen));
    // 0.5.0 (§ 3.4): la condición del flujo se lee junto a él, en sus tres formas.
    const cond = (f: (typeof flujos)[number]) => (f.condicion ? ` (${e(textoCondicion(f.condicion, t))})` : "");
    const lineas = [
      ...salen.map((f) => `<li data-flujo="${e(f.id)}">${e(plantilla(t.hacia, { nombre: nodo.get(f.destino)!.nombre[l]!, modo: modo.get(f.modo_id)!.nombre[l]!, que: f.que_viaja[l]! }))}${cond(f)}</li>`),
      ...entran.map((f) => `<li data-flujo="${e(f.id)}">${e(plantilla(t.desde, { nombre: nodo.get(f.origen)!.nombre[l]!, modo: modo.get(f.modo_id)!.nombre[l]!, que: f.que_viaja[l]! }))}${cond(f)}</li>`),
    ];
    const papel = n.papel ? ` · ${e(textoPapel(t, n.papel))}` : "";
    return `<li data-nodo="${e(n.id)}"><b>${e(n.nombre[l]!)}</b> · ${e(tipo.get(n.tipo_id)!.nombre[l]!)} · ${e(m.nombre[l]!)}${papel}. ${e(n.lider[l]!)}${vigencia(n)}${lineas.length ? `<ul>${lineas.join("")}</ul>` : ""}</li>`;
  };
  // Un flujo que VIENE de una franja se lista también en el nodo de capa que lo recibe (la referencia
  // de franja se dibuja en la franja, pero se lee junto al elemento con el que conecta).
  const transversales = new Set(grammar.bandas.filter((b) => b.clase === "transversal").map((b) => b.id));
  function esTransversal(id: string): boolean {
    return transversales.has(nodo.get(id)!.banda_id);
  }

  const items = bandas.map((b) => {
    const ns = nodosDe(b.id);
    const bloques = ordenarPor(map.bloques.filter((x) => x.banda_id === b.id), (x) => x.id);
    const dentro = bloques.map((bl) => {
      const suyos = ns.filter((n) => n.bloque_id === bl.id);
      return `<li data-bloque="${e(bl.id)}"><b>${e(bl.nombre[l]!)}</b>. ${e(bl.lider[l]!)}<ol>${suyos.map(itemNodo).join("")}</ol></li>`;
    });
    const sueltos = ns.filter((n) => !bloques.some((bl) => bl.id === n.bloque_id)).map(itemNodo);
    return `<li data-banda="${e(b.id)}"><b>${e(b.nombre[l]!)}</b>: ${e(b.pregunta_lider[l]!)}<ol>${[...dentro, ...sueltos].join("")}</ol></li>`;
  });

  const recorridos = map.recorridos.map((r) => {
    const numeros = new Map(numerarPasos(r).map((p) => [p.id, p.numero]));
    const previo = new Map(r.pasos.map((p, k) => [p.id, p.sigue_de ?? (k > 0 ? r.pasos[k - 1]!.id : undefined)]));
    const hijos = (id: string) => r.pasos.filter((p) => previo.get(p.id) === id);
    const paso = (id: string): string => {
      const p = r.pasos.find((x) => x.id === id)!;
      const siguientes = hijos(id);
      let li = `<li data-paso="${e(p.id)}" data-nodo="${e(p.nodo_id)}"><b>${e(numeros.get(p.id)!)}. ${e(p.que_pasa[l]!)}</b> · ${e(nodo.get(p.nodo_id)!.nombre[l]!)}. ${e(p.lider[l]!)}`;
      if (siguientes.length > 1) {
        li += ` ${e(t.ramas[p.bifurca ?? "paralela"])}<ul>${siguientes.map((s) => `<li><ol>${cadena(s.id)}</ol></li>`).join("")}</ul>`;
      }
      return `${li}</li>`;
    };
    const cadena = (id: string): string => {
      let out = paso(id);
      let actual = hijos(id);
      while (actual.length === 1) {
        out += paso(actual[0]!.id);
        actual = hijos(actual[0]!.id);
      }
      return out;
    };
    const inicio = r.pasos[0];
    return `<section data-recorrido="${e(r.id)}"><h3>${e(plantilla(t.recorridoDe, { titulo: r.titulo[l]! }))}</h3><ol>${cadena(inicio!.id)}</ol></section>`;
  });

  const id = opciones.id ? ` id="${e(opciones.id)}"` : "";
  return `<div class="dg-lectura"${id} lang="${e(l)}"><ol>${items.join("")}</ol>${recorridos.join("")}</div>\n`;
}
