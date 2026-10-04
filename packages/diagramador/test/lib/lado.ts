// Casos del lado a lado (§ 4.4) y de las diferencias dibujables (§ 4.7), sin leer archivos: los usan los golden
// files (Node) y la entrada del navegador (tests/determinismo/entrada.ts), con los mismos mapas.
import { compare, diff, toSVG, type Geometria, type Gramatica, type Mapa } from "../../src/index";
import { TEXTOS } from "./textos";

/** Fecha de consulta de los casos: la de los golden del S1 (el mapa de ejemplo, vigente). */
export const FECHA_LADO = "2026-09-26";
/** La constante de la vista del piloto: tres a la vez. El motor no la conoce; la declara quien llama (§ 4.4). */
export const N_LADO = 3;

const conSujeto = (m: Mapa, id: string, es: string, en: string): Mapa => ({ ...structuredClone(m), sujeto_id: id, sujeto_nombre: { es, en } });

/**
 * Cuatro sujetos de `plataformas-datos`, para que N = 3 pagine (la página 2 con uno). Las carnadas A2 y A3 son
 * variantes del mapa de ejemplo (mismo `sujeto_id`): aquí llevan un sujeto propio.
 */
export function mapasLado(ejemplo: Mapa, p1: Mapa, a2: Mapa, a3: Mapa): Mapa[] {
  return [
    ejemplo,
    p1,
    conSujeto(a2, "ejemplo-ocho-bloques", "Ejemplo de ocho bloques", "Eight-block example"),
    conSujeto(a3, "ejemplo-cuatro-modos", "Ejemplo de cuatro modos", "Four-mode example"),
  ];
}

/**
 * Dos versiones del mapa de ejemplo con las cuatro clases de la maqueta: en la nueva entra «Búsqueda vectorial»
 * (nuevo), sale «Cuadernos interactivos» (retirado), «Conector JDBC» pasa a llamarse «Conector de bases
 * relacionales» (renombrado) y el agente sube a disponible (madurez).
 */
export function versiones(ejemplo: Mapa): { antes: Mapa; despues: Mapa } {
  const copia = (m: Mapa, id: string, nuevo: string, cambios: Partial<Mapa["nodos"][number]>) => ({ ...structuredClone(m.nodos.find((n) => n.id === id)!), id: nuevo, ...cambios });
  const antes = structuredClone(ejemplo);
  antes.version = "0.1.0";
  antes.nodos = antes.nodos.map((n) => (n.id === "conector-relacional" ? { ...n, nombre: { es: "Conector JDBC", en: "JDBC connector" } } : n));
  antes.nodos.push(copia(antes, "motor-transformacion", "cuadernos", { orden: 3, nombre: { es: "Cuadernos interactivos", en: "Interactive notebooks" } }));
  const despues = structuredClone(ejemplo);
  despues.version = "0.2.0";
  despues.nodos = despues.nodos.map((n) => (n.id === "agente-datos" ? { ...n, madurez: "disponible-general" } : n));
  despues.nodos.push(copia(despues, "agente-datos", "busqueda-vectorial", { orden: 2, madurez: "vista-previa-publica", nombre: { es: "Búsqueda vectorial", en: "Vector search" } }));
  return { antes, despues };
}

/** Todas las bandas en 2: el estado «Desplegar todo» del producto (mirada M1). */
export const todasEn2 = (g: Gramatica): Record<string, 2> => Object.fromEntries(g.bandas.map((b) => [b.id, 2 as const]));

/** Los golden del lado a lado: bloques, página 2, rejilla de componentes contraída, una banda, todas, y diferencias. */
export function salidasLado(g: Gramatica, lado: Mapa[], antes: Mapa, despues: Mapa): { archivo: string; geo: () => Geometria; svg: (idioma: string) => string }[] {
  const base = { texts: TEXTOS, queryDate: FECHA_LADO };
  const marks = diff(antes, despues);
  const casos: [string, () => Geometria][] = [
    ["bloques", () => compare(lado, g, { ...base, n: N_LADO })],
    ["pagina-2", () => compare(lado, g, { ...base, n: N_LADO, page: 2 })],
    ["contraido", () => compare(lado, g, { ...base, n: N_LADO, levelByBand: {} })],
    ["una-banda", () => compare(lado, g, { ...base, n: N_LADO, levelByBand: { almacenamiento: 2 } })],
    ["desplegado", () => compare(lado, g, { ...base, n: N_LADO, levelByBand: todasEn2(g) })],
    ["diferencias", () => compare([antes, despues], g, { ...base, marks })],
    ["diferencias-desplegado", () => compare([antes, despues], g, { ...base, marks, levelByBand: todasEn2(g) })],
  ];
  return casos.map(([nombre, geo]) => ({ archivo: `lado.${nombre}`, geo, svg: (idioma: string) => toSVG(geo(), { language: idioma }) }));
}
