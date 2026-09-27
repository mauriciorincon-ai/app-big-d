import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IDIOMAS, rutaEnIdioma, textos } from "@/lib/i18n";

// Gate del diccionario de la interfaz (regla bilingüe): los dos idiomas tienen exactamente las mismas
// claves, ningún texto vacío, y todo carácter está en la fuente servida (V15 aplicado a la interfaz:
// un carácter fuera de Space Grotesk cae a la fuente del sistema y rompe la tabla de métricas, G15).
type Arbol = { [k: string]: string | Arbol };

function hojas(arbol: Arbol, prefijo = ""): [string, string][] {
  return Object.entries(arbol).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefijo}${k}`, v] as [string, string]] : hojas(v, `${prefijo}${k}.`),
  );
}

const cobertura = JSON.parse(readFileSync("docs/diseno/assets/fuentes/cobertura.json", "utf8"));
const rangos: [number, number][] = cobertura.fuentes["space-grotesk"].rangos;
const cubierto = (cp: number) => rangos.some(([a, b]) => cp >= a && cp <= b);

describe("diccionario de la interfaz", () => {
  const porIdioma = IDIOMAS.map((i) => [i, hojas(textos(i) as unknown as Arbol)] as const);

  it("los idiomas tienen exactamente las mismas claves", () => {
    const [, base] = porIdioma[0]!;
    for (const [, h] of porIdioma) expect(h.map(([k]) => k)).toEqual(base.map(([k]) => k));
  });

  it.each(porIdioma)("%s: ningún texto vacío y todo carácter en la fuente servida", (_idioma, h) => {
    for (const [clave, texto] of h) {
      expect(texto.trim(), clave).not.toBe("");
      const fuera = [...texto].filter((c) => c !== "\n" && !cubierto(c.codePointAt(0)!));
      expect(fuera, `${clave}: ${fuera.join(" ")}`).toEqual([]);
    }
  });

  it("la misma ruta en otro idioma cambia solo el primer segmento", () => {
    expect(rutaEnIdioma("/es/atlas/fabric", "en")).toBe("/en/atlas/fabric");
    expect(rutaEnIdioma("/en", "es")).toBe("/es");
    expect(rutaEnIdioma("/", "en")).toBe("/en");
    expect(rutaEnIdioma("/diseno/index.html", "es")).toBe("/es");
  });
});
