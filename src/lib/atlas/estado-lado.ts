// Estado del lado a lado que vive en la URL (D-S2-07): qué plataformas se comparan (`?plataformas=a,b`) y en qué
// página (`&pagina=2`). La regla corre dos veces: en el script en línea que corre antes de pintar (una URL con
// consulta no muestra primero las filas por defecto y luego salta) y en el componente, que la aplica al tocar el
// selector o la paginación. Las dos son la misma regla: una prueba ejecuta el script y lo compara con
// `estadoDeConsulta`, consulta por consulta. Sin consulta, todas las plataformas y la página 1.

/** Plataformas a la vez en ancho: la constante de la vista (CONTRATO § 4.4; el motor no la conoce). */
export const POR_PAGINA = 3;

export interface EstadoLado {
  /** Las elegidas, en orden de id (el mismo en los dos idiomas); nunca vacía. */
  elegidas: string[];
  pagina: number;
}

export interface EstadoCompleto extends EstadoLado {
  paginas: number;
  /** Las filas de esta página. */
  visibles: string[];
}

const ENTERO = /^[0-9]+$/;

/** Completa un estado: la página fuera de rango vuelve a la 1, y una selección vacía es «todas». */
export function completar(estado: EstadoLado, ids: readonly string[], porPagina: number): EstadoCompleto {
  const pedidas = ids.filter((id) => estado.elegidas.includes(id));
  const elegidas = pedidas.length ? pedidas : [...ids];
  const paginas = Math.max(1, Math.ceil(elegidas.length / porPagina));
  const pagina = Number.isInteger(estado.pagina) && estado.pagina >= 1 && estado.pagina <= paginas ? estado.pagina : 1;
  return { elegidas, pagina, paginas, visibles: elegidas.slice((pagina - 1) * porPagina, pagina * porPagina) };
}

/** El estado que dice una consulta (`location.search`). */
export function estadoDeConsulta(consulta: string, ids: readonly string[], porPagina: number): EstadoCompleto {
  const q = new URLSearchParams(consulta);
  const lista = q.get("plataformas");
  const pagina = q.get("pagina");
  return completar(
    { elegidas: lista === null ? [...ids] : lista.split(","), pagina: pagina !== null && ENTERO.test(pagina) ? Number(pagina) : 1 },
    ids,
    porPagina,
  );
}

/** La consulta de un estado: vacía con todas y la página 1 (la URL limpia es la de siempre). */
export function consultaDe(estado: EstadoLado, ids: readonly string[]): string {
  const partes = [
    ...(estado.elegidas.length < ids.length ? [`plataformas=${estado.elegidas.join(",")}`] : []),
    ...(estado.pagina > 1 ? [`pagina=${estado.pagina}`] : []),
  ];
  return partes.length ? `?${partes.join("&")}` : "";
}

/** Atributos del `<html>` que el CSS generado lee: las filas de la página (ancho) y las elegidas (teléfono). */
export const ATRIBUTO_VISIBLES = "data-lado";
export const ATRIBUTO_ELEGIDAS = "data-lado-elegidas";

/**
 * El script en línea, previo al pintado: la misma regla que `estadoDeConsulta`, escrita para correr sola y sin
 * módulos. Solo pone dos atributos del `<html>` (regla 5-a: jamás decide qué elementos existen).
 */
export function scriptLado(ids: readonly string[], porPagina: number): string {
  return (
    `(function(){try{var ids=${JSON.stringify(ids)},n=${porPagina},q=new URLSearchParams(location.search),l=q.get("plataformas"),s=q.get("pagina"),e=ids;` +
    `if(l!==null){var w=l.split(",");e=ids.filter(function(x){return w.indexOf(x)>=0});if(!e.length)e=ids}` +
    `var t=Math.max(1,Math.ceil(e.length/n)),p=s!==null&&/^[0-9]+$/.test(s)?Number(s):1;if(p<1||p>t)p=1;` +
    `var h=document.documentElement;h.setAttribute("${ATRIBUTO_VISIBLES}",e.slice((p-1)*n,p*n).join(" "));h.setAttribute("${ATRIBUTO_ELEGIDAS}",e.join(" "))}catch(x){}})();`
  );
}
