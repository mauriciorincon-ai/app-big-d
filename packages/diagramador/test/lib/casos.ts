// Los mapas del contrato en sus tres vistas: la matriz sobre la que corren D11, los golden files y G10.
import { layout, type Geometria, type Mapa, type Vista } from "../../src/index";
import { EJEMPLOS, GRAMATICAS, leerJson } from "./contrato";
import { mapasLado, salidasLado, todasEn2, versiones } from "./lado";
import { TEXTOS } from "./textos";

/** Fecha de consulta fija de las pruebas: el mapa de ejemplo se verificó el 2026-09-20 (6 días: vigente). */
export const FECHA = "2026-09-26";
export const VISTAS: Vista[] = ["nivel1", "nivel2", "recorrido"];
export const A3 = leerJson<Mapa>("carnadas/A3-cuatro-modos-en-un-par.mapa.json");

export interface Caso {
  /** Nombre de archivo del caso (A3 comparte `sujeto_id` con el mapa de ejemplo). */
  clave: string;
  nombre: string;
  mapa: Mapa;
  vista: Vista;
}
export const CASOS: Caso[] = [
  ...EJEMPLOS.flatMap((m) => VISTAS.map((vista) => ({ clave: m.sujeto_id, nombre: `${m.sujeto_id} · ${vista}`, mapa: m, vista }))),
  { clave: "carnada-a3", nombre: "A3 · nivel1", mapa: A3, vista: "nivel1" },
];

export const disponer = (mapa: Mapa, vista: Vista, fecha = FECHA): Geometria =>
  layout(mapa, GRAMATICAS[mapa.gramatica_id]!, vista, { texts: TEXTOS, queryDate: fecha });

/** Lado a lado (§ 4.4) y diferencias (§ 4.7): los casos viven en `lado.ts`, sin `fs`, para el navegador también. */
export const P1 = leerJson<Mapa>("carnadas/P1-mapa-denso.mapa.json");
const EJEMPLO = EJEMPLOS.find((m) => m.sujeto_id === "plataforma-ejemplo")!;
export const LADO = mapasLado(EJEMPLO, P1, leerJson<Mapa>("carnadas/A2-ocho-bloques.mapa.json"), A3);
export const { antes: ANTES, despues: DESPUES } = versiones(EJEMPLO);
export const TODAS_EN_2 = todasEn2(GRAMATICAS["plataformas-datos"]!);
export const SALIDAS_LADO = salidasLado(GRAMATICAS["plataformas-datos"]!, LADO, ANTES, DESPUES);
