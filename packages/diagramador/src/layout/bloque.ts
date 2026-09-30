// Vista «bloque» (enmienda del piloto, D-S1-44): lo que hay DENTRO de un elemento del nivel 1 —un bloque, o
// los nodos de una banda que no tienen bloque («_<banda>», el mismo dueño que el nivel 1 les da)— con la
// MISMA tarjeta que el nivel 2 les da (la de capa, 152 × 84; la ficha compacta, 168 × 44, si la banda es una
// franja), uno bajo otro en el orden de su banda, y los flujos entre ellos por el canal de la derecha. Lo
// que entra o sale del grupo no se dibuja aquí: lo dice `toBlockCards`, debajo. Una columna y su canal:
// cabe en un panel y en un teléfono sin deslizar.
import { nodosDelGrupo, nombreDelGrupo } from "../util/grupo";
import { mitad } from "../util/numeros";
import { ordenarPor } from "../util/orden";
import { CANAL, COL, M, porIdioma, resumenVigencia, type Contexto } from "./contexto";
import { plantilla } from "./escena";
import { FICHA_H, FICHA_W, tarjetaNodo } from "./nivel2";
import { rutear, type Conexion, type Pieza } from "./rutas";
import type { CajaPropia, Elemento, Geometria } from "./tipos";

const ALTO = 840;
const SEPARACION = 400;
const ARRIBA = 160;

/** Sin foco ni «activable»: dentro del panel, la tarjeta no abre nada. */
function quieta(el: Elemento): Elemento {
  const attrs: Elemento["attrs"] = { ...el.attrs, class: "dg-nodo" };
  delete attrs.tabindex;
  return { ...el, attrs };
}

export function bloque(ctx: Contexto, grupo: string | undefined): Geometria {
  if (!grupo) throw new Error("layout: la vista «bloque» pide `grupo` (el id del bloque o «_<banda>»)");
  const ns = nodosDelGrupo(ctx.mapa, ctx.gramatica, grupo);
  if (!ns.length) throw new Error(`layout: el grupo «${grupo}» no tiene nodos`);
  const franja = ctx.gramatica.bandas.find((b) => b.id === ns[0]!.banda_id)!.clase === "transversal";
  const [w, h, sep] = franja ? [FICHA_W, FICHA_H, 80] : [COL, ALTO, SEPARACION];
  const piezas = new Map<string, Pieza>();
  const cajas: CajaPropia[] = [];
  ns.forEach((n, r) => {
    const caja = { x: M, y: ARRIBA + r * (h + sep), w, h };
    piezas.set(n.id, { id: n.id, col: 0, fila: r, caja, baja: r === ns.length - 1 });
    cajas.push({ id: n.id, clase: franja ? "ficha" : "nodo", caja });
  });
  const yb = ARRIBA + ns.length * h + (ns.length - 1) * sep;
  const conexiones: Conexion[] = ordenarPor(ctx.mapa.flujos, (f) => f.id)
    .filter((f) => piezas.has(f.origen) && piezas.has(f.destino) && f.origen !== f.destino)
    .map((f) => ({ id: f.id, o: f.origen, d: f.destino, modos: [f.modo_id] }));
  const ruteo = rutear(ctx, piezas, conexiones, { nivel: 2, yb, centroCanal: () => M + w + mitad(CANAL) });
  const rotulos: Geometria["rotulos"] = [...ruteo.rotulos];
  const escena: Elemento[] = ns.map((n) => quieta(tarjetaNodo(ctx, n, piezas.get(n.id)!.caja, franja, [], rotulos)));
  escena.push(...ruteo.lineas, ...ruteo.etiquetas);
  const nombre = nombreDelGrupo(ctx.mapa, ctx.gramatica, grupo);
  const valores = (l: string) => ({ sujeto: ctx.mapa.sujeto_nombre[l]!, bloque: nombre[l]!, nodos: ns.length, capas: 0, franjas: 0, recorrido: "" });
  return {
    vista: "bloque",
    sujeto: ctx.mapa.sujeto_id,
    gramatica: ctx.gramatica.id,
    idiomas: ctx.idiomas,
    ancho: 2 * M + w + CANAL,
    alto: yb + ARRIBA,
    columnas: [],
    filas: [],
    cajas,
    trazados: ruteo.trazados,
    rotulos,
    escena,
    titulo: porIdioma(ctx, (l, t) => plantilla(t.titulo.bloque, valores(l))),
    descripcion: porIdioma(ctx, (l, t) => plantilla(t.descripcion.bloque, valores(l))),
    vigencia: resumenVigencia(ctx, ns.map((n) => ({ id: n.id, nodos: [n] }))),
    avisos: ctx.avisos,
  };
}
