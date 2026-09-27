// Artefactos del contrato para las pruebas del paquete (solo pruebas: el motor no lee archivos).
import { readdirSync, readFileSync } from "node:fs";
import { coberturaDeRangos } from "../../src/texto/cobertura";
import type { Gramatica, Mapa } from "../../src/tipos";

const aqui = (ruta: string) => new URL(`../../${ruta}`, import.meta.url);
export const leerJson = <T = unknown>(ruta: string): T => JSON.parse(readFileSync(aqui(ruta), "utf8")) as T;

export const GRAMATICAS: Record<string, Gramatica> = Object.fromEntries(
  readdirSync(aqui("gramaticas")).map((f) => {
    const g = leerJson<Gramatica>(`gramaticas/${f}`);
    return [g.id, g];
  }),
);

export const EJEMPLOS: Mapa[] = readdirSync(aqui("ejemplos"))
  .sort()
  .map((f) => leerJson<Mapa>(`ejemplos/${f}`));

const cobertura = leerJson<{ fuentes: Record<string, { rangos: [number, number][] }> }>("metricas/cobertura.json");
/** Los textos del diagrama se dibujan en la fuente de interfaz del piloto (§ 5.5). */
export const COBERTURA = coberturaDeRangos(cobertura.fuentes["space-grotesk"]!.rangos);
